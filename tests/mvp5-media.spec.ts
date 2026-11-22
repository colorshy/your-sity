import { test, expect } from "@playwright/test";
import { randomUUID, randomFillSync } from "node:crypto";
import sharp from "sharp";
test("private image upload and repost persist in local Appwrite fixture", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000);
  await page.goto("/sign-up");
  if ((await page.locator("html").getAttribute("lang")) === "kk")
    await page.getByRole("button", { name: "РУС", exact: true }).click();
  await page.locator('input[name="name"]').fill("Media Tester");
  await page
    .locator('input[name="email"]')
    .fill(`media-${info.project.name}-${randomUUID()}@example.test`);
  await page.locator('input[name="password"]').fill("Test-password-123!");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.locator('input[value="events"]').check();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto("/create");
  await page.waitForLoadState("networkidle");
  const large = info.project.name === "desktop";
  const bytes = large
    ? await sharp(randomFillSync(Buffer.alloc(2500 * 2500 * 3)), {
        raw: { width: 2500, height: 2500, channels: 3 },
      })
        .jpeg({ quality: 85 })
        .toBuffer()
    : await sharp({
        create: { width: 8, height: 8, channels: 3, background: "green" },
      })
        .png()
        .toBuffer();
  if (large) expect(bytes.length).toBeGreaterThan(4 * 1024 * 1024);
  const files = [
    {
      name: large ? "shymkent.jpg" : "shymkent.png",
      mimeType: large ? "image/jpeg" : "image/png",
      buffer: bytes,
    },
  ];
  if (large) {
    const png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: "green",
      },
    })
      .png()
      .toBuffer();
    const webp = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: "blue",
      },
    })
      .webp()
      .toBuffer();
    files.push(
      { name: "extra.png", mimeType: "image/png", buffer: png },
      { name: "extra.webp", mimeType: "image/webp", buffer: webp },
      { name: "extra-two.webp", mimeType: "image/webp", buffer: webp },
    );
  }
  await page.locator('input[type="file"]').setInputFiles(files);
  await expect(page.locator(".app-upload-previews img")).toHaveCount(
    files.length,
  );
  await page.getByRole("button", { name: "Опубликовать" }).click();
  await expect(page).toHaveURL(/\/posts\//);
  const postUrl = page.url();
  await expect(page.locator(".app-media-grid img")).toHaveCount(files.length);
  const imageUrls = await page
    .locator(".app-media-grid a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")!));
  const imageUrl = await page.locator(".app-media-grid a").first().getAttribute("href");
  expect(imageUrl).toMatch(/^\/api\/media\/[a-z0-9]+$/);
  const response = await page.request.get(imageUrl!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain(
    large ? "image/jpeg" : "image/png",
  );
  const anonymous = await browser.newContext({ baseURL: page.url() });
  expect(
    (await anonymous.request.get(imageUrl!, { maxRedirects: 0 })).status(),
  ).toBe(307);
  expect(
    (
      await anonymous.request.post("/api/media/upload", {
        data: Buffer.from([1]),
      })
    ).status(),
  ).toBe(403);
  await anonymous.close();
  await page.getByRole("button", { name: "Репост" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Отменить репост" }),
  ).toContainText("1");
  await page.goto("/feed?mode=city");
  await expect(page.locator(".app-repost-attribution")).toBeVisible();
  if (info.project.name === "mobile")
    await page.setViewportSize({ width: 375, height: 812 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: `/workspace/artifacts/mvp51-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .locator(".app-post")
    .first()
    .getByRole("button", { name: "Отменить репост" })
    .click();
  await expect(
    page.locator(".app-post").first().getByRole("button", { name: "Репост" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".app-repost-attribution")).toHaveCount(0);
  await page.goto(postUrl);
  await page.getByRole("button", { name: "Удалить публикацию" }).click();
  await expect(page).toHaveURL(/\/feed$/);
  expect((await page.request.get(imageUrl!)).status()).toBe(404);
  for (const url of imageUrls)
    expect((await page.request.get(url)).status()).toBe(404);
});
