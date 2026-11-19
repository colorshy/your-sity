import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  BookOpen,
  CalendarDays,
  Code2,
  Compass,
  MapPin,
  Palette,
  Play,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PublicHeader, Wordmark } from "@/components/public/header";
import styles from "@/components/public/public.module.css";
import { hasVerifiedSession } from "@/lib/auth";
import { translator } from "@/lib/locale";

export default async function Page() {
  const [{ t }, signedIn] = await Promise.all([
    translator(),
    hasVerifiedSession(),
  ]);
  const joinHref = signedIn ? "/discover" : "/sign-up";
  const joinLabel = signedIn
    ? t("Your City-ге өту", "Перейти в Your City")
    : t("Қосылу", "Присоединиться");
  const demoLabel = t("Демоны көру", "Посмотреть демо");
  const pillars = [
    {
      icon: UsersRound,
      title: t("Өз адамдарыңды тап", "Найди своих людей"),
      description: t(
        "Ортақ қызығушылықтар жаңа таныстыққа жол ашады. Әңгімені өзіңе жақын қауымдастықтан баста.",
        "Общие интересы помогают познакомиться. Начни разговор в сообществе, которое тебе близко.",
      ),
      link: t("Қызығушылық бойынша іздеу", "Искать по интересам"),
    },
    {
      icon: Compass,
      title: t("Қауымдастықтарды аш", "Открой сообщества"),
      description: t(
        "Спорт, технология, шығармашылық пен білім. Өзіңе ұнайтын іспен қалада тағы кім айналысатынын біл.",
        "Спорт, технологии, творчество и учёба. Узнай, кто в городе увлекается тем же, что и ты.",
      ),
      link: t("Қауымдастықтарды көру", "Смотреть сообщества"),
    },
    {
      icon: CalendarDays,
      title: t("Бірге уақыт өткіз", "Проводи время вместе"),
      description: t(
        "Қаладағы кездесулер мен ортақ істер. Іс-шаралар бөлімі әзірге жоспарда.",
        "Встречи и совместные занятия в городе. Раздел мероприятий пока в планах.",
      ),
    },
  ];
  const categories = [
    [Bike, t("Спорт", "Спорт")],
    [BookOpen, t("Білім", "Образование")],
    [Code2, t("Технология", "Технологии")],
    [Palette, t("Шығармашылық", "Творчество")],
    [Sparkles, t("Өмір салты", "Образ жизни")],
  ] as const;
  const steps = [
    t("Қызығушылығыңа сай тақырып тап", "Найди то, что интересно"),
    t("Қауымдастыққа қосыл", "Вступи в сообщество"),
    t("Әңгіме баста", "Начни разговор"),
    t("Қалада жүздес", "Встретьтесь в городе"),
  ];
  return (
    <div className={styles.site}>
      <PublicHeader landing signedIn={signedIn} />
      <main className={styles.landing}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div>
            <p className={styles.eyebrow}>
              <MapPin size={16} aria-hidden />
              {t("ШЫМКЕНТ, ҚАЗАҚСТАН", "ШЫМКЕНТ, КАЗАХСТАН")}
            </p>
            <h1 id="hero-title">
              {t("Өз қалаң.", "Твой город.")} <br />
              {t("Өз адамдарың.", "Твои люди.")} <br />
              <em>{t("Өз тарихың.", "Твоя история.")}</em>
            </h1>
            <p className={styles.lede}>
              {t(
                "Шымкентте өзіңе жақын адамдарды тап, қауымдастықтарды аш және бірге жаңа әсер жина.",
                "Находи близких по духу людей, открывай сообщества и создавай новые впечатления в Шымкенте.",
              )}
            </p>
            <div className={styles.ctas}>
              <Link className={styles.button} href={joinHref}>
                {joinLabel}
                <ArrowUpRight size={17} aria-hidden />
              </Link>
              <Link className={styles.secondary} href="/demo">
                <Play size={16} aria-hidden />
                {demoLabel}
              </Link>
            </div>
          </div>
          <div className={styles.cityArt} aria-hidden="true">
            <div className={styles.sun} />
            <div className={styles.mountain} />
            <div className={styles.arch} />
            <div className={styles.tower} />
            <div className={styles.park} />
            <div className={styles.plaza} />
            <div className={styles.street} />
            <div className={styles.grove} />
            <div className={styles.artLabel}>
              <MapPin size={14} /> SHYMKENT
            </div>
          </div>
        </section>
        <section className={styles.section} id="discover">
          <h2>{t("Қалада өз ортаңды тап", "Найди своё в городе")}</h2>
          <div className={styles.pillars}>
            {pillars.map(({ icon: Icon, title, description, link }) => (
              <article key={title}>
                <span className={styles.pillarIcon}>
                  <Icon size={23} aria-hidden />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                {link && (
                  <Link href="/communities">
                    {link}
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className={styles.preview} id="communities">
          <div>
            <h2>{t("Қызығушылығыңнан баста", "Начни с интересов")}</h2>
            <p>
              {t(
                "Қауымдастық тақырыптарының мысалдары",
                "Примеры тем для сообществ",
              )}
            </p>
            <Link href="/communities">
              {t("Қауымдастықтар каталогы", "Каталог сообществ")}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <ul>
            {categories.map(([Icon, label]) => (
              <li key={label}>
                <Icon size={21} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.section} id="about">
          <h2>{t("Таныстық қалай басталады", "Как начинается знакомство")}</h2>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section className={styles.banner}>
          <h2>
            {t(
              "Өз адамдарыңды тап. Қалаңмен бірге өмір сүр.",
              "Найди своих людей. Почувствуй свой город.",
            )}
          </h2>
          <div className={styles.ctas}>
            <Link className={styles.button} href={joinHref}>
              {joinLabel}
              <ArrowUpRight size={17} aria-hidden />
            </Link>
            {!signedIn && (
              <Link className={styles.secondary} href="/sign-in">
                {t("Кіру", "Войти")}
              </Link>
            )}
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <Wordmark />
        <p>{t("Шымкент, Қазақстан", "Шымкент, Казахстан")}</p>
        <Link className={styles.footerLink} href="/demo">
          {demoLabel}
          <ArrowUpRight size={15} aria-hidden />
        </Link>
      </footer>
    </div>
  );
}
