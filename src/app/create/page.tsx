import Link from "next/link";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { Submit } from "@/components/backend/submit";
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
          <form action={savePost}>
            <label>
              {t("Қауымдастық", "Сообщество")}
              <select name="community" defaultValue={params.community}>
                {communities.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c[locale === "kk" ? "name_kk" : "name_ru"]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Мәтін", "Текст")}
              <textarea name="body" required maxLength={5000} />
            </label>
            <Submit>{t("Жариялау", "Опубликовать")}</Submit>
          </form>
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
