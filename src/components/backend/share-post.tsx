"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
export function SharePost({ id, locale }: { id: string; locale: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = new URL(
      `/posts/${encodeURIComponent(id)}`,
      window.location.origin,
    ).href;
    try {
      if (navigator.share) await navigator.share({ url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      aria-label={
        locale === "kk" ? "Жазбамен бөлісу" : "Поделиться публикацией"
      }
      title={
        copied
          ? locale === "kk"
            ? "Сілтеме көшірілді"
            : "Ссылка скопирована"
          : undefined
      }
    >
      <Share2 size={18} />
      <span>
        {copied
          ? locale === "kk"
            ? "Көшірілді"
            : "Скопировано"
          : locale === "kk"
            ? "Бөлісу"
            : "Поделиться"}
      </span>
    </button>
  );
}
