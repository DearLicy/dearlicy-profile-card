import { describe, expect, it } from "vitest";

import {
  CARD_THEMES,
  configFromSearchParams,
  normalizeCardConfig,
} from "../../src/config.js";
import {
  normalizeGitHubLogin,
  ProfileInputError,
} from "../../src/github.js";

describe("normalizeGitHubLogin", () => {
  it("accepts usernames, @handles and profile URLs", () => {
    expect(normalizeGitHubLogin("Octocat")).toBe("Octocat");
    expect(normalizeGitHubLogin("@Octocat")).toBe("Octocat");
    expect(normalizeGitHubLogin("https://github.com/Octocat")).toBe("Octocat");
    expect(normalizeGitHubLogin("github.com/Octocat/")).toBe("Octocat");
  });

  it("rejects repositories, foreign hosts and malformed values", () => {
    expect(() => normalizeGitHubLogin("https://github.com/Octocat/repo")).toThrow(
      ProfileInputError,
    );
    expect(() => normalizeGitHubLogin("https://example.com/Octocat")).toThrow(
      ProfileInputError,
    );
    expect(() => normalizeGitHubLogin("bad/name")).toThrow(ProfileInputError);
  });
});

describe("card configuration", () => {
  it("normalizes query parameters and corner order", () => {
    const config = configFromSearchParams(
      new URLSearchParams({
        theme: "graphite",
        accent: "#ffaa00",
        bgTL: "0.7",
        bgTR: "0.1",
        bgBL: "0.2",
        bgBR: "0.9",
        bgImage: "123e4567-e89b-12d3-a456-426614174000",
        h1: "Hello",
        h2: "World",
        note: "Keep building.",
      }),
    );
    expect(config.theme).toBe("graphite");
    expect(config.accent).toBe("#FFAA00");
    expect(config.backgroundCorners).toEqual({
      tl: 0.7,
      tr: 0.1,
      br: 0.9,
      bl: 0.2,
    });
    expect(config.backgroundImage).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    );
    expect(config.headlineOne).toBe("Hello");
    expect(config.headlineTwo).toBe("World");
    expect(config.footerNote).toBe("Keep building.");
  });

  it("rejects arbitrary background URLs and unknown themes", () => {
    const config = normalizeCardConfig({
      theme: "not-a-theme",
      backgroundImage: "https://example.com/bg.webp",
      accent: "javascript:alert(1)",
    });
    expect(config.theme).toBe("midnight");
    expect(config.backgroundImage).toBe("");
    expect(config.accent).toBe("");
  });

  it("clamps opacity and strips control characters from copy", () => {
    const config = normalizeCardConfig({
      backgroundCorners: { tl: -1, tr: 2, bl: 0.5, br: 0.38 },
      mark: "  <script>\u0000  ",
      intro: "a".repeat(200),
    });
    expect(config.backgroundCorners.tl).toBe(0);
    expect(config.backgroundCorners.tr).toBe(1);
    expect(config.mark).toBe("<SCRIPT>");
    expect(config.intro).toHaveLength(120);
  });

  it("ships independent theme definitions", () => {
    expect(Object.keys(CARD_THEMES)).toEqual(["midnight", "graphite", "whale"]);
    expect(new Set(Object.values(CARD_THEMES).map((theme) => theme.layout)).size).toBe(3);
  });
});
