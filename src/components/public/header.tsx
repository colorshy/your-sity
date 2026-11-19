import Link from "next/link";
import { ArrowUpRight, MapPin, Menu, Waypoints } from "lucide-react";
import { setPublicLocale } from "@/app/actions";
import { translator } from "@/lib/locale";
import styles from "./public.module.css";

export function Wordmark() {
  return (
    <Link href="/" className={styles.wordmark} aria-label="Your City">
      <span>
        <Waypoints size={17} aria-hidden />
      </span>{" "}
      your city<span className={styles.dot}>.</span>
    </Link>
  );
}

export async function PublicHeader({
  landing = false,
  signedIn = false,
  signup = false,
}: {
  landing?: boolean;
  signedIn?: boolean;
  signup?: boolean;
}) {
  const { locale, t } = await translator();
  const navigation = [
    ["/#discover", t("Ашу", "Открыть")],
    ["/#communities", t("Қауымдастықтар", "Сообщества")],
    ["/#about", t("Жоба туралы", "О проекте")],
  ];
  const navLinks = navigation.map(([href, label]) => (
    <Link key={href} href={href}>
      {label}
    </Link>
  ));
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Wordmark />
        <p className={styles.location}>
          <MapPin size={15} aria-hidden />
          {t("Шымкент, Қазақстан", "Шымкент, Казахстан")}
        </p>
        {landing && (
          <nav
            className={styles.desktopNav}
            aria-label={t("Басты мәзір", "Главное меню")}
          >
            {navLinks}
          </nav>
        )}
        <div className={styles.headerActions}>
          <form
            action={setPublicLocale}
            className={styles.languages}
            aria-label={t("Тіл", "Язык")}
          >
            <button
              name="locale"
              value="ru"
              lang="ru"
              aria-label="РУС"
              aria-pressed={locale === "ru"}
            >
              RU
            </button>
            <button
              name="locale"
              value="kk"
              lang="kk"
              aria-pressed={locale === "kk"}
            >
              ҚАЗ
            </button>
          </form>
          {landing && (
            <details className={styles.mobileNav}>
              <summary aria-label={t("Мәзір", "Меню")}>
                <Menu size={21} aria-hidden />
              </summary>
              <nav aria-label={t("Басты мәзір", "Главное меню")}>
                {navLinks}
              </nav>
            </details>
          )}
        </div>
        {(landing || signup) && (
          <div className={styles.accountLinks}>
            {!signedIn && (
              <Link className={styles.login} href="/sign-in">
                {t("Кіру", "Войти")}
              </Link>
            )}
            {landing && (
              <Link
                className={styles.button}
                href={signedIn ? "/discover" : "/sign-up"}
              >
                {signedIn
                  ? t("Your City-ге өту", "Перейти в Your City")
                  : t("Қосылу", "Присоединиться")}
                <ArrowUpRight size={16} aria-hidden />
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
