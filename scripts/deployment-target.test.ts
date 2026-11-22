import { test } from "node:test";
import assert from "node:assert/strict";
import {
  auditDeploymentTarget,
  deploymentTarget,
  previewArguments,
  verifyPreviewReadback,
  previewProtectionEnabled,
} from "../src/lib/operations/deployment-target";
const project = {
  id: deploymentTarget.projectId,
  name: "your-city",
  accountId: deploymentTarget.teamId,
  ssoProtection: { deploymentType: "all" },
  link: { type: "github", org: "colorshy", repo: "your-sity" },
};
const keys = [
  "APPWRITE_API_KEY",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_MODERATOR_IDS",
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
    7,
  );
  assert.equal(
    auditDeploymentTarget(
      project,
      metadata.map((e) => ({ ...e, gitBranch: "other" })),
    ).issues.length,
    7,
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
      meta: { releaseCommit: sha, releaseBranch: deploymentTarget.branch },
    };
  assert.equal(verifyPreviewReadback(base, sha).deploymentId, "dpl_verified");
  for (const delta of [
    { target: "production" },
    { readyState: "ERROR" },
    { projectId: "prj_other" },
    { meta: { releaseCommit: "b".repeat(40) } },
    { meta: { ...base.meta, githubCommitSha: "b".repeat(40) } },
    { meta: { ...base.meta, githubCommitRef: "feat/mvp-3-multiuser" } },
  ])
    assert.throws(() => verifyPreviewReadback({ ...base, ...delta }, sha));
});

test("beta writes require verified exact Preview URL, branch, project, SHA and non-production target", async () => {
  const { verifyBetaPreview } =
    await import("../src/lib/operations/beta-preview");
  const sha = "a".repeat(40),
    base = {
      id: "dpl_beta",
      url: "your-city-verified.vercel.app",
      projectId: deploymentTarget.projectId,
      target: null,
      readyState: "READY",
      meta: { releaseCommit: sha, releaseBranch: deploymentTarget.branch },
    };
  assert.equal(
    verifyBetaPreview(base, "https://your-city-verified.vercel.app", sha)
      .deploymentId,
    "dpl_beta",
  );
  for (const change of [
    { target: "production" },
    { target: undefined },
    { projectId: "other" },
    { meta: { releaseCommit: sha, releaseBranch: "main" } },
    { url: "other.vercel.app" },
    { readyState: "ERROR" },
  ])
    assert.throws(() =>
      verifyBetaPreview(
        { ...base, ...change },
        "https://your-city-verified.vercel.app",
        sha,
      ),
    );
  for (const origin of [
    "https://your-city.example",
    "http://your-city-verified.vercel.app",
    "https://your-city-verified.vercel.app/path",
    "https://user@your-city-verified.vercel.app",
  ])
    assert.throws(() => verifyBetaPreview(base, origin, sha));
});

test("release target is MVP 5 and refuses another team or unverified Preview protection", () => {
  assert.equal(deploymentTarget.branch, "feat/mvp-5-social-feed");
  assert.throws(() =>
    auditDeploymentTarget({ ...project, accountId: "team_other" }, metadata),
  );
  assert.throws(() => previewArguments("team_other", "a".repeat(40)));
  for (const ssoProtection of [
    undefined,
    null,
    { deploymentType: "production" },
  ]) {
    assert.equal(
      previewProtectionEnabled({ ...project, ssoProtection }),
      false,
    );
    assert.ok(
      auditDeploymentTarget(
        { ...project, ssoProtection },
        metadata,
      ).issues.includes("preview-protection-unverified"),
    );
  }
  for (const deploymentType of [
    "all",
    "preview",
    "all_except_custom_domains",
    "prod_deployment_urls_and_all_previews",
  ])
    assert.equal(
      previewProtectionEnabled({
        ...project,
        ssoProtection: { deploymentType },
      }),
      true,
    );
});

test("deployment audit rejects client-exposed keys and deployment credentials in Preview runtime", () => {
  for (const key of [
    "NEXT_PUBLIC_APPWRITE_API_KEY",
    "NEXT_PUBLIC_VERCEL_TOKEN",
    "VERCEL_TOKEN",
  ])
    assert.ok(
      auditDeploymentTarget(project, [
        ...metadata,
        { key, target: ["preview"] },
      ]).issues.includes("forbidden-preview-env:" + key),
    );
  assert.equal(
    auditDeploymentTarget(project, metadata).canonicalOriginSource,
    "trusted-vercel-url",
  );
  assert.equal(
    auditDeploymentTarget(project, [
      ...metadata,
      { key: "NEXT_PUBLIC_SITE_URL", target: ["preview"] },
    ]).canonicalOriginSource,
    "explicit-preview-value-unverified",
  );
});
