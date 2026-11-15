/** Authorized HTTPS Preview only; never loaded by local playwright.config.ts. */
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
test.skip(
  process.env.YOUR_CITY_LIVE_BETA !== "1" ||
    !process.env.YOUR_CITY_VERIFIED_PREVIEW,
  "Requires verified authorized Preview",
);
async function login(page: Page, role: "A" | "B" | "MODERATOR") {
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
}
async function submitForeignForm(
  page: Page,
  formData: { fields: [string, string][]; action: string },
) {
  // Replay the actual owner form with B's cookies. Hidden owner controls are not authorization.
  await page.evaluate(({ fields, action }) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.enctype = "multipart/form-data";
    form.action = action;
    for (const [name, value] of fields) {
      const input = document.createElement("input");
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }, formData);
}
test("live moderator decisions, forged ownership and direct Appwrite private-table denial", async ({
  browser,
  baseURL,
  playwright,
}) => {
  test.setTimeout(180000);
  const extraHTTPHeaders: Record<string, string> = process.env
    .BETA_PREVIEW_BYPASS
    ? { "x-vercel-protection-bypass": process.env.BETA_PREVIEW_BYPASS }
    : {};
  const a = await browser.newContext({ baseURL, extraHTTPHeaders }),
    b = await browser.newContext({ baseURL, extraHTTPHeaders }),
    m = await browser.newContext({ baseURL, extraHTTPHeaders });
  for (const context of [a, b, m])
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === new URL(baseURL!).origin
        ? route.continue()
        : route.abort(),
    );
  const alice = await a.newPage(),
    bob = await b.newPage(),
    moderator = await m.newPage();
  let postURL = "";
  const marker = "Beta permission check " + randomUUID().slice(0, 8);
  const endpoint = "https://fra.cloud.appwrite.io/v1";
  const direct = await playwright.request.newContext({
    baseURL: endpoint,
    extraHTTPHeaders: { "X-Appwrite-Project": "your-city" },
  });
  const anonymous = await playwright.request.newContext({
    baseURL: endpoint,
    extraHTTPHeaders: { "X-Appwrite-Project": "your-city" },
  });
  try {
    await login(alice, "A");
    await login(bob, "B");
    await login(moderator, "MODERATOR");
    await alice.goto("/create");
    await alice.locator('select[name="community"]').selectOption("events");
    await alice.locator('textarea[name="body"]').fill(marker);
    await alice
      .getByRole("button", { name: "Опубликовать", exact: true })
      .click();
    await expect(alice).toHaveURL(/\/posts\/[a-z0-9]+$/);
    postURL = alice.url();
    const postId = new URL(postURL).pathname.split("/").pop()!;
    const foreignForm = await alice
      .locator("form")
      .filter({
        has: alice.getByRole("button", {
          name: "Удалить публикацию",
          exact: true,
        }),
      })
      .evaluate((form) => ({
        action: (form as HTMLFormElement).action,
        fields: Array.from(
          new FormData(form as HTMLFormElement).entries(),
        ).filter((e): e is [string, string] => typeof e[1] === "string"),
      }));
    await bob.goto(postURL);
    await submitForeignForm(bob, foreignForm);
    await expect(bob).toHaveURL(/\/feed\?error=save$/);
    await alice.reload();
    await expect(alice.locator(".post-body")).toHaveText(marker);
    await bob.goto("/moderation");
    await expect(
      bob.getByRole("heading", { name: "404", exact: true }),
    ).toBeVisible();
    // Direct Appwrite sessions are obtained using ONLY supplied disposable-account credentials.
    const session = await direct.post(endpoint + "/account/sessions/email", {
      data: {
        email: process.env.BETA_EMAIL_B,
        password: process.env.BETA_PASSWORD_B,
      },
    });
    expect(session.status()).toBe(201);
    const identity = await direct.get(endpoint + "/account");
    expect(identity.status()).toBe(200);
    const user = (await identity.json()) as { $id: string };
    expect(user.$id).toBeTruthy();
    const publicRead = await anonymous.get(
      endpoint + "/tablesdb/your_city_db/tables/cities/rows/shymkent",
    );
    expect(publicRead.status()).toBe(200);
    for (const client of [anonymous, direct]) {
      for (const table of [
        "profiles",
        "community_memberships",
        "posts",
        "comments",
        "reports",
        "post_likes",
        "bookmarks",
        "connections",
        "notifications",
      ]) {
        const response = await client.get(
          endpoint + "/tablesdb/your_city_db/tables/" + table + "/rows",
        );
        expect(
          [401, 403, 404],
          "Private reads must be denied; network/schema errors are not a pass",
        ).toContain(response.status());
      }
      const rowId = randomUUID().replaceAll("-", "");
      const denied = await client.post(
        endpoint + "/tablesdb/your_city_db/tables/post_likes/rows",
        {
          data: {
            rowId,
            data: { user_id: user.$id, post_id: postId },
            permissions: [],
          },
        },
      );
      if (denied.status() === 201)
        await client.delete(
          endpoint + "/tablesdb/your_city_db/tables/post_likes/rows/" + rowId,
        );
      expect([401, 403, 404], "A valid direct write must be denied").toContain(
        denied.status(),
      );
    }
    await bob.goto(postURL);
    await bob
      .locator("form")
      .filter({
        has: bob.getByRole("button", { name: "Отправить", exact: true }),
      })
      .locator("textarea")
      .fill("Beta comment " + marker);
    await bob.getByRole("button", { name: "Отправить", exact: true }).click();
    await expect(bob.locator("[data-comment-id]")).toContainText(marker);
    const report = bob
      .locator("details.form-panel")
      .filter({ has: bob.getByText("Пожаловаться", { exact: true }) });
    await report.locator("summary").click();
    await report.locator('textarea[name="reason"]').fill(marker);
    await report
      .getByRole("button", { name: "Отправить жалобу", exact: true })
      .click();
    await expect(bob.getByRole("status")).toContainText("Жалоба отправлена");
    await moderator.goto("/moderation");
    const queued = moderator
      .locator("article.post")
      .filter({ hasText: marker });
    await expect(queued).toHaveCount(1);
    await queued.locator('select[name="decision"]').selectOption("hide");
    await queued
      .getByRole("button", { name: "Применить", exact: true })
      .click();
    await expect(queued).toHaveCount(0);
    await bob.goto(postURL);
    await expect(
      bob.getByRole("heading", { name: "404", exact: true }),
    ).toBeVisible();
    await alice.goto(postURL);
    await expect(alice.locator("main").getByRole("status")).toContainText(
      "скрыта",
    );
    await expect(
      alice.getByText("Редактировать публикацию", { exact: true }),
    ).toHaveCount(0);
  } finally {
    try {
      await direct.delete(endpoint + "/account/sessions/current");
    } catch {}
    if (postURL) {
      try {
        await alice.goto(postURL);
        const remove = alice.getByRole("button", {
          name: "Удалить публикацию",
          exact: true,
        });
        if (await remove.count()) {
          await remove.click();
          await expect(alice).toHaveURL(/\/feed$/);
        }
      } catch {
        console.warn("Inspect disposable beta records: cleanup incomplete");
      }
    }
    await direct.dispose();
    await anonymous.dispose();
    await a.close();
    await b.close();
    await m.close();
  }
});
