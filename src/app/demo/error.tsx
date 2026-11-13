"use client";
import Link from "next/link";
import { useDemoState } from "@/lib/demo-store";
export default function Error({ reset }: { reset: () => void }) {
  const [state] = useDemoState();
  const t = (kk: string, ru: string) => (state.lang === "kk" ? kk : ru);
  return (
    <div className="mvp social-loading" data-theme={state.theme}>
      <h1>{t("Бет жүктелмеді", "Не удалось открыть страницу")}</h1>
      <p role="alert">
        {t(
          "Демодеректер браузерде сақталады. Қайта көріңіз.",
          "Демоданные хранятся в браузере. Попробуйте ещё раз.",
        )}
      </p>
      <button className="mvp-primary" onClick={reset}>
        {t("Қайталау", "Повторить")}
      </button>
      <Link className="mvp-text-link" href="/">
        {t("Басты бетке", "На главную")}
      </Link>
    </div>
  );
}
