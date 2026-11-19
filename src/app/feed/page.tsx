import Link from "next/link";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { PostList } from "@/components/backend/data";
import { Pagination, pageNumber } from "@/components/backend/pagination";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; page?: string; error?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  const { t } = await translator();
  const params = await searchParams,
    page = pageNumber(params.page),
    mode =
      params.mode === "mine"
        ? "mine"
        : params.mode === "city" || params.mode === "explore"
          ? "city"
          : "for-you";
  const posts = await service.posts(mode, page);
  return (
    <Shell>
      <h1>{t("Қала лентасы", "Лента города")}</h1>
      <Notice {...params} />
      <Link className="primary" href="/create">
        {t("Жазба жасау", "Создать публикацию")}
      </Link>
      <nav className="feed-tabs" aria-label={t("Лента түрі", "Режим ленты")}>
        <Link
          aria-current={mode === "for-you" ? "page" : undefined}
          href="/feed"
        >
          {t("Сіз үшін", "Для тебя")}
        </Link>
        <Link
          aria-current={mode === "city" ? "page" : undefined}
          href="/feed?mode=city"
        >
          {t("Қала", "Город")}
        </Link>
        <Link
          aria-current={mode === "mine" ? "page" : undefined}
          href="/feed?mode=mine"
        >
          {t("Менің қауымдастықтарым", "Мои сообщества")}
        </Link>
      </nav>
      <p>
        <Link className="all-link" href="/discover">
          {t("Қала қауымдастықтарын ашу", "Открыть сообщества города")} →
        </Link>
      </p>
      <PostList
        posts={posts.slice(0, 20)}
        authors={await service.authors(posts.slice(0, 20))}
      />
      <Pagination
        page={page}
        more={posts.length > 20}
        path={"/feed?mode=" + mode + "&page="}
      />
    </Shell>
  );
}
