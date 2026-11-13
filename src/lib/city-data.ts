/** Administrative districts, not precise resident locations. Extend the catalog for another city. */
export const cityCatalog = {
  shymkent: {
    ru: "Шымкент",
    kk: "Шымкент",
    source: "https://www.gov.kz/memleket/entities/shymkent?lang=ru",
    neighborhoods: [
      { id: "abay", ru: "Абайский район", kk: "Абай ауданы" },
      { id: "al-farabi", ru: "Аль-Фарабийский район", kk: "Әл-Фараби ауданы" },
      { id: "enbekshi", ru: "Енбекшинский район", kk: "Еңбекші ауданы" },
      { id: "karatau", ru: "Каратауский район", kk: "Қаратау ауданы" },
      { id: "turan", ru: "Туранский район", kk: "Тұран ауданы" },
    ],
  },
} as const;
export const activeCity = cityCatalog.shymkent;
export const contentTypes = [
  { id: "news", ru: "Новости", kk: "Жаңалықтар" },
  { id: "question", ru: "Вопросы", kk: "Сұрақтар" },
  { id: "discussion", ru: "Обсуждения", kk: "Талқылаулар" },
  { id: "event", ru: "События", kk: "Іс-шаралар" },
  { id: "marketplace", ru: "Барахолка", kk: "Барахолка" },
] as const;
export type ContentType = (typeof contentTypes)[number]["id"];
export function districtName(id: string | undefined, lang: "ru" | "kk") {
  return activeCity.neighborhoods.find((n) => n.id === id)?.[lang];
}

// Explicit city clock + typed month names keep SSR and browsers with different ICU data identical.
export function formatCityTime(
  iso: string,
  lang: "ru" | "kk",
  timeOnly = false,
) {
  const date = new Date(Date.parse(iso) + 5 * 60 * 60 * 1000);
  if (!Number.isFinite(date.getTime())) return "";
  const clock = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  const months =
    lang === "ru"
      ? [
          "янв.",
          "фев.",
          "мар.",
          "апр.",
          "мая",
          "июн.",
          "июл.",
          "авг.",
          "сен.",
          "окт.",
          "нояб.",
          "дек.",
        ]
      : [
          "қаң.",
          "ақп.",
          "нау.",
          "сәу.",
          "мам.",
          "мау.",
          "шіл.",
          "там.",
          "қыр.",
          "қаз.",
          "қар.",
          "жел.",
        ];
  return timeOnly
    ? clock
    : `${date.getUTCDate()} ${months[date.getUTCMonth()]} · ${clock}`;
}
