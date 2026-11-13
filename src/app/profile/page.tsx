import Link from "next/link";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { CommunityCards, PostList } from "@/components/backend/data";
import { Submit } from "@/components/backend/submit";
import { updateProfile, signOut } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!supabaseConfig()) return <Configuration />;
  const { client, user, profile } = await requireResident();
  const { locale, t } = await translator();
  const [members, posts, city] = await Promise.all([
    client
      .from("community_memberships")
      .select("community_id")
      .eq("user_id", user.id),
    client
      .from("posts")
      .select("id,body,author_id,community_id,created_at")
      .eq("author_id", user.id)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(20),
    client
      .from("cities")
      .select("name_kk,name_ru")
      .eq("id", profile.city_id)
      .single(),
  ]);
  if (members.error || posts.error || city.error)
    throw new Error("Profile unavailable");
  const ids = members.data.map((m) => m.community_id);
  const communities = ids.length
    ? await client.from("communities").select("*").in("id", ids)
    : { data: [], error: null };
  if (communities.error) throw new Error("Memberships unavailable");
  return (
    <Shell>
      <h1>{profile.display_name}</h1>
      <p>{city.data[locale === "kk" ? "name_kk" : "name_ru"]}</p>
      <Notice {...await searchParams} />
      <form action={updateProfile} className="form-panel">
        <label>
          {t("Атыңыз", "Имя")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={profile.display_name}
          />
        </label>
        <Submit>{t("Сақтау", "Сохранить")}</Submit>
      </form>
      <form action={signOut}>
        <Submit>{t("Аккаунттан шығу", "Выйти из аккаунта")}</Submit>
      </form>
      <h2>{t("Қауымдастықтар", "Сообщества")}</h2>
      <CommunityCards communities={communities.data ?? []} joined={ids} />
      <Link className="all-link" href="/communities">
        {t("Қауымдастық табу", "Найти сообщество")}
      </Link>
      <h2>{t("Менің жазбаларым", "Мои публикации")}</h2>
      <PostList posts={posts.data} authors={[profile]} />
    </Shell>
  );
}
