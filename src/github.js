import { fetchImageDataUri } from "./assets.js";

const DEFAULT_LOGIN = "DearLicy";
const LOGIN_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const LANGUAGE_COLORS = {
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  PHP: "#4F5D95",
  MDX: "#FCB32C",
  CSS: "#663399",
  HTML: "#E34C26",
  Swift: "#F05138",
  Rust: "#DEA584",
  Python: "#3572A5",
  Go: "#00ADD8",
  Java: "#B07219",
  Shell: "#89E051",
  Vue: "#41B883",
  Svelte: "#FF3E00",
  C: "#555555",
  "C++": "#F34B7D",
  "C#": "#178600",
  Ruby: "#701516",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Dockerfile: "#384D54",
  SCSS: "#C6538C",
  Less: "#1D365D",
  Lua: "#000080",
  Objective_C: "#438EFF",
};

export class ProfileInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProfileInputError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor(login) {
    super(`GitHub profile "${login}" was not found`);
    this.name = "ProfileNotFoundError";
  }
}

export function normalizeGitHubLogin(input) {
  const value = String(input ?? "").trim();
  if (!value) {
    throw new ProfileInputError("输入 GitHub 用户名或主页链接。");
  }

  let candidate = value.replace(/^@/, "");
  if (
    /^(?:https?:\/\/)?(?:www\.)?github\.com(?:\/|$)/i.test(candidate)
  ) {
    const withScheme = /^https?:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`;
    let url;
    try {
      url = new URL(withScheme);
    } catch {
      throw new ProfileInputError("GitHub 主页链接格式不正确。");
    }
    if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
      throw new ProfileInputError("只支持 github.com 的主页链接。");
    }
    const segments = url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
    if (segments.length !== 1) {
      throw new ProfileInputError("请粘贴 GitHub 用户主页，而不是仓库或子页面链接。");
    }
    candidate = segments[0];
  } else if (/[:/]/.test(candidate)) {
    throw new ProfileInputError("只支持 GitHub 用户名或 github.com 用户主页链接。");
  }

  if (!LOGIN_PATTERN.test(candidate)) {
    throw new ProfileInputError("GitHub 用户名格式不正确。");
  }
  return candidate;
}

const PROFILE_QUERY = `
  query($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 240)
      followers { totalCount }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar { totalContributions }
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        privacy: PUBLIC
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          name
          stargazerCount
          isFork
          isArchived
          languages(first: 12, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node { name color }
            }
          }
        }
      }
    }
  }
`;

function calculateRank({ commits, prs, issues, reviews, stars, followers }) {
  const exponentialCdf = (value) => 1 - 2 ** -value;
  const logNormalCdf = (value) => value / (1 + value);
  const weightedScores = [
    [2, exponentialCdf(commits / 250)],
    [3, exponentialCdf(prs / 50)],
    [1, exponentialCdf(issues / 25)],
    [1, exponentialCdf(reviews / 2)],
    [4, logNormalCdf(stars / 50)],
    [1, logNormalCdf(followers / 10)],
  ];
  const totalWeight = weightedScores.reduce((sum, [weight]) => sum + weight, 0);
  const rank =
    1 -
    weightedScores.reduce((sum, [weight, score]) => sum + weight * score, 0) /
      totalWeight;
  const percentile = rank * 100;
  const thresholds = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const levels = ["S", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
  const index = thresholds.findIndex((threshold) => percentile <= threshold);
  return {
    level: levels[index === -1 ? levels.length - 1 : index],
    percentile,
    score: percentile,
  };
}

async function requestGraphql(token, query, variables) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "DearLicy-profile-card",
    },
    body: JSON.stringify({ query, variables }),
    cf: {
      cacheEverything: true,
      cacheTtl: 240,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    if (
      payload.errors.some(
        (error) =>
          error.type === "NOT_FOUND" &&
          /could not resolve to a user/i.test(error.message || ""),
      )
    ) {
      throw new ProfileNotFoundError(variables.login);
    }
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }
  return payload.data;
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "DearLicy-profile-card",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 240,
    },
  });
  if (response.status === 404) {
    throw new ProfileNotFoundError(new URL(url).pathname.split("/")[2] || "profile");
  }
  if (!response.ok) {
    throw new Error(`GitHub REST request failed with ${response.status}`);
  }
  return response.json();
}

async function fetchPublicContributions(login) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  const format = (date) => date.toISOString().slice(0, 10);
  const url =
    `https://github.com/users/${encodeURIComponent(login)}/contributions?` +
    new URLSearchParams({ from: format(from), to: format(to) }).toString();

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent": "DearLicy-profile-card",
      },
      cf: {
        cacheEverything: true,
        cacheTtl: 240,
      },
    });
    if (!response.ok) return 0;
    const html = await response.text();
    const matches = html.matchAll(/>(\d[\d,]*) contributions? on/g);
    let total = 0;
    for (const match of matches) {
      total += Number.parseInt(match[1].replaceAll(",", ""), 10) || 0;
    }
    return total;
  } catch {
    return 0;
  }
}

function fallbackLanguageColor(name) {
  return LANGUAGE_COLORS[name] || "#8B949E";
}

async function fetchRestProfile(env, requestedLogin) {
  const login = encodeURIComponent(requestedLogin);
  const user = await requestJson(`https://api.github.com/users/${login}`);
  const repositories = await requestJson(
    `https://api.github.com/users/${login}/repos?per_page=100&type=owner&sort=updated`,
  );
  const contributions = await fetchPublicContributions(user.login);
  const publicRepositories = Array.isArray(repositories) ? repositories : [];
  const languagesByName = new Map();

  for (const repository of publicRepositories) {
    if (repository.fork || repository.archived || !repository.language) continue;
    const current = languagesByName.get(repository.language) ?? {
      name: repository.language,
      bytes: 0,
      color: fallbackLanguageColor(repository.language),
    };
    current.bytes += Math.max(Number(repository.size) || 0, 1) * 1024;
    languagesByName.set(repository.language, current);
  }

  const languages = [...languagesByName.values()].sort(
    (left, right) => right.bytes - left.bytes,
  );
  const topRepositories = publicRepositories
    .filter((repository) => !repository.fork && !repository.archived)
    .sort(
      (left, right) =>
        right.stargazers_count - left.stargazers_count,
    )
    .slice(0, 4)
    .map((repository) => ({
      name: repository.name,
      stars: repository.stargazers_count,
    }));
  const stars = publicRepositories.reduce(
    (total, repository) => total + (repository.stargazers_count || 0),
    0,
  );
  const followers = user.followers || 0;
  const rank = calculateRank({
    commits: Math.round(contributions * 0.7),
    prs: 0,
    issues: 0,
    reviews: 0,
    stars,
    followers,
  });

  return {
    login: user.login,
    displayName: user.name || user.login,
    avatarDataUri: await fetchImageDataUri(user.avatar_url, env, {
      maxBytes: 1_000_000,
    }),
    stars,
    repositories: user.public_repos || publicRepositories.length,
    followers,
    contributions,
    rank,
    languages,
    totalLanguageBytes: languages.reduce(
      (total, language) => total + language.bytes,
      0,
    ),
    topRepositories,
    fetchedAt: new Date(),
    dataTier: "basic",
  };
}

export async function fetchProfileData(env, requestedLogin = DEFAULT_LOGIN) {
  if (!env.GITHUB_TOKEN) {
    return fetchRestProfile(env, requestedLogin);
  }

  const data = await requestGraphql(env.GITHUB_TOKEN, PROFILE_QUERY, {
    login: requestedLogin,
  });
  const user = data.user;
  if (!user) {
    throw new ProfileNotFoundError(requestedLogin);
  }
  const repositories = user.repositories.nodes ?? [];
  const contributions = user.contributionsCollection;

  const stars = repositories.reduce(
    (total, repository) => total + repository.stargazerCount,
    0,
  );
  const followers = user.followers.totalCount;
  const languagesByName = new Map();

  for (const repository of repositories) {
    if (repository.isFork) continue;
    for (const edge of repository.languages.edges) {
      const name = edge.node.name;
      const current = languagesByName.get(name) ?? {
        name,
        bytes: 0,
        color: edge.node.color || "#8B949E",
      };
      current.bytes += edge.size;
      languagesByName.set(name, current);
    }
  }

  const languages = [...languagesByName.values()].sort(
    (left, right) => right.bytes - left.bytes,
  );
  const totalLanguageBytes = languages.reduce(
    (total, language) => total + language.bytes,
    0,
  );
  const topRepositories = repositories
    .filter((repository) => !repository.isFork && !repository.isArchived)
    .sort((left, right) => right.stargazerCount - left.stargazerCount)
    .slice(0, 4)
    .map((repository) => ({
      name: repository.name,
      stars: repository.stargazerCount,
    }));

  const rank = calculateRank({
    commits: contributions.totalCommitContributions,
    prs: contributions.totalPullRequestContributions,
    issues: contributions.totalIssueContributions,
    reviews: contributions.totalPullRequestReviewContributions,
    stars,
    followers,
  });
  const avatarDataUri = await fetchImageDataUri(user.avatarUrl, env, {
    maxBytes: 1_000_000,
  });

  return {
    login: user.login,
    displayName: user.name || user.login,
    avatarDataUri,
    stars,
    repositories: user.repositories.totalCount,
    followers,
    contributions: contributions.contributionCalendar.totalContributions,
    rank,
    languages,
    totalLanguageBytes,
    topRepositories,
    fetchedAt: new Date(),
    dataTier: "full",
  };
}
