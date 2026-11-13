import { expect, test } from "@playwright/test";

const PASSWORD = process.env.ADMIN_PASSWORD || "e2e-admin-password-at-least-16";

async function openAdminPage(
  page: import("@playwright/test").Page,
  linkName: string,
  heading: string,
) {
  const link = page.getByRole("link", { name: linkName }).first();
  if (!(await link.isVisible())) {
    await page.getByRole("button", { name: "打开管理导航" }).click();
  }
  await link.click();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("管理员密码").fill(PASSWORD);
  await page.getByRole("button", { name: "进入管理后台" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "工作台" })).toBeVisible();
}

test("admin login reaches content workspace and logout clears session", async ({
  page,
}) => {
  await login(page);
  await openAdminPage(page, "媒体库", "媒体库");
  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("admin upload, lightbox preview and cleanup", async ({ page }, testInfo) => {
  await login(page);
  await openAdminPage(page, "媒体库", "媒体库");

  const label = `E2E ${testInfo.project.name} ${Date.now()}`;
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 480;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    context.fillStyle = "#17131f";
    context.fillRect(0, 0, 320, 480);
    context.fillStyle = "#e8442a";
    context.fillRect(32, 32, 256, 24);
    return canvas.toDataURL("image/webp", 0.8);
  });
  const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
  const uploaded = await page.request.post(
    `/admin/api/images?category=photo&label=${encodeURIComponent(label)}`,
    {
      headers: { "Content-Type": "image/webp" },
      data: buffer,
    },
  );
  expect(uploaded.ok()).toBeTruthy();
  const payload = (await uploaded.json()) as { image: { id: string } };

  await page.reload();
  await page.getByRole("button", { name: `预览图片 ${label}` }).click();
  await expect(page.getByRole("button", { name: "使用此图片" })).toHaveCount(0);
  await expect(page.getByText(label).first()).toBeVisible();
  await page.keyboard.press("Escape");

  await page.request.delete(`/admin/api/images/${payload.image.id}`);
  await page.reload();
  await expect(
    page.getByRole("button", { name: `预览图片 ${label}` }),
  ).toHaveCount(0);
});
