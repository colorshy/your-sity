import type { Repository } from "@/lib/appwrite/types";
export async function verifyBackend(repo: Repository) {
  const city = await repo.get("cities", "shymkent");
  if (!city) throw new Error("Required city missing");
  const communities = await repo.list(
    "communities",
    [{ field: "city_id", value: "shymkent" }],
    { limit: 100 },
  );
  if (
    ![
      "drivers",
      "discounts",
      "city-news",
      "students",
      "neighborhoods",
      "events",
      "marketplace",
    ].every((id) => communities.some((c) => c.id === id))
  )
    throw new Error("Required communities missing");
  const probe = "launch-readiness-probe";
  // Read-only query/index verification. No fake accounts, content, or transactions are created.
  await Promise.all([
    repo.list("profiles", [{ field: "user_id", value: probe }], { limit: 1 }),
    repo.list(
      "community_memberships",
      [
        { field: "user_id", value: probe },
        { field: "community_id", value: "events" },
      ],
      { limit: 1 },
    ),
    repo.list(
      "posts",
      [
        { field: "community_id", value: communities.map((c) => c.id) },
        { field: "status", value: "published" },
      ],
      { limit: 1, desc: true },
    ),
    repo.list(
      "posts",
      [
        { field: "author_id", value: probe },
        { field: "status", value: "published" },
      ],
      { limit: 1, desc: true },
    ),
    repo.list(
      "comments",
      [
        { field: "post_id", value: probe },
        { field: "status", value: "published" },
      ],
      { limit: 1, desc: true },
    ),
    repo.list("reports", [{ field: "status", value: "open" }], {
      limit: 1,
      desc: true,
    }),
  ]);
}
