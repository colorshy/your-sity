"use client";
import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import type { Community } from "@/lib/appwrite/types";
import { maxImageBytes, uploadChunkBytes } from "@/lib/appwrite/media-limits";
function Publish({
  valid,
  locale,
  uploading,
}: {
  valid: boolean;
  locale: string;
  uploading: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="primary"
      disabled={pending || uploading || !valid}
      aria-busy={pending || uploading}
    >
      {uploading
        ? locale === "kk"
          ? "Суреттер жүктелуде…"
          : "Загружаем изображения…"
        : pending
          ? locale === "kk"
            ? "Жариялануда…"
            : "Публикуем…"
          : locale === "kk"
            ? "Жариялау"
            : "Опубликовать"}
    </button>
  );
}
type Selection = { file: File; preview: string; id: string };
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
  const [images, setImages] = useState<Selection[]>([]);
  const [draft, setDraft] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const submitted = useRef(false);
  const uploaded = useRef(new Set<string>());
  const t = (kk: string, ru: string) => (locale === "kk" ? kk : ru);
  function select(files: FileList | null) {
    if (!files) return;
    const incoming = [...files];
    if (
      images.length + incoming.length > 4 ||
      incoming.some(
        (f) =>
          f.size > maxImageBytes ||
          f.size < 16 ||
          !["image/jpeg", "image/png", "image/webp"].includes(f.type),
      )
    ) {
      setError(
        t(
          "4 суретке дейін, әрқайсысы 5 МиБ-тан аспауы керек (JPG, PNG, WebP).",
          "До 4 изображений по 5 МиБ каждое (JPG, PNG, WebP).",
        ),
      );
      return;
    }
    if (!draft) setDraft(crypto.randomUUID().replaceAll("-", ""));
    setImages((current) => [
      ...current,
      ...incoming.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: crypto.randomUUID().replaceAll("-", ""),
      })),
    ]);
    setError("");
  }
  function remove(index: number) {
    URL.revokeObjectURL(images[index].preview);
    setImages((current) => current.filter((_, i) => i !== index));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    if (submitted.current || !images.length) return;
    const form = event.currentTarget;
    event.preventDefault();
    setUploading(true);
    setError("");
    try {
      let completed = 0;
      for (const [position, image] of images.entries()) {
        if (uploaded.current.has(image.id)) {
          completed++;
          continue;
        }
        for (
          let start = 0;
          start < image.file.size;
          start += uploadChunkBytes
        ) {
          const end = Math.min(start + uploadChunkBytes, image.file.size);
          const response = await fetch("/api/media/upload", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "x-city-draft": draft,
              "x-city-file": image.id,
              "x-city-position": String(position),
              "x-city-total": String(image.file.size),
              "x-city-start": String(start),
              "x-city-mime": image.file.type,
            },
            body: image.file.slice(start, end),
          });
          if (!response.ok) throw new Error(String(response.status));
          setProgress(
            Math.round(
              ((completed + end / image.file.size) / images.length) * 100,
            ),
          );
        }
        uploaded.current.add(image.id);
        completed++;
      }
      submitted.current = true;
      form.requestSubmit();
    } catch {
      setError(
        t(
          "Жүктеу аяқталмады. Қайта көріңіз.",
          "Не удалось загрузить изображение. Попробуйте снова.",
        ),
      );
      setUploading(false);
    }
  }
  return (
    <form action={action} onSubmit={submit} className="post-composer">
      <p>
        {t(
          "Ойыңызбен бөлісіңіз немесе көршілеріңізге сұрақ қойыңыз.",
          "Поделитесь мыслью или задайте вопрос соседям.",
        )}
      </p>
      <input type="hidden" name="draft" value={images.length ? draft : ""} />
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
        placeholder={t(
          "Шымкентте қандай жаңалық бар?",
          "Что нового в Шымкенте?",
        )}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required={!images.length}
        maxLength={5000}
        rows={5}
        aria-describedby="post-counter post-guidance"
      />
      <p id="post-counter" className="field-hint">
        {body.length} / 5000
      </p>
      <label className="app-attach">
        {t("Сурет қосу", "Добавить фото")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            select(e.target.files);
            e.target.value = "";
          }}
          disabled={uploading || images.length >= 4}
        />
      </label>
      {!!images.length && (
        <div className="app-upload-previews">
          {images.map((image, index) => (
            <div key={image.id}>
              <Image
                unoptimized
                width={120}
                height={120}
                src={image.preview}
                alt={t("Таңдалған сурет", "Выбранное изображение")}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={uploading}
              >
                {t("Өшіру", "Убрать")}
              </button>
            </div>
          ))}
        </div>
      )}
      {uploading && (
        <progress
          value={progress}
          max={100}
          aria-label={t("Жүктеу барысы", "Ход загрузки")}
        >
          {progress}%
        </progress>
      )}
      {error && <p role="alert">{error}</p>}
      <p id="post-guidance" className="field-hint">
        {t("Жеке ақпаратты жарияламаңыз.", "Берегите личные данные.")}
      </p>
      <Publish
        valid={
          (body.trim().length > 0 || images.length > 0) && body.length <= 5000
        }
        locale={locale}
        uploading={uploading}
      />
    </form>
  );
}
