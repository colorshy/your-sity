import { test, expect } from "@playwright/test";

test("open product navigation, localization, theme and responsive assets", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".shell")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Твой город. Твои люди." }),
  ).toBeVisible();
  await expect(page.locator(".mvp-demo-notice")).toContainText(
    "вымышленные примеры",
  );
  await expect(page.locator(".post")).toHaveCount(8);
  await page.getByRole("button", { name: "Переключить тему" }).click();
  await expect(page.locator(".mvp")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator(".mvp")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.getByRole("button", { name: "Переключить тему" }).click();
  // All shipped media is local, readable and decodes; no external image dependency.
  const images = page.locator(".mvp img");
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `/tmp/your-city-mvp-${info.project.name}.png`,
    fullPage: false,
  });
  for (const target of [
    "communities",
    "profile",
    "saved",
    "about",
    "create",
    "feed",
  ]) {
    await page.goto(`/demo?page=${target}`);
    await expect(page.locator(".mvp-main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const nav =
    info.project.name === "mobile"
      ? page.locator(".mvp-bottom-nav")
      : page.locator(".mvp-sidebar nav");
  await nav.getByRole("link", { name: "Сообщества", exact: true }).click();
  await expect(page).toHaveURL(/page=communities/);
  await expect(page.locator(".community-card")).toHaveCount(7);
  await nav.getByRole("link", { name: /Сохран/ }).click();
  await expect(page).toHaveURL(/page=saved/);
  await nav.getByRole("link", { name: "Сообщества", exact: true }).click();
  await page.getByRole("button", { name: "ҚАЗ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Өз ортаңызды табыңыз/ }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
  expect(errors).toEqual([]);
});

test("local demo profile, post, comment, like and bookmark survive navigation and reload", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/demo?page=profile");
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await page
    .getByRole("button", { name: "Редактировать", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Имя", exact: true })
    .fill("Алия Тест");
  await page
    .getByRole("textbox", { name: "О себе" })
    .fill("Люблю зелёный Шымкент");
  await page.getByRole("combobox", { name: "Аватар" }).selectOption("🌻");
  await page
    .getByRole("button", { name: "Сохранить · демо", exact: true })
    .click();
  await expect(page.locator(".mvp-profile")).toContainText("Алия Тест");
  await page.locator(".mvp-compose-link").click();
  const title = `Мой Шымкент ${info.project.name}`;
  await page.getByRole("textbox", { name: "Заголовок" }).fill(title);
  await page
    .getByRole("textbox", { name: "Текст", exact: true })
    .fill("Это локальная демонстрационная история о нашем городе.");
  await page
    .getByRole("combobox", { name: "Сообщество", exact: true })
    .selectOption("neighborhoods");
  await page
    .getByRole("combobox", { name: "Обложка" })
    .selectOption("/demo/city.svg");
  await page.getByRole("button", { name: "Опубликовать · демо" }).click();
  await expect(page).toHaveURL(/page=post&id=/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator(".mvp-post-meta")).toContainText("Алия Тест");
  await page.getByRole("button", { name: "Поделиться", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Ссылка на демопост скопирована",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "page=post&id=",
  );
  await page.getByRole("button", { name: "Нравится", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Нравится", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Ваш комментарий" })
    .fill("<script>demo</script> Отличный город!");
  await page.getByRole("button", { name: "Отправить · демо" }).click();
  await expect(page.locator(".mvp-comment")).toContainText(
    "<script>demo</script>",
  );
  await page.reload();
  await expect(page.locator(".mvp-comment")).toContainText("Отличный город!");
  await expect(
    page.getByRole("button", { name: "Сохранить", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Удалить комментарий" }).click();
  await expect(page.locator(".mvp-comment")).toHaveCount(0);
  await page.goto("/demo?page=saved");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Сохраняйте хорошие идеи" }),
  ).toBeVisible();
  await page.goto("/demo?page=profile");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator(".mvp-profile")).toContainText(
    "Люблю зелёный Шымкент",
  );
});

test("search, category filters, sorting and memberships work without authentication", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await page.getByRole("textbox", { name: "Поиск публикаций" }).fill("книги");
  await expect(page.locator(".post")).toHaveCount(2);
  await page.getByRole("button", { name: "Очистить поиск" }).click();
  await page.getByRole("button", { name: "Город", exact: true }).click();
  await page
    .locator(".mvp-filters")
    .getByRole("button", { name: "Новости", exact: true })
    .click();
  await expect(page.locator(".post")).toHaveCount(1);
  await expect(page.locator(".post")).toContainText(
    "За что вы любите Шымкент?",
  );
  await page
    .locator(".mvp-filters")
    .getByRole("button", { name: "Все", exact: true })
    .click();
  await expect(page.locator(".post").first()).toContainText(
    "Город, в который влюбляешься заново",
  );
  await page
    .getByRole("textbox", { name: "Поиск публикаций" })
    .fill("ничего-не-найдётся");
  await expect(
    page.getByRole("heading", { name: "Пока ничего не найдено" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await expect(page.locator(".post")).toHaveCount(8);
  await page.goto("/demo?page=communities");
  const card = page.locator(".community-card").filter({
    has: page.getByRole("heading", { name: "Автолюбители", exact: true }),
  });
  await card.getByRole("button", { name: "Вступить · демо" }).click();
  await card.getByRole("link", { name: "Автолюбители" }).click();
  await expect(page).toHaveURL(/page=community&id=drivers/);
  await expect(
    page.locator(".mvp-community-intro").getByRole("button"),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.locator(".mvp-community-intro").getByRole("button"),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".mvp-community-intro").getByRole("button").click();
  await expect(
    page.locator(".mvp-community-intro").getByRole("button"),
  ).toHaveAttribute("aria-pressed", "false");
  await page.goto("/demo?page=post&id=missing");
  await expect(
    page.getByRole("heading", { name: "Публикация не найдена" }),
  ).toBeVisible();
});

test("compact phone layouts and denied local storage remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("только в этом сеансе");
  await page
    .getByRole("status")
    .getByRole("button", { name: "Закрыть", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "Переключить тему" }).click();
  await expect(page.getByRole("status")).toContainText("только в этом сеансе");
  await expect(page.locator(".mvp")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: "/tmp/your-city-mvp-compact-dark.png" });
  for (const target of ["communities", "profile", "create", "post&id=books"]) {
    await page.goto(`/demo?page=${target}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
