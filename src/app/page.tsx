import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/public/header";
import styles from "@/components/public/public.module.css";
import { DemoPostContent } from "@/components/social/demo-post-content";
import { hasVerifiedSession } from "@/lib/auth";
import { communities, posts } from "@/lib/demo";
import { translator } from "@/lib/locale";

export default async function Page() {
  if (await hasVerifiedSession()) redirect("/feed");
  const { locale, t } = await translator();

  return (
    <>
      <PublicHeader home />
      <main className={styles.home}>
        <h1>{t("Өз қалаң. Өз адамдарың.", "Твой город. Твои люди.")}</h1>
        <nav
          className={styles.homeNav}
          aria-label={t("Қала мәзірі", "Навигация по городу")}
        >
          <Link href="/" aria-current="page">
            {t("Лента", "Лента")}
          </Link>
          <Link href="/communities">{t("Қауымдастықтар", "Сообщества")}</Link>
        </nav>
        <section aria-labelledby="demo-feed">
          <div className={styles.feedHeading}>
            <h2 id="demo-feed">
              {t("Шымкенттің демолентасы", "Демолента Шымкента")}
            </h2>
            <Link href="/demo">{t("Демоны ашу", "Открыть демо")}</Link>
          </div>
          <p className={styles.feedNote}>
            {t(
              "Жазбалар — ойдан шығарылған үлгілер.",
              "Публикации — вымышленные примеры.",
            )}
          </p>
          {posts
            .filter(
              (post) => post.kind !== "event" && post.community !== "events",
            )
            .map((post) => (
              <article className={styles.sample} key={post.id}>
                <header>
                  <strong>{t(post.authorKk, post.authorRu)}</strong>
                  <span>
                    {
                      communities.find(
                        (community) => community.id === post.community,
                      )?.[locale === "ru" ? "ru" : "kk"]
                    }
                  </span>
                </header>
                <DemoPostContent
                  id={post.id}
                  title={t(post.titleKk, post.titleRu)}
                  body={t(post.bodyKk, post.bodyRu)}
                  heading="h3"
                />
              </article>
            ))}
        </section>
      </main>
    </>
  );
}
