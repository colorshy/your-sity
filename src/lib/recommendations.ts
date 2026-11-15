import type { DemoPost } from "./demo";
import type { DemoState } from "./demo-store";

// These are intentionally modest, auditable demo weights, not ML predictions.
export const RECOMMENDATION_WEIGHTS = {
  joinedCommunity: 14,
  followedAuthor: 10,
  likedPost: 5,
  savedPost: 4,
  commentedPost: 3,
  selectedDistrict: 4,
  recencyMaximum: 10,
  recencyHalfLifeHours: 72 * Math.LN2,
  unseenCommunity: 2,
} as const;

/** Missing/invalid dates sort last, including dates before the Unix epoch. */
export function postTimestamp(post: DemoPost): number {
  const parsed = Date.parse(post.createdAt || "");
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

export const comparePostIds = (a: DemoPost, b: DemoPost) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

const author = (post: DemoPost) => (post.own ? "me" : post.authorId || post.id);

// Build membership indexes once per feed, rather than scanning comments per post.
function signals(state: DemoState) {
  return {
    joined: new Set(state.joined),
    following: new Set(state.following),
    likes: new Set(state.likes),
    saved: new Set(state.saved),
    commented: new Set(
      state.comments
        .filter((comment) => comment.authorId === "me" && !comment.deleted)
        .map((comment) => comment.post),
    ),
    hidden: new Set([...state.blocked, ...state.muted]),
    neighborhood: state.profile.neighborhood,
  };
}

function score(
  context: ReturnType<typeof signals>,
  post: DemoPost,
  now: number,
) {
  const weights = RECOMMENDATION_WEIGHTS;
  const postedAt = postTimestamp(post);
  const freshness =
    Number.isFinite(postedAt) && Number.isFinite(now) && postedAt <= now
      ? weights.recencyMaximum *
        Math.exp(
          (-Math.LN2 * ((now - postedAt) / 3_600_000)) /
            weights.recencyHalfLifeHours,
        )
      : 0;
  return (
    (context.joined.has(post.community)
      ? weights.joinedCommunity
      : weights.unseenCommunity) +
    (context.following.has(author(post)) ? weights.followedAuthor : 0) +
    (context.likes.has(post.id) ? weights.likedPost : 0) +
    (context.saved.has(post.id) ? weights.savedPost : 0) +
    (context.commented.has(post.id) ? weights.commentedPost : 0) +
    (context.neighborhood && post.neighborhood === context.neighborhood
      ? weights.selectedDistrict
      : 0) +
    freshness
  );
}

/** Score only interactions actually saved in this browser. Sample totals are ignored. */
export function recommendationScore(
  state: DemoState,
  post: DemoPost,
  now: number,
): number {
  return score(signals(state), post, now);
}

/**
 * Deterministic For You demo ranking, with light community/author diversity.
 * Callers apply city and search filters first; mute/block is also enforced here.
 * City and joined-community feeds intentionally bypass this function.
 */
export function rankForYou(
  state: DemoState,
  posts: readonly DemoPost[],
  now: number,
): DemoPost[] {
  const indexed = signals(state);
  const seen = new Set<string>();
  const candidates = posts
    .filter((post) => {
      if (indexed.hidden.has(author(post)) || seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    })
    .map((post) => ({
      post,
      score: score(indexed, post, now),
      // Future dates receive no timestamp tie-break advantage either.
      timestamp:
        Number.isFinite(now) && postTimestamp(post) <= now
          ? postTimestamp(post)
          : Number.NEGATIVE_INFINITY,
      author: author(post),
      joined: indexed.joined.has(post.community),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.timestamp - a.timestamp ||
        comparePostIds(a.post, b.post),
    );

  const result: typeof candidates = [];
  const remaining = [...candidates];
  while (remaining.length) {
    const last = result.slice(-2);
    const violations = (item: (typeof candidates)[number]) =>
      last.length < 2
        ? 0
        : Number(
            last[0].author === last[1].author && last[1].author === item.author,
          ) +
          Number(
            last[0].post.community === last[1].post.community &&
              last[1].post.community === item.post.community,
          );
    // Prefer satisfying both streak caps; when impossible, break at least one.
    const minimum = remaining.reduce(
      (best, item) => Math.min(best, violations(item)),
      2,
    );
    let pool = remaining.filter((item) => violations(item) === minimum);
    // Discovery is subordinate to diversity and all upstream filters.
    if (result.length === 4 && !result.some((item) => !item.joined)) {
      const discovery = pool.filter((item) => !item.joined);
      if (discovery.length) pool = discovery;
    }
    const selected = pool[0];
    result.push(selected);
    remaining.splice(remaining.indexOf(selected), 1);
  }

  return result.map((item) => item.post);
}
