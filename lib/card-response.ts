import "server-only";

import { imageDataUri } from "@/src/assets.js";
import { renderErrorCard, renderProfileCard } from "@/src/card.js";
import { configFromSearchParams } from "@/src/config.js";

import {
  getProfile,
  ProfileAccessError,
  publicErrorMessage,
  requestedLogin,
} from "@/lib/github-service";
import { getImage, readImageBytes } from "@/lib/images";
import { getSiteConfig } from "@/lib/site";

const BASE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function errorConfig(url: URL) {
  const site = getSiteConfig();
  return configFromSearchParams(url.searchParams, site.card);
}

function errorCard(error: unknown, url: URL, login = "") {
  const config = errorConfig(url);
  let title = "Live data is taking a moment.";
  let message = "The dynamic card will return automatically after the next refresh.";
  let detail = "Upstream data is temporarily unavailable.";
  if (error instanceof ProfileAccessError) {
    title = "This profile is private here.";
    message = "The instance owner has limited this API to selected profiles.";
    detail = "Open the Studio or contact the instance owner.";
  } else {
    const info = publicErrorMessage(error);
    if (info.code === "INVALID_USERNAME") {
      title = "Profile not recognized.";
      message = "Use a GitHub username or a github.com profile URL.";
      detail = "Example: DearLicy or https://github.com/DearLicy";
    } else if (info.code === "PROFILE_NOT_FOUND") {
      title = "GitHub profile not found.";
      message = "Check the username or profile URL, then try again.";
      detail = `Requested profile: ${login}`;
    }
  }
  return renderErrorCard({ title, message, detail }, config);
}

export async function cardResponse(request: Request) {
  const url = new URL(request.url);
  const site = getSiteConfig();
  const config = configFromSearchParams(url.searchParams, site.card);
  let login = "";
  try {
    login = requestedLogin(url);
    const result = await getProfile(login, {
      forceRefresh: url.searchParams.get("refresh") === "1",
    });
    let backgroundDataUri = "";
    if (config.backgroundImage) {
      const image = getImage(config.backgroundImage);
      if (image) {
        try {
          const bytes = await readImageBytes(image);
          backgroundDataUri = imageDataUri(bytes, image.mime);
        } catch (error) {
          console.warn("Background image unavailable; falling back to theme", {
            id: config.backgroundImage,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }
    const body = renderProfileCard(result.profile, config, {
      backgroundDataUri,
    });
    return new Response(request.method === "HEAD" ? null : body, {
      status: 200,
      headers: {
        ...BASE_HEADERS,
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control":
          site.mode === "public"
            ? "public, max-age=300, s-maxage=300, stale-while-revalidate=1200, stale-if-error=86400"
            : "private, max-age=300, stale-while-revalidate=1200",
        "X-Profile-Cache": result.stale ? "STALE" : result.cached ? "HIT" : "MISS",
        "X-Data-Fetched-At": result.profile.fetchedAt.toISOString(),
        "X-GitHub-Username": result.profile.login,
        "X-Site-Mode": site.mode,
      },
    });
  } catch (error) {
    console.error("Profile card failed", {
      login,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response(request.method === "HEAD" ? null : errorCard(error, url, login), {
      status: 200,
      headers: {
        ...BASE_HEADERS,
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        "X-Profile-Cache": "ERROR",
      },
    });
  }
}

export async function summaryResponse(request: Request) {
  const url = new URL(request.url);
  let login = "";
  try {
    login = requestedLogin(url);
    const result = await getProfile(login, {
      forceRefresh: url.searchParams.get("refresh") === "1",
    });
    const profile = result.profile;
    return Response.json(
      {
        login: profile.login,
        profileUrl: `https://github.com/${profile.login}`,
        stars: profile.stars,
        rank: profile.rank.level,
        score: Number(profile.rank.score.toFixed(1)),
        percentile: Number(profile.rank.percentile.toFixed(1)),
        repositories: profile.repositories,
        followers: profile.followers,
        contributions: profile.contributions,
        languages: profile.languages.length,
        topRepositories: profile.topRepositories,
        fetchedAt: profile.fetchedAt.toISOString(),
        cached: result.cached,
        stale: result.stale,
        cacheAgeSeconds: result.ageSeconds,
        dataTier: profile.dataTier,
      },
      {
        headers: {
          ...BASE_HEADERS,
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "X-Profile-Cache": result.stale ? "STALE" : result.cached ? "HIT" : "MISS",
        },
      },
    );
  } catch (error) {
    const info = publicErrorMessage(error);
    return Response.json(
      { error: info.code, message: info.message },
      {
        status: info.status,
        headers: {
          ...BASE_HEADERS,
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          ...(info.status >= 500 ? { "Retry-After": "60" } : {}),
        },
      },
    );
  }
}
