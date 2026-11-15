/** Local metadata model from the operator-reported structure + runtime contract.
 * NOT an exported live snapshot: sizes and index names are representative.
 * Keep this independent of schema.fields/migration.additions to catch drift.
 */
import type { Column, TableMetadata } from "../../src/lib/appwrite/schema";
import type { MigrationSnapshot } from "../../src/lib/migrations/mvp3";
const str = (key: string, size = 36, required = true): Column => ({
  key,
  type: "varchar",
  size,
  required,
  array: false,
  status: "available",
  default: null,
});
const bool = (key: string): Column => ({
  key,
  type: "boolean",
  required: true,
  array: false,
  status: "available",
  default: null,
});
const index = (key: string, columns: string[], type = "key") => ({
  key,
  columns,
  type,
  status: "available",
});
function table(
  $id: string,
  columns: Column[],
  indexes: TableMetadata["indexes"] = [],
): TableMetadata {
  return {
    $id,
    enabled: true,
    rowSecurity: false,
    $permissions: ["cities", "communities"].includes($id)
      ? ['read("any")']
      : [],
    columns,
    indexes,
  };
}
export function postMigrationSchema(): MigrationSnapshot {
  return {
    endpoint: "https://fra.cloud.appwrite.io/v1",
    project: "your-city",
    database: "your_city_db",
    tables: [
      table("cities", [
        str("name_kk", 128),
        str("name_ru", 128),
        str("name", 128),
        str("slug", 128),
        str("country_code", 2),
        bool("enabled"),
      ]),
      table(
        "communities",
        [
          str("city_id"),
          str("name_kk", 128),
          str("name_ru", 128),
          str("name", 128),
          str("slug", 128),
          str("category", 64),
        ],
        [index("yc_communities_city", ["city_id"])],
      ),
      table(
        "profiles",
        [
          str("user_id"),
          str("display_name", 80),
          str("city_id"),
          str("locale", 2),
          bool("onboarded"),
          str("social_version", 36, false),
        ],
        [index("yc_profiles_user", ["user_id"], "unique")],
      ),
      table(
        "community_memberships",
        [str("user_id"), str("community_id")],
        [index("yc_membership_pair", ["user_id", "community_id"], "unique")],
      ),
      table(
        "posts",
        [
          str("author_id"),
          str("community_id"),
          str("body", 5000),
          str("status", 16),
        ],
        [
          index("yc_posts_city_feed", [
            "community_id",
            "status",
            "$createdAt",
            "$id",
          ]),
        ],
      ),
      table(
        "comments",
        [
          str("author_id"),
          str("post_id"),
          str("body", 2000),
          str("status", 16),
          str("parent_id", 36, false),
        ],
        [
          index("yc_comments_post", ["post_id", "status", "$createdAt", "$id"]),
          index("yc_comments_author", ["author_id", "status"]),
        ],
      ),
      table(
        "reports",
        [
          str("reporter_id"),
          str("post_id"),
          str("reason", 1000),
          str("status", 16),
          str("comment_id", 36, false),
        ],
        [index("yc_reports_queue", ["status", "$createdAt", "$id"])],
      ),
      table(
        "post_likes",
        [str("user_id"), str("post_id")],
        [
          index("yc_like_pair", ["user_id", "post_id"], "unique"),
          index("yc_likes_post", ["post_id"]),
        ],
      ),
      table(
        "bookmarks",
        [str("user_id"), str("post_id")],
        [
          index("yc_bookmark_pair", ["user_id", "post_id"], "unique"),
          index("yc_bookmarks_user", ["user_id"]),
        ],
      ),
      table(
        "connections",
        [str("user_id"), str("target_id"), str("kind", 16)],
        [
          index(
            "yc_connection_pair",
            ["user_id", "target_id", "kind"],
            "unique",
          ),
          index("yc_connections_target", ["target_id", "kind"]),
        ],
      ),
      table(
        "notifications",
        [
          str("recipient_id"),
          str("actor_id"),
          str("kind", 16),
          str("post_id", 36, false),
          str("comment_id", 36, false),
          bool("is_read"),
        ],
        [index("yc_notifications_recipient", ["recipient_id"])],
      ),
    ],
  };
}
