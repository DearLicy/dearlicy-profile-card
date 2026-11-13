import { describe, expect, it } from "vitest";

import { parseWebpDimensions, validateImageBuffer } from "../../lib/images";

function vp8xWebp(width: number, height: number) {
  const buffer = Buffer.alloc(30);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(22, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8X", 12, "ascii");
  buffer.writeUInt32LE(10, 16);
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

describe("WebP validation", () => {
  it("reads dimensions from an extended WebP header", () => {
    expect(parseWebpDimensions(vp8xWebp(920, 1360))).toEqual({
      width: 920,
      height: 1360,
    });
  });

  it("rejects non-WebP and truncated buffers", () => {
    expect(parseWebpDimensions(Buffer.from("not an image"))).toBeNull();
    expect(() => validateImageBuffer(Buffer.from("not an image"))).toThrow();
    expect(() => validateImageBuffer(Buffer.alloc(0))).toThrow("图片内容为空");
  });

  it("enforces the 1 MB limit", () => {
    const oversized = Buffer.alloc(1_000_001);
    expect(() => validateImageBuffer(oversized)).toThrow("1 MB");
  });

  it("returns normalized dimensions for a valid image", () => {
    expect(validateImageBuffer(vp8xWebp(320, 480))).toEqual({
      width: 320,
      height: 480,
    });
  });
});
