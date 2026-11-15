import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration } from "@/components/backend/shell";
import { PostList } from "@/components/backend/data";
import { Pagination, pageNumber } from "@/components/backend/pagination";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  const { t } = await translator();
  const page = pageNumber((await searchParams).page);
  const posts = await service.savedPosts(page);
  return (
    <Shell>
      <h1>{t("Сақталғандар", "Закладки")}</h1>
      <PostList
        posts={posts.slice(0, 20)}
        authors={await service.authors(posts.slice(0, 20))}
      />
      <Pagination page={page} more={posts.length > 20} path="/saved?page=" />
    </Shell>
  );
}
