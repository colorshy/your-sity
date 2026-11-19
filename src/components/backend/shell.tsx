import Link from "next/link";
import { translator } from "@/lib/locale";
import { setLocale } from "@/app/actions";
export async function Shell({ children }: { children: React.ReactNode }) {
  const { locale, t } = await translator();
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          your city.
        </Link>
        <nav className="header-actions">
          <Link href="/discover">{t("Қаланы ашу", "Открыть город")}</Link>
          <Link href="/feed">{t("Лента", "Лента")}</Link>
          <Link href="/communities">{t("Қауымдар", "Сообщества")}</Link>
          <Link href="/saved">{t("Сақталғандар", "Закладки")}</Link>
          <Link href="/notifications">{t("Хабарламалар", "Уведомления")}</Link>
          <Link href="/profile">{t("Профиль", "Профиль")}</Link>
          <form action={setLocale}>
            <input
              type="hidden"
              name="locale"
              value={locale === "kk" ? "ru" : "kk"}
            />
            <button className="join">{locale === "kk" ? "РУС" : "ҚАЗ"}</button>
          </form>
        </nav>
      </header>
      <main lang={locale}>{children}</main>
    </>
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
