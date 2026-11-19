import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, MapPin } from "lucide-react";
import { Configuration, Shell } from "@/components/backend/shell";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import styles from "@/components/public/public.module.css";

export default async function DiscoverPage() {
  if (!appwriteConfig()) redirect("/sign-in?next=discover");
  const context = await requireResident("/sign-in?next=discover");
  const { service, profile } = context;
  const { locale, t } = await translator();
  const data = await Promise.all([
    service.communities(),
    service.memberships(),
  ]).catch(() => null);
  if (!data) return <Configuration />;
  const [communities, memberships] = data;
  const joined = new Set(
    memberships.map((membership) => membership.community_id),
  );
  const suggested = [...communities]
    .sort((a, b) => Number(joined.has(a.id)) - Number(joined.has(b.id)))
    .slice(0, 6);
  return (
    <Shell>
      <div className={styles.resident}>
        <section className={styles.residentIntro}>
          <p className={styles.eyebrow}>
            <MapPin size={16} aria-hidden />
            {t("ШЫМКЕНТ, ҚАЗАҚСТАН", "ШЫМКЕНТ, КАЗАХСТАН")}
          </p>
          <h1>
            {t("Сәлем", "Привет")}, {profile.display_name}!
          </h1>
          <p>
            {t(
              "Қызығушылығыңа сай қауымдастық тауып, қаладағы әңгімелерге қосыл.",
              "Найди сообщество по интересам и присоединяйся к обсуждениям города.",
            )}
          </p>
          <nav
            className={styles.ctas}
            aria-label={t("Қаладағы әрекеттер", "Действия в городе")}
          >
            <Link className={styles.button} href="/feed">
              {t("Қала лентасы", "Лента города")}
            </Link>
            <Link className={styles.secondary} href="/create">
              {t("Жазба жасау", "Создать публикацию")}
            </Link>
            <Link className={styles.secondary} href="/profile">
              {t("Менің профилім", "Мой профиль")}
            </Link>
          </nav>
        </section>
        <section className={styles.section}>
          <h2>{t("Қала қауымдастықтары", "Сообщества города")}</h2>
          {!joined.size && (
            <p>
              {t(
                "Әзірге ешбір қауымдастыққа қосылмадың. Алғашқысын қызығушылығыңа қарай таңда.",
                "Ты пока не вступил ни в одно сообщество. Выбери первое по интересам.",
              )}
            </p>
          )}
          {!suggested.length && (
            <p>
              {t(
                "Қалада әзірге қауымдастықтар жоқ.",
                "В городе пока нет сообществ.",
              )}
            </p>
          )}
          <div className={styles.pillars}>
            {suggested.map((community) => (
              <article key={community.id}>
                <span className={styles.pillarIcon}>
                  <Compass size={21} aria-hidden />
                </span>
                <h3>{community[locale === "kk" ? "name_kk" : "name_ru"]}</h3>
                <p>
                  {
                    community[
                      locale === "kk" ? "description_kk" : "description_ru"
                    ]
                  }
                </p>
                {joined.has(community.id) && (
                  <p>{t("Сен мүшесің", "Ты участник")}</p>
                )}
                <Link href={`/communities/${community.id}`}>
                  {t("Қауымдастықты ашу", "Открыть сообщество")}
                </Link>
              </article>
            ))}
          </div>
          <div className={styles.ctas}>
            <Link className={styles.secondary} href="/communities">
              {t(
                "Барлық қауымдастықтар мен санаттар",
                "Все сообщества и категории",
              )}
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
