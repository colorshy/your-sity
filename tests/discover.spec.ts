import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("public discovery keeps fixture data off the landing page", async ({
  page,
  request,
}, info) => {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["cache-control"]).toContain("no-store");
  const markup = await response.text();
  for (const marker of [
    "resident@example.test",
    "test-server-key",
    "Test Resident",
    "54321/v1",
  ]) {
    expect(markup).not.toContain(marker);
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Өз қалаң\. Өз адамдарың\..*Өз тарихың\./,
  );
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Твоя история.",
  );
  if (info.project.name === "mobile") {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await page.getByLabel("Меню", { exact: true }).focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("navigation", { name: "Главное меню" })
      .getByRole("link", { name: "Сообщества" })
      .click();
    await expect(page).toHaveURL(/#communities$/);
    await page.goto("/");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => innerWidth),
  );
  await page.screenshot({
    path: info.outputPath("landing.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "ҚАЗ", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
});

test("public actions open account forms and the explicitly fictional demo", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Қосылу", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(
    page.locator('input[autocomplete="new-password"]'),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("link", { name: "Аккаунтым бар" })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.locator('input[autocomplete="current-password"]'),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Кіру", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Демоны көру" })
    .click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator(".mvp-demo-notice")).toContainText(
    /ойдан|вымышленные/i,
  );
});

test("fixture onboarding leads to Discover and returning login resumes it", async ({
  page,
  context,
}) => {
  const email = "discover-" + randomUUID() + "@example.test";
  const password = "Test-password-123!";
  await page.goto("/discover");
  await expect(page).toHaveURL(/\/sign-in\?next=discover$/);
  await page.getByRole("link", { name: "Аккаунт ашу" }).click();
  await page.locator('input[name="name"]').fill("Discover Resident");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Тіркелу", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.goto("/discover");
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Сақтау", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await page.getByRole("link", { name: "Қала қауымдастықтарын ашу" }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Discover Resident",
  );
  await expect(
    page.getByRole("heading", { name: "Іс-шаралар", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Әзірге ешбір қауымдастыққа қосылмадың.", { exact: false }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Your City-ге өту" }),
  ).toHaveAttribute("href", "/discover");
  await expect(page.getByRole("main")).not.toContainText("Discover Resident");
  const session = (await context.cookies()).find((cookie) =>
    cookie.name.includes("your-city-session"),
  );
  if (!session) throw new Error("Expected a session cookie");
  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  expect(session.expires).toBeGreaterThan(Date.now() / 1000);
  expect(await page.evaluate(() => Object.values(localStorage))).toEqual([]);
  await page.goto("/profile");
  await page
    .getByRole("button", { name: "Аккаунттан шығу", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(
    (await context.cookies()).some((cookie) => cookie.name === session.name),
  ).toBe(false);
  await context.addCookies([session]);
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Қосылу", exact: true }),
  ).toBeVisible();

  await page.goto("/sign-up");
  await page.locator('input[name="name"]').fill("Duplicate Resident");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Тіркелу", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Жалғастыру мүмкін болмады.",
  );
  await expect(page.getByRole("main").getByRole("alert")).not.toContainText(
    /409|Fixture|Appwrite/i,
  );

  await page.goto("/discover");
  await expect(page).toHaveURL(/\/sign-in\?next=discover$/);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Кіру", exact: true }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Discover Resident",
  );
});
