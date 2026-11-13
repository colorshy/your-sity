import Link from "next/link";
import { translator } from "@/lib/locale";
import { membership } from "@/app/actions";
import { Submit } from "./submit";
export type Community = {
  id: string;
  slug: string;
  name_kk: string;
  name_ru: string;
  description_kk: string;
  description_ru: string;
};
export async function CommunityCards({
  communities,
  joined,
}: {
  communities: Community[];
  joined: string[];
}) {
  const { locale, t } = await translator();
  return (
    <div className="community-grid">
      {communities.map((c) => (
        <article key={c.id} className="community-card">
          <Link href={"/communities/" + c.id}>
            <h2>{c[locale === "kk" ? "name_kk" : "name_ru"]}</h2>
          </Link>
          <p>{c[locale === "kk" ? "description_kk" : "description_ru"]}</p>
          <form action={membership}>
            <input type="hidden" name="community" value={c.id} />
            <input
              type="hidden"
              name="operation"
              value={joined.includes(c.id) ? "leave" : "join"}
            />
            <Submit>
              {joined.includes(c.id)
                ? t("Шығу", "Выйти")
                : t("Қосылу", "Вступить")}
            </Submit>
          </form>
        </article>
      ))}
    </div>
  );
}
export type Post = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  community_id: string;
};
export async function PostList({
  posts,
  authors,
}: {
  posts: Post[];
  authors: { id: string; display_name: string }[];
}) {
  const { locale, t } = await translator();
  if (!posts.length)
    return (
      <p className="empty">
        {t("Әзірге жазбалар жоқ.", "Пока нет публикаций.")}
      </p>
    );
  return (
    <>
      {posts.map((p) => (
        <article key={p.id} className="post">
          <strong>
            {authors.find((a) => a.id === p.author_id)?.display_name ??
              t("Тұрғын", "Житель")}
          </strong>
          <p className="post-body" style={{ whiteSpace: "pre-wrap" }}>
            {p.body}
          </p>
          <time dateTime={p.created_at}>
            {new Date(p.created_at).toLocaleString(
              locale === "kk" ? "kk-KZ" : "ru-RU",
              { timeZone: "Asia/Almaty" },
            )}
          </time>
          <Link className="all-link" href={"/communities/" + p.community_id}>
            {t("Қауымдастық", "Сообщество")}
          </Link>
        </article>
      ))}
    </>
  );
}
