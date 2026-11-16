import Link from "next/link";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { Composer } from "@/components/backend/composer";
import { savePost } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ community?: string; error?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  const { locale, t } = await translator();
  const params = await searchParams;
  const memberships = await service.memberships();
  const communities = (await service.communities()).filter((c) =>
    memberships.some((m) => m.community_id === c.id),
  );
  return (
    <Shell>
      <section className="form-panel">
        <h1>{t("Жазба жасау", "Создать публикацию")}</h1>
        <Notice {...params} />
        {communities.length ? (
          <Composer
            action={savePost}
            communities={communities}
            locale={locale}
            initialCommunity={params.community}
          />
        ) : (
          <p>
            {t(
              "Алдымен қауымдастыққа қосылыңыз",
              "Сначала вступите в сообщество",
            )}
          </p>
        )}
        <Link href="/communities">{t("Қауымдастықтар", "Сообщества")}</Link>
      </section>
    </Shell>
  );
}
