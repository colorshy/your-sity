import Link from "next/link";
import { Shell } from "@/components/backend/shell";
import { translator } from "@/lib/locale";
export default async function Page() {
  const { t } = await translator();
  return (
    <Shell>
      <section className="landing">
        <span className="eyebrow">YOUR CITY · ШЫМКЕНТ</span>
        <h1>{t("Бір қала. Мың байланыс.", "Один город. Тысячи связей.")}</h1>
        <p>
          {t(
            "Қалаңыздағы қауымдастықтарды тауып, көршілермен танысыңыз.",
            "Находите сообщества вашего города и знакомьтесь с соседями.",
          )}
        </p>
        <Link className="primary" href="/sign-up">
          {t("Қосылу", "Присоединиться")}
        </Link>{" "}
        <Link className="chip" href="/sign-in">
          {t("Кіру", "Войти")}
        </Link>
        <p>
          <Link href="/demo">
            {t(
              "Демо нұсқа — ойдан шығарылған деректер",
              "Демоверсия — вымышленные данные",
            )}
          </Link>
        </p>
      </section>
    </Shell>
  );
}
