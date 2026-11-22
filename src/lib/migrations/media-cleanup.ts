export function cleanupCandidate(
  postStatus: string | null,
  createdAt: string,
  now: number,
) {
  if (postStatus === "deleted" || postStatus === "hidden") return true;
  return (
    postStatus === null &&
    Number.isFinite(Date.parse(createdAt)) &&
    Date.parse(createdAt) < now - 24 * 3600_000
  );
}
