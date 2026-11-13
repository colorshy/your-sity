export function appwriteConfig() {
  const key = process.env.APPWRITE_API_KEY;
  if (!key) return null;
  const endpoint =
    process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const url = new URL(endpoint);
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && url.hostname === "127.0.0.1")
  )
    throw new Error("Invalid Appwrite endpoint");
  return {
    endpoint,
    project: process.env.APPWRITE_PROJECT_ID || "your-city",
    database: process.env.APPWRITE_DATABASE_ID || "your_city_db",
    key,
  };
}
export const sessionCookie = () =>
  process.env.NODE_ENV === "production"
    ? "__Host-your-city-session"
    : "your-city-session";
