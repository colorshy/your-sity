import Link from "next/link";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration } from "@/components/backend/shell";
import { PostList, type Post } from "@/components/backend/data";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; page?: string }>;
}) {
  if (!supabaseConfig()) return <Configuration />;
  const { client, user, profile } = await requireResident();
  const { t } = await translator();
  const params = await searchParams;
  const page = Math.min(
    1000,
    Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const mine = params.mode !== "explore";
  const [communities, memberships] = await Promise.all([
    client.from("communities").select("id").eq("city_id", profile.city_id),
    client
      .from("community_memberships")
      .select("community_id")
      .eq("user_id", user.id),
  ]);
  if (communities.error || memberships.error)
    throw new Error("Feed unavailable");
  const joined = new Set(memberships.data.map((m) => m.community_id));
  const ids = communities.data
    .filter((c) => !mine || joined.has(c.id))
    .map((c) => c.id);
  let posts: Post[] = [];
  if (ids.length) {
    const result = await client
      .from("posts")
      .select("id,body,created_at,author_id,community_id")
      .in("community_id", ids)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * 20, page * 20);
    if (result.error) throw new Error("Posts unavailable");
    posts = result.data;
  }
  const more = posts.length > 20;
  posts = posts.slice(0, 20);
  const authors = posts.length
    ? await client
        .from("profiles")
        .select("id,display_name")
        .in("id", [...new Set(posts.map((p) => p.author_id))])
    : { data: [], error: null };
  if (authors.error) throw new Error("Authors unavailable");
  return (
    <Shell>
      <h1>{t("Қала лентасы", "Лента города")}</h1>
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
      <PostList posts={posts} authors={authors.data ?? []} />
      <nav className="header-actions">
        {page > 1 && (
          <Link
            href={
              "/feed?mode=" +
              (mine ? "mine" : "explore") +
              "&page=" +
              (page - 1)
            }
          >
            {t("Алдыңғы", "Назад")}
          </Link>
        )}
        {more && (
          <Link
            href={
              "/feed?mode=" +
              (mine ? "mine" : "explore") +
              "&page=" +
              (page + 1)
            }
          >
            {t("Келесі", "Далее")}
          </Link>
        )}
      </nav>
    </Shell>
  );
}
