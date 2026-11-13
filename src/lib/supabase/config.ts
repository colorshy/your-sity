export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!url.startsWith("https://") && !url.startsWith("http://127.0.0.1:"))
    throw new Error("Invalid Supabase URL");
  if (key.startsWith("sb_secret_"))
    throw new Error("A publishable key is required");
  if (key.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1]));
      if (payload.role !== "anon") throw new Error("Invalid public key role");
    } catch {
      throw new Error("Invalid public key");
    }
  }
  return { url, key };
}
