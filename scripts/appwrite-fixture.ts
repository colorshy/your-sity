/** Loopback SDK contract fixture. No live Appwrite resources are touched. */
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { fields, tables, type TableMetadata } from "../src/lib/appwrite/schema";
import { membershipId } from "../src/lib/appwrite/service";
type Raw = Record<string, unknown> & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
};
const database = "your_city_db",
  now = () => new Date().toISOString();
const rows = new Map<string, Raw>();
const users = new Map<
  string,
  { $id: string; name: string; email: string; emailVerification: boolean }
>();
const sessions = new Map<string, string>();
const transactions = new Map<string, Map<string, Raw>>();
function row(
  table: string,
  id: string,
  data: Record<string, unknown>,
  target = rows,
) {
  const r = {
    $id: id,
    $createdAt: now(),
    $updatedAt: now(),
    $permissions: [],
    ...data,
  };
  target.set(table + ":" + id, r);
  return r;
}
row("cities", "shymkent", { name_kk: "Шымкент", name_ru: "Шымкент" });
for (const [id, kk, ru] of [
  ["drivers", "Көлік жүргізушілері", "Автолюбители"],
  ["discounts", "Жеңілдіктер", "Скидки"],
  ["city-news", "Қала өмірі", "Новости города"],
  ["students", "Студенттер", "Студенты"],
  ["neighborhoods", "Көршілер", "Соседи"],
  ["events", "Іс-шаралар", "События"],
  ["marketplace", "Маркет", "Маркет"],
])
  row("communities", id, { city_id: "shymkent", name_kk: kk, name_ru: ru });
function createUser(email: string, name = "Test Resident", onboarded = true) {
  const id = createHash("sha256").update(email).digest("hex").slice(0, 32);
  const u = { $id: id, email, name, emailVerification: true };
  users.set(id, u);
  if (onboarded) {
    row("profiles", id, {
      user_id: id,
      display_name: name,
      city_id: "shymkent",
      locale: "kk",
      onboarded: true,
    });
    row("community_memberships", membershipId(id, "events"), {
      user_id: id,
      community_id: "events",
    });
  }
  return u;
}
function metadata(table: string): TableMetadata {
  return {
    $id: table,
    enabled: true,
    rowSecurity: false,
    $permissions: ["cities", "communities"].includes(table)
      ? ['read("any")']
      : [],
    columns: Object.keys(fields[table as keyof typeof fields]).map((key) => ({
      key,
      type: key === "onboarded" ? "boolean" : "string",
      status: "available",
      required: true,
      size: 10000,
    })),
    indexes:
      table === "profiles"
        ? [
            {
              key: "yc_profiles_user",
              type: "unique",
              columns: ["user_id"],
              status: "available",
            },
          ]
        : table === "community_memberships"
          ? [
              {
                key: "yc_membership_pair",
                type: "unique",
                columns: ["user_id", "community_id"],
                status: "available",
              },
            ]
          : [],
  };
}
createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:54321");
  let raw = "";
  for await (const c of req) raw += c;
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw || "{}");
  } catch {}
  const send = (code: number, data: unknown) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(data));
  };
  const fail = (code: number) =>
    send(code, {
      code,
      message: "Fixture rejected request",
      type: code === 401 ? "user_unauthorized" : "general_error",
    });
  if (url.pathname === "/health") return send(200, { fixture: true });
  const path = url.pathname.replace(/^\/v1/, "");
  if (path === "/account" && req.method === "POST") {
    if ([...users.values()].some((u) => u.email === body.email))
      return fail(409);
    const u = createUser(String(body.email), String(body.name), false);
    return send(201, u);
  }
  if (path === "/account/sessions/email") {
    if (body.password !== "Test-password-123!") return fail(401);
    let u = [...users.values()].find((u) => u.email === body.email);
    u ??= createUser(String(body.email));
    const secret = randomUUID();
    sessions.set(secret, u.$id);
    return send(201, {
      $id: randomUUID(),
      userId: u.$id,
      secret,
      expire: new Date(Date.now() + 86400000).toISOString(),
      current: true,
    });
  }
  if (path === "/account" && req.method === "GET") {
    const uid = sessions.get(String(req.headers["x-appwrite-session"]));
    return uid ? send(200, users.get(uid)) : fail(401);
  }
  if (path === "/account/sessions/current" && req.method === "DELETE") {
    sessions.delete(String(req.headers["x-appwrite-session"]));
    return send(204, null);
  }
  if (path === "/account/verifications/email") {
    if (req.method === "PUT")
      return body.secret === "valid-test-token" ? send(200, {}) : fail(401);
    return sessions.has(String(req.headers["x-appwrite-session"]))
      ? send(201, {})
      : fail(401);
  }
  if (!req.headers["x-appwrite-key"]) return fail(401);
  if (path === "/tablesdb/transactions" && req.method === "POST") {
    const id = randomUUID();
    transactions.set(id, structuredClone(rows));
    return send(201, { $id: id });
  }
  const tx = path.match(/^\/tablesdb\/transactions\/([^/]+)$/);
  if (tx) {
    const state = transactions.get(tx[1]);
    if (!state) return fail(404);
    if (body.commit) {
      rows.clear();
      for (const [key, value] of state) rows.set(key, value);
    }
    transactions.delete(tx[1]);
    return send(200, { $id: tx[1] });
  }
  const match = path.match(
    /^\/tablesdb\/([^/]+)\/tables\/([^/]+)(?:\/rows(?:\/([^/]+))?)?$/,
  );
  if (
    !match ||
    match[1] !== database ||
    !tables.includes(match[2] as (typeof tables)[number])
  )
    return fail(404);
  const table = match[2],
    id = match[3];
  if (!path.includes("/rows")) return send(200, metadata(table));
  const transactionId = String(
    body.transactionId ?? url.searchParams.get("transactionId") ?? "",
  );
  const target = transactions.get(transactionId) || rows;
  if (id) {
    const existing = target.get(table + ":" + id);
    if (!existing) return fail(404);
    if (req.method === "DELETE") {
      target.delete(table + ":" + id);
      return send(204, null);
    }
    if (req.method === "PATCH")
      return send(
        200,
        row(
          table,
          id,
          { ...existing, ...(body.data as object), $updatedAt: now() },
          target,
        ),
      );
    return send(200, existing);
  }
  if (req.method === "POST") {
    const rowId = String(body.rowId);
    if (target.has(table + ":" + rowId)) return fail(409);
    return send(
      201,
      row(table, rowId, body.data as Record<string, unknown>, target),
    );
  }
  const queries = Array.from(url.searchParams.entries())
    .filter(([key]) => /^queries(?:\[\d*\])?$/.test(key))
    .map(([, value]) => value)
    .map(
      (q) =>
        JSON.parse(q) as {
          method: string;
          attribute: string;
          values: unknown[];
        },
    );
  let result = [...target.entries()]
    .filter(([key]) => key.startsWith(table + ":"))
    .map(([, value]) => value);
  for (const q of queries)
    if (q.method === "equal")
      result = result.filter((r) => q.values.includes(r[q.attribute]));
  if (queries.some((q) => q.method === "orderDesc"))
    result = result.sort(
      (a, b) =>
        String(b.$createdAt).localeCompare(a.$createdAt) ||
        b.$id.localeCompare(a.$id),
    );
  const total = result.length,
    offset = Number(queries.find((q) => q.method === "offset")?.values[0] ?? 0),
    limit = Number(queries.find((q) => q.method === "limit")?.values[0] ?? 25);
  return send(200, { total, rows: result.slice(offset, offset + limit) });
}).listen(54321, "127.0.0.1");
