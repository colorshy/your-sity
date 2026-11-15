/** Additional MVP 3.2 acceptance. Uses supplied accounts on the verified Preview only. */
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
test.skip(
  process.env.YOUR_CITY_LIVE_BETA !== "1" ||
    !process.env.YOUR_CITY_VERIFIED_PREVIEW,
  "Requires verified authorized Preview",
);
async function login(page: Page, role: "A" | "B") {
  await page.goto("/sign-in");
  if ((await page.locator("html").getAttribute("lang")) === "kk")
    await page.getByRole("button", { name: "РУС", exact: true }).click();
  await page
    .locator('input[name="email"]')
    .fill(process.env["BETA_EMAIL_" + role]!);
  await page
    .locator('input[name="password"]')
    .fill(process.env["BETA_PASSWORD_" + role]!);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await expect(
    page.getByRole("heading", { name: /^(Лента города|Қала лентасы)$/ }),
  ).toBeVisible();
  if ((await page.locator("html").getAttribute("lang")) === "kk")
    await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
}
async function eventsCard(page: Page) {
  await page.goto("/communities");
  return page
    .locator("article")
    .filter({ has: page.locator('a[href="/communities/events"]') });
}
test("live profile/post lifecycle, feed membership and author-initiated block", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180000);
  const extraHTTPHeaders: Record<string, string> = process.env
    .BETA_PREVIEW_BYPASS
    ? { "x-vercel-protection-bypass": process.env.BETA_PREVIEW_BYPASS }
    : {};
  const a = await browser.newContext({ baseURL, extraHTTPHeaders }),
    b = await browser.newContext({ baseURL, extraHTTPHeaders });
  for (const context of [a, b])
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === new URL(baseURL!).origin
        ? route.continue()
        : route.abort(),
    );
  const alice = await a.newPage(),
    bob = await b.newPage();
  let postURL = "",
    originalName: string | undefined,
    bobId = "",
    restoreMembership = false,
    restoreBlock = false;
  const marker = "Beta lifecycle " + randomUUID().slice(0, 8),
    edited = marker + " edited";
  try {
    await login(alice, "A");
    await login(bob, "B");
    await alice.goto("/profile");
    const profileForm = alice
      .locator("form")
      .filter({ has: alice.locator('input[name="name"]') });
    originalName = await profileForm.locator('input[name="name"]').inputValue();
    const changedName = originalName.slice(0, 70) + " QA";
    await profileForm.locator('input[name="name"]').fill(changedName);
    await profileForm
      .getByRole("button", { name: "Сохранить", exact: true })
      .click();
    await expect(
      alice.getByRole("heading", { name: changedName, exact: true }),
    ).toBeVisible();
    await alice.reload();
    await expect(profileForm.locator('input[name="name"]')).toHaveValue(
      changedName,
    );
    await alice.goto("/create");
    await alice.locator('select[name="community"]').selectOption("events");
    await alice.locator('textarea[name="body"]').fill(marker);
    await alice
      .getByRole("button", { name: "Опубликовать", exact: true })
      .click();
    await expect(alice).toHaveURL(/\/posts\/[a-z0-9]+$/);
    postURL = alice.url();
    const edit = alice.locator("details").filter({
      has: alice.getByText("Редактировать публикацию", { exact: true }),
    });
    await edit.locator("summary").click();
    await edit.locator('textarea[name="body"]').fill(edited);
    await edit.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(alice.locator(".post-body")).toHaveText(edited);
    await bob.goto(postURL);
    await expect(bob.locator(".post-body")).toHaveText(edited);
    for (const mode of ["for-you", "city", "mine"]) {
      await bob.goto("/feed?mode=" + mode);
      await expect(
        bob.locator(".post").filter({ hasText: edited }),
      ).toHaveCount(1);
      if (mode === "city") {
        const times = await bob
          .locator(".post time")
          .evaluateAll((nodes) =>
            nodes.map((n) => Date.parse(n.getAttribute("datetime") || "")),
          );
        expect(
          times.every(
            (time, i) =>
              Number.isFinite(time) && (i === 0 || times[i - 1] >= time),
          ),
        ).toBe(true);
      }
    }
    let events = await eventsCard(bob);
    await events.getByRole("button", { name: "Выйти", exact: true }).click();
    await expect(
      events.getByRole("button", { name: "Вступить", exact: true }),
    ).toBeVisible();
    restoreMembership = true;
    await bob.goto("/feed?mode=mine");
    await expect(bob.locator(".post").filter({ hasText: edited })).toHaveCount(
      0,
    );
    await bob.goto("/feed?mode=city");
    await expect(bob.locator(".post").filter({ hasText: edited })).toHaveCount(
      1,
    );
    events = await eventsCard(bob);
    await events.getByRole("button", { name: "Вступить", exact: true }).click();
    await expect(
      events.getByRole("button", { name: "Выйти", exact: true }),
    ).toBeVisible();
    restoreMembership = false;
    await bob.reload();
    await expect(
      events.getByRole("button", { name: "Выйти", exact: true }),
    ).toBeVisible();
    await bob.goto("/feed?mode=mine");
    await expect(bob.locator(".post").filter({ hasText: edited })).toHaveCount(
      1,
    );
    await bob.goto(postURL);
    const reply = marker + " comment";
    await bob
      .locator("form")
      .filter({
        has: bob.getByRole("button", { name: "Отправить", exact: true }),
      })
      .locator("textarea")
      .fill(reply);
    await bob.getByRole("button", { name: "Отправить", exact: true }).click();
    const comment = bob
      .locator("[data-comment-id]")
      .filter({ has: bob.getByText(reply, { exact: true }) });
    await expect(comment).toBeVisible();
    bobId = (await comment
      .locator('a[href^="/people/"]')
      .first()
      .getAttribute("href"))!
      .split("/")
      .pop()!;
    await alice.goto("/people/" + bobId);
    await alice
      .getByRole("button", { name: "Заблокировать", exact: true })
      .click();
    await expect(alice).toHaveURL(/\/profile$/);
    restoreBlock = true;
    await bob.goto(postURL);
    await expect(
      bob.getByRole("heading", { name: "404", exact: true }),
    ).toBeVisible();
    await bob.goto("/feed?mode=city");
    await expect(bob.locator(".post").filter({ hasText: edited })).toHaveCount(
      0,
    );
    await alice
      .locator(`[data-connection-target="${bobId}"]`)
      .getByRole("button", { name: "Разблокировать", exact: true })
      .click();
    await expect(
      alice.locator(`[data-connection-target="${bobId}"]`),
    ).toHaveCount(0);
    restoreBlock = false;
    await bob.goto(postURL);
    await expect(bob.locator(".post-body")).toHaveText(edited);
    await alice.goto(postURL);
    await alice
      .getByRole("button", { name: "Удалить публикацию", exact: true })
      .click();
    await expect(alice).toHaveURL(/\/feed$/);
    await bob.goto(postURL);
    await expect(
      bob.getByRole("heading", { name: "404", exact: true }),
    ).toBeVisible();
    postURL = ""; // Owner deletion already committed; avoid repeating cleanup writes.
  } finally {
    try {
      if (restoreBlock && bobId) {
        await alice.goto("/profile");
        const row = alice.locator(`[data-connection-target="${bobId}"]`);
        await row
          .getByRole("button", { name: "Разблокировать", exact: true })
          .click();
        await expect(row).toHaveCount(0);
      }
      if (restoreMembership) {
        const events = await eventsCard(bob);
        await events
          .getByRole("button", { name: "Вступить", exact: true })
          .click();
        await expect(
          events.getByRole("button", { name: "Выйти", exact: true }),
        ).toBeVisible();
      }
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
      if (originalName !== undefined) {
        await alice.goto("/profile");
        const form = alice
          .locator("form")
          .filter({ has: alice.locator('input[name="name"]') });
        await form.locator('input[name="name"]').fill(originalName);
        await form
          .getByRole("button", { name: "Сохранить", exact: true })
          .click();
        await expect(
          alice.getByRole("heading", { name: originalName, exact: true }),
        ).toBeVisible();
      }
    } catch {
      console.warn(
        "Beta lifecycle cleanup incomplete; inspect disposable accounts and records",
      );
    }
    await a.close();
    await b.close();
  }
});
