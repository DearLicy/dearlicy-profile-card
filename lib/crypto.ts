import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { getDb } from "@/lib/db";

function adminPassword() {
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (password.length < 16) {
    throw new Error("ADMIN_PASSWORD 必须配置且至少包含 16 个字符。");
  }
  return password;
}

function readMeta(key: string) {
  return getDb().sqlite
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get(key) as { value: string } | undefined;
}

function writeMeta(key: string, value: string) {
  getDb().sqlite
    .prepare(
      "INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(key, value);
}

export function encryptionSalt() {
  const stored = readMeta("encryption_salt");
  if (stored?.value) return Buffer.from(stored.value, "base64");
  const salt = randomBytes(24);
  writeMeta("encryption_salt", salt.toString("base64"));
  return salt;
}

function derivedKey(label: string) {
  const salt = Buffer.from(
    `${label}:${encryptionSalt().toString("base64")}`,
    "utf8",
  );
  return scryptSync(adminPassword(), salt, 32, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

export function sealSecret(value: string) {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey("secrets"), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function openSecret(payload?: string | null) {
  if (!payload) return "";
  try {
    const [version, iv, tag, ciphertext] = payload.split(".");
    if (version !== "v1" || !iv || !tag || !ciphertext) return "";
    const decipher = createDecipheriv(
      "aes-256-gcm",
      derivedKey("secrets"),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signValue(value: string) {
  return createHmac("sha256", derivedKey("session"))
    .update(value)
    .digest("base64url");
}

export function isValidAdminPassword(value: string) {
  try {
    return safeEqual(String(value || ""), adminPassword());
  } catch {
    return false;
  }
}
