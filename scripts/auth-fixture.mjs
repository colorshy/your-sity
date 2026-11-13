// Local browser-test fixture only. This is not Supabase integration evidence.
import { createServer } from "node:http";
const id = "11111111-1111-4111-8111-111111111111",
  city = "33333333-3333-4333-8333-333333333333",
  community = "44444444-4444-4444-8444-444444444444";
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "resident@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email" },
  user_metadata: { display_name: "Test Resident" },
  created_at: "2026-01-01T00:00:00Z",
};
const token = () =>
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  ) +
  "." +
  Buffer.from(
    JSON.stringify({
      sub: id,
      aud: "authenticated",
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url") +
  ".fixture-signature";
createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:54321");
  let body = "";
  for await (const chunk of req) body += chunk;
  const send = (status, data) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === "/health") return send(200, { fixture: true });
  if (url.pathname === "/auth/v1/token") {
    const data = JSON.parse(body || "{}");
    if (
      data.password !== "Test-password-123!" &&
      data.grant_type !== "refresh_token" &&
      url.searchParams.get("grant_type") !== "refresh_token"
    )
      return send(400, {
        code: "invalid_credentials",
        msg: "Invalid login credentials",
      });
    return send(200, {
      access_token: token(),
      refresh_token: "test-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user,
    });
  }
  if (url.pathname === "/auth/v1/signup")
    return send(200, { ...user, identities: [] });
  if (url.pathname === "/auth/v1/user") {
    if (!req.headers.authorization?.startsWith("Bearer eyJ"))
      return send(401, { message: "Invalid token" });
    return send(200, user);
  }
  if (url.pathname === "/auth/v1/logout") return send(200, {});
  if (url.pathname === "/auth/v1/verify") {
    const input = JSON.parse(body || "{}");
    if (input.token_hash === "valid-test-token")
      return send(200, {
        access_token: token(),
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        user,
      });
    return send(400, { message: "Expired confirmation link" });
  }
  if (url.pathname === "/auth/v1/resend") return send(200, {});
  if (url.pathname === "/rest/v1/profiles")
    return send(
      200,
      req.headers.accept?.includes("vnd.pgrst.object")
        ? { id, display_name: "Test Resident", city_id: city, onboarded: true }
        : [{ id, display_name: "Test Resident" }],
    );
  if (url.pathname === "/rest/v1/communities")
    return send(200, [
      {
        id: community,
        city_id: city,
        slug: "events",
        name_kk: "Іс-шаралар",
        name_ru: "События",
        description_kk: "",
        description_ru: "",
      },
    ]);
  if (url.pathname === "/rest/v1/community_memberships")
    return send(200, [{ user_id: id, community_id: community }]);
  if (url.pathname === "/rest/v1/posts") return send(200, []);
  if (url.pathname === "/rest/v1/cities")
    return send(
      200,
      req.headers.accept?.includes("vnd.pgrst.object")
        ? { id: city, name_kk: "Шымкент", name_ru: "Шымкент" }
        : [
            {
              id: city,
              slug: "shymkent",
              name_kk: "Шымкент",
              name_ru: "Шымкент",
            },
          ],
    );
  return send(404, { message: "Fixture route not implemented" });
}).listen(54321, "127.0.0.1");
