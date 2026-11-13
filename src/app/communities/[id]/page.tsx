import { notFound } from "next/navigation";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { uuid } from "@/lib/validation";
import { Shell, Configuration } from "@/components/backend/shell";
import { CommunityCards, PostList } from "@/components/backend/data";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!supabaseConfig()) return <Configuration />;
  const { client, user, profile } = await requireResident();
  const { id } = await params;
  if (!uuid(id)) notFound();
  const { locale } = await translator();
  const c = await client
    .from("communities")
    .select("*")
    .eq("id", id)
    .eq("city_id", profile.city_id)
    .maybeSingle();
  if (c.error) throw new Error("Community unavailable");
  if (!c.data) notFound();
  const [members, posts] = await Promise.all([
    client
      .from("community_memberships")
      .select("community_id")
      .eq("user_id", user.id),
    client
      .from("posts")
      .select("id,body,author_id,community_id,created_at")
      .eq("community_id", id)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(20),
  ]);
  if (members.error || posts.error) throw new Error("Community unavailable");
  const authors = posts.data.length
    ? await client
        .from("profiles")
        .select("id,display_name")
        .in(
          "id",
          posts.data.map((p) => p.author_id),
        )
    : { data: [], error: null };
  if (authors.error) throw new Error("Authors unavailable");
  return (
    <Shell>
      <h1>{c.data[locale === "kk" ? "name_kk" : "name_ru"]}</h1>
      <CommunityCards
        communities={[c.data]}
        joined={members.data.map((m) => m.community_id)}
      />
      <PostList posts={posts.data} authors={authors.data ?? []} />
    </Shell>
  );
}
