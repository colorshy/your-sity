export const deploymentTarget = {
  projectId: "prj_I9ANo3tGUECTuC53MeDAmURntFIh",
  projectName: "your-city",
  repository: "colorshy/your-sity",
  branch: "feat/milestone-4-launch",
} as const;
export type ProjectIdentity = {
  id: string;
  name: string;
  accountId: string;
  link?: { type: string; org?: string; repo?: string };
};
export type EnvironmentMetadata = {
  key: string;
  target?: string | string[];
  gitBranch?: string | null;
};
export function auditDeploymentTarget(
  project: ProjectIdentity,
  envs: EnvironmentMetadata[],
) {
  if (
    project.id !== deploymentTarget.projectId ||
    project.name !== deploymentTarget.projectName ||
    !project.accountId
  )
    throw new Error("Deployment target identity mismatch");
  const issues: string[] = [];
  if (!project.link) issues.push("github-link-missing");
  else if (
    !["github", "github-limited"].includes(project.link.type) ||
    project.link.org !== "colorshy" ||
    project.link.repo !== "your-sity"
  )
    issues.push("github-link-conflict");
  const previewKeys = [
    ...new Set(
      envs
        .filter(
          (e) =>
            (!e.gitBranch || e.gitBranch === deploymentTarget.branch) &&
            (Array.isArray(e.target) ? e.target : [e.target]).includes(
              "preview",
            ),
        )
        .map((e) => e.key),
    ),
  ].sort();
  for (const key of [
    "APPWRITE_API_KEY",
    "APPWRITE_ENDPOINT",
    "APPWRITE_PROJECT_ID",
    "APPWRITE_DATABASE_ID",
    "VERCEL_AUTH_RATE_LIMIT_ID",
    "VERCEL_WRITE_RATE_LIMIT_ID",
  ])
    if (!previewKeys.includes(key)) issues.push("preview-env-missing:" + key);
  return {
    projectId: project.id,
    projectName: project.name,
    accountId: project.accountId,
    repository: project.link
      ? `${project.link.org ?? ""}/${project.link.repo ?? ""}`
      : null,
    previewKeys,
    issues,
  };
}
export function previewArguments(accountId: string, sha: string) {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/.test(accountId) ||
    !/^[a-f0-9]{40}$/.test(sha)
  )
    throw new Error("Invalid verified deployment identity");
  return [
    "deploy",
    "--project",
    deploymentTarget.projectId,
    "--scope",
    accountId,
    "--environment",
    "preview",
    "--yes",
    "--archive=tgz",
    "--json",
    "--meta",
    "releaseCommit=" + sha,
    "--meta",
    "releaseBranch=" + deploymentTarget.branch,
    "--global-config",
    "/tmp/your-city-vercel-config",
  ];
}

export function verifyPreviewReadback(value: unknown, sha: string) {
  if (!value || typeof value !== "object")
    throw new Error("Deployment readback missing");
  const d = value as Record<string, unknown>;
  const nested =
    d.project && typeof d.project === "object"
      ? (d.project as Record<string, unknown>).id
      : undefined;
  const projectId = typeof d.projectId === "string" ? d.projectId : nested;
  const meta =
    d.meta && typeof d.meta === "object"
      ? (d.meta as Record<string, unknown>)
      : {};
  if (
    projectId !== deploymentTarget.projectId ||
    d.target === "production" ||
    d.readyState !== "READY" ||
    meta.releaseCommit !== sha ||
    typeof d.id !== "string"
  )
    throw new Error("Deployment identity/state/source not verified");
  return {
    projectId: deploymentTarget.projectId,
    deploymentId: d.id,
    commit: sha,
  };
}
