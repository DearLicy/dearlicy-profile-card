import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { fetchProfileData } from "../src/github.js";
import { renderProfileCard } from "../src/card.js";

const here = dirname(fileURLToPath(import.meta.url));
const login = process.env.GITHUB_USERNAME || process.argv[2] || "DearLicy";
const filename =
  login.toLowerCase() === "dearlicy"
    ? "profile-preview.svg"
    : `profile-${login.toLowerCase()}.svg`;
const output = join(here, "..", "public", filename);

const data = await fetchProfileData({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
}, login);
const svg = renderProfileCard(data);
await writeFile(output, svg, "utf8");

console.log(
  JSON.stringify({
    output,
    login: data.login,
    avatar: Boolean(data.avatarDataUri),
    stars: data.stars,
    rank: data.rank.level,
    repositories: data.repositories,
    languages: data.languages.length,
  }),
);
