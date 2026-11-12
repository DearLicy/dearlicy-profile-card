import assert from "node:assert/strict";
import test from "node:test";

import {
  inlineBackgroundData,
  isAllowedAssetUrl,
} from "../src/assets.js";
import { configFromSearchParams } from "../src/config.js";

const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

test("accepts browser-safe inline background data", () => {
  const encoded = pngBytes.toString("base64url");
  const config = configFromSearchParams(
    new URLSearchParams(`bgData=${encoded}`),
  );
  assert.equal(config.backgroundData, encoded);
  assert.match(
    inlineBackgroundData(encoded),
    /^data:image\/png;base64,/,
  );
});

test("rejects oversized or non-image inline background data", () => {
  const oversized = Buffer.alloc(18_001, 0).toString("base64url");
  const random = Buffer.from("not an image").toString("base64url");
  assert.equal(inlineBackgroundData(oversized), "");
  assert.equal(inlineBackgroundData(random), "");
  assert.equal(
    configFromSearchParams(
      new URLSearchParams(`bgData=${"a".repeat(24_001)}`),
    ).backgroundData,
    "",
  );
});

test("does not proxy arbitrary asset hosts by default", () => {
  assert.equal(
    isAllowedAssetUrl("https://avatars.githubusercontent.com/u/1", {}),
    true,
  );
  assert.equal(isAllowedAssetUrl("https://images.example.net/a.jpg", {}), false);
  assert.equal(
    isAllowedAssetUrl("https://images.example.net/a.jpg", {
      ALLOW_REMOTE_ASSET_FETCH: "true",
    }),
    true,
  );
  assert.equal(
    isAllowedAssetUrl("https://127.0.0.1/a.jpg", {
      ALLOW_REMOTE_ASSET_FETCH: "true",
    }),
    false,
  );
});
