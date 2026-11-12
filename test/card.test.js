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
    "theme=ocean&accent=%23FFAA00&bgTL=0.7&bgTR=0.1&bgBR=0.9&bgBL=0.2&h1=Hello&note=Keep+building.",
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

test("error cards respect the selected theme", () => {
  const svg = renderErrorCard({ title: "Unavailable" }, { theme: "ivory" });
  assert.match(svg, /Unavailable/);
  assert.match(svg, /#F8F4EC/);
});

test("site access mode only permits configured profiles in private mode", () => {
  const site = normalizeSiteConfig({
    mode: "private",
    defaultUsername: "DearLicy",
    allowedUsers: "DearLicy, octocat",
  });
  assert.equal(profileAllowed(site, "dearlicy"), true);
  assert.equal(profileAllowed(site, "Octocat"), true);
  assert.equal(profileAllowed(site, "torvalds"), false);
  assert.deepEqual(publicSiteConfig(site).allowedUsers, ["DearLicy", "octocat"]);
});
