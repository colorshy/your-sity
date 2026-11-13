"use client";
import { useMemo, useSyncExternalStore } from "react";
import { communities, type DemoPost } from "./demo";
import { activeCity, contentTypes } from "./city-data";
import type { DemoComment, LocalNotice } from "./social-demo";
export type DemoState = {
  lang: "kk" | "ru";
  theme: "light" | "dark";
  joined: string[];
  likes: string[];
  saved: string[];
  posts: DemoPost[];
  comments: DemoComment[];
  profile: {
    name: string;
    bio: string;
    avatar: string;
    username: string;
    neighborhood: string;
  };
  following: string[];
  muted: string[];
  blocked: string[];
  notifications: LocalNotice[];
  reports: { id: string; target: string; reason: string; createdAt: string }[];
};
// Keep the existing key and migrate additively so the previous demo is not lost.
const key = "your-city-demo-v2";
export const initialDemoState: DemoState = {
  lang: "kk",
  theme: "light",
  joined: ["events", "neighborhoods"],
  likes: [],
  saved: [],
  posts: [],
  comments: [],
  profile: {
    name: "Демо тұрғын",
    bio: "",
    avatar: "🌿",
    username: "neighbor",
    neighborhood: "",
  },
  following: [],
  muted: [],
  blocked: [],
  notifications: [],
  reports: [],
};
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const district = (v: unknown) =>
  v === undefined ||
  v === "" ||
  activeCity.neighborhoods.some((n) => n.id === v);
export function parseDemoState(raw: string): DemoState {
  try {
    const v = JSON.parse(raw);
    const initial = initialDemoState;
    if (
      !v ||
      !["kk", "ru"].includes(v.lang) ||
      !["light", "dark"].includes(v.theme) ||
      ![v.joined, v.likes, v.saved].every(strings) ||
      !Array.isArray(v.posts) ||
      !Array.isArray(v.comments) ||
      typeof v.profile?.name !== "string" ||
      typeof v.profile.bio !== "string" ||
      typeof v.profile.avatar !== "string"
    )
      return initial;
    if (
      !v.posts.every(
        (p: DemoPost) =>
          p &&
          [
            p.id,
            p.titleRu,
            p.titleKk,
            p.bodyRu,
            p.bodyKk,
            p.authorRu,
            p.authorKk,
            p.initials,
            p.time,
          ].every((x) => typeof x === "string") &&
          p.own === true &&
          communities.some((c) => c.id === p.community) &&
          district(p.neighborhood) &&
          (!p.kind || contentTypes.some((t) => t.id === p.kind)) &&
          (!p.image ||
            [
              "/demo/city.svg",
              "/demo/books.svg",
              "/demo/mountains.jpg",
            ].includes(p.image)) &&
          (!p.createdAt || Number.isFinite(Date.parse(p.createdAt))) &&
          (!p.quoteId || typeof p.quoteId === "string"),
      )
    )
      return initial;
    if (
      !v.comments.every(
        (c: DemoComment) =>
          c &&
          [c.id, c.post, c.text, c.author].every(
            (x) => typeof x === "string",
          ) &&
          (!c.parentId || typeof c.parentId === "string") &&
          (!c.authorId || c.authorId === "me"),
      )
    )
      return initial;
    const ids = new Set<string>();
    for (const c of v.comments as DemoComment[]) {
      if (ids.has(c.id) || c.id === c.parentId) return initial;
      ids.add(c.id);
      const visited = new Set<string>([c.id]);
      let parent = c.parentId;
      while (parent) {
        if (visited.has(parent)) return initial;
        visited.add(parent);
        const ancestor = (v.comments as DemoComment[]).find(
          (x) => x.id === parent,
        );
        if (ancestor && ancestor.post !== c.post) return initial;
        parent = ancestor?.parentId;
      }
    }
    const notifications = Array.isArray(v.notifications)
      ? v.notifications
          .filter(
            (n: LocalNotice) =>
              n &&
              [n.id, n.target, n.subject, n.createdAt].every(
                (x) => typeof x === "string",
              ) &&
              ["reply", "like", "follow", "community"].includes(n.kind) &&
              typeof n.read === "boolean" &&
              typeof n.sample === "boolean" &&
              Number.isFinite(Date.parse(n.createdAt)),
          )
          .slice(0, 100)
      : [];
    return {
      ...initial,
      lang: v.lang,
      theme: v.theme,
      joined: v.joined,
      likes: v.likes,
      saved: v.saved,
      posts: v.posts,
      comments: v.comments.map((c: DemoComment) => ({ ...c, authorId: "me" })),
      profile: {
        ...v.profile,
        username:
          typeof v.profile.username === "string" &&
          /^[a-z0-9_]{3,24}$/.test(v.profile.username)
            ? v.profile.username
            : "neighbor",
        neighborhood: district(v.profile.neighborhood)
          ? v.profile.neighborhood || ""
          : "",
      },
      following: strings(v.following) ? v.following : [],
      muted: strings(v.muted) ? v.muted : [],
      blocked: strings(v.blocked) ? v.blocked : [],
      notifications,
      reports: Array.isArray(v.reports)
        ? v.reports.filter(
            (r: DemoState["reports"][number]) =>
              r &&
              [r.id, r.target, r.reason, r.createdAt].every(
                (x) => typeof x === "string",
              ),
          )
        : [],
    };
  } catch {
    return initialDemoState;
  }
}
let memory = "";
let sessionOnly = false;
const subscribers = new Set<() => void>();
function subscribe(callback: () => void) {
  subscribers.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  if (sessionOnly) return memory;
  try {
    return localStorage.getItem(key) || memory;
  } catch {
    return memory;
  }
}
export function useDemoState() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const state = useMemo(() => parseDemoState(raw), [raw]);
  function update(change: (previous: DemoState) => DemoState) {
    const next = JSON.stringify(change(parseDemoState(snapshot())));
    memory = next;
    let persisted = !sessionOnly;
    try {
      localStorage.setItem(key, next);
    } catch {
      persisted = false;
      sessionOnly = true;
    }
    subscribers.forEach((c) => c());
    return persisted;
  }
  return [state, update, !sessionOnly] as const;
}
