import { posts, type DemoPost } from "./demo";
import type { DemoState } from "./demo-store";
export type DemoComment = {
  id: string;
  post: string;
  text: string;
  author: string;
  authorId: string;
  parentId?: string;
  deleted?: boolean;
  edited?: boolean;
  createdAt?: string;
};
export type LocalNotice = {
  id: string;
  kind: "reply" | "like" | "follow" | "community";
  read: boolean;
  createdAt: string;
  sample: boolean;
  target: string;
  subject: string;
};
export const authorId = (p: DemoPost) => (p.own ? "me" : p.authorId || p.id);
export const username = (id: string) =>
  id === "me" ? "neighbor" : id.replace(/[^a-z0-9_-]/g, "");
export function isHidden(state: DemoState, id: string) {
  return state.muted.includes(id) || state.blocked.includes(id);
}
export function localNotice(
  kind: LocalNotice["kind"],
  target: string,
  subject: string,
  sample = false,
): LocalNotice {
  return {
    id: crypto.randomUUID(),
    kind,
    target,
    subject,
    sample,
    read: false,
    createdAt: new Date().toISOString(),
  };
}
export function activity(state: DemoState, notice: LocalNotice): DemoState {
  return {
    ...state,
    notifications: [notice, ...state.notifications].slice(0, 100),
  };
}
export function sampleComment(
  post: DemoPost,
  lang: "kk" | "ru",
): DemoComment[] {
  return post.own
    ? []
    : [
        {
          id: `sample-${post.id}`,
          post: post.id,
          text:
            lang === "ru"
              ? "Отличная идея! Давайте открывать наш город вместе 🌿"
              : "Керемет идея! Қаламызды бірге таниық 🌿",
          author:
            lang === "ru" ? "Мадина · демопрофиль" : "Мәдина · демопрофиль",
          authorId: "madina",
        },
      ];
}
export function visiblePosts(
  state: DemoState,
  all: DemoPost[],
  options: {
    mode: string;
    neighborhood: string;
    kind: string;
    query: string;
    now?: number;
  },
) {
  const now =
    options.now ??
    Math.max(0, ...all.map((p) => Date.parse(p.createdAt || "") || 0));
  const filtered = all.filter(
    (p) =>
      !isHidden(state, authorId(p)) &&
      (options.mode !== "mine" || state.joined.includes(p.community)) &&
      (!options.neighborhood || p.neighborhood === options.neighborhood) &&
      (options.kind === "all" || p.kind === options.kind) &&
      `${p.titleRu} ${p.titleKk} ${p.bodyRu} ${p.bodyKk}`
        .toLocaleLowerCase()
        .includes(options.query.trim().toLocaleLowerCase()),
  );
  const timestamp = (p: DemoPost) => Date.parse(p.createdAt || "") || 0;
  const score = (p: DemoPost) =>
    (state.joined.includes(p.community) ? 20 : 0) +
    (state.following.includes(authorId(p)) ? 8 : 0) +
    Math.max(0, 12 - (now - timestamp(p)) / 3600000) +
    Number(state.likes.includes(p.id)) * 2 +
    state.comments.filter((c) => c.post === p.id && !c.deleted).length;
  return filtered.sort((a, b) =>
    options.mode === "explore"
      ? score(b) - score(a) || timestamp(b) - timestamp(a)
      : timestamp(b) - timestamp(a),
  );
}
export function profileFor(state: DemoState, id: string, lang: "ru" | "kk") {
  if (!id || id === "me")
    return {
      id: "me",
      name: state.profile.name,
      bio: state.profile.bio,
      avatar: state.profile.avatar,
      username: state.profile.username,
      neighborhood: state.profile.neighborhood,
    };
  const p = posts.find((p) => authorId(p) === id);
  return p
    ? {
        id,
        name: lang === "ru" ? p.authorRu : p.authorKk,
        bio:
          lang === "ru"
            ? "Знакомлюсь с городом и его людьми. Демопрофиль."
            : "Қаланы және оның тұрғындарын танимын. Демопрофиль.",
        avatar: p.initials,
        username: username(id),
        neighborhood: p.neighborhood,
      }
    : undefined;
}
