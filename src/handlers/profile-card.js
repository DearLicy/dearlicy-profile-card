import { imageDataUri } from "../assets.js";
import { configFromSearchParams } from "../config.js";
import {
  ProfileInputError,
  ProfileNotFoundError,
} from "../github.js";
import { renderErrorCard, renderProfileCard } from "../card.js";
import {
  CARD_CACHE_CONTROL,
  ERROR_CARD_CACHE_CONTROL,
  PRIVATE_CARD_CACHE_CONTROL,
  cacheState,
  emptyBody,
  jsonResponse,
  responseHeaders,
} from "../http.js";
import { getProfile } from "../profile-service.js";
import {
  ProfileAccessError,
  enforceProfileAccess,
  requestedLogin,
} from "../runtime.js";

function cardConfig(url, site) {
  return configFromSearchParams(url.searchParams, site.card);
}

async function imageContext(config, env, profile) {
  let backgroundSource = "";
  if (
    config.backgroundImage &&
    env.SITE_STORE?.images
  ) {
    const stored = await env.SITE_STORE.images.get(config.backgroundImage);
    if (stored) backgroundSource = imageDataUri(stored.buffer, stored.image.mime);
  }
  return {
    profile,
    backgroundSource,
  };
}

function summaryPayload(profile, meta) {
  const score = Number(profile.rank.score.toFixed(1));
  return {
    login: profile.login,
    profileUrl: `https://github.com/${profile.login}`,
    stars: profile.stars,
    rank: profile.rank.level,
    score,
    percentile: score,
    repositories: profile.repositories,
    followers: profile.followers,
    contributions: profile.contributions,
    languages: profile.languages.length,
    topRepositories: profile.topRepositories,
    fetchedAt: profile.fetchedAt.toISOString(),
    cached: meta.cached,
    stale: meta.stale,
    cacheAgeSeconds: meta.ageSeconds,
    dataTier: profile.dataTier,
  };
}

function errorCardFor(error, config, login) {
  if (error instanceof ProfileInputError) {
    return renderErrorCard(
      {
        title: "Profile not recognized.",
        message: "Use a GitHub username or a github.com profile URL.",
        detail: "Example: DearLicy or https://github.com/DearLicy",
      },
      config,
    );
  }
  if (error instanceof ProfileNotFoundError) {
    return renderErrorCard(
      {
        title: "GitHub profile not found.",
        message: "Check the username or profile URL, then try again.",
        detail: `Requested profile: ${login}`,
      },
      config,
    );
  }
  if (error instanceof ProfileAccessError) {
    return renderErrorCard(
      {
        title: "This profile is private here.",
        message: "The instance owner has limited this API to selected profiles.",
        detail: "Open the Studio or contact the instance owner.",
      },
      config,
    );
  }
  return renderErrorCard(undefined, config);
}

function errorKind(error) {
  if (error instanceof ProfileInputError) return "INPUT";
  if (error instanceof ProfileNotFoundError) return "MISSING";
  if (error instanceof ProfileAccessError) return "ACCESS";
  return "UPSTREAM";
}

export async function handleCardRequest(request, ctx, runtime) {
  const url = new URL(request.url);
  const config = cardConfig(url, runtime.site);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  let login = "";
  try {
    login = requestedLogin(url, runtime.site);
    enforceProfileAccess(runtime.site, login);
    const meta = await getProfile(runtime.env, ctx, login, { forceRefresh });
    const images = await imageContext(config, runtime.env, meta.profile);
    return new Response(
      emptyBody(
        request,
        renderProfileCard(images.profile, config, {
          backgroundDataUri: images.backgroundSource,
        }),
      ),
      {
        headers: responseHeaders({
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control":
            runtime.site.mode === "public"
              ? CARD_CACHE_CONTROL
              : PRIVATE_CARD_CACHE_CONTROL,
          "X-Profile-Cache": cacheState(meta),
          "X-Data-Fetched-At": meta.profile.fetchedAt.toISOString(),
          "X-GitHub-Username": meta.profile.login,
          "X-Site-Mode": runtime.site.mode,
        }),
      },
    );
  } catch (error) {
    const kind = errorKind(error);
    if (kind === "UPSTREAM") {
      console.error("Profile card refresh failed", {
        login,
        message:
          error instanceof Error ? error.message : "Unknown upstream error",
      });
    }
    return new Response(emptyBody(request, errorCardFor(error, config, login)), {
      status: 200,
      headers: responseHeaders({
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control":
          kind === "INPUT" || kind === "MISSING" || kind === "ACCESS"
            ? "no-store"
            : ERROR_CARD_CACHE_CONTROL,
        "X-Profile-Cache":
          kind === "INPUT"
            ? "INVALID"
            : kind === "MISSING"
              ? "NOT_FOUND"
              : kind === "ACCESS"
                ? "FORBIDDEN"
                : "ERROR",
        ...(login && kind !== "INPUT" ? { "X-GitHub-Username": login } : {}),
      }),
    });
  }
}

export async function handleSummaryRequest(request, ctx, runtime) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  let login = "";
  try {
    login = requestedLogin(url, runtime.site);
    enforceProfileAccess(runtime.site, login);
    const meta = await getProfile(runtime.env, ctx, login, { forceRefresh });
    return jsonResponse(request, 200, summaryPayload(meta.profile, meta), {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "X-Profile-Cache": cacheState(meta),
      "X-GitHub-Username": meta.profile.login,
    });
  } catch (error) {
    const kind = errorKind(error);
    if (kind === "UPSTREAM") {
      console.error("Profile summary refresh failed", {
        login,
        message:
          error instanceof Error ? error.message : "Unknown upstream error",
      });
    }
    const status =
      kind === "INPUT" ? 400 : kind === "MISSING" ? 404 : kind === "ACCESS" ? 403 : 503;
    return jsonResponse(
      request,
      status,
      {
        error:
          kind === "INPUT"
            ? "INVALID_USERNAME"
            : kind === "MISSING"
              ? "PROFILE_NOT_FOUND"
              : kind === "ACCESS"
                ? "PROFILE_NOT_ALLOWED"
                : "PROFILE_UNAVAILABLE",
        message:
          kind === "INPUT"
            ? error.message
            : kind === "MISSING"
              ? `找不到 GitHub 用户 “${login}”。`
              : kind === "ACCESS"
                ? "这个实例没有开放该 GitHub 用户的数据接口。"
                : "动态数据暂时不可用，请稍后重试。",
      },
      {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        ...(status >= 500 ? { "Retry-After": "60" } : {}),
      },
    );
  }
}
