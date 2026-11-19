import Link from "next/link";
import { appwriteConfig } from "@/lib/appwrite/config";
import { translator } from "@/lib/locale";
import { authenticate } from "@/app/actions";
import { Notice } from "./shell";
import { PublicHeader } from "@/components/public/header";
import styles from "@/components/public/public.module.css";
import { Submit } from "./submit";
export async function AuthPage({
  signup = false,
  params,
}: {
  signup?: boolean;
  params: { error?: string; message?: string; next?: string };
}) {
  let configured = false;
  try {
    configured = Boolean(appwriteConfig());
  } catch {
    // An invalid target is unavailable and must never receive credentials.
  }
  const { t } = await translator();
  return (
    <>
      <PublicHeader signup={signup} />
      <main className={styles.auth}>
        <section className="form-panel">
          <h1>{signup ? t("Тіркелу", "Регистрация") : t("Кіру", "Вход")}</h1>
          <p>
            {signup
              ? t(
                  "Шымкенттегі ортаңызға қосылыңыз. Келесі қадамда профиліңізді баптайсыз.",
                  "Присоединяйтесь к сообществу Шымкента. На следующем шаге вы настроите профиль.",
                )
              : t(
                  "Қалаңыздағы жаңалықтарға оралыңыз.",
                  "Вернитесь к обсуждениям вашего города.",
                )}
          </p>
          <Notice
            {...params}
            error={configured ? params.error : "unavailable"}
          />
          <form action={authenticate}>
            <input
              type="hidden"
              name="mode"
              value={signup ? "signup" : "signin"}
            />
            {!signup && params.next === "discover" && (
              <input type="hidden" name="next" value="discover" />
            )}
            {signup && (
              <label>
                {t("Атыңыз", "Имя")}
                <input
                  name="name"
                  minLength={2}
                  maxLength={80}
                  autoComplete="nickname"
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                maxLength={254}
                autoComplete="email"
                required
              />
            </label>
            <label>
              {t("Құпиясөз", "Пароль")}
              <input
                name="password"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete={signup ? "new-password" : "current-password"}
                aria-describedby="password-hint"
                required
              />
            </label>
            <p className="field-hint" id="password-hint">
              {t("Құпиясөз: 8–128 таңба.", "Пароль: от 8 до 128 символов.")}
            </p>
            <Submit
              disabled={!configured}
              pendingLabel={
                signup
                  ? t("Тіркеліп жатыр…", "Регистрируем…")
                  : t("Кіріп жатыр…", "Входим…")
              }
            >
              {signup ? t("Тіркелу", "Зарегистрироваться") : t("Кіру", "Войти")}
            </Submit>
          </form>
          <div className={styles.authLinks}>
            <Link href={signup ? "/sign-in" : "/sign-up"}>
              {signup
                ? t("Аккаунтым бар", "Уже есть аккаунт")
                : t("Аккаунт ашу", "Создать аккаунт")}
            </Link>
            <Link href="/demo">{t("Демоны көру", "Посмотреть демо")}</Link>
          </div>
        </section>
      </main>
    </>
  );
}
