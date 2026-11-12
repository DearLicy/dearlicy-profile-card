import { fetchProfileData } from "./github.js";

const FRESH_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 20 * 1000;
const CACHE_ORIGIN = "https://profile-card.internal";
const MEMORY_LIMIT = 40;

const memoryEntries = new Map();
const inFlight = new Map();

function cacheApi() {
  try {
    return globalThis.caches?.default || null;
  } catch {
    return null;
  }
}

function cacheControl(seconds) {
  return `public, max-age=${seconds}, s-maxage=${seconds}`;
}

function toEntry(profile) {
  return {
    profile: {
      ...profile,
      fetchedAt: profile.fetchedAt.toISOString(),
    },
    storedAt: Date.now(),
  };
}

function fromEntry(entry) {
  if (!entry?.profile?.fetchedAt || !entry?.storedAt) return null;
  return {
    profile: {
      ...entry.profile,
      fetchedAt: new Date(entry.profile.fetchedAt),
    },
    storedAt: entry.storedAt,
  };
}

function cacheKey(login) {
  return new Request(
    `${CACHE_ORIGIN}/${encodeURIComponent(login.toLowerCase())}/profile/v3`,
  );
}

function remember(login, entry) {
  memoryEntries.set(login.toLowerCase(), entry);
  while (memoryEntries.size > MEMORY_LIMIT) {
    memoryEntries.delete(memoryEntries.keys().next().value);
  }
}

function scheduleWrite(ctx, task) {
  const promise = Promise.resolve(task).catch(() => undefined);
  if (typeof ctx?.waitUntil === "function") {
    ctx.waitUntil(promise);
  } else {
    void promise;
  }
}

async function readCache(login) {
  const memory = fromEntry(memoryEntries.get(login.toLowerCase()));
  if (memory && Date.now() - memory.storedAt < STALE_TTL_MS) {
    return memory;
  }

  const cache = cacheApi();
  if (!cache) return null;

  try {
    const response = await cache.match(cacheKey(login));
    if (!response) return null;
    const entry = fromEntry(await response.json());
    if (
      !entry ||
      Date.now() - entry.storedAt >= STALE_TTL_MS
    ) {
      return null;
    }
    remember(login, entry);
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(login, entry, ctx) {
  remember(login, entry);
  const cache = cacheApi();
  if (!cache) return;

  scheduleWrite(
    ctx,
    cache.put(
      cacheKey(login),
      new Response(JSON.stringify(entry), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": cacheControl(STALE_TTL_MS / 1000),
        },
      }),
    ),
  );
}

async function loadFromGitHub(env, login, ctx) {
  const profile = await fetchProfileData(env, login);
  const entry = toEntry(profile);
  await writeCache(login, entry, ctx);
  return {
    profile,
    cached: false,
    stale: false,
    ageSeconds: 0,
  };
}

export async function getProfile(
  env,
  ctx,
  login,
  { forceRefresh = false } = {},
) {
  const key = login.toLowerCase();
  const cachedEntry = await readCache(login);
  const now = Date.now();
  const age = cachedEntry ? now - cachedEntry.storedAt : Infinity;
  const isFresh = age < FRESH_TTL_MS;
  const refreshAllowed = forceRefresh && age >= REFRESH_COOLDOWN_MS;

  if (cachedEntry && (forceRefresh ? !refreshAllowed : isFresh)) {
    return {
      profile: cachedEntry.profile,
      cached: true,
      stale: age >= STALE_TTL_MS,
      ageSeconds: Math.max(0, Math.floor(age / 1000)),
    };
  }

  if (!inFlight.has(key)) {
    const request = loadFromGitHub(env, login, ctx).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, request);
  }

  try {
    return await inFlight.get(key);
  } catch (error) {
    if (cachedEntry && age < STALE_TTL_MS) {
      return {
        profile: cachedEntry.profile,
        cached: true,
        stale: true,
        ageSeconds: Math.max(0, Math.floor(age / 1000)),
        warning: error instanceof Error ? error.message : "Upstream request failed",
      };
    }
    throw error;
  }
}

export const CACHE_SECONDS = FRESH_TTL_MS / 1000;

export function clearProfileCache() {
  memoryEntries.clear();
  inFlight.clear();
}
