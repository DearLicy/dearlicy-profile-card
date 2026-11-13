const SESSION_COOKIE = "pcard_admin";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64url(value) {
  const padded = String(value)
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(String(value).length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(value));
}

async function signedValue(secret, value) {
  const signature = await hmac(secret, value);
  return `${value}.${base64url(new Uint8Array(signature))}`;
}

async function verifySignedValue(secret, signed, maxAgeSeconds) {
  try {
    const separator = String(signed || "").lastIndexOf(".");
    if (separator < 1) return null;
    const value = signed.slice(0, separator);
    const provided = fromBase64url(signed.slice(separator + 1));
    const expected = new Uint8Array(await hmac(secret, value));
    if (provided.length !== expected.length) return null;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) {
      difference |= provided[index] ^ expected[index];
    }
    if (difference !== 0) return null;
    const [payload, timestamp] = value.split(".");
    const issuedAt = Number(timestamp);
    if (!payload || !Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > maxAgeSeconds * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requestCookies(request) {
  const output = {};
  for (const part of String(request.headers.get("Cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    output[part.slice(0, separator).trim()] = part
      .slice(separator + 1)
      .trim();
  }
  return output;
}

function isSecureRequest(request) {
  const forwarded = String(request.headers.get("X-Forwarded-Proto") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return forwarded === "https" || new URL(request.url).protocol === "https:";
}

export function browserCookie(
  name,
  value,
  request,
  {
    maxAge = SESSION_SECONDS,
    clear = false,
    sameSite = "Lax",
    path = "/",
    httpOnly = true,
  } = {},
) {
  const bits = [
    `${name}=${clear ? "" : value}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
    `Max-Age=${clear ? 0 : maxAge}`,
  ];
  if (httpOnly) bits.push("HttpOnly");
  if (isSecureRequest(request)) bits.push("Secure");
  return bits.join("; ");
}

export function sessionCookie(
  value,
  request,
  { maxAge = SESSION_SECONDS, clear = false, sameSite = "Lax" } = {},
) {
  return browserCookie(SESSION_COOKIE, value, request, {
    maxAge,
    clear,
    sameSite,
  });
}

export async function createSession(secret) {
  return signedValue(secret, `admin.${Date.now()}`);
}

export async function hasSession(request, secret) {
  return (
    (await verifySignedValue(
      secret,
      requestCookies(request)[SESSION_COOKIE],
      SESSION_SECONDS,
    )) === "admin"
  );
}
