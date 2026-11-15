import { deploymentTarget, verifyPreviewReadback } from "./deployment-target";
/** Only Vercel API readback is a trusted input here, never page/request headers. */
export function verifyBetaPreview(raw: unknown, origin: string, sha: string) {
  const url = new URL(origin);
  if (
    url.protocol !== "https:" ||
    url.origin !== origin.replace(/\/$/, "") ||
    url.username ||
    url.password ||
    url.port ||
    !/^[a-z0-9-]+\.vercel\.app$/i.test(url.hostname) ||
    !/^[a-f0-9]{40}$/.test(sha)
  )
    throw new Error("Invalid beta Preview identity");
  if (!raw || typeof raw !== "object")
    throw new Error("Preview metadata missing");
  const d = raw as Record<string, unknown>,
    meta = (d.meta ?? {}) as Record<string, unknown>;
  const commit = meta.releaseCommit ?? meta.githubCommitSha,
    branch = meta.releaseBranch ?? meta.githubCommitRef;
  if (
    (meta.releaseCommit &&
      meta.githubCommitSha &&
      meta.releaseCommit !== meta.githubCommitSha) ||
    (meta.releaseBranch &&
      meta.githubCommitRef &&
      meta.releaseBranch !== meta.githubCommitRef) ||
    branch !== deploymentTarget.branch ||
    d.url !== url.hostname
  )
    throw new Error("Preview URL/source mismatch");
  return verifyPreviewReadback(
    { ...d, meta: { ...meta, releaseCommit: commit, releaseBranch: branch } },
    sha,
  );
}
