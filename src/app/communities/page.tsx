import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { CommunityCards } from "@/components/backend/data";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  const { t } = await translator();
  const params = await searchParams;
  const [communities, memberships] = await Promise.all([
    service.communities(),
    service.memberships(),
  ]);
  const query = (params.q ?? "").slice(0, 100).toLowerCase();
  const filtered = communities.filter((c) =>
    [c.name_kk, c.name_ru, c.id].some((v) => v.toLowerCase().includes(query)),
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
        joined={memberships.map((m) => m.community_id)}
      />
      {!filtered.length && (
        <p className="empty">{t("Табылмады", "Ничего не найдено")}</p>
      )}
    </Shell>
  );
}
