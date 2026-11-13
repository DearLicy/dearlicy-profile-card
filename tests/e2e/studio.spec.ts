import { expect, test, type Page } from "@playwright/test";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="1360" viewBox="0 0 920 1360">
  <rect width="920" height="1360" fill="#090807"/>
  <text x="60" y="120" fill="#f4efe5" font-size="42">DearLicy</text>
</svg>`;

async function mockSummaryAndCard(page: Page) {
  await page.route("**/api**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/summary") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          login: "DearLicy",
          profileUrl: "https://github.com/DearLicy",
          stars: 120,
          rank: "A",
          score: 42.5,
          percentile: 8,
          repositories: 18,
          followers: 96,
          contributions: 860,
          languages: 9,
          fetchedAt: new Date().toISOString(),
          cached: false,
          stale: false,
          dataTier: "full",
        }),
      });
      return;
    }
    if (url.pathname === "/api") {
      await route.fulfill({ contentType: "image/svg+xml", body: SVG });
      return;
    }
    await route.fallback();
  });
}

test("initial page is landing-only and generation replaces it", async ({ page }) => {
  await mockSummaryAndCard(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "变成你的主页名片",
  );
  await expect(
    page.getByRole("textbox", { name: "GitHub 用户名或主页链接" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "生成卡片" })).toBeVisible();
  await expect(page.locator("img[alt*='主页卡片']")).toHaveCount(0);

  await page
    .getByRole("textbox", { name: "GitHub 用户名或主页链接" })
    .fill("DearLicy");
  await page.getByRole("button", { name: "生成卡片" }).click();

  await expect(page).toHaveURL(/\/c\/DearLicy/);
  await expect(page.getByRole("heading", { name: "@DearLicy" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "GitHub 用户名或主页链接" })).toHaveCount(0);
  await expect(page.locator("img[alt='DearLicy 的 GitHub 主页卡片']")).toBeVisible();
});

test("theme transition keeps layout geometry stable", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  const form = page.locator("form").first();
  const documentBox = (locator: typeof header) =>
    locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x + window.scrollX),
        y: Math.round(rect.y + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });

  await page.waitForTimeout(700);
  const beforeHeader = await documentBox(header);
  const beforeForm = await documentBox(form);

  const toggle = page.getByRole("button", { name: "切换主题" });
  await toggle.click();
  await page.waitForTimeout(850);

  expect(await documentBox(header)).toEqual(beforeHeader);
  expect(await documentBox(form)).toEqual(beforeForm);

  await toggle.click();
  await page.waitForTimeout(850);

  expect(await documentBox(header)).toEqual(beforeHeader);
  expect(await documentBox(form)).toEqual(beforeForm);
});

test("no native form, dialog or select controls are exposed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("select")).toHaveCount(0);
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.locator("input[type='color']")).toHaveCount(0);
});

test("mobile drawer opens from the bottom and closes with Escape", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only gesture surface");
  await mockSummaryAndCard(page);
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "GitHub 用户名或主页链接" })
    .fill("DearLicy");
  await page.getByRole("button", { name: "生成卡片" }).click();
  await expect(page.getByRole("heading", { name: "@DearLicy" })).toBeVisible();

  await page.getByRole("button", { name: "调整" }).click();
  await expect(page.getByRole("dialog", { name: "调整卡片" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "调整卡片" })).toBeHidden();
});
