import assert from "node:assert/strict";
import test from "node:test";

import { isAllowedAssetUrl } from "../src/assets.js";

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
