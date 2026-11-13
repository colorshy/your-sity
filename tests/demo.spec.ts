import { test, expect } from "@playwright/test";
test("discover, search, join and leave a demo community", async ({ page }) => {
  await page.goto("/communities");
  await expect(page.locator(".shell")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Поиск сообществ" })
    .fill("Автолюбители");
  await expect(page.locator(".community-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Вступить · демо", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Вы участник · выйти" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Вы участник · выйти" }).click();
  await expect(
    page.getByRole("button", { name: "Вступить · демо", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox").fill("не существует");
  await expect(page.getByText("Сообщества не найдены")).toBeVisible();
});
test("feed modes, locale persistence and responsive layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/feed");
  await expect(page.locator(".shell")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".post")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Менің қауымдастықтарым", exact: true })
    .click();
  await expect(page.locator(".post")).toHaveCount(2);
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Мои сообщества", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("all routes render and auth cannot submit in demo mode", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/about",
    "/profile",
    "/onboarding",
    "/create",
    "/sign-in",
    "/sign-up",
    "/communities/events",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/sign-in");
  await expect(page.locator("input[type=email]")).toBeDisabled();
  await page.goto("/communities/missing");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});
