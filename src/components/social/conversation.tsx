"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Pencil, X, Reply, Send } from "lucide-react";
import type { DemoPost } from "@/lib/demo";
import {
  activity,
  localNotice,
  sampleComment,
  isHidden,
  type DemoComment,
} from "@/lib/social-demo";
import { demoHref, translator, type DemoUI } from "./shared";
import { TrustControls } from "./trust-controls";
export function Conversation({
  post,
  state,
  mutate,
  feedback,
}: DemoUI & { post: DemoPost }) {
  const t = translator(state.lang);
  const [replyTo, setReplyTo] = useState<DemoComment>();
  const [edit, setEdit] = useState<{ id: string; text: string }>();
  const input = useRef<HTMLTextAreaElement>(null);
  const comments = [
    ...sampleComment(post, state.lang),
    ...state.comments.filter((c) => c.post === post.id),
  ];
  function renderComment(c: DemoComment, depth = 0): React.ReactNode {
    const children = comments.filter((x) => x.parentId === c.id);
    const hidden = isHidden(state, c.authorId);
    const own = c.authorId === "me";
    return (
      <div
        key={c.id}
        className={`social-thread ${depth && depth <= 2 ? "social-thread-child" : ""}`}
      >
        <article className="mvp-comment" data-comment-id={c.id}>
          <span className="mvp-avatar green">
            {own ? state.profile.avatar : "М"}
          </span>
          <div>
            {!hidden && (
              <Link
                href={demoHref("profile", c.authorId)}
                className="social-comment-author"
              >
                {own ? state.profile.name : c.author}{" "}
                <span>@{own ? state.profile.username : c.authorId}</span>
              </Link>
            )}
            {hidden || c.deleted ? (
              <p>
                {hidden
                  ? t("Аккаунт жасырылған", "Аккаунт скрыт")
                  : t("Пікір жойылды", "Комментарий удалён")}
              </p>
            ) : edit?.id === c.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = edit.text.trim();
                  if (!text) {
                    feedback(
                      t("Пікір мәтінін жазыңыз.", "Введите текст комментария."),
                    );
                    return;
                  }
                  mutate((s) => ({
                    ...s,
                    comments: s.comments.map((x) =>
                      x.id === c.id && x.authorId === "me"
                        ? { ...x, text, edited: true }
                        : x,
                    ),
                  }));
                  setEdit(undefined);
                  feedback(
                    t("Демопікір жаңартылды", "Демокомментарий обновлён"),
                  );
                }}
              >
                <label>
                  {t("Пікірді өңдеу", "Редактировать комментарий")}
                  <textarea
                    required
                    maxLength={2000}
                    value={edit.text}
                    onChange={(e) => setEdit({ ...edit, text: e.target.value })}
                  />
                </label>
                <button className="mvp-secondary" type="submit">
                  {t("Өзгерістерді сақтау", "Сохранить изменения")}
                </button>
                <button
                  type="button"
                  className="mvp-icon"
                  aria-label={t(
                    "Өңдеуден бас тарту",
                    "Отменить редактирование",
                  )}
                  onClick={() => setEdit(undefined)}
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <>
                <p>{c.text}</p>
                {c.edited && <small>{t("өңделген", "изменён")}</small>}
              </>
            )}
            {!hidden && !c.deleted && (
              <div className="social-comment-actions">
                <button
                  onClick={() => {
                    setReplyTo(c);
                    input.current?.focus();
                  }}
                >
                  <Reply size={14} />
                  {t("Жауап беру", "Ответить")}
                </button>
                {own ? (
                  <>
                    <button
                      aria-label={t(
                        "Пікірді өңдеу",
                        "Редактировать комментарий",
                      )}
                      onClick={() => setEdit({ id: c.id, text: c.text })}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      aria-label={t("Пікірді жою", "Удалить комментарий")}
                      onClick={() => {
                        mutate((s) => ({
                          ...s,
                          comments: s.comments.flatMap((x) =>
                            x.id !== c.id || x.authorId !== "me"
                              ? [x]
                              : children.length
                                ? [{ ...x, text: "", deleted: true }]
                                : [],
                          ),
                        }));
                        if (replyTo?.id === c.id) setReplyTo(undefined);
                        feedback(
                          t("Демопікір жойылды", "Демокомментарий удалён"),
                        );
                      }}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <TrustControls
                    state={state}
                    mutate={mutate}
                    feedback={feedback}
                    target={`comment:${c.id}`}
                    author={c.authorId}
                  />
                )}
              </div>
            )}
          </div>
        </article>
        {children.map((x) => renderComment(x, depth + 1))}
      </div>
    );
  }
  return (
    <section className="mvp-comments">
      <h3>
        {t("Әңгімеге қосылыңыз", "Присоединяйтесь к разговору")}{" "}
        <span>
          {
            comments.filter((c) => !c.deleted && !isHidden(state, c.authorId))
              .length
          }
        </span>
      </h3>
      {comments
        .filter(
          (c) => !c.parentId || !comments.some((x) => x.id === c.parentId),
        )
        .map((c) => renderComment(c))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const text = String(new FormData(form).get("comment") || "").trim();
          if (!text) {
            feedback(t("Пікір мәтінін жазыңыз.", "Введите текст комментария."));
            return;
          }
          const comment: DemoComment = {
            id: crypto.randomUUID(),
            post: post.id,
            text,
            author: state.profile.name,
            authorId: "me",
            createdAt: new Date().toISOString(),
            ...(replyTo ? { parentId: replyTo.id } : {}),
          };
          mutate((s) =>
            activity(
              { ...s, comments: [...s.comments, comment] },
              localNotice(
                "reply",
                demoHref("post", post.id),
                state.lang === "kk" ? post.titleKk : post.titleRu,
              ),
            ),
          );
          form.reset();
          setReplyTo(undefined);
          feedback(
            t(
              "Демопікір осы браузерде сақталды",
              "Демокомментарий сохранён в этом браузере",
            ),
          );
        }}
      >
        {replyTo && (
          <div className="social-reply-context">
            {t("Жауап: ", "Ответ пользователю: ")}@
            {replyTo.authorId === "me"
              ? state.profile.username
              : replyTo.authorId}
            <button
              className="mvp-icon"
              type="button"
              aria-label={t("Жауаптан бас тарту", "Отменить ответ")}
              onClick={() => setReplyTo(undefined)}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <label htmlFor="comment">{t("Пікіріңіз", "Ваш комментарий")}</label>
        <textarea
          id="comment"
          ref={input}
          name="comment"
          required
          maxLength={2000}
          placeholder={t("Ойыңызбен бөлісіңіз…", "Поделитесь мыслями…")}
        />
        <button className="mvp-primary" type="submit">
          <Send size={16} />
          {t("Жіберу · демо", "Отправить · демо")}
        </button>
      </form>
    </section>
  );
}
