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
  await expect(page.locator(".post")).toHaveCount(8);
  await page
    .getByRole("button", { name: "Қауымдастықтар", exact: true })
    .click();
  await expect(page.locator(".post")).toHaveCount(3);
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Сообщества", exact: true }),
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
  await expect(page.locator(".post")).toHaveCount(8);
  await expect(page.locator(".mvp-demo-badge")).toHaveText("DEMO");
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
    page.getByRole("heading", { name: "Қала лентасы", exact: true }),
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
test("invalid login returns a generic authentication error", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page
    .locator(".form-panel > form input[name=email]")
    .fill("resident@example.test");
  await page.locator("input[name=password]").fill("wrong-password");
  await page.getByRole("button", { name: "Кіру", exact: true }).click();
  await expect(page.locator(".form-panel").getByRole("alert")).toBeVisible();
});
test("registration, onboarding and membership persistence (Appwrite fixture)", async ({
  page,
}, info) => {
  const email = "new-" + info.project.name + "@example.test";
  await page.goto("/sign-up");
  await page.locator("input[name=name]").fill("New Resident");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill("Test-password-123!");
  await page.getByRole("button", { name: "Тіркелу", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.locator("input[value=events]").check();
  await page.getByRole("button", { name: "Сақтау", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto("/communities");
  const events = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Іс-шаралар", exact: true }),
  });
  await expect(
    events.getByRole("button", { name: "Шығу", exact: true }),
  ).toBeVisible();
  await events.getByRole("button", { name: "Шығу", exact: true }).click();
  await expect(
    events.getByRole("button", { name: "Қосылу", exact: true }),
  ).toBeVisible();
  await events.getByRole("button", { name: "Қосылу", exact: true }).click();
  await expect(
    events.getByRole("button", { name: "Шығу", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    events.getByRole("button", { name: "Шығу", exact: true }),
  ).toBeVisible();
});
test("post and comment CRUD (Appwrite fixture)", async ({ page }, info) => {
  await page.goto("/sign-in");
  await page
    .locator(".form-panel > form input[name=email]")
    .fill("writer-" + info.project.name + "@example.test");
  await page.locator("input[name=password]").fill("Test-password-123!");
  await page.getByRole("button", { name: "Кіру", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto("/create");
  await page.locator("textarea[name=body]").fill("Post " + info.project.name);
  await page.getByRole("button", { name: "Жариялау", exact: true }).click();
  await expect(page).toHaveURL(/\/posts\/[a-z0-9]+$/);
  const url = page.url();
  await page
    .locator("form")
    .filter({ has: page.locator("input[name=post]") })
    .filter({ has: page.getByRole("button", { name: "Жіберу", exact: true }) })
    .locator("textarea")
    .fill("Comment original");
  await page.getByRole("button", { name: "Жіберу", exact: true }).click();
  await expect(
    page.locator("p").filter({ hasText: /^Comment original$/ }),
  ).toBeVisible();
  const comment = page.locator("article").filter({
    has: page.locator("p").filter({ hasText: /^Comment original$/ }),
  });
  await comment.getByText("Өңдеу", { exact: true }).click();
  await comment.locator("textarea").fill("Comment edited");
  await comment.getByRole("button", { name: "Сақтау", exact: true }).click();
  await expect(
    page.locator("p").filter({ hasText: /^Comment edited$/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Пікірді жою", exact: true }).click();
  await expect(
    page.locator("p").filter({ hasText: /^Comment edited$/ }),
  ).toHaveCount(0);
  await page.getByText("Жазбаны өңдеу", { exact: true }).click();
  const edit = page
    .locator("details")
    .filter({ has: page.getByText("Жазбаны өңдеу", { exact: true }) });
  await edit.locator("textarea").fill("Post edited");
  await edit.getByRole("button", { name: "Сақтау", exact: true }).click();
  await expect(
    page.locator("p").filter({ hasText: /^Post edited$/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Жазбаны жою", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto(url);
  await expect(page.locator("main").getByRole("status")).toBeVisible();
});
test("health/readiness expose status only and apply security headers (local fixture)", async ({
  request,
}) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok" });
  expect(health.headers()["x-content-type-options"]).toBe("nosniff");
  expect(health.headers()["x-frame-options"]).toBe("DENY");
  expect(health.headers()["x-powered-by"]).toBeUndefined();
  const ready = await request.get("/api/ready");
  expect(ready.status()).toBe(200);
  expect(await ready.json()).toEqual({ status: "ready" });
  expect(ready.headers()["cache-control"]).toContain("no-store");
});
