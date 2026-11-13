import { notFound } from "next/navigation";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { AccessError } from "@/lib/appwrite/policy";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { PostList } from "@/components/backend/data";
import { Submit } from "@/components/backend/submit";
import { Pagination, pageNumber } from "@/components/backend/pagination";
import {
  savePost,
  deletePost,
  saveComment,
  deleteComment,
  reportPost,
} from "@/app/actions";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string; page?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service, user } = await requireResident();
  const { id } = await params;
  let post;
  try {
    post = await service.post(id);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const query = await searchParams,
    page = pageNumber(query.page);
  const { t } = await translator();
  const comments =
    post.status === "published" ? await service.comments(id, page) : [];
  const authors = await service.authors([post, ...comments]);
  const joined = (await service.memberships()).some(
    (m) => m.community_id === post.community_id,
  );
  return (
    <Shell>
      <h1>{t("Талқылау", "Обсуждение")}</h1>
      <Notice {...query} />
      <PostList posts={[post]} authors={authors} />
      {post.status !== "published" && (
        <p role="status">
          {t(
            "Жазба жасырылған немесе жойылған",
            "Публикация скрыта или удалена",
          )}
        </p>
      )}
      {post.author_id === user.id && (
        <section className="form-panel">
          {post.status === "published" && joined && (
            <details>
              <summary>
                {t("Жазбаны өңдеу", "Редактировать публикацию")}
              </summary>
              <form action={savePost}>
                <input type="hidden" name="post" value={post.id} />
                <label>
                  {t("Мәтін", "Текст")}
                  <textarea
                    name="body"
                    defaultValue={post.body}
                    maxLength={5000}
                    required
                  />
                </label>
                <Submit>{t("Сақтау", "Сохранить")}</Submit>
              </form>
            </details>
          )}
          <form action={deletePost}>
            <input type="hidden" name="post" value={post.id} />
            <Submit>{t("Жазбаны жою", "Удалить публикацию")}</Submit>
          </form>
        </section>
      )}
      <h2>{t("Пікірлер", "Комментарии")}</h2>
      {comments.length ? (
        comments.slice(0, 20).map((c) => (
          <article className="post" key={c.id}>
            <strong>
              {authors.find((a) => a.id === c.author_id)?.display_name ??
                t("Тұрғын", "Житель")}
            </strong>
            <p style={{ whiteSpace: "pre-wrap" }}>{c.body}</p>
            {c.author_id === user.id && (
              <>
                <details>
                  <summary>{t("Өңдеу", "Редактировать")}</summary>
                  <form action={saveComment}>
                    <input type="hidden" name="post" value={post.id} />
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
                <form action={deleteComment}>
                  <input type="hidden" name="post" value={post.id} />
                  <input type="hidden" name="comment" value={c.id} />
                  <Submit>{t("Пікірді жою", "Удалить комментарий")}</Submit>
                </form>
              </>
            )}
          </article>
        ))
      ) : (
        <p className="empty">
          {t("Әзірге пікірлер жоқ", "Пока нет комментариев")}
        </p>
      )}
      <Pagination
        page={page}
        more={comments.length > 20}
        path={"/posts/" + id + "?page="}
      />
      {post.status === "published" && joined && (
        <form action={saveComment} className="form-panel">
          <input type="hidden" name="post" value={post.id} />
          <label>
            {t("Пікіріңіз", "Ваш комментарий")}
            <textarea name="body" required maxLength={2000} />
          </label>
          <Submit>{t("Жіберу", "Отправить")}</Submit>
        </form>
      )}
      {post.status === "published" && (
        <details className="form-panel">
          <summary>{t("Шағымдану", "Пожаловаться")}</summary>
          <form action={reportPost}>
            <input type="hidden" name="post" value={post.id} />
            <label>
              {t("Себебі", "Причина")}
              <textarea name="reason" required minLength={5} maxLength={1000} />
            </label>
            <Submit>{t("Шағым жіберу", "Отправить жалобу")}</Submit>
          </form>
        </details>
      )}
    </Shell>
  );
}
