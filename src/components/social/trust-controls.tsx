"use client";
import { useEffect, useRef, useState } from "react";
import { Flag, MoreHorizontal, VolumeX, Ban, X } from "lucide-react";
import { translator, type DemoUI } from "./shared";
export function TrustControls({
  state,
  mutate,
  feedback,
  target,
  author,
}: { target: string; author: string } & DemoUI) {
  const t = translator(state.lang);
  const [reporting, setReporting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  function closeDialog() {
    dialog.current?.close();
    setReporting(false);
  }
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (reporting) dialog.current?.showModal();
  }, [reporting]);
  function hide(field: "muted" | "blocked") {
    mutate((s) => ({
      ...s,
      [field]: Array.from(new Set([...s[field], author])),
      following:
        field === "blocked"
          ? s.following.filter((x) => x !== author)
          : s.following,
    }));
    if (menu.current) menu.current.open = false;
    feedback(
      t(
        "Аккаунт тек сіздің демолентаңызда жасырылды",
        "Аккаунт скрыт только в вашей демоленте",
      ),
    );
  }
  return (
    <>
      <details className="social-menu" ref={menu}>
        <summary aria-label={t("Жазба әрекеттері", "Действия с контентом")}>
          <MoreHorizontal size={19} />
        </summary>
        <div>
          <button
            onClick={() => {
              if (menu.current) menu.current.open = false;
              setReporting(true);
            }}
          >
            <Flag size={15} />
            {t("Шағымдану · демо", "Пожаловаться · демо")}
          </button>
          <button onClick={() => hide("muted")}>
            <VolumeX size={15} />
            {t("Аккаунтты жасыру", "Заглушить аккаунт")}
          </button>
          <button onClick={() => hide("blocked")}>
            <Ban size={15} />
            {t("Бұғаттау · демо", "Заблокировать · демо")}
          </button>
        </div>
      </details>
      {reporting && (
        <dialog
          ref={dialog}
          className="social-dialog"
          onCancel={closeDialog}
          aria-labelledby="report-title"
        >
          <button
            className="mvp-icon social-dialog-close"
            aria-label={t("Жабу", "Закрыть")}
            onClick={closeDialog}
          >
            <X size={18} />
          </button>
          <h2 id="report-title">
            {t("Мәселе туралы айтыңыз", "Расскажите о проблеме")}
          </h2>
          <p>
            {t(
              "Бұл жергілікті демошағым. Модераторға жіберілмейді.",
              "Это локальная деможалоба. Она не отправляется модератору.",
            )}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const reason = String(
                new FormData(e.currentTarget).get("reason"),
              );
              mutate((s) => ({
                ...s,
                reports: [
                  ...s.reports,
                  {
                    id: crypto.randomUUID(),
                    target,
                    reason,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }));
              closeDialog();
              feedback(
                t(
                  "Демошағым осы браузерде сақталды",
                  "Деможалоба сохранена в этом браузере",
                ),
              );
            }}
          >
            <label>
              {t("Себеп", "Причина")}
              <select name="reason" required>
                <option value="spam">{t("Спам", "Спам")}</option>
                <option value="abuse">{t("Қорлау", "Оскорбления")}</option>
                <option value="misleading">
                  {t("Жалған ақпарат", "Вводит в заблуждение")}
                </option>
                <option value="other">{t("Басқа", "Другое")}</option>
              </select>
            </label>
            <button className="mvp-primary" type="submit">
              {t("Шағымды сақтау · демо", "Сохранить жалобу · демо")}
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
