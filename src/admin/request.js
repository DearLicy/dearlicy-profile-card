const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function externalOrigin(request) {
  const url = new URL(request.url);
  const host = String(request.headers.get("X-Forwarded-Host") || url.host)
    .split(",")[0]
    .trim();
  const proto = String(
    request.headers.get("X-Forwarded-Proto") || url.protocol.replace(":", ""),
  )
    .split(",")[0]
    .trim();
  return `${proto || "http"}://${host}`;
}

export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === externalOrigin(request);
}

export function clientAddress(request) {
  return (
    String(request.headers.get("CF-Connecting-IP") || "").trim() ||
    String(request.headers.get("X-Real-IP") || "").trim() ||
    String(request.headers.get("X-Forwarded-For") || "")
      .split(",")[0]
      .trim() ||
    "local"
  );
}

export function loginLimited(address) {
  const entry = attempts.get(address);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    attempts.delete(address);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function registerLoginFailure(address) {
  const current = attempts.get(address);
  if (!current || current.resetAt <= Date.now()) {
    attempts.set(address, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    current.count += 1;
  }
  while (attempts.size > 500) {
    attempts.delete(attempts.keys().next().value);
  }
}

export function resetLoginFailures(address) {
  attempts.delete(address);
}

export function safeEqual(left, right) {
  const encoder = new TextEncoder();
  const a = encoder.encode(String(left || ""));
  const b = encoder.encode(String(right || ""));
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

export function validGitHubToken(value) {
  const token = String(value || "").trim();
  return (
    token.length >= 20 &&
    token.length <= 255 &&
    /^(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)$/.test(token)
  );
}
