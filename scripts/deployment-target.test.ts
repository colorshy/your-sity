import { test } from "node:test";
import assert from "node:assert/strict";
import {
  auditDeploymentTarget,
  deploymentTarget,
  previewArguments,
  verifyPreviewReadback,
} from "../src/lib/operations/deployment-target";
const project = {
  id: deploymentTarget.projectId,
  name: "your-city",
  accountId: "team_verified",
  link: { type: "github", org: "colorshy", repo: "your-sity" },
};
const keys = [
  "APPWRITE_API_KEY",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "VERCEL_AUTH_RATE_LIMIT_ID",
  "VERCEL_WRITE_RATE_LIMIT_ID",
];
const metadata = keys.map((key) => ({
  key,
  target: ["preview"],
  value: "must-not-appear",
}));
test("deployment reuses the exact existing project and correct GitHub repository", () => {
  assert.equal(auditDeploymentTarget(project, metadata).issues.length, 0);
  assert.throws(() =>
    auditDeploymentTarget({ ...project, id: "prj_other" }, metadata),
  );
  assert.deepEqual(
    auditDeploymentTarget(
      { ...project, link: { type: "github", org: "other", repo: "other" } },
      metadata,
    ).issues,
    ["github-link-conflict"],
  );
});
test("production-only or other-branch variables do not count as preview configuration", () => {
  assert.equal(
    auditDeploymentTarget(
      project,
      metadata.map((e) => ({ ...e, target: ["production"] })),
    ).issues.length,
    6,
  );
  assert.equal(
    auditDeploymentTarget(
      project,
      metadata.map((e) => ({ ...e, gitBranch: "other" })),
    ).issues.length,
    6,
  );
  assert.equal(
    auditDeploymentTarget(
      project,
      metadata.map((e) => ({ ...e, gitBranch: deploymentTarget.branch })),
    ).issues.length,
    0,
  );
});
test("remote server secrets are not required locally and are never included in audit output", () => {
  const report = auditDeploymentTarget(project, metadata);
  assert.equal(JSON.stringify(report).includes("must-not-appear"), false);
  assert.ok(report.previewKeys.includes("APPWRITE_API_KEY"));
});
test("preview deployment arguments cannot create duplicates, force-deploy, or promote production", () => {
  const args = previewArguments(project.accountId, "a".repeat(40));
  assert.equal(args[args.indexOf("--project") + 1], deploymentTarget.projectId);
  assert.equal(args[args.indexOf("--environment") + 1], "preview");
  for (const flag of [
    "--prod",
    "--force",
    "--temporary",
    "--create-if-missing",
    "--token",
    "--env",
    "--build-env",
  ])
    assert.equal(args.includes(flag), false);
  assert.throws(() => previewArguments("--scope=other", "a".repeat(40)));
});
test("deployment readback verifies project, source SHA and READY preview status", () => {
  const sha = "a".repeat(40),
    base = {
      id: "dpl_verified",
      projectId: deploymentTarget.projectId,
      readyState: "READY",
      target: null,
      meta: { releaseCommit: sha },
    };
  assert.equal(verifyPreviewReadback(base, sha).deploymentId, "dpl_verified");
  for (const delta of [
    { target: "production" },
    { readyState: "ERROR" },
    { projectId: "prj_other" },
    { meta: { releaseCommit: "b".repeat(40) } },
  ])
    assert.throws(() => verifyPreviewReadback({ ...base, ...delta }, sha));
});
