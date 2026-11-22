"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { Community } from "@/lib/appwrite/types";
function Publish({ valid, locale }: { valid: boolean; locale: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="primary"
      disabled={pending || !valid}
      aria-busy={pending}
    >
      {pending
        ? locale === "kk"
          ? "Жариялануда…"
          : "Публикуем…"
        : locale === "kk"
          ? "Жариялау"
          : "Опубликовать"}
    </button>
  );
}
export function Composer({
  action,
  communities,
  locale,
  initialCommunity,
}: {
  action: (form: FormData) => Promise<void>;
  communities: Community[];
  locale: string;
  initialCommunity?: string;
}) {
  const [body, setBody] = useState("");
  const t = (kk: string, ru: string) => (locale === "kk" ? kk : ru);
  return (
    <form action={action} className="post-composer">
      <p>
        {t(
          "Ойыңызбен бөлісіңіз немесе көршілеріңізге сұрақ қойыңыз.",
          "Поделитесь мыслью или задайте вопрос соседям.",
        )}
      </p>
      <label>
        {t("Қауымдастық", "Сообщество")}
        <select
          name="community"
          defaultValue={
            communities.some((c) => c.id === initialCommunity)
              ? initialCommunity
              : communities[0]?.id
          }
        >
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c[locale === "kk" ? "name_kk" : "name_ru"]}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="post-body">{t("Мәтін", "Текст")}</label>
      <textarea
        id="post-body"
        name="body"
        placeholder={t("Шымкентте қандай жаңалық бар?", "Что нового в Шымкенте?")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        maxLength={5000}
        rows={5}
        aria-describedby="post-counter post-guidance"
      />
      <p id="post-counter" className="field-hint">
        {body.length} / 5000
      </p>
      <p id="post-guidance" className="field-hint">
        {t(
          "Жеке ақпаратты жарияламаңыз. Әзірге тек мәтін жариялауға болады.",
          "Берегите личные данные. Пока доступны только текстовые публикации.",
        )}
      </p>
      <Publish
        valid={body.trim().length > 0 && body.length <= 5000}
        locale={locale}
      />
    </form>
  );
}
