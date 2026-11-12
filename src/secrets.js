const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function vaultKey(secret) {
  if (!secret) throw new Error("ADMIN_SECRET is required to unlock secrets");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function sealSecret(value, adminSecret) {
  if (!value) return "";
  const key = await vaultKey(adminSecret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(String(value)),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function openSecret(value, adminSecret) {
  if (!value) return "";
  const [version, encodedIv, encodedPayload] = String(value).split(".");
  if (version !== "v1" || !encodedIv || !encodedPayload) return "";
  try {
    const key = await vaultKey(adminSecret);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(encodedIv) },
      key,
      base64ToBytes(encodedPayload),
    );
    return decoder.decode(decrypted);
  } catch {
    return "";
  }
}
