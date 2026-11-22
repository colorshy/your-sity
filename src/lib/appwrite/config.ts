export const isolatedProjectId = "6ab4b121002386b3d769";
export const previewBranch = "feat/mvp-5-social-feed";
export function validAppwriteTarget(env: Record<string, string | undefined>) {
  const project = env.APPWRITE_PROJECT_ID || "your-city";
  const isolated = project === isolatedProjectId;
  if (project !== "your-city" && !isolated) return false;
  if ((env.APPWRITE_TARGET === "isolated") !== isolated) return false;
  if (env.APPWRITE_TARGET && env.APPWRITE_TARGET !== "isolated") return false;
  if (isolated && env.NODE_ENV === "production")
    return (
      env.VERCEL === "1" &&
      env.VERCEL_ENV === "preview" &&
      env.VERCEL_GIT_COMMIT_REF === previewBranch
    );
  if (isolated && env.VERCEL_ENV === "production") return false;
  return true;
}
export function resolveAppwriteConfig(env: Record<string, string | undefined>) {
  if (!validAppwriteTarget(env)) throw new Error("Invalid Appwrite target");
  const key = env.APPWRITE_API_KEY;
  if (!key) return null;
  const endpoint = env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const project = env.APPWRITE_PROJECT_ID || "your-city",
    database = env.APPWRITE_DATABASE_ID || "your_city_db";
  const url = new URL(endpoint);
  const fixture =
    env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    url.hostname === "127.0.0.1" &&
    url.pathname === "/v1" &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash;
  if (
    database !== "your_city_db" ||
    (endpoint !== "https://fra.cloud.appwrite.io/v1" && !fixture)
  )
    throw new Error("Invalid Appwrite target");
  return { endpoint, project, database, key };
}
export function appwriteConfig() {
  return resolveAppwriteConfig(process.env);
}
export const sessionCookie = () =>
  process.env.NODE_ENV === "production"
    ? "__Host-your-city-session"
    : "your-city-session";
