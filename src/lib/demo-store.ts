"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { DemoPost } from "./demo";
export type DemoState = {
  lang: "kk" | "ru";
  theme: "light" | "dark";
  joined: string[];
  likes: string[];
  saved: string[];
  posts: DemoPost[];
  comments: { id: string; post: string; text: string; author: string }[];
  profile: { name: string; bio: string; avatar: string };
};
const key = "your-city-demo-v2";
const initial: DemoState = {
  lang: "kk",
  theme: "light",
  joined: ["events", "neighborhoods"],
  likes: [],
  saved: [],
  posts: [],
  comments: [],
  profile: { name: "Демо тұрғын", bio: "", avatar: "🌿" },
};
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
function parse(raw: string): DemoState {
  try {
    const v = JSON.parse(raw);
    if (
      !v ||
      !["kk", "ru"].includes(v.lang) ||
      !["light", "dark"].includes(v.theme) ||
      ![v.joined, v.likes, v.saved].every(
        (a) => Array.isArray(a) && a.every((x) => typeof x === "string"),
      ) ||
      !Array.isArray(v.posts) ||
      !v.posts.every(
        (p: DemoPost) =>
          p &&
          typeof p.id === "string" &&
          typeof p.bodyRu === "string" &&
          typeof p.bodyKk === "string" &&
          typeof p.titleRu === "string" &&
          typeof p.titleKk === "string" &&
          typeof p.authorRu === "string" &&
          typeof p.authorKk === "string" &&
          typeof p.initials === "string" &&
          typeof p.time === "string" &&
          typeof p.likes === "number" &&
          [
            "drivers",
            "discounts",
            "city-news",
            "students",
            "neighborhoods",
            "events",
            "marketplace",
          ].includes(p.community) &&
          (!p.image ||
            [
              "/demo/city.svg",
              "/demo/books.svg",
              "/demo/mountains.jpg",
            ].includes(p.image)) &&
          p.own === true,
      ) ||
      !Array.isArray(v.comments) ||
      !v.comments.every(
        (c: { text: string; post: string; author: string }) =>
          c &&
          typeof c.text === "string" &&
          typeof c.post === "string" &&
          typeof c.author === "string",
      ) ||
      typeof v.profile?.name !== "string" ||
      typeof v.profile?.bio !== "string" ||
      typeof v.profile?.avatar !== "string"
    )
      return initial;
    return v as DemoState;
  } catch {
    return initial;
  }
}
export function useDemoState() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const state = useMemo(() => parse(raw), [raw]);
  function update(change: (previous: DemoState) => DemoState) {
    const next = JSON.stringify(change(parse(snapshot())));
    memory = next;
    let persisted = true;
    try {
      localStorage.setItem(key, next);
    } catch {
      persisted = false;
      sessionOnly = true;
    }
    subscribers.forEach((callback) => callback());
    return persisted;
  }
  return [state, update] as const;
}
