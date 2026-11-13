import { describe, expect, it } from "vitest";

import { renderErrorCard, renderProfileCard } from "../../src/card.js";

const profile = {
  login: "Octocat",
  displayName: "The Octocat",
  avatarDataUri: null,
  stars: 123,
  repositories: 8,
  followers: 42,
  contributions: 365,
  rank: { level: "A-", score: 31.4, percentile: 31.4 },
  languages: [
    { name: "TypeScript", bytes: 70, color: "#3178C6" },
    { name: "JavaScript", bytes: 30, color: "#F1E05A" },
  ],
  totalLanguageBytes: 100,
  topRepositories: [
    { name: "hello-world", stars: 100 },
    { name: "spoon-knife", stars: 23 },
  ],
  fetchedAt: new Date("2026-01-02T03:04:05Z"),
  dataTier: "full" as const,
};

describe("SVG renderer", () => {
  it.each(["midnight", "graphite", "whale"])(
    "renders a complete animated SVG for %s",
    (theme) => {
      const svg = renderProfileCard(profile, { theme });
      expect(svg).toMatch(/^<svg /);
      expect(svg).toMatch(/<\/svg>$/);
      expect(svg).toContain("The Octocat");
      expect(svg).toContain("31.4 / 100");
      expect(svg).not.toContain("<script");
      expect(svg).toContain("@keyframes");
    },
  );

  it("escapes user copy before it enters the SVG", () => {
    const svg = renderProfileCard(profile, {
      intro: "<unsafe & text>",
      mark: 'A"B',
    });
    expect(svg).toContain("&lt;unsafe &amp; text&gt;");
    expect(svg).not.toContain('mark="A"B"');
  });

  it("embeds the tide theme character assets as WebP data URIs", () => {
    const svg = renderProfileCard(profile, { theme: "whale" });
    expect(svg.match(/data:image\/webp/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps username and metrics when a background layer is present", () => {
    for (const theme of ["midnight", "graphite", "whale"]) {
      const svg = renderProfileCard(
        profile,
        {
          theme,
          backgroundCorners: { tl: 0.5, tr: 0.24, bl: 0.16, br: 0.38 },
        },
        {
          backgroundDataUri:
            "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJQBOgCHwAP7+4AAAAA==",
        },
      );
      expect(svg).toContain("The Octocat");
      expect(svg).toMatch(/@?Octocat/i);
      expect(svg).toContain("31.4 / 100");
      expect(svg).toContain("<image ");
      expect(svg).toContain('mask="url(#');
    }
  });

  it("renders a themed error card rather than an empty response", () => {
    const svg = renderErrorCard(
      { title: "Unavailable", message: "Try later", detail: "Upstream" },
      { theme: "graphite" },
    );
    expect(svg).toContain("Unavailable");
    expect(svg).toContain("#F3F1EB");
  });
});
