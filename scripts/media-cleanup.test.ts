import test from "node:test";
import assert from "node:assert/strict";
import { cleanupCandidate } from "../src/lib/migrations/media-cleanup";
test("cleanup targets hidden/deleted and stale orphan media without touching published posts", () => {
  const now = Date.parse("2026-11-22T12:00:00Z");
  const recent = "2026-11-22T11:00:00Z";
  const old = "2026-11-20T11:00:00Z";
  assert.equal(cleanupCandidate("published", old, now), false);
  assert.equal(cleanupCandidate("hidden", recent, now), true);
  assert.equal(cleanupCandidate("deleted", recent, now), true);
  assert.equal(cleanupCandidate(null, recent, now), false);
  assert.equal(cleanupCandidate(null, old, now), true);
  assert.equal(cleanupCandidate(null, "invalid", now), false);
});
