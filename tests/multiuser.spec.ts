import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
const live = process.env.YOUR_CITY_LIVE_BETA === "1";
async function account(
  page: Page,
  email: string,
  name: string,
  password: string,
) {
  const signup = !live || process.env.BETA_REGISTER_ACCOUNTS === "1";
  await page.goto(signup ? "/sign-up" : "/sign-in");
  if ((await page.locator("html").getAttribute("lang")) === "kk")
    await page.getByRole("button", { name: "РУС", exact: true }).click();
  if (signup) await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page
    .getByRole("button", {
      name: signup ? "Зарегистрироваться" : "Войти",
      exact: true,
    })
    .click();
  if (signup) {
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.locator('input[value="events"]').check();
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  }
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto("/communities");
  const card = page
    .locator("article")
    .filter({ has: page.locator('a[href="/communities/events"]') });
  const join = card.getByRole("button", { name: "Вступить", exact: true });
  if (await join.count()) await join.click();
}

test(
  live
    ? "authorized live two-account beta smoke"
    : "two isolated accounts share server social data (local Appwrite fixture)",
  async (
    { browser, baseURL, viewport, isMobile, hasTouch, userAgent },
    info,
  ) => {
    test.setTimeout(180000);
    const a = await browser.newContext({
        baseURL,
        extraHTTPHeaders:
          live && process.env.BETA_PREVIEW_BYPASS
            ? { "x-vercel-protection-bypass": process.env.BETA_PREVIEW_BYPASS }
            : {},
        viewport: viewport ?? undefined,
        isMobile,
        hasTouch,
        userAgent,
      }),
      b = await browser.newContext({
        baseURL,
        extraHTTPHeaders:
          live && process.env.BETA_PREVIEW_BYPASS
            ? { "x-vercel-protection-bypass": process.env.BETA_PREVIEW_BYPASS }
            : {},
        viewport: viewport ?? undefined,
        isMobile,
        hasTouch,
        userAgent,
      });
    if (live)
      for (const context of [a, b])
        await context.route("**/*", (route) =>
          new URL(route.request().url()).origin === new URL(baseURL!).origin
            ? route.continue()
            : route.abort(),
        );
    const alice = await a.newPage(),
      bob = await b.newPage();
    for (const page of [alice, bob]) {
      page.setDefaultTimeout(10000);
      page.setDefaultNavigationTimeout(20000);
    }
    const token = randomUUID().slice(0, 8);
    let postURL = "";
    try {
      await account(
        alice,
        live
          ? process.env.BETA_EMAIL_A!
          : `beta-a-${info.project.name}-${token}@example.test`,
        "Beta Alice",
        live ? process.env.BETA_PASSWORD_A! : "Test-password-123!",
      );
      await account(
        bob,
        live
          ? process.env.BETA_EMAIL_B!
          : `beta-b-${info.project.name}-${token}@example.test`,
        "Beta Bob",
        live ? process.env.BETA_PASSWORD_B! : "Test-password-123!",
      );
      await alice.goto("/create");
      await alice.locator('select[name="community"]').selectOption("events");
      await alice
        .locator('textarea[name="body"]')
        .fill("Beta shared post " + token);
      await alice
        .getByRole("button", { name: "Опубликовать", exact: true })
        .click();
      await expect(alice).toHaveURL(/\/posts\/[a-z0-9]+$/);
      postURL = alice.url();
      const authorId = (await alice
        .locator('.post a[href^="/people/"]')
        .first()
        .getAttribute("href"))!
        .split("/")
        .pop();
      await bob.goto(postURL);
      await expect(
        bob.getByRole("button", {
          name: "Редактировать публикацию",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        bob.getByText("Редактировать публикацию", { exact: true }),
      ).toHaveCount(0);
      await expect(
        bob.getByRole("button", { name: "Удалить публикацию", exact: true }),
      ).toHaveCount(0);
      await bob.getByRole("button", { name: "Нравится", exact: true }).click();
      await expect(
        bob.getByRole("button", { name: "Убрать нравится", exact: true }),
      ).toBeVisible();
      await bob
        .getByRole("button", { name: "В закладки", exact: true })
        .click();
      await alice.reload();
      await expect(alice.locator(".beta-actions").first()).toContainText(
        "Отметки нравится: 1",
      );
      await expect(
        alice.getByRole("button", { name: "Нравится", exact: true }),
      ).toBeVisible();
      await bob.goto("/saved");
      await expect(bob.locator(".post")).toContainText(
        "Beta shared post " + token,
      );
      await alice.goto("/saved");
      await expect(
        alice.locator(".post").filter({ hasText: token }),
      ).toHaveCount(0);
      await bob.goto(postURL);
      await bob
        .locator("form")
        .filter({
          has: bob.getByRole("button", { name: "Отправить", exact: true }),
        })
        .locator("textarea")
        .fill("Bob comment " + token);
      await bob.getByRole("button", { name: "Отправить", exact: true }).click();
      const comment = bob
        .locator("[data-comment-id]")
        .filter({ hasText: "Bob comment " + token });
      const commentId = await comment.getAttribute("data-comment-id");
      const bobId = (await comment
        .locator('a[href^="/people/"]')
        .first()
        .getAttribute("href"))!
        .split("/")
        .pop();
      expect(bobId).not.toBe(authorId);
      await alice.goto(postURL);
      const shared = alice.locator(`[data-comment-id="${commentId}"]`);
      await shared.getByText("Ответить", { exact: true }).click();
      await shared
        .getByRole("textbox", { name: "Ваш ответ" })
        .fill("Alice reply " + token);
      await shared
        .getByRole("button", { name: "Отправить ответ", exact: true })
        .click();
      await expect(
        alice.locator(`[data-parent-id="${commentId}"]`),
      ).toContainText("Alice reply " + token);
      await bob.reload();
      await expect(
        bob.locator(`[data-parent-id="${commentId}"]`),
      ).toContainText("Alice reply " + token);
      await bob.goto("/notifications");
      const notification = bob
        .locator("[data-notification-id]")
        .filter({ hasText: "Ответил на ваш комментарий" })
        .first();
      await expect(notification).toBeVisible();
      await notification
        .getByRole("button", { name: "Отметить прочитанным" })
        .click();
      await expect(notification).toContainText("Прочитано");
      await bob.reload();
      await expect(notification).toContainText("Прочитано");
      await bob.goto(postURL);
      await bob
        .getByRole("button", { name: "Подписаться", exact: true })
        .click();
      await expect(bob).toHaveURL(/\/profile$/);
      await alice.goto("/notifications");
      await expect(
        alice
          .locator("[data-notification-id]")
          .filter({ hasText: "Подписался на вас" }),
      ).toHaveCount(1);
      await bob.goto(postURL);
      await bob.getByRole("button", { name: "Заглушить", exact: true }).click();
      await expect(bob).toHaveURL(/\/profile$/);
      await bob.goto("/feed?mode=city");
      await expect(bob.locator(".post").filter({ hasText: token })).toHaveCount(
        0,
      );
      await bob.goto("/profile");
      await bob
        .getByRole("button", { name: "Отменить заглушение", exact: true })
        .click();
      await expect(
        bob.getByRole("button", { name: "Заглушить", exact: true }),
      ).toBeVisible();
      await bob.goto(postURL);
      await expect(bob.locator(".post-body")).toContainText(token);
      await bob
        .getByRole("button", { name: "Заблокировать", exact: true })
        .click();
      await expect(bob).toHaveURL(/\/profile$/);
      await bob.goto("/saved");
      await expect(bob.locator(".post").filter({ hasText: token })).toHaveCount(
        0,
      );
      await alice.goto("/people/" + bobId);
      await expect(
        alice.getByRole("button", { name: "Подписаться", exact: true }),
      ).toHaveCount(0);
      await bob.goto("/profile");
      await bob
        .getByRole("button", { name: "Разблокировать", exact: true })
        .click();
      await expect(
        bob.locator(`[data-connection-target="${authorId}"]`),
      ).toHaveCount(0);
      await bob.goto(postURL);
      await expect(bob.locator(".post-body")).toContainText(token);
      await bob.reload();
      await expect(
        bob.getByRole("button", { name: "Убрать из закладок", exact: true }),
      ).toBeVisible();
      await bob
        .getByRole("button", { name: "Убрать из закладок", exact: true })
        .click();
      await expect(
        bob.getByRole("button", { name: "В закладки", exact: true }),
      ).toBeVisible();
      await bob
        .getByRole("button", { name: "Убрать нравится", exact: true })
        .click();
      await expect(
        bob.getByRole("button", { name: "Нравится", exact: true }),
      ).toBeVisible();
      await bob.setViewportSize({ width: 320, height: 740 });
      for (const route of ["/feed", "/saved", "/notifications", "/profile"]) {
        await bob.goto(route);
        expect(
          await bob.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      expect(
        await bob.evaluate(() => localStorage.getItem("your-city-demo-v2")),
      ).toBeNull();
      await bob.goto("/profile");
      await bob
        .getByRole("button", { name: "Выйти из аккаунта", exact: true })
        .click();
      await bob.goto("/notifications");
      await expect(bob).toHaveURL(/\/sign-in$/);
      await alice.goto("/profile");
      await expect(alice).toHaveURL(/\/profile$/);
    } finally {
      try {
        if (postURL) {
          await alice.goto(postURL);
          const remove = alice.getByRole("button", {
            name: "Удалить публикацию",
            exact: true,
          });
          if (await remove.count()) {
            await remove.click();
            await expect(alice).toHaveURL(/\/feed$/);
          }
        }
      } catch {
        console.warn(
          "Beta smoke cleanup incomplete; inspect disposable test accounts.",
        );
      }
      await a.close();
      await b.close();
    }
  },
);
