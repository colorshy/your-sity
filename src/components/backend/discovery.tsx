"use client";
import { Children, useState } from "react";
import type { Community } from "@/lib/appwrite/types";

export function Discovery({
  communities,
  locale,
  initialQuery,
  children,
}: {
  communities: Community[];
  locale: string;
  initialQuery: string;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState(initialQuery.slice(0, 100));
  const [category, setCategory] = useState("");
  const t = (kk: string, ru: string) => (locale === "kk" ? kk : ru);
  const categories = [
    ...new Set(
      communities.map((c) => c.category).filter((c): c is string => !!c),
    ),
  ].sort();
  const q = query.trim().toLocaleLowerCase();
  const matches = communities.map(
    (c) =>
      (!category || c.category === category) &&
      [c.name_kk, c.name_ru, c.description_kk, c.description_ru].some((v) =>
        v.toLocaleLowerCase().includes(q),
      ),
  );
  const cards = Children.toArray(children);
  return (
    <section aria-label={t("Қауымдастық іздеу", "Поиск сообществ")}>
      <div className="discovery-controls">
        <label>
          {t("Атауы немесе сипаттамасы", "Название или описание")}
          <input
            type="search"
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          {t("Санат", "Категория")}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t("Барлық санаттар", "Все категории")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "city" ? t("Қала", "Город") : c}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="join"
          onClick={() => {
            setQuery("");
            setCategory("");
          }}
        >
          {t("Тазарту", "Сбросить")}
        </button>
      </div>
      <p role="status">
        {t("Табылды", "Найдено")}: {matches.filter(Boolean).length}
      </p>
      {communities.length === 100 && (
        <p>
          {t(
            "Алғашқы 100 қауымдастық көрсетілген. Іздеу осы тізімде жұмыс істейді.",
            "Показаны первые 100 сообществ. Поиск работает в этом списке.",
          )}
        </p>
      )}
      <div className="discovery-grid">{cards.filter((_, i) => matches[i])}</div>
      {!matches.some(Boolean) && (
        <div className="empty">
          <h2>
            {communities.length
              ? t("Қауымдастық табылмады", "Сообщества не найдены")
              : t("Әзірге қауымдастықтар жоқ", "Пока нет доступных сообществ")}
          </h2>
          <p>
            {communities.length
              ? t(
                  "Басқа сөзді қолданып көріңіз немесе сүзгілерді тазалаңыз.",
                  "Попробуйте другое слово или сбросьте фильтры.",
                )
              : t("Кейінірек қайта кіріңіз.", "Загляните позже.")}
          </p>
        </div>
      )}
    </section>
  );
}
