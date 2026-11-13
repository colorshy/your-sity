"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MapPin, Pencil, X, Check, Plus } from "lucide-react";
import { activeCity, districtName } from "@/lib/city-data";
import { activity, isHidden, localNotice, profileFor } from "@/lib/social-demo";
import { demoHref, translator, pluralRu, type DemoUI } from "./shared";
export function SocialProfile({
  id,
  tab,
  onTab,
  state,
  mutate,
  feedback,
}: { id: string; tab: string; onTab: (value: string) => void } & DemoUI) {
  const t = translator(state.lang);
  const profile = profileFor(state, id, state.lang);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  function closeDialog() {
    dialog.current?.close();
    setEditing(false);
  }
  useEffect(() => {
    if (editing) dialog.current?.showModal();
  }, [editing]);
  if (!profile)
    return (
      <div className="mvp-empty">
        <h2>{t("Профиль табылмады", "Профиль не найден")}</h2>
        <Link href={demoHref("feed")}>
          {t("Лентаға оралу", "Вернуться к ленте")}
        </Link>
      </div>
    );
  const own = profile.id === "me",
    followed = state.following.includes(profile.id);
  return (
    <>
      <section className="mvp-profile social-profile">
        <div className="mvp-profile-cover">
          <Image
            src="/demo/city.svg"
            alt=""
            width={800}
            height={400}
            unoptimized
          />
          <span>SHYMKENT · YOUR CITY</span>
        </div>
        <div className="mvp-profile-info">
          <span className="mvp-profile-avatar">{profile.avatar}</span>
          {own ? (
            <button
              className="mvp-secondary"
              onClick={() => {
                setError("");
                setEditing(true);
              }}
            >
              <Pencil size={15} />
              {t("Өңдеу", "Редактировать")}
            </button>
          ) : (
            <button
              className="mvp-secondary"
              aria-pressed={followed}
              disabled={isHidden(state, profile.id)}
              onClick={() => {
                mutate((s) => {
                  const next = {
                    ...s,
                    following: followed
                      ? s.following.filter((x) => x !== profile.id)
                      : [...s.following, profile.id],
                  };
                  return followed
                    ? next
                    : activity(
                        next,
                        localNotice(
                          "follow",
                          demoHref("profile", profile.id),
                          "@" + profile.username,
                        ),
                      );
                });
                feedback(
                  t(
                    "Жазылу тек осы браузерде өзгертілді",
                    "Подписка изменена только в этом браузере",
                  ),
                );
              }}
            >
              {followed ? <Check size={15} /> : <Plus size={15} />}{" "}
              {followed
                ? t("Жазылдыңыз · демо", "Вы подписаны · демо")
                : t("Жазылу · демо", "Подписаться · демо")}
            </button>
          )}
          <h2>{profile.name}</h2>
          <p className="social-handle">@{profile.username}</p>
          <p>
            {profile.bio ||
              t(
                "Қаланы танимын, жақсы адамдарды іздеймін 🌿",
                "Открываю город и ищу хороших людей 🌿",
              )}
          </p>
          <p>
            <MapPin size={14} />
            Шымкент
            {districtName(profile.neighborhood, state.lang) &&
              ` · ${districtName(profile.neighborhood, state.lang)}`}
          </p>
          <div className="social-follow-stats">
            <span>
              <b>{own ? 0 : Number(followed)}</b>{" "}
              {t(
                "оқырман",
                pluralRu(own ? 0 : Number(followed), [
                  "подписчик",
                  "подписчика",
                  "подписчиков",
                ]),
              )}
            </span>
            <span>
              <b>{own ? state.following.length : 0}</b>{" "}
              {t(
                "жазылым",
                pluralRu(own ? state.following.length : 0, [
                  "подписка",
                  "подписки",
                  "подписок",
                ]),
              )}
            </span>
          </div>
          <small className="mvp-muted">
            {t(
              "Тек осы браузердегі демобайланыстар",
              "Только демосвязи в этом браузере",
            )}
          </small>
          {own && (
            <details className="social-hidden-accounts">
              <summary>
                {t("Жасырылған аккаунттар", "Скрытые аккаунты")} (
                {new Set([...state.muted, ...state.blocked]).size})
              </summary>
              {state.muted.length + state.blocked.length === 0 ? (
                <p>{t("Жасырылған аккаунттар жоқ", "Скрытых аккаунтов нет")}</p>
              ) : (
                (["muted", "blocked"] as const).flatMap((field) =>
                  state[field].map((author) => (
                    <div key={field + author}>
                      <span>
                        @
                        {profileFor(state, author, state.lang)?.username ||
                          author}{" "}
                        ·{" "}
                        {field === "muted"
                          ? t("жасырылған", "заглушён")
                          : t("бұғатталған", "заблокирован")}
                      </span>
                      <button
                        onClick={() =>
                          mutate((s) => ({
                            ...s,
                            [field]: s[field].filter((x) => x !== author),
                          }))
                        }
                      >
                        {t("Болдырмау", "Отменить")}
                      </button>
                    </div>
                  )),
                )
              )}
            </details>
          )}
        </div>
        <div
          className="social-profile-tabs"
          aria-label={t("Профиль бөлімдері", "Разделы профиля")}
        >
          {[
            ["posts", t("Жазбалар", "Посты")],
            ["replies", t("Жауаптар", "Ответы")],
            ["media", t("Медиа", "Медиа")],
            ["likes", t("Ұнатқандар", "Нравится")],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={tab === value}
              onClick={() => onTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      {editing && (
        <dialog
          className="social-dialog"
          ref={dialog}
          onCancel={closeDialog}
          aria-labelledby="edit-profile-title"
        >
          <button
            className="mvp-icon social-dialog-close"
            aria-label={t("Жабу", "Закрыть")}
            onClick={closeDialog}
          >
            <X size={19} />
          </button>
          <h2 id="edit-profile-title">
            {t("Профильді өңдеу", "Редактировать профиль")}
          </h2>
          <p>
            {t(
              "Өзгерістер тек осы браузерде сақталады.",
              "Изменения сохраняются только в этом браузере.",
            )}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              const name = String(d.get("name") || "").trim();
              const username = String(d.get("username") || "").trim();
              if (name.length < 2 || !/^[a-z0-9_]{3,24}$/.test(username)) {
                setError(
                  t(
                    "Аты кемінде 2 таңбадан тұруы керек. Пайдаланушы аты: 3–24 латын әрпі, сан немесе төменгі сызық.",
                    "Имя должно содержать хотя бы 2 символа. Имя пользователя: 3–24 латинских буквы, цифры или знак подчёркивания.",
                  ),
                );
                return;
              }
              mutate((s) => ({
                ...s,
                profile: {
                  name,
                  username,
                  bio: String(d.get("bio") || "").trim(),
                  avatar: String(d.get("avatar")),
                  neighborhood: String(d.get("neighborhood")),
                },
              }));
              closeDialog();
              feedback(t("Демопрофиль сақталды", "Демопрофиль сохранён"));
            }}
          >
            {error && (
              <p className="social-form-error" role="alert">
                {error}
              </p>
            )}
            <label>
              {t("Атыңыз", "Имя")}
              <input
                name="name"
                defaultValue={profile.name}
                required
                minLength={2}
                maxLength={60}
              />
            </label>
            <label>
              {t("Пайдаланушы аты", "Имя пользователя")}
              <input
                name="username"
                defaultValue={profile.username}
                required
                minLength={3}
                maxLength={24}
                pattern="[a-z0-9_]{3,24}"
                title={t(
                  "3–24 латын әрпі, сан немесе төменгі сызық",
                  "3–24 строчных латинских буквы, цифры или знак подчёркивания",
                )}
              />
            </label>
            <label>
              {t("Өзіңіз туралы", "О себе")}
              <textarea name="bio" defaultValue={profile.bio} maxLength={280} />
            </label>
            <label>
              {t("Аватар", "Аватар")}
              <select name="avatar" defaultValue={profile.avatar}>
                {["🌿", "☀️", "🌻", "🌊", "🏔️", "☕"].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              {t("Аудан (міндетті емес)", "Район (необязательно)")}
              <select name="neighborhood" defaultValue={profile.neighborhood}>
                <option value="">{t("Көрсетпеу", "Не указывать")}</option>
                {activeCity.neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n[state.lang]}
                  </option>
                ))}
              </select>
            </label>
            <button className="mvp-primary" type="submit">
              {t("Сақтау · демо", "Сохранить · демо")}
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
