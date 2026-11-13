export type AbuseKind = "auth" | "write";
export type LimitResult = {
  rateLimited: boolean;
  error?: "not-found" | "blocked";
};
export async function enforceLimit(
  input: { production: boolean; vercel: boolean; rule?: string },
  check: (rule: string) => Promise<LimitResult>,
): Promise<"allowed" | "limited" | "unavailable" | "development"> {
  if (!input.production) return "development";
  if (!input.vercel || !input.rule) return "unavailable";
  try {
    const result = await check(input.rule);
    if (result.error === "not-found") return "unavailable";
    if (result.rateLimited || result.error === "blocked") return "limited";
    return "allowed";
  } catch {
    return "unavailable";
  }
}
