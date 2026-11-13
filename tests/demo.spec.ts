import { test, expect } from "@playwright/test";
test("discover, search, join and leave a demo community", async ({ page }) => {
  await page.goto("/demo?page=communities");
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
  await page.goto("/demo");
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
test("live routes require authentication and demo content stays isolated", async ({
  page,
}) => {
  for (const route of [
    "/feed",
    "/profile",
    "/onboarding",
    "/communities",
    "/communities/test",
    "/create",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(
      page.locator(".form-panel > form input[name=email]"),
    ).toBeEnabled();
  }
  await page.goto("/");
  await expect(page.locator(".post")).toHaveCount(0);
  await page.goto("/sign-up");
  await expect(page.locator("input[name=name]")).toBeEnabled();
  await page.goto("/auth/callback?code=invalid&next=https://evil.example");
  await expect(page).toHaveURL(
    "http://127.0.0.1:3100/sign-in?error=verification",
  );
  await expect(page.locator(".form-panel").getByRole("alert")).toBeVisible();
  await page.goto("/auth/confirm?token_hash=invalid&type=recovery");
  await expect(page).toHaveURL(
    "http://127.0.0.1:3100/sign-in?error=verification",
  );
});
test("real UI locale and form validation", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("heading", { name: "Регистрация", exact: true }),
  ).toBeVisible();
  await page.locator("input[name=name]").fill("A");
  await page.locator(".form-panel > form input[name=email]").fill("invalid");
  await page.locator("input[name=password]").fill("short");
  expect(
    await page
      .locator(".form-panel > form input[name=email]")
      .evaluate((el) => (el as HTMLInputElement).checkValidity()),
  ).toBe(false);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});
test("SSR login persists across reload and logout clears access (local Auth fixture)", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page
    .locator(".form-panel > form input[name=email]")
    .fill("resident@example.test");
  await page.locator("input[name=password]").fill("Test-password-123!");
  await page.getByRole("button", { name: "Кіру", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await expect(
    page.getByText("Әзірге жазбалар жоқ.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Test Resident", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Аккаунттан шығу", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/sign-in$/);
});
test("invalid login and email confirmation state (local Auth fixture)", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page
    .locator(".form-panel > form input[name=email]")
    .fill("resident@example.test");
  await page.locator("input[name=password]").fill("wrong-password");
  await page.getByRole("button", { name: "Кіру", exact: true }).click();
  await expect(page.locator(".form-panel").getByRole("alert")).toBeVisible();
  await page.goto("/sign-up");
  await page.locator("input[name=name]").fill("Test Resident");
  await page
    .locator(".form-panel > form input[name=email]")
    .fill("resident@example.test");
  await page.locator("input[name=password]").fill("Test-password-123!");
  await page.getByRole("button", { name: "Тіркелу", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in\?message=verify$/);
  await expect(page.getByRole("status")).toBeVisible();
});
test("email token confirmation establishes a session (local Auth fixture)", async ({
  page,
}) => {
  await page.goto("/auth/confirm?token_hash=valid-test-token&type=email");
  await expect(page).toHaveURL("http://127.0.0.1:3100/onboarding");
  await expect(page.locator("input[name=name]")).toHaveValue("Test Resident");
  await page.goto("/feed");
  await expect(page).toHaveURL(/\/feed$/);
});
