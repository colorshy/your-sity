import { notFound } from "next/navigation";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { Submit } from "@/components/backend/submit";
import { Pagination, pageNumber } from "@/components/backend/pagination";
import { resolveReport } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; error?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  if (!service.isModerator()) notFound();
  const params = await searchParams,
    page = pageNumber(params.page),
    reports = await service.reports(page);
  const { t } = await translator();
  return (
    <Shell>
      <h1>{t("Модерация", "Модерация")}</h1>
      <Notice {...params} />
      {reports.length ? (
        reports.slice(0, 20).map((r) => (
          <article className="post" key={r.id}>
            <p>{r.reason}</p>
            <p>{r.post_id}</p>
            <form action={resolveReport}>
              <input type="hidden" name="report" value={r.id} />
              <label>
                {t("Шешім", "Решение")}
                <select name="decision">
                  <option value="hide">
                    {t("Жазбаны жасыру", "Скрыть публикацию")}
                  </option>
                  <option value="dismiss">
                    {t("Шағымды қабылдамау", "Отклонить жалобу")}
                  </option>
                </select>
              </label>
              <Submit>{t("Қолдану", "Применить")}</Submit>
            </form>
          </article>
        ))
      ) : (
        <p className="empty">{t("Шағымдар жоқ", "Жалоб нет")}</p>
      )}
      <Pagination
        page={page}
        more={reports.length > 20}
        path="/moderation?page="
      />
    </Shell>
  );
}
