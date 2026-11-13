import Link from "next/link";
import { supabaseConfig } from "@/lib/supabase/config";
import { translator } from "@/lib/locale";
import { authenticate, resendVerification } from "@/app/actions";
import { Shell, Configuration, Notice } from "./shell";
import { Submit } from "./submit";
export async function AuthPage({
  signup = false,
  params,
}: {
  signup?: boolean;
  params: { error?: string; message?: string };
}) {
  if (!supabaseConfig()) return <Configuration />;
  const { t } = await translator();
  return (
    <Shell>
      <section className="form-panel">
        <h1>{signup ? t("Тіркелу", "Регистрация") : t("Кіру", "Вход")}</h1>
        <Notice {...params} />
        <form action={authenticate}>
          <input
            type="hidden"
            name="mode"
            value={signup ? "signup" : "signin"}
          />
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
              required
            />
          </label>
          <Submit>
            {signup ? t("Тіркелу", "Зарегистрироваться") : t("Кіру", "Войти")}
          </Submit>
        </form>
        {!signup && (
          <details>
            <summary>
              {t(
                "Растау хатын қайта жіберу",
                "Отправить письмо подтверждения повторно",
              )}
            </summary>
            <form action={resendVerification}>
              <label>
                Email
                <input name="email" type="email" required maxLength={254} />
              </label>
              <Submit>{t("Хат жіберу", "Отправить письмо")}</Submit>
            </form>
          </details>
        )}
        <Link href={signup ? "/sign-in" : "/sign-up"}>
          {signup
            ? t("Аккаунтым бар", "Уже есть аккаунт")
            : t("Аккаунт ашу", "Создать аккаунт")}
        </Link>
      </section>
    </Shell>
  );
}
