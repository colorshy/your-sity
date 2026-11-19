import Link from "next/link";
import { Leaf } from "lucide-react";
import { setPublicLocale } from "@/app/actions";
import { translator } from "@/lib/locale";
import styles from "./public.module.css";

export async function PublicHeader({
  home = false,
  signup = false,
}: {
  home?: boolean;
  signup?: boolean;
}) {
  const { locale, t } = await translator();
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.wordmark} aria-label="Your City">
          <Leaf size={19} aria-hidden /> your city.
        </Link>
        <p className={styles.location}>Шымкент</p>
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
        {(home || signup) && (
          <div className={styles.accountLinks}>
            <Link className={styles.login} href="/sign-in">
              {t("Кіру", "Войти")}
            </Link>
            {home && (
              <Link className={styles.button} href="/sign-up">
                {t("Тіркелу", "Регистрация")}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
