import { test, expect, type Page } from "@playwright/test";
async function openRu(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator(".shell")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "РУС", exact: true }).click();
}

test("three feeds, district/type filters, expansion and real local counters", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openRu(page);
  await expect(
    page.getByRole("button", { name: "Для тебя", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".post")).toHaveCount(8);
  await expect(
    page
      .locator(".post")
      .first()
      .getByRole("button", { name: "Нравится", exact: true }),
  ).toHaveText("0");
  const expandable = page
    .locator(".post")
    .filter({
      has: page.getByRole("button", { name: "Показать ещё", exact: true }),
    })
    .first();
  await expandable
    .getByRole("button", { name: "Показать ещё", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Свернуть", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Город", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Фильтр по району" })
    .selectOption("turan");
  await expect(page.locator(".post")).toHaveCount(2);
  await page
    .locator(".mvp-filters")
    .getByRole("button", { name: "Новости", exact: true })
    .click();
  await expect(page.locator(".post")).toHaveCount(1);
  await expect(page.locator(".post")).toContainText(
    "За что вы любите Шымкент?",
  );
  await page
    .getByRole("combobox", { name: "Фильтр по району" })
    .selectOption("abay");
  await expect(
    page.getByRole("heading", { name: "Пока ничего не найдено" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await page.getByRole("button", { name: "Сообщества", exact: true }).click();
  await expect(page.locator(".post")).toHaveCount(3);
  await page
    .locator(".social-feed-options")
    .getByRole("link", { name: "Найти сообщества" })
    .click();
  for (const community of ["События", "Районы и соседи"])
    await page
      .locator(".community-card")
      .filter({
        has: page.getByRole("heading", { name: community, exact: true }),
      })
      .getByRole("button", { name: "Вы участник · выйти" })
      .click();
  await page.goto("/demo");
  await page.getByRole("button", { name: "Сообщества", exact: true }).click();
  await expect(page.locator(".post")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Соберите свою ленту" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Город", exact: true }).click();
  await page.screenshot({
    path: `/tmp/your-city-social-${info.project.name}.png`,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "ҚАЗ", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Сіз үшін", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Қала", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("nested replies, editing, deletion tombstones and local ownership", async ({
  page,
}) => {
  await openRu(page, "/demo?page=post&id=walk");
  const sample = page.locator('[data-comment-id="sample-walk"]');
  await expect(
    sample.getByRole("button", { name: "Удалить комментарий" }),
  ).toHaveCount(0);
  await sample.getByRole("button", { name: "Ответить", exact: true }).click();
  await expect(page.locator(".social-reply-context")).toContainText("@madina");
  await page
    .getByRole("textbox", { name: "Ваш комментарий" })
    .fill("Первый локальный ответ");
  await page.getByRole("button", { name: "Отправить · демо" }).click();
  const first = page
    .locator(".mvp-comment")
    .filter({ has: page.getByText("Первый локальный ответ", { exact: true }) });
  await first.getByRole("button", { name: "Ответить", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Ваш комментарий" })
    .fill("Вложенный ответ");
  await page.getByRole("button", { name: "Отправить · демо" }).click();
  await expect(page.locator(".social-thread-child")).toHaveCount(2);
  const nested = page
    .locator(".mvp-comment")
    .filter({ has: page.getByText("Вложенный ответ", { exact: true }) });
  await nested
    .getByRole("button", { name: "Редактировать комментарий" })
    .click();
  await page
    .getByRole("textbox", { name: "Редактировать комментарий" })
    .fill("Исправленный ответ <script>demo</script>");
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(
    page.getByText("Исправленный ответ <script>demo</script>", { exact: true }),
  ).toBeVisible();
  await first.getByRole("button", { name: "Удалить комментарий" }).click();
  await expect(
    page.getByText("Комментарий удалён", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Исправленный ответ <script>demo</script>", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Комментарий удалён", { exact: true }),
  ).toBeVisible();
  const edited = page.locator(".mvp-comment").filter({
    has: page.getByText("Исправленный ответ <script>demo</script>", {
      exact: true,
    }),
  });
  await edited.getByRole("button", { name: "Удалить комментарий" }).click();
  await expect(
    page.getByText("Исправленный ответ <script>demo</script>", { exact: true }),
  ).toHaveCount(0);
  await sample.getByRole("button", { name: "Ответить", exact: true }).click();
  await page.getByRole("button", { name: "Отменить ответ" }).click();
  await expect(page.locator(".social-reply-context")).toHaveCount(0);
});

test("quote posts, optional district and profile media/replies/likes tabs", async ({
  page,
}) => {
  await openRu(page, "/demo?page=post&id=books");
  await page.getByRole("button", { name: "Нравится", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Ваш комментарий" })
    .fill("Локальный ответ о книгах");
  await page.getByRole("button", { name: "Отправить · демо" }).click();
  await page.getByRole("link", { name: "Цитировать", exact: true }).click();
  await expect(page.locator(".mvp-editor > .social-quote")).toContainText(
    "Хорошие книги должны путешествовать",
  );
  await page
    .getByRole("textbox", { name: "Заголовок" })
    .fill("Обсудим книжный обмен");
  await page
    .getByRole("textbox", { name: "Текст", exact: true })
    .fill("Это моя локальная цитата для демоверсии.");
  await page
    .getByRole("combobox", { name: "Район (необязательно)", exact: true })
    .selectOption("abay");
  await page
    .getByRole("combobox", { name: "Тип публикации" })
    .selectOption("question");
  await page
    .getByRole("combobox", { name: "Обложка" })
    .selectOption("/demo/books.svg");
  await page.getByRole("button", { name: "Опубликовать · демо" }).click();
  await expect(page.locator(".social-quote")).toContainText(
    "Хорошие книги должны путешествовать",
  );
  await expect(page.locator(".social-post-tags")).toContainText(
    "Абайский район",
  );
  await page.goto("/demo?page=profile");
  await page
    .locator(".social-profile-tabs")
    .getByRole("button", { name: "Медиа", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Обсудим книжный обмен" }),
  ).toBeVisible();
  await page
    .locator(".social-profile-tabs")
    .getByRole("button", { name: "Ответы", exact: true })
    .click();
  await expect(page.locator(".social-profile-replies")).toContainText(
    "Локальный ответ о книгах",
  );
  await page
    .locator(".social-profile-tabs")
    .getByRole("button", { name: "Нравится", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Хорошие книги должны путешествовать" }),
  ).toBeVisible();
  await page
    .locator(".social-profile-tabs")
    .getByRole("button", { name: "Посты", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Обсудим книжный обмен" }),
  ).toBeVisible();
});

test("profiles have honest local follow counts and an accessible edit modal", async ({
  page,
}) => {
  await openRu(page, "/demo?page=profile&id=dana");
  await expect(page.locator(".social-follow-stats")).toContainText(
    "0 подписчиков",
  );
  await page
    .getByRole("button", { name: "Подписаться · демо", exact: true })
    .click();
  await expect(page.locator(".social-follow-stats")).toContainText(
    "1 подписчик",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Вы подписаны · демо" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Вы подписаны · демо" }).click();
  await expect(page.locator(".social-follow-stats")).toContainText(
    "0 подписчиков",
  );
  await page.goto("/demo?page=profile");
  const opener = page.getByRole("button", {
    name: "Редактировать",
    exact: true,
  });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await page
    .getByRole("textbox", { name: "Имя пользователя", exact: true })
    .fill("invalid name!");
  await page
    .getByRole("button", { name: "Сохранить · демо", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Имя пользователя", exact: true })
    .fill("shymkent_neighbor");
  await page
    .getByRole("combobox", { name: "Район (необязательно)", exact: true })
    .selectOption("turan");
  await page
    .getByRole("button", { name: "Сохранить · демо", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".mvp-profile")).toContainText(
    "@shymkent_neighbor",
  );
  await expect(page.locator(".mvp-profile")).toContainText("Туранский район");
});

test("notification center separates explicit samples from genuine local activity and persists read states", async ({
  page,
}) => {
  await openRu(page, "/demo?page=notifications");
  await expect(page.locator(".social-notice")).toHaveCount(0);
  await page.getByRole("button", { name: "Добавить примеры событий" }).click();
  await expect(page.locator(".social-notice.unread")).toHaveCount(4);
  await expect(page.locator(".social-notice").first()).toContainText(
    "ПРИМЕР СОБЫТИЯ",
  );
  await page
    .locator(".social-notice")
    .first()
    .getByRole("button", { name: "Отметить прочитанным" })
    .click();
  await page.reload();
  await expect(page.locator(".social-notice.unread")).toHaveCount(3);
  await page.getByRole("button", { name: "Только непрочитанные" }).click();
  await expect(page.locator(".social-notice")).toHaveCount(3);
  await page.getByRole("button", { name: "Прочитать все" }).click();
  await expect(page.locator(".social-notice")).toHaveCount(0);
  await page.getByRole("button", { name: "Только непрочитанные" }).click();
  await expect(page.locator(".social-notice")).toHaveCount(4);
  await page.getByRole("button", { name: "Очистить", exact: true }).click();
  await page.goto("/demo?page=post&id=walk");
  await page.getByRole("button", { name: "Нравится", exact: true }).click();
  await page.locator(".social-notification-link").click();
  await expect(page.locator(".social-notice")).toHaveCount(1);
  await expect(page.locator(".social-notice")).toContainText(
    "Вы отметили демопост",
  );
  await expect(page.locator(".social-notice")).toContainText("В ЭТОМ БРАУЗЕРЕ");
  await page.locator(".social-notice a").click();
  await expect(page).toHaveURL(/page=post&id=walk/);
  await page.locator(".social-notification-link").click();
  await expect(page.locator(".social-notice.unread")).toHaveCount(0);
});

test("local reporting, muting/blocking and restoration work on small phones without bypassing real authorization", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openRu(page, "/demo?page=post&id=walk");
  const menu = page.locator(".mvp-post-meta .social-menu");
  await menu.locator("summary").click();
  await menu.getByRole("button", { name: "Пожаловаться · демо" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "не отправляется модератору",
  );
  await page.getByRole("button", { name: "Сохранить жалобу · демо" }).click();
  await expect(page.getByRole("status")).toContainText("Деможалоба сохранена");
  const sampleMenu = page.locator(
    '[data-comment-id="sample-walk"] .social-menu',
  );
  await sampleMenu.locator("summary").click();
  const bounds = await sampleMenu.locator(":scope > div").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await sampleMenu.getByRole("button", { name: "Пожаловаться · демо" }).click();
  await page.getByRole("button", { name: "Сохранить жалобу · демо" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("your-city-demo-v2")!).reports.length,
    ),
  ).toBe(2);
  await menu.locator("summary").click();
  await menu.getByRole("button", { name: "Заглушить аккаунт" }).click();
  await expect(page.locator(".mvp-detail")).toContainText("Этот аккаунт скрыт");
  await page.goto("/demo?page=profile");
  await page.getByText("Скрытые аккаунты", { exact: false }).click();
  await page
    .locator(".social-hidden-accounts")
    .getByRole("button", { name: "Отменить", exact: true })
    .click();
  await page.goto("/demo?page=post&id=walk");
  await menu.locator("summary").click();
  await menu.getByRole("button", { name: "Заблокировать · демо" }).click();
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Город, в который влюбляешься заново" }),
  ).toHaveCount(0);
  await page.goto("/demo?page=profile");
  await page.getByText("Скрытые аккаунты", { exact: false }).click();
  await page
    .locator(".social-hidden-accounts")
    .getByRole("button", { name: "Отменить", exact: true })
    .click();
  for (const lang of ["ru", "kk"]) {
    await page
      .getByRole("button", { name: lang === "ru" ? "РУС" : "ҚАЗ", exact: true })
      .click();
    for (const route of [
      "feed",
      "notifications",
      "profile&id=dana",
      "post&id=books",
      "create",
    ]) {
      await page.goto("/demo?page=" + route);
      await expect(page.locator(".shell")).toHaveAttribute(
        "aria-busy",
        "false",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.getByRole("button", { name: "Тақырыпты ауыстыру" }).click();
  await page.screenshot({
    path: `/tmp/your-city-social-dark-320-${info.project.name}.png`,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
