import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { CommunityCards } from "@/components/backend/data";
import { Discovery } from "@/components/backend/discovery";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  const { locale, t } = await translator();
  const params = await searchParams;
  const [communities, memberships] = await Promise.all([
    service.communities(),
    service.memberships(),
  ]);
  return (
    <Shell>
      <h1>{t("Қауымдастықтар", "Сообщества")}</h1>
      <Notice {...params} />
      <p>
        {t(
          "Қызығушылықтарыңызға жақын ортаны табыңыз.",
          "Найдите людей с близкими интересами.",
        )}
      </p>
      <Discovery
        communities={communities}
        locale={locale}
        initialQuery={params.q ?? ""}
      >
        {communities.map((c) => (
          <div key={c.id} data-discovery-card={c.id}>
            <CommunityCards
              communities={[c]}
              joined={memberships.map((m) => m.community_id)}
            />
          </div>
        ))}
      </Discovery>
    </Shell>
  );
}
