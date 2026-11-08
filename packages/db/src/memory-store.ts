import type { FeedbackReason } from "@forkd/core";
import { randomUUID } from "node:crypto";
import { buildSampleData } from "./sample-data";
import type {
  Category,
  Collection,
  Comment,
  CounterField,
  NewSpot,
  NewVisit,
  Notification,
  Photo,
  Profile,
  ProfilePatch,
  SpotDerived,
  SpotRow,
  Store,
  VisitRecord,
} from "./types";

const clone = <T>(x: T): T => structuredClone(x);
const newest = <T extends { createdAt: Date }>(a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime();

/** Demo-mode store: sample data in process memory. Resets when the server restarts. */
export class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private categories: Category[];
  private spots = new Map<string, SpotRow>();
  private visits = new Map<string, VisitRecord>();
  private profiles = new Map<string, Profile>();
  private feedback = new Map<string, Map<string, FeedbackReason>>();
  private saved = new Map<string, Set<string>>();
  private follows = new Set<string>(); // "a>b"
  private likes = new Set<string>(); // "visit|uid"
  private comments: Comment[] = [];
  private collections = new Map<string, Collection>();
  private notifications = new Map<string, Notification[]>();
  private photos = new Map<string, Photo>();
  private hits = new Map<string, number[]>();

  constructor() {
    const data = buildSampleData();
    this.categories = data.categories;
    for (const s of data.spots) this.spots.set(s.id, s);
    for (const p of data.profiles) this.profiles.set(p.uid, p);
    for (const v of data.visits) this.visits.set(v.id, v);
    for (const [a, b] of data.follows) this.follows.add(`${a}>${b}`);
    for (const [v, u] of data.likes) this.likes.add(`${v}|${u}`);
    this.comments = data.comments;
    for (const c of data.collections) this.collections.set(c.id, c);
  }

  // spots
  async listCategories() {
    return clone(this.categories);
  }
  async listCitySpots(cityId: string) {
    return clone([...this.spots.values()].filter((s) => s.cityId === cityId && s.status === "live"));
  }
  async getSpot(id: string) {
    const s = this.spots.get(id);
    return s ? clone(s) : null;
  }
  async getSpotBySlug(slug: string) {
    const s = [...this.spots.values()].find((x) => x.slug === slug);
    return s ? clone(s) : null;
  }
  async createSpot(spot: NewSpot) {
    const row: SpotRow = { ...spot, id: randomUUID(), createdAt: new Date(), stats: null, ratings: {}, dishes: {}, revisitShare: null, recent30: 0 };
    this.spots.set(row.id, row);
    return clone(row);
  }
  async updateSpotDerived(spotId: string, patch: SpotDerived) {
    const s = this.spots.get(spotId);
    if (!s) return;
    const { coverUrl, ...rest } = patch;
    Object.assign(s, clone(rest));
    if (coverUrl !== undefined) s.coverUrl = coverUrl;
  }

  // experiences
  async addVisits(visits: NewVisit[]) {
    const ids: string[] = [];
    for (const v of visits) {
      const id = randomUUID();
      this.visits.set(id, { ...clone(v), id, likeCount: 0, commentCount: 0, createdAt: new Date() });
      const s = this.spots.get(v.spotId);
      if (s) s.ratings[v.userId] = v.rating;
      ids.push(id);
    }
    return ids;
  }
  async getVisit(id: string) {
    const v = this.visits.get(id);
    return v ? clone(v) : null;
  }
  async deleteVisit(id: string) {
    const v = this.visits.get(id);
    if (!v) return;
    this.visits.delete(id);
    const s = this.spots.get(v.spotId);
    if (s) {
      const latest = [...this.visits.values()].filter((x) => x.spotId === v.spotId && x.userId === v.userId).sort(newest)[0];
      if (latest) s.ratings[v.userId] = latest.rating;
      else delete s.ratings[v.userId];
    }
  }
  async listSpotVisits(spotId: string) {
    return clone([...this.visits.values()].filter((v) => v.spotId === spotId).sort(newest));
  }
  async listUserVisits(userId: string) {
    return clone([...this.visits.values()].filter((v) => v.userId === userId).sort(newest));
  }
  async listVisitsByUsers(userIds: string[], limit: number) {
    const set = new Set(userIds);
    return clone(
      [...this.visits.values()]
        .filter((v) => set.has(v.userId) && v.source === "log")
        .sort(newest)
        .slice(0, limit),
    );
  }

  // likes & comments
  async setLike(visitId: string, uid: string, liked: boolean) {
    const key = `${visitId}|${uid}`;
    const v = this.visits.get(visitId);
    if (!v || this.likes.has(key) === liked) return false;
    if (liked) this.likes.add(key);
    else this.likes.delete(key);
    v.likeCount = Math.max(0, v.likeCount + (liked ? 1 : -1));
    return true;
  }
  async likedVisitIds(uid: string, visitIds: string[]) {
    return new Set(visitIds.filter((id) => this.likes.has(`${id}|${uid}`)));
  }
  async addComment(c: Omit<Comment, "id" | "createdAt">) {
    const row: Comment = { ...c, id: randomUUID(), createdAt: new Date() };
    this.comments.push(row);
    const v = this.visits.get(c.visitId);
    if (v) v.commentCount++;
    return clone(row);
  }
  async listComments(visitId: string) {
    return clone(this.comments.filter((c) => c.visitId === visitId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
  }

  // feedback & saves
  async listFeedback(userId: string) {
    return [...(this.feedback.get(userId) ?? new Map())].map(([spotId, reason]) => ({ spotId, reason }));
  }
  async setFeedback(userId: string, spotId: string, reason: FeedbackReason) {
    let m = this.feedback.get(userId);
    if (!m) this.feedback.set(userId, (m = new Map()));
    m.set(spotId, reason);
  }
  async deleteFeedback(userId: string, spotId: string) {
    this.feedback.get(userId)?.delete(spotId);
  }
  async setSaved(uid: string, spotId: string, saved: boolean) {
    let s = this.saved.get(uid);
    if (!s) this.saved.set(uid, (s = new Set()));
    if (saved) s.add(spotId);
    else s.delete(spotId);
  }
  async listSaved(uid: string) {
    return [...(this.saved.get(uid) ?? [])].reverse();
  }

  // people
  async getProfile(uid: string) {
    const p = this.profiles.get(uid);
    return p ? clone(p) : null;
  }
  async getProfileByHandle(handle: string) {
    const p = [...this.profiles.values()].find((x) => x.handle === handle);
    return p ? clone(p) : null;
  }
  async getProfiles(uids: string[]) {
    return uids.map((u) => this.profiles.get(u)).filter((p): p is Profile => Boolean(p)).map(clone);
  }
  async createProfile(profile: Profile) {
    if (!this.profiles.has(profile.uid)) this.profiles.set(profile.uid, clone(profile));
    return clone(this.profiles.get(profile.uid)!);
  }
  async updateProfile(uid: string, patch: ProfilePatch) {
    const p = this.profiles.get(uid);
    if (p) Object.assign(p, clone(patch));
  }
  async incrementCounter(uid: string, field: CounterField, by: number) {
    const p = this.profiles.get(uid);
    if (p) p[field] = Math.max(0, p[field] + by);
  }
  async setFollow(a: string, b: string, follow: boolean) {
    const key = `${a}>${b}`;
    if (this.follows.has(key) === follow) return false;
    if (follow) this.follows.add(key);
    else this.follows.delete(key);
    return true;
  }
  async isFollowing(a: string, b: string) {
    return this.follows.has(`${a}>${b}`);
  }
  async listFollowing(uid: string) {
    return [...this.follows].filter((k) => k.startsWith(`${uid}>`)).map((k) => k.slice(uid.length + 1));
  }
  async listFollowers(uid: string) {
    return [...this.follows].filter((k) => k.endsWith(`>${uid}`)).map((k) => k.slice(0, k.length - uid.length - 1));
  }

  // collections
  async createCollection(c: Omit<Collection, "id" | "createdAt" | "updatedAt">) {
    const row: Collection = { ...clone(c), id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    this.collections.set(row.id, row);
    return clone(row);
  }
  async getCollection(id: string) {
    const c = this.collections.get(id);
    return c ? clone(c) : null;
  }
  async setCollectionSpot(id: string, spotId: string, included: boolean) {
    const c = this.collections.get(id);
    if (!c) return;
    c.spotIds = included ? [...new Set([...c.spotIds, spotId])] : c.spotIds.filter((s) => s !== spotId);
    c.updatedAt = new Date();
  }
  async listUserCollections(uid: string) {
    return clone([...this.collections.values()].filter((c) => c.ownerUid === uid));
  }
  async listPublicCollections(limit: number) {
    return clone([...this.collections.values()].filter((c) => c.isPublic && c.spotIds.length > 0).slice(0, limit));
  }

  // notifications
  async addNotification(uid: string, n: Omit<Notification, "id" | "createdAt" | "read">) {
    const list = this.notifications.get(uid) ?? [];
    list.unshift({ ...clone(n), id: randomUUID(), read: false, createdAt: new Date() });
    this.notifications.set(uid, list.slice(0, 200));
  }
  async listNotifications(uid: string, limit: number) {
    return clone((this.notifications.get(uid) ?? []).slice(0, limit));
  }
  async markNotificationsRead(uid: string) {
    for (const n of this.notifications.get(uid) ?? []) n.read = true;
  }

  // photos
  async putPhoto(photo: Omit<Photo, "id" | "createdAt">) {
    const id = randomUUID();
    this.photos.set(id, { ...photo, id, createdAt: new Date() });
    return id;
  }
  async getPhoto(id: string) {
    return this.photos.get(id) ?? null;
  }

  async hitRateLimit(uid: string, key: string, limit: number, windowMs: number) {
    const k = `${uid}:${key}`;
    const now = Date.now();
    const recent = (this.hits.get(k) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      this.hits.set(k, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(k, recent);
    return true;
  }
}
