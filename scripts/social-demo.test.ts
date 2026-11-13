import { test } from "node:test";
import assert from "node:assert/strict";
import { initialDemoState, parseDemoState } from "../src/lib/demo-store";
import { visiblePosts, authorId } from "../src/lib/social-demo";
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
