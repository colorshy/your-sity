import { supabaseConfig } from "@/lib/supabase/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { CommunityCards } from "@/components/backend/data";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  if (!supabaseConfig()) return <Configuration />;
  const { client, user, profile } = await requireResident();
  const { t } = await translator();
  const params = await searchParams;
  const [communities, memberships] = await Promise.all([
    client
      .from("communities")
      .select("*")
      .eq("city_id", profile.city_id)
      .order("slug"),
    client
      .from("community_memberships")
      .select("community_id")
      .eq("user_id", user.id),
  ]);
  if (communities.error || memberships.error)
    throw new Error("Communities unavailable");
  const query = (params.q ?? "").slice(0, 100).toLowerCase();
  const filtered = communities.data.filter(
    (c) =>
      c.name_kk.toLowerCase().includes(query) ||
      c.name_ru.toLowerCase().includes(query),
  );
  return (
    <Shell>
      <h1>{t("Қауымдастықтар", "Сообщества")}</h1>
      <Notice {...params} />
      <form className="search">
        <label>
          {t("Іздеу", "Поиск")}
          <input name="q" maxLength={100} defaultValue={params.q} />
        </label>
        <button>{t("Іздеу", "Найти")}</button>
      </form>
      <CommunityCards
        communities={filtered}
        joined={memberships.data.map((m) => m.community_id)}
      />
      {!filtered.length && (
        <p className="empty">{t("Табылмады", "Ничего не найдено")}</p>
      )}
    </Shell>
  );
}
