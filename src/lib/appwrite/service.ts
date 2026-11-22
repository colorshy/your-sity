import { createHash, randomUUID } from "node:crypto";
import type {
  Actor,
  Repository,
  Post,
  Table,
  Filter,
  Rows,
  Notification,
  Connection,
} from "./types";
import { rankForYou } from "../recommendations";
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
    if (!p?.onboarded || p.city_id !== "shymkent")
      throw new AccessError("Onboarding required");
    return p;
  }
  async cities() {
    return (await this.repo.list("cities", [], { limit: 100 })).filter(
      (c) => c.id === "shymkent",
    );
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
      city !== "shymkent" ||
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
  // Beta safety bounds: never silently truncate privacy lists or eligible records.
  async allRows<K extends Table>(
    table: K,
    filters: Filter[] = [],
    desc = false,
  ): Promise<Rows[K][]> {
    const result: Rows[K][] = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const batch = await this.repo.list(table, filters, {
        limit: 100,
        offset,
        desc,
      });
      result.push(...batch);
      if (batch.length < 100) return result;
    }
    throw new AccessError("Beta dataset limit reached");
  }
  async connections() {
    await this.resident();
    return this.allRows("connections", [
      { field: "user_id", value: this.actor.id },
    ]);
  }
  async hiddenAuthors() {
    const mine = await this.connections();
    const inbound = await this.allRows("connections", [
      { field: "target_id", value: this.actor.id },
      { field: "kind", value: "block" },
    ]);
    return new Set([
      ...mine.filter((c) => c.kind !== "follow").map((c) => c.target_id),
      ...inbound.map((c) => c.user_id),
    ]);
  }
  async posts(mode: string, page = 1, community?: string, now = Date.now()) {
    const cs = community
      ? [await this.community(community)]
      : await this.communities();
    let ids = cs.map((c) => c.id);
    const memberships = await this.memberships();
    if (mode === "mine")
      ids = ids.filter((cid) =>
        memberships.some((m) => m.community_id === cid),
      );
    if (!ids.length) return [];
    const hidden = await this.hiddenAuthors();
    let eligible = (
      await this.allRows(
        "posts",
        [
          { field: "community_id", value: ids },
          { field: "status", value: "published" },
        ],
        true,
      )
    ).filter((p) => !hidden.has(p.author_id));
    if (mode === "for-you") {
      const [connections, likes, saved, comments] = await Promise.all([
        this.connections(),
        this.allRows("post_likes", [
          { field: "user_id", value: this.actor.id },
        ]),
        this.allRows("bookmarks", [{ field: "user_id", value: this.actor.id }]),
        this.allRows("comments", [
          { field: "author_id", value: this.actor.id },
          { field: "status", value: "published" },
        ]),
      ]);
      // Rank a bounded recent candidate window; no demo fixture or browser state is used.
      eligible = rankForYou(
        {
          joined: memberships.map((m) => m.community_id),
          following: connections
            .filter((c) => c.kind === "follow")
            .map((c) => c.target_id),
          likes: likes.map((l) => l.post_id),
          saved: saved.map((b) => b.post_id),
          comments: comments.map((c) => ({
            post: c.post_id,
            authorId: "me",
            deleted: false,
          })),
          profile: { neighborhood: "" },
          blocked: [...hidden],
          muted: [],
        },
        eligible.slice(0, 200).map((p) => ({
          ...p,
          community: p.community_id,
          authorId: p.author_id,
          createdAt: p.created_at,
        })),
        now,
      );
    }
    const offset = (Math.max(1, Math.min(page, 1000)) - 1) * 20;
    return eligible.slice(offset, offset + 21);
  }
  async post(pid: string) {
    const p = validId(pid) ? await this.repo.get("posts", pid) : null;
    if (!p) throw new AccessError();
    await this.community(p.community_id);
    if ((await this.hiddenAuthors()).has(p.author_id)) throw new AccessError();
    if (p.status !== "published" && p.author_id !== this.actor.id)
      throw new AccessError();
    return p;
  }
  async comments(pid: string, page = 1) {
    await this.post(pid);
    const hidden = await this.hiddenAuthors();
    const rows = await this.allRows(
      "comments",
      [
        { field: "post_id", value: pid },
        { field: "status", value: ["published", "deleted"] },
      ],
      true,
    );
    const visible = rows.filter(
      (c) =>
        !hidden.has(c.author_id) &&
        (c.status === "published" ||
          rows.some(
            (reply) =>
              reply.parent_id === c.id &&
              reply.status === "published" &&
              !hidden.has(reply.author_id),
          )),
    );
    const offset = (Math.max(1, Math.min(page, 1000)) - 1) * 20;
    return visible.slice(offset, offset + 21);
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
  async createComment(pid: string, body: string, parentId = "") {
    body = text(body, 1, 2000);
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const p = await svc.post(pid);
      if (p.status !== "published") throw new AccessError();
      await svc.joined(p.community_id);
      let recipient = p.author_id;
      if (parentId) {
        if (!validId(parentId)) throw new AccessError();
        const parent = await repo.get("comments", parentId);
        if (
          !parent ||
          parent.post_id !== pid ||
          parent.status !== "published" ||
          (await svc.hiddenAuthors()).has(parent.author_id)
        )
          throw new AccessError();
        recipient = parent.author_id;
      }
      await svc.fenceParticipants([p.author_id, recipient]);
      const comment = await repo.create("comments", id(), {
        author_id: this.actor.id,
        post_id: pid,
        parent_id: parentId || null,
        body,
        status: "published",
      });
      await svc.notify(
        recipient,
        parentId ? "reply" : "comment",
        comment.id,
        pid,
        comment.id,
      );
      if (parentId && p.author_id !== recipient)
        await svc.notify(p.author_id, "comment", comment.id, pid, comment.id);
      return comment;
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
      await svc.fenceParticipants([p.author_id]);
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
      const post = await svc.post(c.post_id);
      await svc.fenceParticipants([post.author_id]);
      await repo.update("comments", cid, {
        status: "deleted",
        body: "[deleted]",
      });
    });
  }
  async report(pid: string, reason: string, commentId = "") {
    const p = await this.post(pid);
    if (p.status !== "published") throw new AccessError();
    if (commentId) {
      if (!validId(commentId)) throw new AccessError();
      const c = await this.repo.get("comments", commentId);
      if (
        !c ||
        c.post_id !== pid ||
        c.status !== "published" ||
        (await this.hiddenAuthors()).has(c.author_id)
      )
        throw new AccessError();
    }
    const rid = membershipId(
      this.actor.id,
      commentId ? JSON.stringify([pid, commentId]) : pid,
    );
    await this.repo.create("reports", rid, {
      comment_id: commentId || null,
      post_id: pid,
      reporter_id: this.actor.id,
      reason: text(reason, 5, 1000),
      status: "open",
    });
  }
  async target(uid: string) {
    if (!validId(uid) || uid === this.actor.id) throw new AccessError();
    const mine = await this.resident();
    const matches = await this.repo.list(
      "profiles",
      [{ field: "user_id", value: uid }],
      { limit: 2 },
    );
    const p = matches[0];
    if (matches.length !== 1 || !p.onboarded || p.city_id !== mine.city_id)
      throw new AccessError();
    return { id: p.user_id, display_name: p.display_name };
  }
  // Touch shared participant rows inside the transaction. Block and interaction
  // writers then conflict even when the connection query originally found no row.
  private async fenceParticipants(uids: string[]) {
    for (const uid of [...new Set([this.actor.id, ...uids])].sort()) {
      const participant = new CityService(this.repo, { id: uid, name: "" });
      const profile = await participant.resident();
      await this.repo.update("profiles", profile.id, { social_version: id() });
    }
  }
  async notify(
    recipient: string,
    kind: Notification["kind"],
    event: string,
    postId?: string,
    commentId?: string,
  ) {
    if (recipient === this.actor.id) return;
    const receiver = new CityService(this.repo, { id: recipient, name: "" });
    await receiver.resident();
    if (
      (await receiver.hiddenAuthors()).has(this.actor.id) ||
      (await this.hiddenAuthors()).has(recipient)
    )
      return;
    const nid = membershipId(recipient, JSON.stringify([kind, event]));
    if (await this.repo.get("notifications", nid)) return;
    await this.repo.create("notifications", nid, {
      recipient_id: recipient,
      actor_id: this.actor.id,
      kind,
      post_id: postId || null,
      comment_id: commentId || null,
      is_read: false,
    });
  }
  async interact(pid: string, kind: "like" | "bookmark", enabled: boolean) {
    if (!["like", "bookmark"].includes(kind)) throw new AccessError();
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      const p = await svc.post(pid);
      if (p.status !== "published") throw new AccessError();
      await svc.fenceParticipants([p.author_id]);
      const table = kind === "like" ? "post_likes" : "bookmarks";
      const rid = membershipId(this.actor.id, pid);
      const existing = await repo.get(table, rid);
      if (existing) {
        owner(this.actor.id, existing.user_id);
        if (existing.post_id !== pid) throw new AccessError();
      }
      if (enabled && !existing) {
        await repo.create(table, rid, { user_id: this.actor.id, post_id: pid });
        if (kind === "like") await svc.notify(p.author_id, "like", rid, pid);
      } else if (!enabled && existing) await repo.delete(table, rid);
    });
  }
  async connection(uid: string, kind: Connection["kind"], enabled: boolean) {
    if (!["follow", "mute", "block"].includes(kind)) throw new AccessError();
    return this.repo.transaction(async (repo) => {
      const svc = new CityService(repo, this.actor);
      await svc.target(uid);
      await svc.fenceParticipants([uid]);
      const rid = membershipId(this.actor.id, JSON.stringify([kind, uid]));
      const existing = await repo.get("connections", rid);
      if (existing) {
        owner(this.actor.id, existing.user_id);
        if (existing.target_id !== uid || existing.kind !== kind)
          throw new AccessError();
      }
      // Permit removing preferences even when the other user has blocked the viewer.
      if (enabled && kind === "follow" && (await svc.hiddenAuthors()).has(uid))
        throw new AccessError();
      if (enabled && !existing) {
        await repo.create("connections", rid, {
          user_id: this.actor.id,
          target_id: uid,
          kind,
        });
        if (kind === "follow") await svc.notify(uid, "follow", rid);
      } else if (!enabled && existing) await repo.delete("connections", rid);
      if (enabled && kind === "block") {
        for (const [from, to] of [
          [this.actor.id, uid],
          [uid, this.actor.id],
        ]) {
          const follows = await svc.allRows("connections", [
            { field: "user_id", value: from },
            { field: "target_id", value: to },
            { field: "kind", value: "follow" },
          ]);
          for (const follow of follows)
            await repo.delete("connections", follow.id);
        }
      }
    });
  }
  async postInteractions(pid: string) {
    await this.post(pid);
    const likes = await this.allRows("post_likes", [
      { field: "post_id", value: pid },
    ]);
    const hidden = await this.hiddenAuthors();
    return {
      count: likes.filter((l) => !hidden.has(l.user_id)).length,
      liked: !!(await this.repo.get(
        "post_likes",
        membershipId(this.actor.id, pid),
      )),
      bookmarked: !!(await this.repo.get(
        "bookmarks",
        membershipId(this.actor.id, pid),
      )),
    };
  }
  async postInteractionsBatch(posts: Pick<Post, "id">[]) {
    const ids = [...new Set(posts.map((p) => p.id))];
    if (!ids.length)
      return {} as Record<
        string,
        { likes: number; comments: number; liked: boolean; bookmarked: boolean }
      >;
    const [likes, comments, bookmarks, hidden] = await Promise.all([
      this.allRows("post_likes", [{ field: "post_id", value: ids }]),
      this.allRows("comments", [
        { field: "post_id", value: ids },
        { field: "status", value: "published" },
      ]),
      this.allRows("bookmarks", [{ field: "user_id", value: this.actor.id }]),
      this.hiddenAuthors(),
    ]);
    return Object.fromEntries(
      ids.map((pid) => [
        pid,
        {
          likes: likes.filter(
            (l) => l.post_id === pid && !hidden.has(l.user_id),
          ).length,
          comments: comments.filter(
            (c) => c.post_id === pid && !hidden.has(c.author_id),
          ).length,
          liked: likes.some(
            (l) => l.post_id === pid && l.user_id === this.actor.id,
          ),
          bookmarked: bookmarks.some((b) => b.post_id === pid),
        },
      ]),
    );
  }
  async ownPosts(page = 1) {
    const communities = new Set((await this.communities()).map((c) => c.id));
    const posts = (
      await this.allRows(
        "posts",
        [
          { field: "author_id", value: this.actor.id },
          { field: "status", value: "published" },
        ],
        true,
      )
    ).filter((p) => communities.has(p.community_id));
    const offset = (Math.max(1, page) - 1) * 20;
    return posts.slice(offset, offset + 21);
  }
  async savedPosts(page = 1) {
    await this.resident();
    const saved = await this.allRows(
      "bookmarks",
      [{ field: "user_id", value: this.actor.id }],
      true,
    );
    const hidden = await this.hiddenAuthors();
    const communities = new Set((await this.communities()).map((c) => c.id));
    const posts: Post[] = [];
    for (const item of saved) {
      const p = await this.repo.get("posts", item.post_id);
      if (
        p?.status === "published" &&
        communities.has(p.community_id) &&
        !hidden.has(p.author_id)
      )
        posts.push(p);
    }
    const offset = (Math.max(1, page) - 1) * 20;
    return posts.slice(offset, offset + 21);
  }
  async notifications(page = 1) {
    const hidden = await this.hiddenAuthors();
    const rows = await this.allRows(
      "notifications",
      [{ field: "recipient_id", value: this.actor.id }],
      true,
    );
    const result: Notification[] = [];
    for (const n of rows) {
      if (hidden.has(n.actor_id)) continue;
      if (n.post_id) {
        try {
          if ((await this.post(n.post_id)).status !== "published") continue;
        } catch (error) {
          if (error instanceof AccessError) continue;
          throw error;
        }
      }
      if (n.comment_id) {
        const c = await this.repo.get("comments", n.comment_id);
        if (!c || c.status !== "published" || c.post_id !== n.post_id) continue;
      }
      result.push(n);
    }
    const offset = (Math.max(1, page) - 1) * 20;
    return result.slice(offset, offset + 21);
  }
  async readNotification(nid: string) {
    await this.resident();
    if (!validId(nid)) throw new AccessError();
    const n = await this.repo.get("notifications", nid);
    if (!n) throw new AccessError();
    owner(this.actor.id, n.recipient_id);
    await this.repo.update("notifications", nid, { is_read: true });
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
        if (report.comment_id) {
          const comment = await repo.get("comments", report.comment_id);
          if (!comment || comment.post_id !== post.id) throw new AccessError();
          if (comment.status !== "deleted")
            await repo.update("comments", comment.id, { status: "hidden" });
        } else if (post.status !== "deleted")
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
