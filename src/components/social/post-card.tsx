"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Quote } from "lucide-react";
import { communities, type DemoPost } from "@/lib/demo";
import { districtName, formatCityTime } from "@/lib/city-data";
import {
  activity,
  authorId,
  isHidden,
  localNotice,
  sampleComment,
  username,
} from "@/lib/social-demo";
import { demoHref, translator, type DemoUI } from "./shared";
import { Conversation } from "./conversation";
import { TrustControls } from "./trust-controls";
export function SocialPost({
  post: p,
  full = false,
  allPosts,
  state,
  mutate,
  feedback,
}: DemoUI & { post: DemoPost; allPosts: DemoPost[]; full?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const t = translator(state.lang);
  const author = authorId(p);
  const c = communities.find((c) => c.id === p.community)!;
  const displayName = p.own
    ? state.profile.name
    : state.lang === "kk"
      ? p.authorKk
      : p.authorRu;
  const handle = p.own ? state.profile.username : username(author);
  const title = state.lang === "kk" ? p.titleKk : p.titleRu;
  const body = state.lang === "kk" ? p.bodyKk : p.bodyRu;
  const comments = [
    ...sampleComment(p, state.lang),
    ...state.comments.filter((c) => c.post === p.id),
  ].filter((c) => !c.deleted && !isHidden(state, c.authorId));
  const quote = allPosts.find((x) => x.id === p.quoteId);
  if (isHidden(state, author))
    return (
      <div className="mvp-empty">
        <p>
          {t(
            "Бұл аккаунт жасырылған. Профильде шешіміңізді өзгерте аласыз.",
            "Этот аккаунт скрыт. Отменить это можно в своём профиле.",
          )}
        </p>
        <Link href={demoHref("profile")}>
          {t("Профильді ашу", "Открыть профиль")}
        </Link>
      </div>
    );
  return (
    <article className="mvp-post post social-post">
      <header className="mvp-post-meta">
        <Link
          href={demoHref("profile", author)}
          className={`mvp-avatar ${c.color}`}
          aria-label={t("Профиль: ", "Профиль: ") + displayName}
        >
          {p.own ? state.profile.avatar : p.initials}
        </Link>
        <div>
          <Link href={demoHref("profile", author)}>
            <strong>{displayName}</strong>
          </Link>
          <p className="social-byline">
            <span>@{handle}</span>
            <span> · </span>
            {p.createdAt ? (
              <time dateTime={p.createdAt}>
                {formatCityTime(p.createdAt, state.lang)}
              </time>
            ) : (
              <span>{t("Жергілікті жазба", "Локальная запись")}</span>
            )}
          </p>
        </div>
        <span className="mvp-demo-tag">{t("ҮЛГІ", "ДЕМО")}</span>
        {!p.own && (
          <TrustControls
            state={state}
            mutate={mutate}
            feedback={feedback}
            target={`post:${p.id}`}
            author={author}
          />
        )}
      </header>
      <div className="social-post-tags">
        <Link href={demoHref("community", p.community)}>
          {c.icon} {c[state.lang]}
        </Link>
        {districtName(p.neighborhood, state.lang) && (
          <span>{districtName(p.neighborhood, state.lang)}</span>
        )}
      </div>
      <div className="mvp-post-content">
        <Link href={demoHref("post", p.id)}>
          <h2>{title}</h2>
        </Link>
        <p>
          {full || expanded || body.length <= 180
            ? body
            : body.slice(0, 180) + "…"}
        </p>
        {!full && body.length > 180 && (
          <button
            className="social-expand"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? t("Қысқарту", "Свернуть")
              : t("Толығырақ", "Показать ещё")}
          </button>
        )}
      </div>
      {p.quoteId && (
        <div className="social-quote">
          {quote && !isHidden(state, authorId(quote)) ? (
            <Link href={demoHref("post", quote.id)}>
              <small>
                {t("Дәйексөз · демо", "Цитата · демо")} · @
                {quote.own ? state.profile.username : username(authorId(quote))}
              </small>
              <strong>
                {state.lang === "kk" ? quote.titleKk : quote.titleRu}
              </strong>
              <p>
                {(state.lang === "kk" ? quote.bodyKk : quote.bodyRu).slice(
                  0,
                  160,
                )}
              </p>
            </Link>
          ) : (
            <p>
              {t(
                "Бастапқы жазба қолжетімсіз",
                "Исходная публикация недоступна",
              )}
            </p>
          )}
        </div>
      )}
      {p.image && (
        <Link className="mvp-post-image" href={demoHref("post", p.id)}>
          <Image
            src={p.image}
            alt={t(
              p.photo
                ? "Тау пейзажы — иллюстрациялық фото"
                : "Деможазбаға арналған иллюстрация",
              p.photo
                ? "Горный пейзаж — иллюстративное фото"
                : "Иллюстрация к демопубликации",
            )}
            width={800}
            height={400}
            loading={full || p.id === "walk" ? "eager" : "lazy"}
            unoptimized={p.image.endsWith(".svg")}
          />
        </Link>
      )}
      <footer className="mvp-post-actions">
        <button
          aria-label={t("Ұнату", "Нравится")}
          aria-pressed={state.likes.includes(p.id)}
          className={state.likes.includes(p.id) ? "liked" : ""}
          onClick={() => {
            mutate((s) => {
              const liked = s.likes.includes(p.id);
              const next = {
                ...s,
                likes: liked
                  ? s.likes.filter((x) => x !== p.id)
                  : [...s.likes, p.id],
              };
              return liked
                ? next
                : activity(
                    next,
                    localNotice("like", demoHref("post", p.id), title),
                  );
            });
            feedback(
              t(
                "Ұнату тек осы браузерде өзгертілді",
                "Реакция изменена только в этом браузере",
              ),
            );
          }}
        >
          <Heart
            size={19}
            fill={state.likes.includes(p.id) ? "currentColor" : "none"}
          />
          {Number(state.likes.includes(p.id))}
        </button>
        <Link
          aria-label={t("Пікірлер", "Комментарии")}
          href={demoHref("post", p.id)}
        >
          <MessageCircle size={19} />
          {comments.length}
        </Link>
        <Link
          aria-label={t("Дәйексөз келтіру", "Цитировать")}
          href={demoHref("create", p.id)}
        >
          <Quote size={18} />
        </Link>
        <button
          aria-label={t("Бөлісу", "Поделиться")}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${location.origin}${demoHref("post", p.id)}`,
              );
              feedback(
                p.own
                  ? t(
                      "Жергілікті жазба сілтемесі көшірілді. Жазба тек осы браузерде бар.",
                      "Ссылка на демопост скопирована. Локальный пост доступен только в этом браузере.",
                    )
                  : t(
                      "Деможазба сілтемесі көшірілді",
                      "Ссылка на демопост скопирована",
                    ),
              );
            } catch {
              feedback(
                t(
                  "Сілтемені жазба бетіндегі мекенжайдан көшіріңіз",
                  "Скопируйте ссылку из адресной строки страницы поста",
                ),
              );
            }
          }}
        >
          <Share2 size={18} />
        </button>
        <button
          className="mvp-save"
          aria-label={t("Сақтау", "Сохранить")}
          aria-pressed={state.saved.includes(p.id)}
          onClick={() => {
            mutate((s) => ({
              ...s,
              saved: s.saved.includes(p.id)
                ? s.saved.filter((x) => x !== p.id)
                : [...s.saved, p.id],
            }));
            feedback(
              t("Бетбелгі өзгертілді · демо", "Закладка изменена · демо"),
            );
          }}
        >
          <Bookmark
            size={19}
            fill={state.saved.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
      </footer>
      {full && (
        <Conversation
          post={p}
          state={state}
          mutate={mutate}
          feedback={feedback}
        />
      )}
    </article>
  );
}
