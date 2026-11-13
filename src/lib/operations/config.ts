export function canonicalOrigin(
  value: string | undefined,
  production: boolean,
): string {
  if (!value) {
    if (production) throw new Error("Canonical origin required");
    return "http://localhost:3000";
  }
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !["http:", "https:"].includes(url.protocol)
  )
    throw new Error("Invalid canonical origin");
  if (
    production &&
    (url.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(
        url.hostname,
      ))
  )
    throw new Error("HTTPS deployment origin required");
  return url.origin;
}
export function deploymentIssues(
  env: Record<string, string | undefined>,
): string[] {
  const issues: string[] = [];
  if (!env.APPWRITE_API_KEY) issues.push("appwrite-key");
  if (
    (env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1") !==
      "https://fra.cloud.appwrite.io/v1" &&
    env.NODE_ENV === "production"
  )
    issues.push("appwrite-endpoint");
  if (
    (env.APPWRITE_PROJECT_ID || "your-city") !== "your-city" ||
    (env.APPWRITE_DATABASE_ID || "your_city_db") !== "your_city_db"
  )
    issues.push("appwrite-identity");
  try {
    applicationOrigin(env);
  } catch {
    issues.push("canonical-origin");
  }
  if (env.NODE_ENV === "production") {
    try {
      trustedDeploymentHost(env);
    } catch {
      issues.push("vercel-runtime");
    }
    if (!env.VERCEL_AUTH_RATE_LIMIT_ID || !env.VERCEL_WRITE_RATE_LIMIT_ID)
      issues.push("firewall-rules");
  }
  return issues;
}

export function applicationOrigin(
  env: Record<string, string | undefined>,
): string {
  if (env.NEXT_PUBLIC_SITE_URL)
    return canonicalOrigin(
      env.NEXT_PUBLIC_SITE_URL,
      env.NODE_ENV === "production",
    );
  // Vercel's own deployment metadata is trusted; incoming Host/Forwarded headers are not.
  if (
    env.NODE_ENV === "production" &&
    env.VERCEL === "1" &&
    env.VERCEL_ENV === "preview" &&
    env.VERCEL_URL &&
    /^[a-z0-9.-]+\.vercel\.app$/i.test(env.VERCEL_URL)
  )
    return canonicalOrigin("https://" + env.VERCEL_URL, true);
  return canonicalOrigin(undefined, env.NODE_ENV === "production");
}

export function trustedDeploymentHost(
  env: Record<string, string | undefined>,
): string {
  const host = env.VERCEL_URL;
  if (
    env.VERCEL !== "1" ||
    !host ||
    !host.endsWith(".vercel.app") ||
    !host
      .split(".")
      .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
  )
    throw new Error("Trusted Vercel deployment host required");
  return host;
}
