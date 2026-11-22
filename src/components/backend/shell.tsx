import Link from "next/link";
import { translator } from "@/lib/locale";
import { setLocale } from "@/app/actions";
import { signOut } from "@/app/actions";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireService } from "@/lib/auth";
import { AppNav } from "./app-nav";
export async function Shell({ children }: { children: React.ReactNode }) {
  const { locale, t } = await translator();
  const context = appwriteConfig() ? await requireService() : null;
  const onboarded = context
    ? (await context.service.profile())?.onboarded
    : false;
  const communities =
    onboarded && context ? await context.service.communities() : [];
  const joined =
    onboarded && context
      ? new Set(
          (await context.service.memberships()).map((m) => m.community_id),
        )
      : new Set<string>();
  return (
    <div className="app-layout" lang={locale}>
      <aside className="app-left">
        <Link className="brand" href="/">
          your city.
        </Link>
        <AppNav locale={locale} moderator={context?.service.isModerator()} />
        <Link className="app-create" href="/create">
          {t("Жазба жасау", "Создать публикацию")}
        </Link>
        <div className="app-account">
          <span>{context?.user.name}</span>
          <form action={setLocale}>
            <input
              type="hidden"
              name="locale"
              value={locale === "kk" ? "ru" : "kk"}
            />
            <button className="join">{locale === "kk" ? "РУС" : "ҚАЗ"}</button>
          </form>
          {context && (
            <form action={signOut}>
              <button>{t("Шығу", "Выйти")}</button>
            </form>
          )}
        </div>
      </aside>
      <main className="app-center">{children}</main>
      <aside className="app-right" aria-label={t("Қала туралы", "О городе")}>
        <Link className="app-search" href="/discover">
          {t("Қауымдастықтарды іздеу", "Поиск сообществ")} →
        </Link>
        <section>
          <h2>{t("Менің қауымдастықтарым", "Мои сообщества")}</h2>
          {communities
            .filter((c) => joined.has(c.id))
            .slice(0, 5)
            .map((c) => (
              <Link key={c.id} href={"/communities/" + c.id}>
                {c[locale === "kk" ? "name_kk" : "name_ru"]}
              </Link>
            ))}
          {!joined.size && <p>{t("Әзірге жоқ", "Пока нет")}</p>}
        </section>
        <section>
          <h2>{t("Қаланы ашыңыз", "Откройте город")}</h2>
          {communities
            .filter((c) => !joined.has(c.id))
            .slice(0, 4)
            .map((c) => (
              <Link key={c.id} href={"/communities/" + c.id}>
                {c[locale === "kk" ? "name_kk" : "name_ru"]}
              </Link>
            ))}
        </section>
        <p>{t("Шымкент, Қазақстан", "Шымкент, Казахстан")}</p>
      </aside>
      <div className="app-bottom">
        <AppNav locale={locale} moderator={false} />
      </div>
    </div>
  );
}
export async function Configuration() {
  const { t } = await translator();
  return (
    <Shell>
      <section className="form-panel">
        <h1>{t("Қызмет әзірге қолжетімсіз", "Сервис пока недоступен")}</h1>
        <p>
          {t(
            "Қосылым бапталуда. Кейінірек қайталап көріңіз.",
            "Подключение настраивается. Попробуйте позже.",
          )}
        </p>
        <Link href="/demo">
          {t("Демо нұсқаны көру", "Посмотреть демоверсию")}
        </Link>
      </section>
    </Shell>
  );
}
export async function Notice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  const { t } = await translator();
  return (
    <>
      {error && (
        <p role="alert">
          {error === "rate"
            ? t(
                "Тым көп сұрау. Кейінірек қайталаңыз.",
                "Слишком много запросов. Попробуйте позже.",
              )
            : error === "unavailable"
              ? t(
                  "Қызмет уақытша қолжетімсіз. Кейінірек қайталаңыз.",
                  "Сервис временно недоступен. Попробуйте позже.",
                )
              : error === "verification"
                ? t(
                    "Растау сілтемесі жарамсыз немесе ескірген. Қайта кіріп көріңіз.",
                    "Ссылка подтверждения недействительна или истекла. Попробуйте войти снова.",
                  )
                : error === "auth"
                  ? t(
                      "Жалғастыру мүмкін болмады. Деректерді тексеріңіз. Аккаунтыңыз болса, кіру бетін пайдаланыңыз.",
                      "Не удалось продолжить. Проверьте введённые данные. Если у вас уже есть аккаунт, воспользуйтесь страницей входа.",
                    )
                  : t(
                      "Сұрау орындалмады. Деректерді тексеріп, қайталаңыз.",
                      "Запрос не выполнен. Проверьте данные и повторите.",
                    )}
        </p>
      )}
      {message === "verify" && (
        <p role="status">
          {t(
            "Растау хаты сұралды. Email поштаңызды тексеріңіз.",
            "Письмо подтверждения запрошено. Проверьте почту.",
          )}
        </p>
      )}
      {message === "verified" && (
        <p role="status">{t("Email расталды.", "Email подтверждён.")}</p>
      )}
      {message === "reported" && (
        <p role="status">{t("Шағым жіберілді.", "Жалоба отправлена.")}</p>
      )}
    </>
  );
}
