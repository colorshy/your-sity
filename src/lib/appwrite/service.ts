import { createHash, randomUUID } from "node:crypto";
import type { Actor, Repository, Post } from "./types";
import { AccessError, owner, text, validId } from "./policy";
export const membershipId = (user: string, community: string) =>
  createHash("sha256")
    .update(JSON.stringify([user, community]))
    .digest("hex")
    .slice(0, 32);
const id = () => randomUUID().replaceAll("-", "");
export class CityService {
  constructor(
    readonly repo: Repository,
    readonly actor: Actor,
    readonly moderators: readonly string[] = [],
  ) {
    if (!validId(actor.id)) throw new AccessError();
  }
  async profile() {
    let p = await this.repo.get("profiles", this.actor.id);
    if (p) owner(this.actor.id, p.user_id);
    else {
      const matches = await this.repo.list(
        "profiles",
        [{ field: "user_id", value: this.actor.id }],
        { limit: 2 },
      );
      if (matches.length > 1)
        throw new AccessError("Duplicate profiles require backend review");
      p = matches[0] ?? null;
    }
    return p;
  }
  async ensureProfile() {
    const existing = await this.profile();
    if (existing) return existing;
    try {
      return await this.repo.create("profiles", this.actor.id, {
        user_id: this.actor.id,
        display_name:
          this.actor.name.trim().length >= 2 &&
          this.actor.name.trim().length <= 80
            ? this.actor.name.trim()
            : "Тұрғын",
        city_id: "shymkent",
        locale: "kk",
        onboarded: false,
      });
    } catch (error) {
      const p = await this.profile();
      if (p) return p;
      throw error;
    }
  }
  async resident() {
    const p = await this.profile();
    if (!p?.onboarded || !p.city_id)
      throw new AccessError("Onboarding required");
    return p;
  }
  async cities() {
    return this.repo.list("cities", [], { limit: 100 });
  }
  async communities() {
    const p = await this.resident();
    return this.repo.list(
      "communities",
      [{ field: "city_id", value: p.city_id }],
      { limit: 100 },
    );
  }
  async memberships() {
    return this.repo.list(
      "community_memberships",
      [{ field: "user_id", value: this.actor.id }],
      { limit: 100 },
    );
  }
  async community(cid: string) {
    const p = await this.resident();
    const c = validId(cid) ? await this.repo.get("communities", cid) : null;
    if (!c || c.city_id !== p.city_id) throw new AccessError();
    return c;
  }
  async joined(cid: string) {
    await this.community(cid);
    const rows = await this.repo.list(
      "community_memberships",
      [
        { field: "user_id", value: this.actor.id },
        { field: "community_id", value: cid },
      ],
      { limit: 2 },
    );
    if (!rows.length) throw new AccessError("Join community first");
  }
  async onboard(
    name: string,
    city: string,
    communities: string[],
    locale: string,
  ) {
    name = text(name, 2, 80);
    if (
      !validId(city) ||
      communities.length > 30 ||
      !communities.every(validId) ||
      !["ru", "kk"].includes(locale)
    )
      throw new AccessError("Invalid input");
    await this.ensureProfile();
    await this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const p = await svc.profile();
      if (!p || (p.onboarded && p.city_id !== city))
        throw new AccessError("City changes require administrator");
      if (!(await repo.get("cities", city))) throw new AccessError();
      const selected = [...new Set(communities)];
      for (const cid of selected) {
        const c = await repo.get("communities", cid);
        if (c?.city_id !== city) throw new AccessError();
      }
      const old = await svc.memberships();
      if (old.length >= 100) throw new AccessError("Too many memberships");
      for (const m of old)
        if (!selected.includes(m.community_id))
          await repo.delete("community_memberships", m.id);
      for (const cid of selected)
        if (!old.some((m) => m.community_id === cid))
          await repo.create(
            "community_memberships",
            membershipId(this.actor.id, cid),
            { user_id: this.actor.id, community_id: cid },
          );
      await repo.update("profiles", p.id, {
        display_name: name,
        city_id: city,
        locale,
        onboarded: true,
      });
    });
  }
  async membership(cid: string, join: boolean) {
    await this.community(cid);
    if (join) {
      const matches = await this.repo.list(
        "community_memberships",
        [
          { field: "user_id", value: this.actor.id },
          { field: "community_id", value: cid },
        ],
        { limit: 2 },
      );
      if (matches.length > 1)
        throw new AccessError("Duplicate memberships require backend review");
      if (matches.length === 1) return;
      if ((await this.memberships()).length >= 100) throw new AccessError();
      try {
        await this.repo.create(
          "community_memberships",
          membershipId(this.actor.id, cid),
          { user_id: this.actor.id, community_id: cid },
        );
      } catch (error) {
        const existing = await this.repo.get(
          "community_memberships",
          membershipId(this.actor.id, cid),
        );
        if (
          existing?.user_id !== this.actor.id ||
          existing.community_id !== cid
        )
          throw error;
      }
    } else {
      const rows = await this.repo.list(
        "community_memberships",
        [
          { field: "user_id", value: this.actor.id },
          { field: "community_id", value: cid },
        ],
        { limit: 100 },
      );
      for (const row of rows)
        await this.repo.delete("community_memberships", row.id);
    }
  }
  async updateProfile(name: string, locale: string) {
    const p = await this.resident();
    if (!["ru", "kk"].includes(locale)) throw new AccessError();
    return this.repo.update("profiles", p.id, {
      display_name: text(name, 2, 80),
      locale,
    });
  }
  async posts(mode: string, page = 1, community?: string) {
    const cs = community
      ? [await this.community(community)]
      : await this.communities();
    let ids = cs.map((c) => c.id);
    if (mode === "mine") {
      const memberships = await this.memberships();
      ids = ids.filter((cid) =>
        memberships.some((m) => m.community_id === cid),
      );
    }
    if (!ids.length) return [];
    return this.repo.list(
      "posts",
      [
        { field: "community_id", value: ids },
        { field: "status", value: "published" },
      ],
      {
        limit: 21,
        offset: (Math.max(1, Math.min(page, 1000)) - 1) * 20,
        desc: true,
      },
    );
  }
  async post(pid: string) {
    const p = validId(pid) ? await this.repo.get("posts", pid) : null;
    if (!p) throw new AccessError();
    await this.community(p.community_id);
    if (p.status !== "published" && p.author_id !== this.actor.id)
      throw new AccessError();
    return p;
  }
  async comments(pid: string, page = 1) {
    await this.post(pid);
    return this.repo.list(
      "comments",
      [
        { field: "post_id", value: pid },
        { field: "status", value: "published" },
      ],
      {
        limit: 21,
        offset: (Math.max(1, Math.min(page, 1000)) - 1) * 20,
        desc: true,
      },
    );
  }
  async createPost(cid: string, body: string) {
    body = text(body, 1, 5000);
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      await svc.joined(cid);
      return repo.create("posts", id(), {
        author_id: this.actor.id,
        community_id: cid,
        body,
        status: "published",
      });
    });
  }
  async editPost(pid: string, body: string) {
    body = text(body, 1, 5000);
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const p = await svc.post(pid);
      owner(this.actor.id, p.author_id);
      await svc.joined(p.community_id);
      if (p.status !== "published")
        throw new AccessError("Moderated content cannot be edited");
      return repo.update("posts", pid, { body });
    });
  }
  async deletePost(pid: string) {
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const p = await svc.post(pid);
      owner(this.actor.id, p.author_id);
      await repo.update("posts", pid, { status: "deleted", body: "[deleted]" });
    });
  }
  async createComment(pid: string, body: string) {
    body = text(body, 1, 2000);
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const p = await svc.post(pid);
      if (p.status !== "published") throw new AccessError();
      await svc.joined(p.community_id);
      return repo.create("comments", id(), {
        author_id: this.actor.id,
        post_id: pid,
        body,
        status: "published",
      });
    });
  }
  async editComment(cid: string, body: string) {
    if (!validId(cid)) throw new AccessError();
    body = text(body, 1, 2000);
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const c = await repo.get("comments", cid);
      if (!c) throw new AccessError();
      owner(this.actor.id, c.author_id);
      const p = await svc.post(c.post_id);
      await svc.joined(p.community_id);
      if (c.status !== "published" || p.status !== "published")
        throw new AccessError();
      return repo.update("comments", cid, { body });
    });
  }
  async deleteComment(cid: string) {
    if (!validId(cid)) throw new AccessError();
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const c = await repo.get("comments", cid);
      if (!c) throw new AccessError();
      owner(this.actor.id, c.author_id);
      await svc.post(c.post_id);
      await repo.update("comments", cid, {
        status: "deleted",
        body: "[deleted]",
      });
    });
  }
  async report(pid: string, reason: string) {
    const p = await this.post(pid);
    if (p.status !== "published") throw new AccessError();
    const rid = membershipId(this.actor.id, pid);
    await this.repo.create("reports", rid, {
      post_id: pid,
      reporter_id: this.actor.id,
      reason: text(reason, 5, 1000),
      status: "open",
    });
  }
  isModerator() {
    return this.moderators.includes(this.actor.id);
  }
  async reports(page = 1) {
    if (!this.isModerator()) throw new AccessError();
    return this.repo.list("reports", [{ field: "status", value: "open" }], {
      limit: 21,
      offset: (Math.max(1, Math.min(page, 1000)) - 1) * 20,
      desc: true,
    });
  }
  async resolveReport(rid: string, decision: string) {
    if (
      !this.isModerator() ||
      !validId(rid) ||
      !["hide", "dismiss"].includes(decision)
    )
      throw new AccessError();
    await this.repo.transaction(async (repo) => {
      const report = await repo.get("reports", rid);
      if (!report || report.status !== "open") throw new AccessError();
      if (decision === "hide") {
        const post = await repo.get("posts", report.post_id);
        if (!post) throw new AccessError();
        if (post.status !== "deleted")
          await repo.update("posts", post.id, { status: "hidden" });
      }
      await repo.update("reports", rid, {
        status: decision === "hide" ? "resolved" : "dismissed",
      });
    });
  }
  async authors(posts: Pick<Post, "author_id">[]) {
    const out = [];
    for (const uid of [...new Set(posts.map((p) => p.author_id))]) {
      const byId = await this.repo.get("profiles", uid);
      const p =
        byId ??
        (
          await this.repo.list("profiles", [{ field: "user_id", value: uid }], {
            limit: 1,
          })
        )[0];
      if (p && p.user_id === uid)
        out.push({ id: uid, display_name: p.display_name });
    }
    return out;
  }
}
