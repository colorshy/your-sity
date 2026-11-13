/** Existing-project metadata audit by default. --deploy-preview never creates/promotes a project. */
import { Vercel } from "@vercel/sdk";
import { spawnSync } from "node:child_process";
import { configureTransport } from "../src/lib/appwrite/transport";
import {
  auditDeploymentTarget,
  deploymentTarget,
  previewArguments,
  verifyPreviewReadback,
  type EnvironmentMetadata,
  type ProjectIdentity,
} from "../src/lib/operations/deployment-target";
function git(...args: string[]) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error("Git verification failed");
  return result.stdout.trim();
}
function status(error: unknown): number | undefined {
  if (typeof error === "object" && error) {
    for (const key of ["statusCode", "status", "code"])
      if (key in error) {
        const value = (error as Record<string, unknown>)[key];
        if (typeof value === "number" && value >= 400 && value <= 599)
          return value;
      }
  }
  return undefined;
}
function metadataEntries(response: unknown): EnvironmentMetadata[] {
  if (!response || typeof response !== "object")
    throw new Error("Unrecognized environment metadata");
  const object = response as Record<string, unknown>;
  if (
    object.pagination &&
    typeof object.pagination === "object" &&
    (object.pagination as Record<string, unknown>).next
  )
    throw new Error("Incomplete environment metadata");
  const entries = Array.isArray(object.envs)
    ? object.envs
    : typeof object.key === "string"
      ? [object]
      : null;
  if (!entries) throw new Error("Unrecognized environment metadata");
  return entries.map((raw) => {
    if (!raw || typeof raw !== "object" || typeof raw.key !== "string")
      throw new Error("Invalid environment metadata");
    return { key: raw.key, target: raw.target, gitBranch: raw.gitBranch };
  });
}
async function main() {
  const execute = process.argv.includes("--deploy-preview");
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.log(
      JSON.stringify({
        status: "blocked",
        stage: "vercel-authorization",
        projectId: deploymentTarget.projectId,
        missing: ["VERCEL_TOKEN or authenticated Vercel integration"],
        localAppwriteKeyRequired: false,
        networkRequests: 0,
        deploymentCreated: false,
      }),
    );
    process.exitCode = 2;
    return;
  }
  configureTransport();
  const client = new Vercel({
    bearerToken: token,
    timeoutMs: 15000,
    retryConfig: { strategy: "none" },
  });
  let stage = "project-discovery";
  try {
    let project;
    const scope = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;
    try {
      project = await client.projects.getProject({
        idOrName: deploymentTarget.projectId,
        teamId: scope,
      });
    } catch (error) {
      if (scope || ![403, 404].includes(status(error) ?? 0)) throw error;
      const teams = await client.teams.getTeams({ limit: 100 });
      for (const team of teams.teams) {
        try {
          project = await client.projects.getProject({
            idOrName: deploymentTarget.projectId,
            teamId: team.id,
          });
          break;
        } catch (error) {
          if (![403, 404].includes(status(error) ?? 0)) throw error;
        }
      }
      if (!project) throw new Error("Project unavailable in authorized scopes");
    }
    stage = "environment-metadata";
    const remote = await client.projects.filterProjectEnvs({
      idOrName: deploymentTarget.projectId,
      teamId: project.accountId.startsWith("team_")
        ? project.accountId
        : undefined,
      gitBranch: deploymentTarget.branch,
      decrypt: "false",
    });
    const audit = auditDeploymentTarget(
      project as ProjectIdentity,
      metadataEntries(remote),
    );
    console.log(
      JSON.stringify({
        status: audit.issues.length
          ? "configuration-incomplete"
          : "metadata-verified",
        ...audit,
        secretValuesRequested: false,
        liveBackendVerified: false,
      }),
    );
    if (audit.issues.length) {
      process.exitCode = 2;
      return;
    }
    if (!execute) {
      console.log(
        JSON.stringify({
          status: "audit-only",
          deploymentCreated: false,
          next: "npm run launch:preview",
        }),
      );
      return;
    }
    stage = "source-verification";
    if (
      git("branch", "--show-current") !== deploymentTarget.branch ||
      git("status", "--porcelain")
    )
      throw new Error("Source must be clean on the exact release branch");
    const sha = git("rev-parse", "HEAD");
    const remoteRef = git(
      "ls-remote",
      "origin",
      "refs/heads/" + deploymentTarget.branch,
    ).split(/\s+/)[0];
    if (remoteRef !== sha) throw new Error("Local and remote source differ");
    stage = "preview-deployment";
    const result = spawnSync(
      "npm",
      [
        "--cache",
        "/workspace/.npm-cache",
        "exec",
        "--yes",
        "--package=vercel@65.15.0",
        "--",
        "vercel",
        ...previewArguments(project.accountId, sha),
      ],
      {
        encoding: "utf8",
        timeout: 15 * 60 * 1000,
        maxBuffer: 8 * 1024 * 1024,
        env: process.env,
      },
    );
    // Raw CLI logs may contain provider data. Only explicitly selected public deployment fields are emitted.
    if (result.status !== 0) {
      console.error(
        JSON.stringify({
          status: "preview-command-failed",
          stage,
          exitCode: result.status,
          deploymentStatus: "unverified",
        }),
      );
      process.exitCode = 1;
      return;
    }
    let url: string | undefined;
    try {
      const value = JSON.parse(result.stdout);
      if (typeof value.url === "string") url = value.url;
    } catch {}
    url ??= result.stdout.match(/https:\/\/[a-z0-9.-]+\.vercel\.app\b/i)?.[0];
    if (!url) throw new Error("CLI did not yield a verifiable URL");
    const parsed = new URL(url.startsWith("https://") ? url : "https://" + url);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".vercel.app") ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/"
    )
      throw new Error("Invalid deployment URL");
    stage = "deployment-readback";
    const deployment = await client.deployments.getDeployment({
      idOrUrl: parsed.hostname,
      teamId: project.accountId.startsWith("team_")
        ? project.accountId
        : undefined,
    });
    const verified = verifyPreviewReadback(deployment, sha);
    if (git("rev-parse", "HEAD") !== sha || git("status", "--porcelain"))
      throw new Error("Source changed during deployment");
    console.log(
      JSON.stringify({
        status: "preview-ready",
        projectId: verified.projectId,
        commit: sha,
        url: parsed.origin,
        deploymentId: verified.deploymentId,
        productionReleased: false,
        liveAcceptance: "not-run",
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "blocked-or-failed",
        stage,
        httpStatus: status(error),
        projectId: deploymentTarget.projectId,
        deploymentStatus:
          stage === "preview-deployment" || stage === "deployment-readback"
            ? "unverified"
            : "not-created",
        productionReleased: false,
      }),
    );
    process.exitCode = 1;
  }
}
void main();
