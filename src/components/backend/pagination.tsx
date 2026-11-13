import Link from "next/link";
import { translator } from "@/lib/locale";
export function pageNumber(value?: string) {
  return Math.min(1000, Math.max(1, Number.parseInt(value ?? "1", 10) || 1));
}
export async function Pagination({
  page,
  more,
  path,
}: {
  page: number;
  more: boolean;
  path: string;
}) {
  const { t } = await translator();
  return (
    <nav className="header-actions" aria-label={t("Беттер", "Страницы")}>
      {page > 1 && (
        <Link href={path + (page - 1)}>{t("Алдыңғы", "Назад")}</Link>
      )}
      {more && <Link href={path + (page + 1)}>{t("Келесі", "Далее")}</Link>}
    </nav>
  );
}
