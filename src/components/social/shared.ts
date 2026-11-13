import type { DemoState } from "@/lib/demo-store";
export type DemoUI = {
  state: DemoState;
  mutate: (change: (state: DemoState) => DemoState) => void;
  feedback: (message: string) => void;
};
export const demoHref = (page: string, id?: string) =>
  `/demo?page=${page}${id ? `&id=${encodeURIComponent(id)}` : ""}`;
export const translator = (lang: "kk" | "ru") => (kk: string, ru: string) =>
  lang === "kk" ? kk : ru;

export function pluralRu(n: number, forms: readonly [string, string, string]) {
  const last = n % 10,
    lastTwo = n % 100;
  return lastTwo >= 11 && lastTwo <= 14
    ? forms[2]
    : last === 1
      ? forms[0]
      : last >= 2 && last <= 4
        ? forms[1]
        : forms[2];
}
