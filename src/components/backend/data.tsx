import Link from "next/link";
import Image from "next/image";
import { translator } from "@/lib/locale";
import { membership } from "@/app/actions";
import { Submit } from "./submit";
import { requireService } from "@/lib/auth";
import { postInteraction } from "@/app/actions";
import { MessageCircle, Repeat2, Heart, Bookmark } from "lucide-react";
import { SharePost } from "./share-post";
import { PostActionButton } from "./post-action-button";
export type Community = import("@/lib/appwrite/types").Community;
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
          <p className="membership-state">
            {joined.includes(c.id)
              ? t("Сіз мүшесіз", "Вы участник")
              : t("Әзірге қосылмадыңыз", "Вы ещё не участник")}
          </p>
          {c.category && (
            <span className="chip">
              {c.category === "city" ? t("Қала", "Город") : c.category}
            </span>
          )}
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
  reposted_by?: string;
  reposted_at?: string;
  status?: string;
};
function relativePostTime(date: Date, locale: string) {
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(elapsed / 86400000);
  if (days >= 2) return `${days} ${locale === "kk" ? "күн" : "дн."}`;
  if (days === 1) return locale === "kk" ? "кеше" : "вчера";
  const hours = Math.floor(elapsed / 3600000);
  if (hours) return `${hours} ${locale === "kk" ? "сағ" : "ч"}`;
  return `${Math.max(1, Math.floor(elapsed / 60000))} мин`;
}
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
  const { service } = await requireService();
  const [counts, communities, media] = await Promise.all([
    service.postInteractionsBatch(posts),
    service.communities(),
    service.mediaForPosts(posts),
  ]);
  const reposters = await service.authors(
    posts
      .filter((p) => p.reposted_by)
      .map((p) => ({ author_id: p.reposted_by! })),
  );
  const names = new Map(
    [...authors, ...reposters].map((a) => [a.id, a.display_name]),
  );
  const communityNames = new Map(
    communities.map((c) => [c.id, c[locale === "kk" ? "name_kk" : "name_ru"]]),
  );
  return (
    <>
      {posts
        .filter(
          (p) =>
            !p.reposted_by || counts[p.id]?.reposterIds.includes(p.reposted_by),
        )
        .map((p) => {
          const name = names.get(p.author_id) ?? t("Тұрғын", "Житель");
          const status = counts[p.id];
          const date = new Date(p.created_at);
          const relative = relativePostTime(date, locale);
          return (
            <article
              key={p.id + (p.reposted_by ?? "")}
              className="post app-post"
            >
              <div className="app-avatar" aria-hidden="true">
                {name.trim().slice(0, 1).toUpperCase()}
              </div>
              <div className="app-post-content">
                {p.reposted_by && (
                  <p className="app-repost-attribution">
                    <Repeat2 size={14} />
                    {names.get(p.reposted_by) ?? t("Тұрғын", "Житель")}{" "}
                    {t("қайта жариялады", "поделился публикацией")}
                  </p>
                )}
                <div className="app-post-meta">
                  <Link href={"/people/" + p.author_id}>
                    <strong>{name}</strong>
                  </Link>
                  <span>·</span>
                  <Link href={"/communities/" + p.community_id}>
                    {communityNames.get(p.community_id) ?? p.community_id}
                  </Link>
                  <span>·</span>
                  <time
                    dateTime={p.created_at}
                    title={date.toLocaleString(
                      locale === "kk" ? "kk-KZ" : "ru-RU",
                      { timeZone: "Asia/Almaty" },
                    )}
                  >
                    {relative}
                  </time>
                </div>
                <p className="post-body">{p.body}</p>
                {p.status !== "deleted" &&
                  p.status !== "hidden" &&
                  media.some((m) => m.post_id === p.id) && (
                    <div className="app-media-grid">
                      {media
                        .filter((m) => m.post_id === p.id)
                        .map((m, index) => (
                          <a
                            key={m.file_id}
                            href={"/api/media/" + m.file_id}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t(
                              `Сурет ${index + 1}`,
                              `Фото ${index + 1}`,
                            )}
                          >
                            <Image
                              unoptimized
                              src={"/api/media/" + m.file_id}
                              width={600}
                              height={500}
                              alt={t(
                                `Жазбадағы сурет ${index + 1}`,
                                `Изображение публикации ${index + 1}`,
                              )}
                            />
                          </a>
                        ))}
                    </div>
                  )}
                {(!p.status || p.status === "published") && <div className="app-post-actions">
                  <Link
                    href={"/posts/" + p.id}
                    aria-label={t("Пікірлер", "Комментарии")}
                  >
                    <MessageCircle size={18} />
                    <span>{status?.comments ?? 0}</span>
                  </Link>
                  <form action={postInteraction}>
                    <input type="hidden" name="post" value={p.id} />
                    <input type="hidden" name="kind" value="repost" />
                    <input
                      type="hidden"
                      name="enabled"
                      value={String(!status?.reposted)}
                    />
                    <PostActionButton
                      label={
                        status?.reposted
                          ? t("Қайта жариялауды қайтару", "Отменить репост")
                          : t("Қайта жариялау", "Репост")
                      }
                      active={Boolean(status?.reposted)}
                    >
                      <Repeat2 size={18} />
                      <span>{status?.reposts ?? 0}</span>
                    </PostActionButton>
                  </form>
                  <form action={postInteraction}>
                    <input type="hidden" name="post" value={p.id} />
                    <input type="hidden" name="kind" value="like" />
                    <input
                      type="hidden"
                      name="enabled"
                      value={String(!status?.liked)}
                    />
                    <PostActionButton
                      label={
                        status?.liked
                          ? t("Ұнатуды қайтару", "Убрать нравится")
                          : t("Ұнайды", "Нравится")
                      }
                      active={Boolean(status?.liked)}
                    >
                      <Heart
                        size={18}
                        fill={status?.liked ? "currentColor" : "none"}
                      />
                      <span>{status?.likes ?? 0}</span>
                    </PostActionButton>
                  </form>
                  <form action={postInteraction}>
                    <input type="hidden" name="post" value={p.id} />
                    <input type="hidden" name="kind" value="bookmark" />
                    <input
                      type="hidden"
                      name="enabled"
                      value={String(!status?.bookmarked)}
                    />
                    <PostActionButton
                      label={
                        status?.bookmarked
                          ? t("Сақталғаннан жою", "Убрать из закладок")
                          : t("Сақтау", "В закладки")
                      }
                      active={Boolean(status?.bookmarked)}
                    >
                      <Bookmark
                        size={18}
                        fill={status?.bookmarked ? "currentColor" : "none"}
                      />
                    </PostActionButton>
                  </form>
                  <SharePost id={p.id} locale={locale} />
                </div>}
              </div>
            </article>
          );
        })}
    </>
  );
}
