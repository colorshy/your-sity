import { test } from "node:test";
import assert from "node:assert/strict";
import { enforceLimit } from "../src/lib/operations/abuse-policy";
import {
  canonicalOrigin,
  deploymentIssues,
} from "../src/lib/operations/config";
import { operationLog } from "../src/lib/operations/log";
import { verifyBackend } from "../src/lib/operations/readiness";
import type { Repository } from "../src/lib/appwrite/types";
test("production rejects missing Vercel context and missing rate rule without calling a provider", async () => {
  let calls = 0;
  const provider = async () => {
    calls++;
    return { rateLimited: false };
  };
  assert.equal(
    await enforceLimit(
      { production: true, vercel: false, rule: "auth" },
      provider,
    ),
    "unavailable",
  );
  assert.equal(
    await enforceLimit({ production: true, vercel: true }, provider),
    "unavailable",
  );
  assert.equal(calls, 0);
});
test("rate limits, WAF denial, missing rule and timeout all fail closed", async () => {
  const config = { production: true, vercel: true, rule: "auth" };
  assert.equal(
    await enforceLimit(config, async () => ({ rateLimited: false })),
    "allowed",
  );
  assert.equal(
    await enforceLimit(config, async () => ({ rateLimited: true })),
    "limited",
  );
  assert.equal(
    await enforceLimit(config, async () => ({
      rateLimited: false,
      error: "blocked",
    })),
    "limited",
  );
  assert.equal(
    await enforceLimit(config, async () => ({
      rateLimited: false,
      error: "not-found",
    })),
    "unavailable",
  );
  assert.equal(
    await enforceLimit(config, async () => {
      throw new Error("Timeout");
    }),
    "unavailable",
  );
});
test("development is explicitly distinguished from enforced production protection", async () => {
  assert.equal(
    await enforceLimit({ production: false, vercel: false }, async () => {
      throw new Error("Not contacted");
    }),
    "development",
  );
});
test("canonical origin rejects credential URLs, path/query redirects and local production origins", () => {
  for (const value of [
    "http://localhost:3000",
    "https://user:password@example.com",
    "https://example.com/path",
    "https://example.com?next=elsewhere",
    "https://example.com/#fragment",
  ])
    assert.throws(() => canonicalOrigin(value, true));
  assert.throws(() => canonicalOrigin(undefined, true));
  assert.equal(
    canonicalOrigin("https://your-city.example/", true),
    "https://your-city.example",
  );
  assert.equal(
    canonicalOrigin("http://localhost:3000", false),
    "http://localhost:3000",
  );
});
test("deployment readiness identifies absent requirements without exposing values", () => {
  assert.deepEqual(deploymentIssues({ NODE_ENV: "production" }), [
    "appwrite-key",
    "canonical-origin",
    "vercel-runtime",
    "firewall-rules",
  ]);
  assert.deepEqual(
    deploymentIssues({
      NODE_ENV: "production",
      APPWRITE_API_KEY: "test-secret",
      NEXT_PUBLIC_SITE_URL: "https://your-city.example",
      VERCEL: "1",
      VERCEL_URL: "verified-preview.vercel.app",
      VERCEL_AUTH_RATE_LIMIT_ID: "auth",
      VERCEL_WRITE_RATE_LIMIT_ID: "write",
    }),
    [],
  );
  assert.ok(
    deploymentIssues({ APPWRITE_PROJECT_ID: "other" }).includes(
      "appwrite-identity",
    ),
  );
});
test("operational logs contain only enumerated metadata, no request or credential fields", () => {
  const info = console.info;
  const lines: string[] = [];
  console.info = (line) => lines.push(line);
  try {
    operationLog("auth_attempt", "failed", "auth");
  } finally {
    console.info = info;
  }
  const event = JSON.parse(lines[0]);
  assert.deepEqual(Object.keys(event).sort(), [
    "event",
    "kind",
    "result",
    "timestamp",
  ]);
  assert.equal(event.event, "auth_attempt");
  assert.equal(event.result, "failed");
});
test("readiness validates all existing community IDs and query plans without mutations", async () => {
  const calls: string[] = [];
  const ids = [
    "drivers",
    "discounts",
    "city-news",
    "students",
    "neighborhoods",
    "events",
    "marketplace",
  ];
  const repo = {
    get: async () => ({ id: "shymkent" }),
    list: async (table: string) => {
      calls.push(table);
      return table === "communities" ? ids.map((id) => ({ id })) : [];
    },
  } as unknown as Repository;
  await verifyBackend(repo);
  assert.deepEqual(
    calls.sort(),
    [
      "comments",
      "communities",
      "community_memberships",
      "posts",
      "posts",
      "profiles",
      "reports",
    ].sort(),
  );
});
test("readiness cannot succeed when required backend data or indexes are missing", async () => {
  await assert.rejects(
    verifyBackend({ get: async () => null } as unknown as Repository),
  );
  const repo = {
    get: async () => ({ id: "shymkent" }),
    list: async () => [],
  } as unknown as Repository;
  await assert.rejects(verifyBackend(repo));
});
test("preview origin uses trusted Vercel metadata while production requires explicit canonical configuration", async () => {
  const { applicationOrigin } = await import("../src/lib/operations/config");
  assert.equal(
    applicationOrigin({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_URL: "verified-preview.vercel.app",
    }),
    "https://verified-preview.vercel.app",
  );
  assert.throws(() =>
    applicationOrigin({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_URL: "verified-preview.vercel.app",
    }),
  );
  assert.throws(() =>
    applicationOrigin({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_URL: "evil.example/redirect",
    }),
  );
});
test("Firewall destination cannot come from a request-controlled or malformed hostname", async () => {
  const { trustedDeploymentHost } =
    await import("../src/lib/operations/config");
  assert.equal(
    trustedDeploymentHost({
      VERCEL: "1",
      VERCEL_URL: "trusted-deployment.vercel.app",
    }),
    "trusted-deployment.vercel.app",
  );
  for (const host of [
    "attacker.example",
    "trusted.vercel.app@attacker.example",
    "trusted.vercel.app/path",
    "a..vercel.app",
    "https://trusted.vercel.app",
  ])
    assert.throws(() =>
      trustedDeploymentHost({ VERCEL: "1", VERCEL_URL: host }),
    );
});
test("SDK failures retain only safe numeric status, not provider payloads or credentials", async () => {
  const { providerCall, BackendUnavailableError } =
    await import("../src/lib/appwrite/provider-boundary");
  const sdkError = Object.assign(new Error("sensitive-provider-payload"), {
    code: 403,
    response: { key: "sensitive-provider-payload" },
  });
  await assert.rejects(
    providerCall(async () => {
      throw sdkError;
    }),
    (error: unknown) => {
      assert.ok(error instanceof BackendUnavailableError);
      assert.equal(error.code, 403);
      assert.equal(error.message, "Backend operation unavailable");
      assert.equal(
        JSON.stringify(error).includes("sensitive-provider-payload"),
        false,
      );
      assert.equal(error.stack?.includes("sensitive-provider-payload"), false);
      assert.equal("cause" in error, false);
      return true;
    },
  );
  assert.equal(await providerCall(async () => 42), 42);
});
