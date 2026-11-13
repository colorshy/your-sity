"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Compass,
  Home,
  Plus,
  MessageCircle,
  Search,
  User,
  Leaf,
  Heart,
  Bookmark,
  Share2,
  Sun,
  Moon,
  ChevronRight,
  Check,
  ArrowLeft,
  Send,
  X,
  Pencil,
  Sparkles,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";
import { communities, posts, type DemoPost } from "@/lib/demo";
import { useDemoState } from "@/lib/demo-store";
const subscribeHydration = () => () => {};
const href = (page: string, id?: string) =>
  `/demo?page=${page}${id ? `&id=${encodeURIComponent(id)}` : ""}`;
export function CityApp({
  page = "feed",
  id = "",
}: {
  page?: string;
  id?: string;
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const [state, update] = useDemoState();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("explore");
  const [category, setCategory] = useState("all");
  const [toast, setToast] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sort, setSort] = useState("recent");
  const t = (kk: string, ru: string) => (state.lang === "kk" ? kk : ru);
  const name = (c: (typeof communities)[number]) => c[state.lang];
  const allPosts = [...state.posts, ...posts];
  const current = communities.find((c) => c.id === id);
  const detail = allPosts.find((p) => p.id === id);
  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const notification =
    toast ||
    (storageWarning
      ? t(
          "Браузер сақтауын бұғаттады. Өзгерістер осы сеанста ғана сақталады.",
          "Браузер заблокировал хранение. Изменения доступны только в этом сеансе.",
        )
      : "");
  function mutate(change: Parameters<typeof update>[0]) {
    if (!update(change)) setStorageWarning(true);
  }
  function toggle(field: "joined" | "likes" | "saved", value: string) {
    mutate((s) => ({
      ...s,
      [field]: s[field].includes(value)
        ? s[field].filter((x) => x !== value)
        : [...s[field], value],
    }));
  }
  function joinButton(c: (typeof communities)[number]) {
    const joined = state.joined.includes(c.id);
    return (
      <button
        className={joined ? "mvp-join joined" : "mvp-join"}
        aria-pressed={joined}
        onClick={() => toggle("joined", c.id)}
      >
        {joined ? <Check size={16} /> : <Plus size={16} />}{" "}
        {joined
          ? t("Қосылдым · шығу", "Вы участник · выйти")
          : t("Қосылу · демо", "Вступить · демо")}
      </button>
    );
  }
  const shown = allPosts
    .filter(
      (p) =>
        (page !== "community" || p.community === id) &&
        (page !== "profile" || p.own) &&
        (page !== "saved" || state.saved.includes(p.id)) &&
        (mode !== "mine" || state.joined.includes(p.community)) &&
        (category === "all" || p.community === category) &&
        `${p.titleRu} ${p.titleKk} ${p.bodyRu} ${p.bodyKk}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
    )
    .sort((a, b) =>
      sort === "popular"
        ? b.likes +
          Number(state.likes.includes(b.id)) -
          (a.likes + Number(state.likes.includes(a.id)))
        : 0,
    );
  function postCard(p: DemoPost, full = false) {
    const c = communities.find((c) => c.id === p.community)!;
    const commentCount =
      state.comments.filter((c) => c.post === p.id).length + (p.own ? 0 : 1);
    const title = state.lang === "kk" ? p.titleKk : p.titleRu;
    return (
      <article className="mvp-post post" key={p.id}>
        <header className="mvp-post-meta">
          <span className={`mvp-avatar ${c.color}`}>
            {p.own ? state.profile.avatar : p.initials}
          </span>
          <div>
            <strong>
              {p.own
                ? state.profile.name
                : state.lang === "kk"
                  ? p.authorKk
                  : p.authorRu}
            </strong>
            <p>
              <Link href={href("community", p.community)}>
                {c.icon} {name(c)}
              </Link>
              <span> · {p.time}</span>
            </p>
          </div>
          <span className="mvp-demo-tag">{t("ҮЛГІ", "ДЕМО")}</span>
        </header>
        <Link href={href("post", p.id)} className="mvp-post-content">
          <h2>{title}</h2>
          <p>{state.lang === "kk" ? p.bodyKk : p.bodyRu}</p>
        </Link>
        {p.image && (
          <Link href={href("post", p.id)} className="mvp-post-image">
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
              loading={full ? "eager" : "lazy"}
              unoptimized={p.image.endsWith(".svg")}
            />
          </Link>
        )}
        <footer className="mvp-post-actions">
          <button
            aria-label={t("Ұнату", "Нравится")}
            aria-pressed={state.likes.includes(p.id)}
            className={state.likes.includes(p.id) ? "liked" : ""}
            onClick={() => toggle("likes", p.id)}
          >
            <Heart
              size={19}
              fill={state.likes.includes(p.id) ? "currentColor" : "none"}
            />
            {p.likes + Number(state.likes.includes(p.id))}
          </button>
          <Link
            aria-label={t("Пікірлер", "Комментарии")}
            href={href("post", p.id)}
          >
            <MessageCircle size={19} />
            {commentCount}
          </Link>
          <button
            aria-label={t("Бөлісу", "Поделиться")}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${location.origin}${href("post", p.id)}`,
                );
                setToast(
                  t(
                    "Деможазба сілтемесі көшірілді",
                    "Ссылка на демопост скопирована",
                  ),
                );
              } catch {
                setToast(
                  t(
                    "Сілтемені жазба бетіндегі мекенжайдан көшіріңіз",
                    "Скопируйте ссылку из адресной строки страницы поста",
                  ),
                );
              }
            }}
          >
            <Share2 size={18} />
            <span>{t("Бөлісу", "Поделиться")}</span>
          </button>
          <button
            className="mvp-save"
            aria-label={t("Сақтау", "Сохранить")}
            aria-pressed={state.saved.includes(p.id)}
            onClick={() => toggle("saved", p.id)}
          >
            <Bookmark
              size={19}
              fill={state.saved.includes(p.id) ? "currentColor" : "none"}
            />
          </button>
        </footer>
        {full && (
          <section className="mvp-comments">
            <h3>
              {t("Әңгімеге қосылыңыз", "Присоединяйтесь к разговору")}{" "}
              <span>{commentCount}</span>
            </h3>
            {!p.own && (
              <div className="mvp-comment">
                <span className="mvp-avatar purple">М</span>
                <div>
                  <strong>
                    {t("Мәдина · демопрофиль", "Мадина · демопрофиль")}
                  </strong>
                  <p>
                    {t(
                      "Керемет идея! Қаламызды бірге таниық 🌿",
                      "Отличная идея! Давайте открывать наш город вместе 🌿",
                    )}
                  </p>
                </div>
              </div>
            )}
            {state.comments
              .filter((c) => c.post === p.id)
              .map((c) => (
                <div className="mvp-comment" key={c.id}>
                  <span className="mvp-avatar green">
                    {state.profile.avatar}
                  </span>
                  <div>
                    <strong>
                      {c.author} · {t("демо", "демо")}
                    </strong>
                    <p>{c.text}</p>
                  </div>
                  <button
                    className="mvp-icon"
                    aria-label={t("Пікірді жою", "Удалить комментарий")}
                    onClick={() =>
                      mutate((s) => ({
                        ...s,
                        comments: s.comments.filter((x) => x.id !== c.id),
                      }))
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const text = String(
                  new FormData(form).get("comment") || "",
                ).trim();
                if (!text) return;
                mutate((s) => ({
                  ...s,
                  comments: [
                    ...s.comments,
                    {
                      id: crypto.randomUUID(),
                      post: p.id,
                      text,
                      author: s.profile.name,
                    },
                  ],
                }));
                form.reset();
                setToast(
                  t(
                    "Демопікір осы браузерде сақталды",
                    "Демокомментарий сохранён в этом браузере",
                  ),
                );
              }}
            >
              <label htmlFor="comment">
                {t("Пікіріңіз", "Ваш комментарий")}
              </label>
              <textarea
                id="comment"
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
        )}
      </article>
    );
  }
  const navItems = [
    { page: "feed", icon: Home, label: t("Лента", "Лента") },
    {
      page: "communities",
      icon: Compass,
      label: t("Қауымдастықтар", "Сообщества"),
    },
    { page: "saved", icon: Bookmark, label: t("Сақталғандар", "Сохранённое") },
    { page: "profile", icon: User, label: t("Менің профилім", "Мой профиль") },
  ];
  return (
    <div
      className="mvp shell"
      data-theme={state.theme}
      aria-busy={!hydrated}
      inert={!hydrated}
    >
      <aside className="mvp-sidebar">
        <Link href="/" className="mvp-brand">
          <span>
            <Leaf size={24} />
          </span>
          your city<b>.</b>
        </Link>
        <div className="mvp-city">
          <span className="mvp-pin">
            <MapPin size={19} />
          </span>
          <div>
            <small>{t("Сіздің қалаңыз", "Ваш город")}</small>
            <strong>
              Шымкент <span>🇰🇿</span>
            </strong>
          </div>
          <span className="mvp-online" />
        </div>
        <p className="mvp-caption">{t("ҚАЛАНЫ ТАНЫҢЫЗ", "ОТКРОЙТЕ ГОРОД")}</p>
        <nav aria-label={t("Негізгі мәзір", "Основная навигация")}>
          {navItems.map((n) => (
            <Link
              key={n.page}
              href={href(n.page)}
              className={`mvp-nav ${page === n.page ? "active" : ""}`}
              aria-current={page === n.page ? "page" : undefined}
            >
              <n.icon size={21} />
              {n.label}
              {n.page === "saved" && state.saved.length > 0 && (
                <small>{state.saved.length}</small>
              )}
            </Link>
          ))}
        </nav>
        <div className="mvp-sidebar-communities">
          <p className="mvp-caption">{t("СІЗГЕ ЖАҚЫН", "БЛИЗКО ПО ДУХУ")}</p>
          {communities.slice(0, 5).map((c) => (
            <Link
              className="mvp-mini"
              key={c.id}
              href={href("community", c.id)}
            >
              <span className={c.color}>{c.icon}</span>
              {name(c)}
            </Link>
          ))}
        </div>
        <div className="mvp-side-bottom">
          <Sparkles size={25} />
          <h3>{t("Қала — бұл адамдар.", "Город — это люди.")}</h3>
          <p>{t("Жақыныңыздан бастаңыз.", "Начните с тех, кто рядом.")}</p>
          <Link href={href("about")}>
            {t("Жоба туралы", "О проекте")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </aside>
      <div className="mvp-workspace">
        <header className="mvp-topbar">
          <Link href="/" className="mvp-mobile-brand">
            <Leaf size={23} />
            your city.
          </Link>
          <span className="mvp-breadcrumb">
            <MapPin size={15} /> Шымкент <ChevronRight size={13} />
            {t("Қалаңыздың үні", "Голос вашего города")}
          </span>
          <div className="mvp-top-actions">
            <div className="mvp-language">
              {(["kk", "ru"] as const).map((l) => (
                <button
                  key={l}
                  aria-pressed={state.lang === l}
                  onClick={() => {
                    mutate((s) => ({ ...s, lang: l }));
                    document.cookie = `city-locale=${l}; path=/; SameSite=Lax`;
                  }}
                >
                  {l === "kk" ? "ҚАЗ" : "РУС"}
                </button>
              ))}
            </div>
            <button
              className="mvp-icon"
              aria-label={t("Тақырыпты ауыстыру", "Переключить тему")}
              aria-pressed={state.theme === "dark"}
              onClick={() =>
                mutate((s) => ({
                  ...s,
                  theme: s.theme === "light" ? "dark" : "light",
                }))
              }
            >
              {state.theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <Link className="mvp-account" href="/sign-in">
              {t("Кіру", "Войти")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </header>
        <main className="mvp-main">
          <div className="mvp-demo-notice">
            <span className="mvp-demo-badge">DEMO</span>
            <span>
              {t(
                "Шымкенттің демокеңістігі. Жазбалар — ойдан шығарылған үлгілер. Өзгерістер тек осы браузерде.",
                "Демопространство Шымкента. Публикации — вымышленные примеры. Изменения — только в этом браузере.",
              )}
            </span>
          </div>
          {page === "feed" && (
            <section className="mvp-hero">
              <div className="mvp-hero-copy">
                <span className="mvp-eyebrow">
                  <span />
                  YOUR CITY · ШЫМКЕНТ
                </span>
                <h1>
                  {t("Өз қалаң.\nӨз адамдарың.", "Твой город.\nТвои люди.")}
                </h1>
                <p>
                  {t(
                    "Көршілермен танысыңыз, жаңалықтармен бөлісіңіз және күнделікті өмірден жаңалық ашыңыз.",
                    "Знакомьтесь с соседями, делитесь находками и открывайте новое в привычном.",
                  )}
                </p>
                <Link href={href("communities")}>
                  {t("Өз ортаңызды табыңыз", "Найдите свой круг")}
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className="mvp-hero-art">
                <Image
                  src="/demo/city.svg"
                  alt={t(
                    "Жасыл қаланың иллюстрациясы",
                    "Иллюстрация зелёного города",
                  )}
                  width={800}
                  height={400}
                  unoptimized
                  priority
                />
                <span>42°19′ N · 69°35′ E</span>
                <div className="mvp-hero-stamp">
                  {t("БІЗДІҢ ҚАЛА", "НАШ ГОРОД")}
                  <b>SHYMKENT</b>
                </div>
              </div>
            </section>
          )}
          {page === "about" ? (
            <section className="mvp-about">
              <span className="mvp-eyebrow">YOUR CITY</span>
              <h1>
                {t("Бір қала. Мың байланыс.", "Один город. Тысячи связей.")}
              </h1>
              <p>
                {t(
                  "Шымкенттегі адамдарды жақындастыратын кеңістік. Қызығушылықтар, көршілер және қалалық оқиғалар бір жерде.",
                  "Пространство, которое сближает жителей Шымкента. Интересы, соседи и городские истории — в одном месте.",
                )}
              </p>
              <p>
                {t(
                  "Бұл ашық демо. Барлық профильдер, жазбалар, сандар мен пікірлер — үлгілер. Әрекеттер тек браузерде сақталады, басқа адамдарға жіберілмейді.",
                  "Это открытая демоверсия. Все профили, публикации, счётчики и комментарии — примеры. Действия сохраняются в браузере и не отправляются другим людям.",
                )}
              </p>
              <Link className="mvp-primary" href={href("feed")}>
                {t("Қаланы тану", "Открыть город")}
                <ArrowRight size={18} />
              </Link>
              <Link className="mvp-text-link" href="/sign-up">
                {t("Нақты аккаунт жасау", "Создать реальный аккаунт")}
              </Link>
            </section>
          ) : page === "create" ? (
            <section className="mvp-editor">
              <Link className="mvp-back" href={href("feed")}>
                <ArrowLeft size={17} />
                {t("Лентаға", "К ленте")}
              </Link>
              <span className="mvp-eyebrow">
                {t("АЙТАР ӘҢГІМЕҢІЗ БАР МА?", "ЕСТЬ ЧЕМ ПОДЕЛИТЬСЯ?")}
              </span>
              <h1>{t("Қалаға айтыңыз", "Расскажите городу")}</h1>
              <p className="mvp-muted">
                {t(
                  "Деможазба тек осы браузерде көрінеді.",
                  "Демопубликация будет видна только в этом браузере.",
                )}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const title = String(data.get("title") || "").trim();
                  const body = String(data.get("body") || "").trim();
                  if (!title || !body) return;
                  const post: DemoPost = {
                    id: crypto.randomUUID(),
                    community: String(data.get("community")),
                    authorRu: state.profile.name,
                    authorKk: state.profile.name,
                    initials: "Д",
                    titleRu: title,
                    titleKk: title,
                    bodyRu: body,
                    bodyKk: body,
                    time: t("Қазір", "Сейчас"),
                    likes: 0,
                    own: true,
                    ...(data.get("image")
                      ? { image: String(data.get("image")) }
                      : {}),
                  };
                  mutate((s) => ({ ...s, posts: [post, ...s.posts] }));
                  router.push(href("post", post.id));
                }}
              >
                <label>
                  {t("Қауымдастық", "Сообщество")}
                  <select
                    name="community"
                    defaultValue={current?.id || "events"}
                  >
                    {communities.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.icon} {name(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("Тақырып", "Заголовок")}
                  <input
                    name="title"
                    required
                    maxLength={120}
                    placeholder={t(
                      "Бәрі жақсы әңгімеден басталады…",
                      "Всё начинается с хорошей истории…",
                    )}
                  />
                </label>
                <label>
                  {t("Мәтін", "Текст")}
                  <textarea
                    name="body"
                    required
                    minLength={3}
                    maxLength={5000}
                    placeholder={t(
                      "Идеяңыз, сұрағыңыз немесе қаладағы жаңалығыңыз…",
                      "Ваша идея, вопрос или городская находка…",
                    )}
                  />
                </label>
                <label>
                  {t("Мұқаба", "Обложка")}
                  <select name="image">
                    <option value="">{t("Мұқабасыз", "Без обложки")}</option>
                    <option value="/demo/city.svg">
                      {t("Қала · иллюстрация", "Город · иллюстрация")}
                    </option>
                    <option value="/demo/mountains.jpg">
                      {t(
                        "Таулар · иллюстрациялық фото",
                        "Горы · иллюстративное фото",
                      )}
                    </option>
                    <option value="/demo/books.svg">
                      {t("Кітаптар · иллюстрация", "Книги · иллюстрация")}
                    </option>
                  </select>
                </label>
                <div className="mvp-form-footer">
                  <span>
                    <Leaf size={16} />
                    {t("Ізгілікпен бөлісіңіз", "Делитесь с добротой")}
                  </span>
                  <button type="submit" className="mvp-primary">
                    {t("Жариялау · демо", "Опубликовать · демо")}
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </form>
            </section>
          ) : page === "post" ? (
            <div className="mvp-detail">
              <Link className="mvp-back" href={href("feed")}>
                <ArrowLeft size={17} />
                {t("Лентаға оралу", "Вернуться к ленте")}
              </Link>
              {detail ? (
                postCard(detail, true)
              ) : (
                <div className="mvp-empty">
                  <Search size={32} />
                  <h1>{t("Жазба табылмады", "Публикация не найдена")}</h1>
                  <p>
                    {t(
                      "Бұл деможазба басқа браузерде жасалған болуы мүмкін.",
                      "Возможно, этот демопост создан в другом браузере.",
                    )}
                  </p>
                  <Link className="mvp-primary" href={href("feed")}>
                    {t("Лентаны ашу", "Открыть ленту")}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mvp-page-heading">
                <div>
                  <span className="mvp-eyebrow">
                    {page === "feed"
                      ? t(
                          "ҚАЛА ӨМІРІНЕ ҚОСЫЛЫҢЫЗ",
                          "ПРИСОЕДИНЯЙТЕСЬ К ЖИЗНИ ГОРОДА",
                        )
                      : "YOUR CITY · ШЫМКЕНТ"}
                  </span>
                  <h1>
                    {page === "communities"
                      ? t("Өз ортаңызды табыңыз", "Найдите свой круг")
                      : page === "community"
                        ? current
                          ? name(current)
                          : t("Табылмады", "Не найдено")
                        : page === "profile"
                          ? t("Менің кеңістігім", "Моё пространство")
                          : page === "saved"
                            ? t("Сақталғандар", "Сохранённое")
                            : t("Бүгін қалада", "Сегодня в городе")}{" "}
                    <span className="mvp-spark">✳</span>
                  </h1>
                  {page === "communities" && (
                    <p>
                      {t(
                        "Ортақ қызығушылықтар — жаңа таныстықтардың бастауы.",
                        "Общие интересы — начало новых знакомств.",
                      )}
                    </p>
                  )}
                </div>
                <Link
                  className="mvp-primary mvp-compose-link"
                  href={href("create")}
                >
                  <Plus size={19} />
                  <span>{t("Жазба жасау", "Создать пост")}</span>
                </Link>
              </div>
              {page === "communities" ? (
                <>
                  <label className="mvp-search">
                    <Search size={19} />
                    <input
                      aria-label={t("Қауымдастық іздеу", "Поиск сообществ")}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t(
                        "Қызығушылығыңыз бойынша іздеу…",
                        "Поиск по интересам…",
                      )}
                    />
                  </label>
                  <div className="mvp-community-grid">
                    {communities
                      .filter((c) =>
                        name(c).toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((c) => (
                        <article
                          className="mvp-community-card community-card"
                          key={c.id}
                        >
                          <div className={`mvp-community-cover ${c.color}`}>
                            <span>{c.icon}</span>
                            <Sparkles size={25} />
                          </div>
                          <div className="mvp-community-body">
                            <span className="mvp-member-count">
                              {c.members} ·{" "}
                              {t("демоқатысушы", "демоучастников")}
                            </span>
                            <Link href={href("community", c.id)}>
                              <h2>{name(c)}</h2>
                            </Link>
                            <p>{state.lang === "kk" ? c.descKk : c.descRu}</p>
                            {joinButton(c)}
                          </div>
                        </article>
                      ))}
                  </div>
                  {!communities.some((c) =>
                    name(c).toLowerCase().includes(query.toLowerCase()),
                  ) && (
                    <div className="mvp-empty">
                      <Search size={30} />
                      <h2>
                        {t("Қауымдастық табылмады", "Сообщества не найдены")}
                      </h2>
                      <button
                        className="mvp-primary"
                        onClick={() => setQuery("")}
                      >
                        {t("Іздеуді тазарту", "Сбросить поиск")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mvp-content-grid">
                  <section
                    className="mvp-feed-column"
                    aria-label={t("Жазбалар", "Публикации")}
                  >
                    {page === "profile" && (
                      <section className="mvp-profile">
                        <div className="mvp-profile-cover">
                          <span>SHYMKENT · YOUR CITY</span>
                          <Leaf size={65} />
                        </div>
                        <div className="mvp-profile-info">
                          <span className="mvp-profile-avatar">
                            {state.profile.avatar}
                          </span>
                          <button
                            className="mvp-secondary"
                            onClick={() => setEditing(!editing)}
                          >
                            <Pencil size={15} />
                            {editing
                              ? t("Жабу", "Закрыть")
                              : t("Өңдеу", "Редактировать")}
                          </button>
                          <h2>{state.profile.name}</h2>
                          <p>
                            <MapPin size={14} /> Шымкент ·{" "}
                            {t("Демопрофиль", "Демопрофиль")}
                          </p>
                          <p>
                            {state.profile.bio ||
                              t(
                                "Қаланы танимын, жақсы адамдарды іздеймін 🌿",
                                "Открываю город и ищу хороших людей 🌿",
                              )}
                          </p>
                          <div className="mvp-profile-stats">
                            <span>
                              <b>{state.posts.length}</b>
                              {t("жазба", "публикаций")}
                            </span>
                            <span>
                              <b>{state.joined.length}</b>
                              {t("қауымдастық", "сообществ")}
                            </span>
                            <span>
                              <b>{state.saved.length}</b>
                              {t("сақталған", "сохранено")}
                            </span>
                          </div>
                          {editing && (
                            <form
                              className="mvp-profile-form"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const d = new FormData(e.currentTarget);
                                const name = String(d.get("name") || "").trim();
                                if (!name) return;
                                mutate((s) => ({
                                  ...s,
                                  profile: {
                                    name,
                                    bio: String(d.get("bio") || "").trim(),
                                    avatar: String(d.get("avatar")),
                                  },
                                }));
                                setEditing(false);
                                setToast(
                                  t(
                                    "Демопрофиль сақталды",
                                    "Демопрофиль сохранён",
                                  ),
                                );
                              }}
                            >
                              <label>
                                {t("Атыңыз", "Имя")}
                                <input
                                  name="name"
                                  defaultValue={state.profile.name}
                                  required
                                  minLength={2}
                                  maxLength={60}
                                />
                              </label>
                              <label>
                                {t("Өзіңіз туралы", "О себе")}
                                <textarea
                                  name="bio"
                                  defaultValue={state.profile.bio}
                                  maxLength={280}
                                />
                              </label>
                              <label>
                                {t("Аватар", "Аватар")}
                                <select
                                  name="avatar"
                                  defaultValue={state.profile.avatar}
                                >
                                  {["🌿", "☀️", "🌻", "🌊", "🏔️", "☕"].map(
                                    (a) => (
                                      <option key={a}>{a}</option>
                                    ),
                                  )}
                                </select>
                              </label>
                              <button type="submit" className="mvp-primary">
                                {t("Сақтау · демо", "Сохранить · демо")}
                              </button>
                            </form>
                          )}
                        </div>
                      </section>
                    )}
                    {page === "community" && current && (
                      <section className="mvp-community-intro">
                        <span
                          className={`mvp-community-symbol ${current.color}`}
                        >
                          {current.icon}
                        </span>
                        <h2>{name(current)}</h2>
                        <p>
                          {state.lang === "kk"
                            ? current.descKk
                            : current.descRu}
                        </p>
                        <small>
                          {current.members} ·{" "}
                          {t("демоқатысушы", "демоучастников")}
                        </small>
                        {joinButton(current)}
                      </section>
                    )}
                    {page === "feed" && (
                      <Link href={href("create")} className="mvp-composer">
                        <span className="mvp-avatar green">
                          {state.profile.avatar}
                        </span>
                        <span>
                          {t("Шымкент, не жаңалық?", "Шымкент, что нового?")}
                        </span>
                        <Plus size={20} />
                      </Link>
                    )}
                    <div className="mvp-feed-toolbar">
                      {page === "feed" ? (
                        <div className="mvp-feed-tabs">
                          {[
                            ["explore", t("Барлық жазбалар", "Все публикации")],
                            [
                              "mine",
                              t("Менің қауымдастықтарым", "Мои сообщества"),
                            ],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              className={mode === value ? "selected" : ""}
                              aria-pressed={mode === value}
                              onClick={() => setMode(value)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <h2>
                          {t("Жазбалар", "Публикации")}{" "}
                          <small>{shown.length}</small>
                        </h2>
                      )}
                      <label className="mvp-sort">
                        <SlidersHorizontal size={15} />
                        <select
                          aria-label={t("Сұрыптау", "Сортировка")}
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                        >
                          <option value="recent">{t("Жаңа", "Новые")}</option>
                          <option value="popular">
                            {t("Танымал", "Популярные")}
                          </option>
                        </select>
                      </label>
                    </div>
                    <label className="mvp-search">
                      <Search size={19} />
                      <input
                        aria-label={t("Жазбаларды іздеу", "Поиск публикаций")}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t(
                          "Қала не туралы сөйлеседі?",
                          "О чём говорит город?",
                        )}
                      />
                      {query && (
                        <button
                          className="mvp-icon"
                          aria-label={t("Іздеуді тазарту", "Очистить поиск")}
                          onClick={() => setQuery("")}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </label>
                    {page === "feed" && (
                      <div
                        className="mvp-filters"
                        aria-label={t("Санаттар", "Категории")}
                      >
                        <button
                          aria-pressed={category === "all"}
                          onClick={() => setCategory("all")}
                        >
                          {t("Барлығы", "Все")}
                        </button>
                        {communities.map((c) => (
                          <button
                            key={c.id}
                            aria-pressed={category === c.id}
                            onClick={() => setCategory(c.id)}
                          >
                            {c.icon} {name(c)}
                          </button>
                        ))}
                      </div>
                    )}
                    {shown.map((p) => postCard(p))}
                    {!shown.length && (
                      <div className="mvp-empty">
                        <Leaf size={35} />
                        <h2>
                          {query || category !== "all"
                            ? t(
                                "Әзірге ештеңе табылмады",
                                "Пока ничего не найдено",
                              )
                            : page === "saved"
                              ? t(
                                  "Жақсы идеяларды сақтаңыз",
                                  "Сохраняйте хорошие идеи",
                                )
                              : page === "profile"
                                ? t(
                                    "Бірінші әңгімеңізді бастаңыз",
                                    "Начните свою первую историю",
                                  )
                                : t(
                                    "Лентаңызды өзіңіз жасаңыз",
                                    "Соберите свою ленту",
                                  )}
                        </h2>
                        <p>
                          {page === "saved"
                            ? t(
                                "Жазбаның астындағы бетбелгіні басыңыз — ол осында пайда болады.",
                                "Нажмите на закладку под публикацией — она появится здесь.",
                              )
                            : t(
                                "Қызығушылықтарыңызды табыңыз немесе қалаға өз ойыңызды айтыңыз.",
                                "Найдите свои интересы или поделитесь с городом своей историей.",
                              )}
                        </p>
                        {query || category !== "all" ? (
                          <button
                            className="mvp-primary"
                            onClick={() => {
                              setQuery("");
                              setCategory("all");
                            }}
                          >
                            {t("Сүзгілерді тазарту", "Сбросить фильтры")}
                          </button>
                        ) : (
                          <Link
                            className="mvp-primary"
                            href={href(
                              page === "profile" ? "create" : "communities",
                            )}
                          >
                            {page === "profile"
                              ? t("Жазба жасау", "Создать пост")
                              : t(
                                  "Қауымдастықтарды көру",
                                  "Посмотреть сообщества",
                                )}
                            <ArrowRight size={16} />
                          </Link>
                        )}
                      </div>
                    )}
                  </section>
                  <aside className="mvp-right-rail">
                    <section className="mvp-rail-card">
                      <span className="mvp-eyebrow">
                        {t("ӨЗ ОРТАҢЫЗДЫ ТАБЫҢЫЗ", "НАЙДИТЕ СВОЙ КРУГ")}
                      </span>
                      <h2>
                        {t("Бір толқында", "На одной волне")} <span>✳</span>
                      </h2>
                      <p>
                        {t(
                          "Қызығушылықтар жақындастырады.",
                          "Интересы объединяют.",
                        )}
                      </p>
                      {communities.slice(0, 4).map((c) => (
                        <div key={c.id} className="mvp-suggestion">
                          <Link href={href("community", c.id)}>
                            <span className={`mvp-community-icon ${c.color}`}>
                              {c.icon}
                            </span>
                            <div>
                              <strong>{name(c)}</strong>
                              <small>
                                {c.members} · {t("демо", "демо")}
                              </small>
                            </div>
                          </Link>
                          <button
                            aria-label={
                              (state.joined.includes(c.id)
                                ? t("Шығу: ", "Выйти: ")
                                : t("Қосылу: ", "Вступить: ")) + name(c)
                            }
                            aria-pressed={state.joined.includes(c.id)}
                            onClick={() => toggle("joined", c.id)}
                          >
                            {state.joined.includes(c.id) ? (
                              <Check size={16} />
                            ) : (
                              <Plus size={16} />
                            )}
                          </button>
                        </div>
                      ))}
                      <Link className="mvp-all-link" href={href("communities")}>
                        {t("Барлық қауымдастықтар", "Все сообщества")}
                        <ArrowRight size={16} />
                      </Link>
                    </section>
                    <section className="mvp-weekend">
                      <span className="mvp-event-icon">
                        <CalendarDays size={24} />
                      </span>
                      <span className="mvp-eyebrow">
                        {t("ДЕМАЛЫСҚА ИДЕЯ", "ИДЕЯ НА ВЫХОДНЫЕ")}
                      </span>
                      <h2>
                        {t(
                          "Қаланы жаяу\nтанып көріңіз",
                          "Откройте город\nпешком",
                        )}
                      </h2>
                      <p>
                        {t(
                          "Таныс көшелер. Жаңа оқиғалар. Жақсы серіктер.",
                          "Знакомые улицы. Новые истории. Хорошая компания.",
                        )}
                      </p>
                      <Link href={href("post", "walk")}>
                        {t("Талқылауға қосылу", "Присоединиться к обсуждению")}
                        <ArrowUpRight size={17} />
                      </Link>
                    </section>
                    <div className="mvp-rail-footer">
                      <span>
                        your city<span className="mvp-spark">.</span>
                      </span>
                      <p>
                        {t(
                          "Шымкенттен басталады 💚",
                          "Начинается с Шымкента 💚",
                        )}
                      </p>
                      <Link href={href("about")}>
                        {t("Жоба туралы", "О проекте")}
                      </Link>
                      <span> · © 2026</span>
                    </div>
                  </aside>
                </div>
              )}
            </>
          )}
        </main>
        <nav
          className="mvp-bottom-nav"
          aria-label={t("Мобильді мәзір", "Мобильная навигация")}
        >
          {[
            navItems[0],
            navItems[1],
            { page: "create", icon: Plus, label: t("Жазба", "Создать") },
            navItems[2],
            navItems[3],
          ].map((n) => (
            <Link
              key={n.page}
              href={href(n.page)}
              className={page === n.page ? "active" : ""}
              aria-current={page === n.page ? "page" : undefined}
            >
              <n.icon size={22} />
              <span>
                {n.page === "profile"
                  ? t("Профиль", "Профиль")
                  : n.page === "saved"
                    ? t("Сақталған", "Сохранено")
                    : n.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
      {notification && (
        <div className="mvp-toast" role="status">
          <Check size={18} />
          {notification}
          <button
            className="mvp-icon"
            aria-label={t("Жабу", "Закрыть")}
            onClick={() => {
              setToast("");
              setStorageWarning(false);
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
