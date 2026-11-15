import Link from "next/link";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { Submit } from "@/components/backend/submit";
import { Pagination, pageNumber } from "@/components/backend/pagination";
import { readNotification } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; error?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireResident();
  const { t } = await translator();
  const params = await searchParams,
    page = pageNumber(params.page);
  const notifications = await service.notifications(page);
  const authors = await service.authors(
    notifications.map((n) => ({ author_id: n.actor_id })),
  );
  return (
    <Shell>
      <h1>{t("Хабарламалар", "Уведомления")}</h1>
      <Notice {...params} />
      <p>
        {t(
          "Жаңарту үшін бетті қайта жүктеңіз.",
          "Обновите страницу, чтобы увидеть новые уведомления.",
        )}
      </p>
      {notifications.length ? (
        notifications.slice(0, 20).map((n) => (
          <article className="post" key={n.id} data-notification-id={n.id}>
            <Link href={"/people/" + n.actor_id}>
              {authors.find((a) => a.id === n.actor_id)?.display_name ??
                t("Тұрғын", "Житель")}
            </Link>
            <p>
              {n.kind === "like"
                ? t("Жазбаңызды ұнатты", "Отметил вашу публикацию")
                : n.kind === "follow"
                  ? t("Сізге жазылды", "Подписался на вас")
                  : n.kind === "reply"
                    ? t("Пікіріңізге жауап берді", "Ответил на ваш комментарий")
                    : t("Пікір қалдырды", "Оставил комментарий")}
            </p>
            {n.post_id && (
              <Link
                href={
                  "/posts/" +
                  n.post_id +
                  (n.comment_id ? "#comment-" + n.comment_id : "")
                }
              >
                {t("Талқылау", "Обсуждение")}
              </Link>
            )}
            {!n.is_read ? (
              <form action={readNotification}>
                <input type="hidden" name="notification" value={n.id} />
                <Submit>
                  {t("Оқылды деп белгілеу", "Отметить прочитанным")}
                </Submit>
              </form>
            ) : (
              <p>{t("Оқылды", "Прочитано")}</p>
            )}
          </article>
        ))
      ) : (
        <p className="empty">{t("Хабарламалар жоқ", "Уведомлений нет")}</p>
      )}
      <Pagination
        page={page}
        more={notifications.length > 20}
        path="/notifications?page="
      />
    </Shell>
  );
}
