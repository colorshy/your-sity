import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("authenticated shell and feed actions fit each viewport (local fixture)", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto("/sign-up");
  if ((await page.locator("html").getAttribute("lang")) === "kk")
    await page.getByRole("button", { name: "РУС", exact: true }).click();
  await page.locator('input[name="name"]').fill("Layout Tester");
  await page
    .locator('input[name="email"]')
    .fill(`layout-${randomUUID()}@example.test`);
  await page.locator('input[name="password"]').fill("Test-password-123!");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.locator('input[value="events"]').check();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto("/create");
  await page
    .getByRole("textbox", { name: "Текст", exact: true })
    .fill("Жаңалықтар Шымкентте · Новый день в Шымкенте");
  await page.getByRole("button", { name: "Опубликовать" }).click();
  await expect(page).toHaveURL(/\/posts\//);
  await page.goto("/feed?mode=city");
  await expect(page.locator(".app-post").first()).toBeVisible();
  await page
    .locator(".app-post")
    .first()
    .getByRole("button", { name: "Нравится" })
    .click();
  await expect(
    page
      .locator(".app-post")
      .first()
      .getByRole("button", { name: "Убрать нравится" }),
  ).toBeVisible();
  await page
    .locator(".app-post")
    .first()
    .getByRole("button", { name: "В закладки" })
    .click();
  await page.reload();
  await expect(
    page
      .locator(".app-post")
      .first()
      .getByRole("button", { name: "Убрать из закладок" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async ({ url }: { url: string }) => {
        (window as Window & { __sharedUrl?: string }).__sharedUrl = url;
      },
    });
  });
  const postUrl = await page
    .locator(".app-post")
    .first()
    .getByRole("link", { name: "Комментарии" })
    .getAttribute("href");
  await page
    .locator(".app-post")
    .first()
    .getByRole("button", { name: "Поделиться публикацией" })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __sharedUrl?: string }).__sharedUrl,
      ),
    )
    .toBe(new URL(postUrl!, page.url()).href);
  await expect(page.locator(".app-layout")).toBeVisible();
  await expect(page.locator(".app-left")).toBeVisible();
  await expect(page.getByRole("link", { name: "Модерация" })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: `/workspace/artifacts/mvp5-${info.project.name}.png`,
    fullPage: true,
  });
});
