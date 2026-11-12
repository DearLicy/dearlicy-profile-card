import assert from "node:assert/strict";
import test from "node:test";

import { renderErrorCard, renderProfileCard } from "../src/card.js";
import { configFromSearchParams } from "../src/config.js";
import { normalizeGitHubLogin } from "../src/github.js";
import {
  normalizeSiteConfig,
  profileAllowed,
  publicSiteConfig,
} from "../src/site-config.js";

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
  dataTier: "full",
};

test("normalizes usernames and rejects non-profile URLs", () => {
  assert.equal(normalizeGitHubLogin("Octocat"), "Octocat");
  assert.equal(
    normalizeGitHubLogin("https://github.com/Octocat"),
    "Octocat",
  );
  assert.throws(() => normalizeGitHubLogin("https://github.com/Octocat/repo"));
});

test("parses customizable card query parameters", () => {
  const query = new URLSearchParams(
    "theme=ocean&accent=%23FFAA00&bgTL=0.7&bgTR=0.1&bgBR=0.9&bgBL=0.2&bgImage=123e4567-e89b-12d3-a456-426614174000&h1=Hello&note=Keep+building.",
  );
  const config = configFromSearchParams(query);
  assert.equal(config.theme, "ocean");
  assert.equal(config.accent, "#FFAA00");
  assert.deepEqual(config.backgroundCorners, {
    tl: 0.7,
    tr: 0.1,
    br: 0.9,
    bl: 0.2,
  });
  assert.equal(config.headlineOne, "Hello");
  assert.equal(config.footerNote, "Keep building.");
  assert.equal(config.backgroundImage, "123e4567-e89b-12d3-a456-426614174000");
  assert.equal(
    configFromSearchParams(new URLSearchParams("bgImage=not-an-image-id"))
      .backgroundImage,
    "",
  );
});

test("renders valid, escaped animated SVG for all themes", () => {
  for (const theme of ["midnight", "ivory", "ocean", "ember", "graphite"]) {
    const svg = renderProfileCard(profile, { theme });
    assert.match(svg, /^<svg /);
    assert.match(svg, /<\/svg>$/);
    assert.match(svg, /The Octocat/);
    assert.match(svg, /31\.4 \/ 100/);
    assert.ok(!svg.includes("<script"));
  }
  const escaped = renderProfileCard(profile, { intro: "<unsafe & text>" });
  assert.match(escaped, /&lt;unsafe &amp; text&gt;/);
});

test("keeps profile data when a custom background layer is enabled", () => {
  for (const theme of ["midnight", "ivory", "ocean", "ember", "graphite"]) {
    const svg = renderProfileCard(
      profile,
      {
        theme,
        backgroundCorners: { tl: 0.5, tr: 0.24, br: 0.38, bl: 0.16 },
      },
      {
        backgroundDataUri:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ",
      },
    );
    assert.match(svg, /The Octocat/);
    assert.match(svg, /@?Octocat/i);
    assert.match(svg, /31\.4 \/ 100/);
    assert.match(svg, /<image /);
    assert.match(svg, /mask="url\(#/);
    assert.match(svg, /<\/svg>$/);
  }
});

test("each theme has a structurally distinct composition and motion system", () => {
  const signatures = {
    midnight: ["ORBITAL PROFILE / LIVE", "mo-halo", "GITHUB / LIVE SNAPSHOT"],
    ivory: ["ISSUE 01 / PROFILE", "ed-shine", "PROFILE INDEX"],
    ocean: ["SESSION 01 / LIVE", "tc-rain", "$ stats --snapshot"],
    ember: ["POSTER / 01", "em-sun", "LANGUAGE SIGNAL"],
    graphite: ["PROFILE / 05", "sw-frame", "LANGUAGE / DISTRIBUTION"],
  };
  for (const [theme, markers] of Object.entries(signatures)) {
    const svg = renderProfileCard(profile, { theme });
    for (const marker of markers) assert.ok(svg.includes(marker), `${theme}: ${marker}`);
  }
});

test("long custom copy is bounded before it reaches the card edge", () => {
  for (const theme of ["midnight", "ivory", "ocean", "ember", "graphite"]) {
    const svg = renderProfileCard(
      {
        ...profile,
        topRepositories: [
          { name: "repository-".repeat(14), stars: 100 },
          { name: "spoon-knife", stars: 23 },
        ],
      },
      {
        theme,
        headlineOne: "W".repeat(42),
        headlineTwo: "M".repeat(48),
        intro: "中".repeat(120),
        badge: "状态徽标".repeat(16),
        footerNote: "页脚备注".repeat(16),
      },
    );
    assert.match(svg, /…/);
    assert.ok(!svg.includes("W".repeat(42)));
    assert.ok(!svg.includes("M".repeat(48)));
    assert.ok(!svg.includes("中".repeat(120)));
    assert.ok(!svg.includes("状态徽标".repeat(16)));
    assert.ok(!svg.includes("页脚备注".repeat(16)));
    assert.ok(!svg.includes("repository-".repeat(14)));
  }
});

test("error cards respect the selected theme", () => {
  const svg = renderErrorCard({ title: "Unavailable" }, { theme: "ivory" });
  assert.match(svg, /Unavailable/);
  assert.match(svg, /#F7F2E8/);
});

test("site access mode only permits configured profiles in private mode", () => {
  const site = normalizeSiteConfig({
    mode: "private",
    allowPublicUploads: true,
    defaultUsername: "DearLicy",
    allowedUsers: "DearLicy, octocat",
  });
  assert.equal(profileAllowed(site, "dearlicy"), true);
  assert.equal(profileAllowed(site, "Octocat"), true);
  assert.equal(profileAllowed(site, "torvalds"), false);
  assert.equal(site.allowPublicUploads, true);
  assert.deepEqual(publicSiteConfig(site).allowedUsers, ["DearLicy", "octocat"]);
});
