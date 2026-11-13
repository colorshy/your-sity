"use client";
import Link from "next/link";
import { useState } from "react";
import { Bell, Heart, MessageCircle, Users, UserPlus } from "lucide-react";
import { formatCityTime } from "@/lib/city-data";
import { localNotice } from "@/lib/social-demo";
import { demoHref, translator, type DemoUI } from "./shared";
export function Notifications({ state, mutate, feedback }: DemoUI) {
  const t = translator(state.lang);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const shown = state.notifications.filter((n) => !unreadOnly || !n.read);
  const verbs = {
    reply: t("Сіз демопікір жаздыңыз", "Вы добавили демокомментарий"),
    like: t("Сіз жазбаны ұнаттыңыз", "Вы отметили демопост"),
    follow: t("Сіз демопрофильге жазылдыңыз", "Вы подписались на демопрофиль"),
    community: t(
      "Демоқауымдастықтағы мүшелігіңіз өзгерді",
      "Ваше участие в демосообществе изменено",
    ),
  };
  const sampleVerbs = {
    reply: t("Жауап туралы демомысал", "Пример уведомления об ответе"),
    like: t("Ұнату туралы демомысал", "Пример уведомления о лайке"),
    follow: t("Жазылу туралы демомысал", "Пример уведомления о подписчике"),
    community: t(
      "Қауымдастық туралы демомысал",
      "Пример уведомления сообщества",
    ),
  };
  const icons = {
    reply: MessageCircle,
    like: Heart,
    follow: UserPlus,
    community: Users,
  };
  return (
    <section className="social-notifications">
      <div className="mvp-page-heading">
        <div>
          <span className="mvp-eyebrow">YOUR CITY · DEMO</span>
          <h1>{t("Хабарламалар", "Уведомления")}</h1>
          <p>
            {t(
              "Жергілікті әрекеттер мен анық белгіленген мысалдар. Нақты адамдардан келмейді.",
              "Локальные действия и явно отмеченные примеры. Они не приходят от реальных людей.",
            )}
          </p>
        </div>
      </div>
      <div className="social-notice-tools">
        <button
          className="mvp-secondary"
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly(!unreadOnly)}
        >
          {t("Тек оқылмағандар", "Только непрочитанные")}
        </button>
        <button
          className="mvp-secondary"
          disabled={!state.notifications.some((n) => !n.read)}
          onClick={() =>
            mutate((s) => ({
              ...s,
              notifications: s.notifications.map((n) => ({ ...n, read: true })),
            }))
          }
        >
          {t("Барлығын оқу", "Прочитать все")}
        </button>
        <button
          className="mvp-secondary"
          disabled={!state.notifications.length}
          onClick={() => mutate((s) => ({ ...s, notifications: [] }))}
        >
          {t("Тазарту", "Очистить")}
        </button>
      </div>
      {shown.length ? (
        shown.map((n) => {
          const Icon = icons[n.kind];
          return (
            <article
              key={n.id}
              className={`social-notice ${n.read ? "" : "unread"}`}
            >
              <Icon size={20} />
              <Link
                href={
                  n.target.startsWith("/demo?") ? n.target : demoHref("feed")
                }
                onClick={() =>
                  mutate((s) => ({
                    ...s,
                    notifications: s.notifications.map((x) =>
                      x.id === n.id ? { ...x, read: true } : x,
                    ),
                  }))
                }
              >
                <strong>
                  {n.sample ? sampleVerbs[n.kind] : verbs[n.kind]}
                </strong>
                <p>{n.subject}</p>
                <small>
                  {n.sample
                    ? t("ҮЛГІ ОҚИҒА", "ПРИМЕР СОБЫТИЯ")
                    : t("ОСЫ БРАУЗЕРДЕ", "В ЭТОМ БРАУЗЕРЕ")}{" "}
                  · {formatCityTime(n.createdAt, state.lang, true)}
                </small>
              </Link>
              <button
                className="mvp-icon"
                aria-label={
                  n.read
                    ? t("Оқылмаған деп белгілеу", "Отметить непрочитанным")
                    : t("Оқылған деп белгілеу", "Отметить прочитанным")
                }
                onClick={() =>
                  mutate((s) => ({
                    ...s,
                    notifications: s.notifications.map((x) =>
                      x.id === n.id ? { ...x, read: !x.read } : x,
                    ),
                  }))
                }
              >
                <span className={`social-read-dot ${n.read ? "read" : ""}`} />
              </button>
            </article>
          );
        })
      ) : (
        <div className="mvp-empty">
          <Bell size={30} />
          <h2>{t("Әзірге тыныш", "Пока здесь тихо")}</h2>
          <p>
            {t(
              "Жазбаны ұнатыңыз, пікір жазыңыз немесе қауымдастыққа қосылыңыз.",
              "Поставьте лайк, напишите комментарий или вступите в сообщество.",
            )}
          </p>
          <Link className="mvp-primary" href={demoHref("feed")}>
            {t("Лентаны ашу", "Открыть ленту")}
          </Link>
        </div>
      )}
      <div className="social-sample-notices">
        <p>
          {t(
            "Мүмкіндікті көру үшін белгіленген үлгі оқиғаларды қосуға болады.",
            "Чтобы посмотреть интерфейс, можно добавить явно обозначенные примеры событий.",
          )}
        </p>
        <button
          className="mvp-secondary"
          disabled={state.notifications.some((n) => n.sample)}
          onClick={() => {
            mutate((s) => ({
              ...s,
              notifications: [
                ...(["reply", "like", "follow", "community"] as const).map(
                  (kind) =>
                    localNotice(
                      kind,
                      kind === "follow"
                        ? demoHref("profile", "dana")
                        : kind === "community"
                          ? demoHref("community", "events")
                          : demoHref("post", "walk"),
                      "Your City · DEMO",
                      true,
                    ),
                ),
                ...s.notifications,
              ].slice(0, 100),
            }));
            feedback(
              t("Төрт үлгі оқиға қосылды", "Добавлены четыре примера событий"),
            );
          }}
        >
          {t("Үлгі оқиғаларды қосу", "Добавить примеры событий")}
        </button>
      </div>
    </section>
  );
}
