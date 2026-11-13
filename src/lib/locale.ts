import { cookies } from "next/headers";
export async function translator() {
  const locale =
    (await cookies()).get("city-locale")?.value === "ru" ? "ru" : "kk";
  return { locale, t: (kk: string, ru: string) => (locale === "ru" ? ru : kk) };
}
