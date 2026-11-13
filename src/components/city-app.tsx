"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Compass,
  Users,
  Home,
  Plus,
  MessageCircle,
  ChevronRight,
  Search,
  User,
  Leaf,
} from "lucide-react";
import { communities, posts } from "@/lib/demo";
const subscribeHydration = () => () => {};
type Lang = "kk" | "ru";
function readLanguage(): Lang {
  try {
    return localStorage.getItem("your-city-language") === "ru" ? "ru" : "kk";
  } catch {
    return "kk";
  }
}
function subscribeLanguage(callback: () => void) {
  window.addEventListener("language-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("language-change", callback);
    window.removeEventListener("storage", callback);
  };
}
export function CityApp({
  page = "feed",
  id = "",
}: {
  page?: string;
  id?: string;
}) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const lang = useSyncExternalStore(
    subscribeLanguage,
    readLanguage,
    () => "kk" as Lang,
  );
  const [joined, setJoined] = useState<string[]>(["events", "neighborhoods"]);
  const [mode, setMode] = useState("explore");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = (kk: string, ru: string) => (lang === "kk" ? kk : ru);
  const name = (c: (typeof communities)[number]) => c[lang];
  const toggle = (key: string) =>
    setJoined((v) =>
      v.includes(key) ? v.filter((x) => x !== key) : [...v, key],
    );
  const current = communities.find((c) => c.id === id);
  const shown = posts.filter(
    (p) =>
      (page !== "community" || p.community === id) &&
      (mode !== "mine" || joined.includes(p.community)),
  );
  return (
    <div className="shell" aria-busy={!hydrated} inert={!hydrated}>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Leaf size={23} />
          </span>
          your city<span className="brand-dot">.</span>
        </Link>
        <div className="city-pill">
          <MapPin size={17} />
          <div>
            <small>{t("Сіздің қалаңыз", "Ваш город")}</small>
            <strong>Шымкент</strong>
          </div>
          <span className="status-dot" />
        </div>
        <p className="nav-caption">{t("ҚАЛАНЫ ТАНЫҢЫЗ", "ОТКРОЙТЕ ГОРОД")}</p>
        <nav>
          {[
            ["/feed", Home, t("Менің лентам", "Моя лента"), "feed"],
            [
              "/communities",
              Compass,
              t("Қауымдастықтар", "Сообщества"),
              "communities",
            ],
            ["/profile", User, t("Менің профилім", "Мой профиль"), "profile"],
          ].map(([href, Icon, label, key]) => {
            const I = Icon as typeof Home;
            return (
              <Link
                className={page === key ? "nav-link active" : "nav-link"}
                key={String(key)}
                href={String(href)}
              >
                <I size={20} />
                {String(label)}
              </Link>
            );
          })}
        </nav>
        <p className="nav-caption">
          {t("ДЕМО ҚАУЫМДАСТЫҚТАР", "ДЕМОСООБЩЕСТВА")}
        </p>
        {communities.slice(0, 4).map((c) => (
          <Link
            className="mini-community"
            key={c.id}
            href={"/communities/" + c.id}
          >
            <span className={"emoji " + c.color}>{c.icon}</span>
            {name(c)}
          </Link>
        ))}
        <div className="sidebar-bottom">
          <span className="small-leaf">✳</span>
          <strong>{t("Қала — бұл адамдар.", "Город — это люди.")}</strong>
          <p>{t("Жақыныңыздан бастаңыз.", "Начните с тех, кто рядом.")}</p>
          <Link href="/about">
            {t("Жоба туралы", "О проекте")} <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            Шымкент <ChevronRight size={14} />{" "}
            {t("Қауымдастық кеңістігі", "Пространство сообществ")}
          </span>
          <div className="header-actions">
            <div className="language" aria-label="Language">
              {(["kk", "ru"] as const).map((l) => (
                <button
                  aria-pressed={lang === l}
                  className={lang === l ? "selected" : ""}
                  key={l}
                  onClick={() => {
                    localStorage.setItem("your-city-language", l);
                    window.dispatchEvent(new Event("language-change"));
                  }}
                >
                  {l === "kk" ? "ҚАЗ" : "РУС"}
                </button>
              ))}
            </div>
            <Link href="/sign-in" className="login">
              {t("Кіру", "Войти")} <ArrowUpRight size={15} />
            </Link>
          </div>
        </header>
        <main>
          <div className="demo-notice">
            <span />{" "}
            {t(
              "Демо нұсқа · Барлық профильдер мен жазбалар — үлгілер. Өзгерістер тек осы бетте сақталады.",
              "Деморежим · Все профили и публикации — примеры. Изменения действуют только на этой странице.",
            )}
          </div>
          {page === "landing" || page === "about" ? (
            <section className="landing">
              <span className="eyebrow">YOUR CITY · ШЫМКЕНТ</span>
              <h1>
                {t("Бір қала. Мың байланыс.", "Один город. Тысячи связей.")}
              </h1>
              <p>
                {t(
                  "Өзіңізге жақын адамдарды, қызығушылықтарды және қауымдастықтарды табыңыз. Сіздің қалаңыз сізден басталады.",
                  "Находите близких по духу людей, интересы и сообщества. Ваш город начинается с вас.",
                )}
              </p>
              <Link className="primary" href="/feed">
                {t("Қаланы тану", "Открыть город")} <ArrowRight size={18} />
              </Link>
              <div className="landing-grid">
                {communities.slice(0, 3).map((c) => (
                  <Link
                    className="community-card"
                    key={c.id}
                    href={"/communities/" + c.id}
                  >
                    <span className={"tile " + c.color}>{c.icon}</span>
                    <h3>{name(c)}</h3>
                    <p>{lang === "kk" ? c.descKk : c.descRu}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : ["sign-in", "sign-up", "onboarding", "create"].includes(page) ? (
            <section className="form-panel">
              <span className="eyebrow">
                {t("КЕЛЕСІ ҚАДАМ", "СЛЕДУЮЩИЙ ШАГ")}
              </span>
              <h1>
                {page === "create"
                  ? t("Жазба жасау", "Создать публикацию")
                  : page === "onboarding"
                    ? t("Қалаңызды таңдаңыз", "Выберите город")
                    : page === "sign-up"
                      ? t("Қош келдіңіз!", "Добро пожаловать!")
                      : t("Қайта оралуыңызбен!", "С возвращением!")}
              </h1>
              <p>
                {t(
                  "Бұл — демо интерфейс. Нақты аккаунт пен жазбалар үшін негізгі қолданбаға өтіңіз.",
                  "Это демоинтерфейс. Для реального аккаунта и публикаций перейдите в основное приложение.",
                )}
              </p>
              <fieldset disabled>
                {page === "onboarding" ? (
                  <label>
                    {t("Қала", "Город")}
                    <select>
                      <option>Шымкент</option>
                    </select>
                  </label>
                ) : page === "create" ? (
                  <>
                    <label>
                      {t("Қауымдастық", "Сообщество")}
                      <select>
                        {communities.map((c) => (
                          <option key={c.id}>{name(c)}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("Мәтін", "Текст")}
                      <textarea
                        placeholder={t(
                          "Ойыңызбен бөлісіңіз",
                          "Поделитесь мыслями",
                        )}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    {page === "sign-up" && (
                      <label>
                        {t("Атыңыз", "Имя")}
                        <input autoComplete="nickname" />
                      </label>
                    )}
                    <label>
                      Email
                      <input type="email" autoComplete="email" />
                    </label>
                    <label>
                      {t("Құпиясөз", "Пароль")}
                      <input
                        type="password"
                        autoComplete={
                          page === "sign-up"
                            ? "new-password"
                            : "current-password"
                        }
                      />
                    </label>
                  </>
                )}
                <button className="primary">
                  {t("Әзірге қолжетімсіз", "Пока недоступно")}
                </button>
              </fieldset>
              <Link href={page === "sign-in" ? "/sign-up" : "/feed"}>
                {page === "sign-in"
                  ? t("Тіркелу үлгісі", "Макет регистрации")
                  : t("Лентаға оралу", "Вернуться к ленте")}{" "}
                <ArrowRight size={16} />
              </Link>
            </section>
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <span className="eyebrow">
                    {t(
                      "ЖАҚЫН АДАМДАР. ОРТАҚ ҚЫЗЫҒУШЫЛЫҚТАР.",
                      "ЛЮДИ РЯДОМ. ОБЩИЕ ИНТЕРЕСЫ.",
                    )}
                  </span>
                  <h1>
                    {page === "communities"
                      ? t("Өз ортаңызды табыңыз", "Найдите своё сообщество")
                      : page === "community"
                        ? current
                          ? name(current)
                          : t("Табылмады", "Не найдено")
                        : page === "profile"
                          ? t("Демо профиль", "Демопрофиль")
                          : t("Сәлем, Шымкент!", "Сәлем, Шымкент!")}
                    <span className="heading-spark">✳</span>
                  </h1>
                  <p>
                    {t(
                      "Қала өміріне қосылыңыз. Бөлісіңіз, танысыңыз, бірге болыңыз.",
                      "Присоединяйтесь к жизни города. Делитесь, знакомьтесь, будьте рядом.",
                    )}
                  </p>
                </div>
                <Link className="primary" href="/create">
                  <Plus size={18} />
                  {t("Жазба жасау", "Создать пост")}
                </Link>
              </section>
              {page === "profile" ? (
                <section className="profile-box">
                  <div className="avatar">Д</div>
                  <h2>{t("Демо тұрғын", "Деможитель")}</h2>
                  <p>
                    Шымкент ·{" "}
                    {t("Нақты аккаунт емес", "Это не настоящий аккаунт")}
                  </p>
                  <h3>{t("Демо мүшеліктер", "Демочленства")}</h3>
                  {communities
                    .filter((c) => joined.includes(c.id))
                    .map((c) => (
                      <Link
                        className="chip"
                        key={c.id}
                        href={"/communities/" + c.id}
                      >
                        {c.icon} {name(c)}
                      </Link>
                    ))}
                  <p>
                    {t(
                      "Бұл профильдің жазбалары жоқ.",
                      "У этого профиля нет публикаций.",
                    )}
                  </p>
                </section>
              ) : page === "communities" ? (
                <>
                  <label className="search">
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
                  <div className="community-grid">
                    {communities
                      .filter((c) =>
                        name(c).toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((c) => (
                        <article className="community-card" key={c.id}>
                          <span className={"tile " + c.color}>{c.icon}</span>
                          <Link href={"/communities/" + c.id}>
                            <h2>{name(c)}</h2>
                          </Link>
                          <p>{lang === "kk" ? c.descKk : c.descRu}</p>
                          <button
                            className={
                              joined.includes(c.id) ? "join joined" : "join"
                            }
                            onClick={() => toggle(c.id)}
                          >
                            {joined.includes(c.id)
                              ? t("Қосылдым · шығу", "Вы участник · выйти")
                              : t("Қосылу · демо", "Вступить · демо")}
                          </button>
                        </article>
                      ))}
                  </div>
                  {!communities.some((c) =>
                    name(c).toLowerCase().includes(query.toLowerCase()),
                  ) && (
                    <p className="empty">
                      {t("Қауымдастық табылмады", "Сообщества не найдены")}
                    </p>
                  )}
                </>
              ) : (
                <div className="content-grid">
                  <div>
                    {page === "feed" ? (
                      <section className="city-banner">
                        <div>
                          <span className="eyebrow">
                            {t(
                              "БІЗДІҢ ҚАЛА. БІЗДІҢ ОРТА.",
                              "НАШ ГОРОД. НАШ КРУГ.",
                            )}
                          </span>
                          <h2>
                            {t(
                              "Жақсы көршілерден\nжақсы қала басталады.",
                              "Хороший город\nначинается с соседей.",
                            )}
                          </h2>
                          <Link href="/communities">
                            {t("Қауымдастықтарды көру", "Найти сообщество")}{" "}
                            <ArrowUpRight size={16} />
                          </Link>
                        </div>
                        <div className="city-art" aria-hidden="true">
                          <span className="sun" />
                          <i className="building b1" />
                          <i className="building b2" />
                          <i className="building b3" />
                          <i className="tree t1" />
                          <i className="tree t2" />
                          <span className="art-label">SHYMKENT</span>
                        </div>
                      </section>
                    ) : (
                      current && (
                        <div className="community-intro">
                          <span className={"tile " + current.color}>
                            {current.icon}
                          </span>
                          <p>
                            {lang === "kk" ? current.descKk : current.descRu}
                          </p>
                          <button
                            className="join"
                            onClick={() => toggle(current.id)}
                          >
                            {joined.includes(current.id)
                              ? t(
                                  "Қауымдастықтан шығу · демо",
                                  "Покинуть · демо",
                                )
                              : t("Қосылу · демо", "Вступить · демо")}
                          </button>
                        </div>
                      )
                    )}
                    <div className="feed-tabs">
                      <button
                        className={mode === "explore" ? "tab selected" : "tab"}
                        onClick={() => setMode("explore")}
                      >
                        <Compass size={17} />
                        {t("Қала лентасы", "Весь город")}
                      </button>
                      <button
                        className={mode === "mine" ? "tab selected" : "tab"}
                        onClick={() => setMode("mine")}
                      >
                        <Users size={17} />
                        {t("Менің қауымдастықтарым", "Мои сообщества")}
                      </button>
                      <span>{t("Жаңалары алдымен", "Сначала новые")}</span>
                    </div>
                    {shown.map((post) => {
                      const c = communities.find(
                        (x) => x.id === post.community,
                      )!;
                      return (
                        <article className="post" key={post.id}>
                          <div className="post-meta">
                            <span className={"avatar " + c.color}>
                              {post.initials}
                            </span>
                            <div>
                              <strong>
                                {lang === "kk" ? post.authorKk : post.authorRu}
                              </strong>
                              <p>
                                <Link href={"/communities/" + c.id}>
                                  {name(c)}
                                </Link>
                                <span>
                                  {" "}
                                  · {t("Демо күн", "Демодень")}, {post.time}
                                </span>
                              </p>
                            </div>
                            <span className="demo-tag">
                              {t("ҮЛГІ", "ДЕМО")}
                            </span>
                          </div>
                          <h2>{lang === "kk" ? post.titleKk : post.titleRu}</h2>
                          <p className="post-body">
                            {lang === "kk" ? post.bodyKk : post.bodyRu}
                          </p>
                          <div className="post-footer">
                            <span>
                              <MessageCircle size={17} />
                              {t(
                                "Талқылау кейін қосылады",
                                "Обсуждения появятся позже",
                              )}
                            </span>
                            <span>{c.icon}</span>
                          </div>
                        </article>
                      );
                    })}
                    {shown.length === 0 && (
                      <div className="empty">
                        {t(
                          "Әзірге жазбалар жоқ. Басқа қауымдастыққа қосылып көріңіз.",
                          "Пока нет публикаций. Попробуйте вступить в другое сообщество.",
                        )}
                      </div>
                    )}
                  </div>
                  <aside className="right-rail">
                    <section className="rail-card">
                      <div className="section-title">
                        <h3>{t("Өз ортаңызды табыңыз", "Найдите своих")}</h3>
                        <Compass size={18} />
                      </div>
                      <p>
                        {t(
                          "Қызығушылықтар ортақ болғанда, танысу оңай.",
                          "Знакомиться проще, когда есть общие интересы.",
                        )}
                      </p>
                      {communities.slice(0, 4).map((c) => (
                        <div className="suggestion" key={c.id}>
                          <Link href={"/communities/" + c.id}>
                            <span className={"emoji " + c.color}>{c.icon}</span>
                            <strong>{name(c)}</strong>
                          </Link>
                          <button
                            aria-label={
                              (joined.includes(c.id)
                                ? t("Шығу: ", "Выйти: ")
                                : t("Қосылу: ", "Вступить: ")) + name(c)
                            }
                            onClick={() => toggle(c.id)}
                          >
                            {joined.includes(c.id) ? "✓" : "+"}
                          </button>
                        </div>
                      ))}
                      <Link className="all-link" href="/communities">
                        {t("Барлық қауымдастықтар", "Все сообщества")}
                        <ArrowRight size={16} />
                      </Link>
                    </section>
                    <section className="neighbor-card">
                      <span>🌱</span>
                      <h3>{t("Бірге — жақынырақ.", "Вместе — ближе.")}</h3>
                      <p>
                        {t(
                          "Құрметпен сөйлесіңіз. Жеке ақпаратты қорғаңыз. Қалаңызды жақсы жаққа өзгертіңіз.",
                          "Общайтесь уважительно. Берегите личные данные. Делайте город лучше.",
                        )}
                      </p>
                      <Link href="/about">
                        {t("Your City туралы", "О Your City")}{" "}
                        <ArrowUpRight size={15} />
                      </Link>
                    </section>
                    <p className="rail-footer">
                      Your City © 2026
                      <br />
                      {t("Шымкенттен басталады 💚", "Начинается с Шымкента 💚")}
                    </p>
                  </aside>
                </div>
              )}
            </>
          )}
        </main>
        <footer className="mobile-footer">
          <Link href="/feed">
            <Home size={20} />
            {t("Лента", "Лента")}
          </Link>
          <Link href="/communities">
            <Compass size={20} />
            {t("Қауымдар", "Сообщества")}
          </Link>
          <Link href="/profile">
            <User size={20} />
            {t("Профиль", "Профиль")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
