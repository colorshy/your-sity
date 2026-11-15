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

const timestamp = (post: DemoPost) => {
  const parsed = Date.parse(post.createdAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const author = (post: DemoPost) =>
  post.own ? "me" : post.authorId || post.id;

/** Score only interactions actually saved in this browser. Sample like totals are ignored. */
export function recommendationScore(
  state: DemoState,
  post: DemoPost,
  now: number,
): number {
  const weights = RECOMMENDATION_WEIGHTS;
  const joined = state.joined.includes(post.community);
  const postedAt = timestamp(post);
  const ageHours = Math.max(0, (now - postedAt) / 3_600_000);
  const freshness =
    postedAt && Number.isFinite(now)
      ? weights.recencyMaximum *
        Math.exp(-ageHours / weights.recencyHalfLifeHours)
      : 0;

  return (
    (joined ? weights.joinedCommunity : weights.unseenCommunity) +
    (state.following.includes(author(post)) ? weights.followedAuthor : 0) +
    (state.likes.includes(post.id) ? weights.likedPost : 0) +
    (state.saved.includes(post.id) ? weights.savedPost : 0) +
    (state.comments.some(
      (comment) =>
        comment.post === post.id &&
        comment.authorId === "me" &&
        !comment.deleted,
    )
      ? weights.commentedPost
      : 0) +
    (state.profile.neighborhood &&
    post.neighborhood === state.profile.neighborhood
      ? weights.selectedDistrict
      : 0) +
    freshness
  );
}

/**
 * Deterministic For You demo ranking, with light community/author diversity.
 * Callers MUST apply mute/block, city and search filters before calling.
 * City and joined-community feeds intentionally bypass this function.
 */
export function rankForYou(
  state: DemoState,
  posts: DemoPost[],
  now: number,
): DemoPost[] {
  const candidates = posts
    .map((post) => ({
      post,
      score: recommendationScore(state, post, now),
      timestamp: timestamp(post),
      author: author(post),
      joined: state.joined.includes(post.community),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.timestamp - a.timestamp ||
        (a.post.id < b.post.id ? -1 : a.post.id > b.post.id ? 1 : 0),
    );

  const result: typeof candidates = [];
  const remaining = [...candidates];
  while (remaining.length) {
    let pool = remaining;
    // If possible, let an unfamiliar community surface in the first five.
    if (
      result.length === 4 &&
      !result.some((item) => !item.joined) &&
      remaining.some((item) => !item.joined)
    ) {
      pool = remaining.filter((item) => !item.joined);
    }

    const last = result.slice(-2);
    const varied =
      last.length < 2
        ? pool
        : pool.filter(
            (item) =>
              !(last[0].author === last[1].author &&
                last[1].author === item.author) &&
              !(last[0].post.community === last[1].post.community &&
                last[1].post.community === item.post.community),
          );
    const selected = (varied.length ? varied : pool)[0];
    result.push(selected);
    remaining.splice(remaining.indexOf(selected), 1);
  }

  return result.map((item) => item.post);
}
