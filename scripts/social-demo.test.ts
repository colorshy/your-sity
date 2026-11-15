import { test } from "node:test";
import assert from "node:assert/strict";
import { initialDemoState, parseDemoState } from "../src/lib/demo-store";
import { visiblePosts, authorId } from "../src/lib/social-demo";
import { rankForYou, recommendationScore } from "../src/lib/recommendations";
import { formatCityTime } from "../src/lib/city-data";
import { posts } from "../src/lib/demo";
const state = initialDemoState;
test("city is chronological, while interests and real local engagement affect For You", () => {
  const options = {
    mode: "city",
    kind: "all",
    neighborhood: "",
    query: "",
    now: Date.parse("2026-11-14T12:00:00+05:00"),
  };
  assert.deepEqual(
    visiblePosts(state, posts, options).map((p) => p.id),
    posts.map((p) => p.id),
  );
  const interested = { ...state, joined: ["students"] };
  assert.equal(
    visiblePosts(interested, posts, { ...options, mode: "explore" })[0].id,
    "books",
  );
  const engaged = { ...state, joined: [], likes: ["roads"] };
  assert.equal(
    visiblePosts(engaged, posts, { ...options, mode: "explore" })[0].id,
    "roads",
  );
  assert.ok(posts.every((p) => p.likes === 0));
});
test("community/district/type constraints compose and hidden authors never enter feed results", () => {
  const options = { mode: "mine", kind: "all", neighborhood: "", query: "" };
  assert.deepEqual(
    visiblePosts(state, posts, options).map((p) => p.id),
    ["walk", "mountains", "yard"],
  );
  assert.deepEqual(
    visiblePosts(state, posts, {
      ...options,
      mode: "city",
      neighborhood: "turan",
      kind: "news",
    }).map((p) => p.id),
    ["city"],
  );
  const blocked = { ...state, blocked: [authorId(posts[0])] };
  assert.ok(
    !visiblePosts(blocked, posts, { ...options, mode: "city" }).some(
      (p) => p.id === "walk",
    ),
  );
  assert.equal(
    visiblePosts({ ...state, joined: [] }, posts, options).length,
    0,
  );
});
test("previous MVP state migrates without discarding posts, bookmarks or owned comments", () => {
  const post = { ...posts[0], id: "local", own: true };
  const legacy = {
    lang: "ru",
    theme: "dark",
    joined: ["drivers"],
    likes: ["walk"],
    saved: ["books"],
    posts: [post],
    comments: [{ id: "old", post: "local", text: "legacy", author: "Me" }],
    profile: { name: "Me", bio: "Bio", avatar: "🌿" },
  };
  const migrated = parseDemoState(JSON.stringify(legacy));
  assert.equal(migrated.posts[0].id, "local");
  assert.equal(migrated.comments[0].authorId, "me");
  assert.equal(migrated.profile.username, "neighbor");
  assert.deepEqual(migrated.saved, ["books"]);
  assert.deepEqual(migrated.notifications, []);
});
test("corrupt threads and foreign comment ownership cannot masquerade as local owned comments", () => {
  const comment = {
    id: "a",
    post: "walk",
    text: "Text",
    author: "A",
    authorId: "me",
  };
  for (const comments of [
    [{ ...comment, authorId: "someone" }],
    [{ ...comment, parentId: "a" }],
    [
      { ...comment, parentId: "b" },
      { ...comment, id: "b", parentId: "a" },
    ],
  ])
    assert.equal(
      parseDemoState(JSON.stringify({ ...state, comments })),
      initialDemoState,
    );
  const invalid = {
    id: "n",
    kind: "like",
    read: false,
    sample: true,
    target: "/demo?page=feed",
    subject: "Demo",
    createdAt: "invalid",
  };
  assert.equal(
    parseDemoState(JSON.stringify({ ...state, notifications: [invalid] }))
      .notifications.length,
    0,
  );
});

test("city timestamps are stable without browser/server ICU locale differences", () => {
  assert.equal(formatCityTime("2026-11-13T07:30:00Z", "kk"), "13 қар. · 12:30");
  assert.equal(
    formatCityTime("2026-11-13T23:30:00Z", "ru"),
    "14 нояб. · 04:30",
  );
});

const rankingNow = Date.parse("2026-11-14T12:00:00+05:00");
const emptyInterestState = {
  ...initialDemoState,
  joined: [],
  following: [],
  likes: [],
  saved: [],
  comments: [],
  profile: { ...initialDemoState.profile, neighborhood: "" },
};

test("recommendations stay deterministic and discover several communities at cold start", () => {
  const first = rankForYou(emptyInterestState, posts, rankingNow).map((p) => p.id);
  const second = rankForYou(emptyInterestState, posts, rankingNow).map((p) => p.id);
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, posts.length);
  assert.ok(
    new Set(
      first.slice(0, 5).map((id) => posts.find((p) => p.id === id)?.community),
    ).size >= 3,
  );
});

test("only real local interactions and preferences increase an individual post score", () => {
  const post = posts.find((p) => p.id === "books")!;
  const base = recommendationScore(emptyInterestState, post, rankingNow);
  const interacted = {
    ...emptyInterestState,
    joined: [post.community],
    following: [authorId(post)],
    likes: [post.id],
    saved: [post.id],
    comments: [
      {
        id: "local-reply",
        post: post.id,
        authorId: "me",
        author: "Me",
        text: "Interesting",
      },
    ],
    profile: { ...emptyInterestState.profile, neighborhood: post.neighborhood || "" },
  };
  assert.ok(recommendationScore(interacted, post, rankingNow) > base);
  assert.equal(
    recommendationScore(interacted, { ...post, likes: 999999 }, rankingNow),
    recommendationScore(interacted, { ...post, likes: 0 }, rankingNow),
  );
  assert.equal(
    recommendationScore(
      { ...interacted, comments: [...interacted.comments, { ...interacted.comments[0], id: "another" }] },
      post,
      rankingNow,
    ),
    recommendationScore(interacted, post, rankingNow),
  );
});

test("freshness is bounded for future timestamps and invalid dates get no freshness", () => {
  const post = posts[0];
  const recent = { ...post, createdAt: "2026-11-14T12:00:00+05:00" };
  const future = { ...post, createdAt: "2028-01-01T00:00:00Z" };
  const old = { ...post, createdAt: "2024-01-01T00:00:00Z" };
  const invalid = { ...post, createdAt: "not-a-date" };
  const base = recommendationScore(emptyInterestState, recent, rankingNow);
  assert.equal(recommendationScore(emptyInterestState, future, rankingNow), base);
  assert.ok(recommendationScore(emptyInterestState, old, rankingNow) < base);
  assert.ok(recommendationScore(emptyInterestState, invalid, rankingNow) < base);
});

test("For You diversifies authors and communities when alternatives exist", () => {
  const sameAuthor = Array.from({ length: 5 }, (_, i) => ({
    ...posts[0],
    id: `same-${i}`,
  }));
  const alternatives = [
    { ...posts[2], id: "student-alternative" },
    { ...posts[4], id: "cafe-alternative" },
  ];
  const result = rankForYou(emptyInterestState, [...sameAuthor, ...alternatives], rankingNow);
  for (let i = 2; i < result.length; i++) {
    const triple = result.slice(i - 2, i + 1);
    assert.ok(
      !(triple.every((p) => authorId(p) === authorId(triple[0])) &&
        triple.every((p) => p.community === triple[0].community) &&
        i < 5),
      "early feed should break repeated same-author/community streaks",
    );
  }
});

test("For You respects safety and search filters before ranking, City remains chronological", () => {
  const blocked = { ...emptyInterestState, blocked: [authorId(posts[0])] };
  const options = {
    mode: "explore",
    kind: "all",
    neighborhood: "",
    query: "",
    now: rankingNow,
  };
  assert.ok(!visiblePosts(blocked, posts, options).some((p) => p.id === posts[0].id));
  assert.ok(!visiblePosts(emptyInterestState, posts, { ...options, query: "nonexistent-search-string" }).length);
  assert.deepEqual(
    visiblePosts(emptyInterestState, posts, { ...options, mode: "city" }).map((p) => p.id),
    posts.map((p) => p.id),
  );
});
