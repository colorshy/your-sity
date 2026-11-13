"use client";
import { Leaf } from "lucide-react";
import { useDemoState } from "@/lib/demo-store";
export default function Loading() {
  const [state] = useDemoState();
  return (
    <div
      className="mvp social-loading"
      data-theme={state.theme}
      role="status"
      aria-live="polite"
    >
      <Leaf size={32} />
      <p>{state.lang === "ru" ? "Загружаем город…" : "Қала жүктелуде…"}</p>
      <div className="social-loading-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
