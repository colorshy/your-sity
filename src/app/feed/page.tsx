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
    mine = params.mode !== "explore";
  const posts = await service.posts(mine ? "mine" : "explore", page);
  return (
    <Shell>
      <h1>{t("Қала лентасы", "Лента города")}</h1>
      <Notice {...params} />
      <Link className="primary" href="/create">
        {t("Жазба жасау", "Создать публикацию")}
      </Link>
      <nav className="feed-tabs">
        <Link aria-current={mine ? "page" : undefined} href="/feed">
          {t("Менің қауымдастықтарым", "Мои сообщества")}
        </Link>
        <Link
          aria-current={!mine ? "page" : undefined}
          href="/feed?mode=explore"
        >
          {t("Қаланы шолу", "Весь город")}
        </Link>
      </nav>
      <PostList
        posts={posts.slice(0, 20)}
        authors={await service.authors(posts.slice(0, 20))}
      />
      <Pagination
        page={page}
        more={posts.length > 20}
        path={"/feed?mode=" + (mine ? "mine" : "explore") + "&page="}
      />
    </Shell>
  );
}
