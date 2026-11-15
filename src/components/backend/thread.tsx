import Link from "next/link";
import { saveComment, deleteComment, reportPost } from "@/app/actions";
import { Submit } from "./submit";
import { translator } from "@/lib/locale";
import type { Comment } from "@/lib/appwrite/types";

export async function Thread({
  comments,
  authors,
  postId,
  userId,
  joined,
}: {
  comments: Comment[];
  authors: { id: string; display_name: string }[];
  postId: string;
  userId: string;
  joined: boolean;
}) {
  const { t } = await translator();
  const byId = new Map(comments.map((c) => [c.id, c]));
  const ordered: { comment: Comment; depth: number }[] = [];
  const visited = new Set<string>();
  function visit(c: Comment, depth: number) {
    if (visited.has(c.id)) return;
    visited.add(c.id);
    ordered.push({ comment: c, depth });
    for (const reply of comments.filter((r) => r.parent_id === c.id))
      visit(reply, depth + 1);
  }
  for (const c of comments)
    if (!c.parent_id || !byId.has(c.parent_id)) visit(c, 0);
  for (const c of comments) visit(c, 0);
  if (!comments.length)
    return (
      <p className="empty">
        {t("Әзірге пікірлер жоқ", "Пока нет комментариев")}
      </p>
    );
  return (
    <>
      {ordered.map(({ comment: c, depth }) => (
        <article
          className="post beta-comment"
          id={"comment-" + c.id}
          key={c.id}
          data-comment-id={c.id}
          data-parent-id={c.parent_id || ""}
          style={{ marginInlineStart: Math.min(depth, 3) * 12 }}
        >
          <Link href={"/people/" + c.author_id}>
            <strong>
              {authors.find((a) => a.id === c.author_id)?.display_name ??
                t("Тұрғын", "Житель")}
            </strong>
          </Link>
          {c.parent_id && (
            <p className="beta-reply-context">
              {t("Жауап", "Ответ")}:{" "}
              {byId.has(c.parent_id) ? (
                <a href={"#comment-" + c.parent_id}>
                  {byId.get(c.parent_id)?.status === "published"
                    ? byId.get(c.parent_id)?.body.slice(0, 100)
                    : t("Жойылған пікір", "Удалённый комментарий")}
                </a>
              ) : (
                t(
                  "Алдыңғы беттегі немесе қолжетімсіз пікірге",
                  "На комментарий на другой странице или недоступный комментарий",
                )
              )}
            </p>
          )}
          <p style={{ whiteSpace: "pre-wrap" }}>
            {c.status === "deleted"
              ? t("Пікір жойылған", "Комментарий удалён")
              : c.body}
          </p>
          {c.status === "published" && joined && (
            <details>
              <summary>{t("Жауап беру", "Ответить")}</summary>
              <form action={saveComment}>
                <input type="hidden" name="post" value={postId} />
                <input type="hidden" name="parent" value={c.id} />
                <label>
                  {t("Жауабыңыз", "Ваш ответ")}
                  <textarea name="body" required maxLength={2000} />
                </label>
                <Submit>{t("Жауап жіберу", "Отправить ответ")}</Submit>
              </form>
            </details>
          )}
          {c.status === "published" && (
            <details>
              <summary>{t("Шағымдану", "Пожаловаться")}</summary>
              <form action={reportPost}>
                <input type="hidden" name="post" value={postId} />
                <input type="hidden" name="comment" value={c.id} />
                <label>
                  {t("Себебі", "Причина")}
                  <textarea
                    name="reason"
                    required
                    minLength={5}
                    maxLength={1000}
                  />
                </label>
                <Submit>{t("Шағым жіберу", "Отправить жалобу")}</Submit>
              </form>
            </details>
          )}
          {c.status === "published" && c.author_id === userId && (
            <>
              {joined && (
                <details>
                  <summary>{t("Өңдеу", "Редактировать")}</summary>
                  <form action={saveComment}>
                    <input type="hidden" name="post" value={postId} />
                    <input type="hidden" name="comment" value={c.id} />
                    <label>
                      {t("Мәтін", "Текст")}
                      <textarea
                        name="body"
                        required
                        maxLength={2000}
                        defaultValue={c.body}
                      />
                    </label>
                    <Submit>{t("Сақтау", "Сохранить")}</Submit>
                  </form>
                </details>
              )}
              <form action={deleteComment}>
                <input type="hidden" name="post" value={postId} />
                <input type="hidden" name="comment" value={c.id} />
                <Submit>{t("Пікірді жою", "Удалить комментарий")}</Submit>
              </form>
            </>
          )}
        </article>
      ))}
    </>
  );
}
