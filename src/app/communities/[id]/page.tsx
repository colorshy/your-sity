import Link from "next/link";
import { notFound } from "next/navigation";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration } from "@/components/backend/shell";
import { CommunityCards, PostList } from "@/components/backend/data";
import { Pagination, pageNumber } from "@/components/backend/pagination";
import { AccessError } from "@/lib/appwrite/policy";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  const { id } = await params;
  const { locale, t } = await translator();
  let c;
  try {
    c = await service.community(id);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const page = pageNumber((await searchParams).page);
  const [members, posts] = await Promise.all([
    service.memberships(),
    service.posts("explore", page, id),
  ]);
  return (
    <Shell>
      <h1>{c[locale === "kk" ? "name_kk" : "name_ru"]}</h1>
      <CommunityCards
        communities={[c]}
        joined={members.map((m) => m.community_id)}
      />
      <Link className="all-link" href={"/create?community=" + id}>
        {t("Жазба жасау", "Создать публикацию")}
      </Link>
      <PostList
        posts={posts.slice(0, 20)}
        authors={await service.authors(posts.slice(0, 20))}
      />
      <Pagination
        page={page}
        more={posts.length > 20}
        path={"/communities/" + id + "?page="}
      />
    </Shell>
  );
}
