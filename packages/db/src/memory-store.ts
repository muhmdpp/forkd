import type { FeedbackReason, SpotStats } from "@forkd/core";
import { randomUUID } from "node:crypto";
import { buildSampleData } from "./sample-data";
import type { Category, NewSpot, NewVisit, Profile, SpotRow, Store, VisitRecord } from "./types";

const clone = <T>(x: T): T => structuredClone(x);

/** Demo-mode store: sample data in process memory. Resets when the server restarts. */
export class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private categories: Category[];
  private spots = new Map<string, SpotRow>();
  private visits: VisitRecord[];
  private profiles = new Map<string, Profile>();
  private feedback = new Map<string, Map<string, FeedbackReason>>();
  private hits = new Map<string, number[]>();

  constructor() {
    const data = buildSampleData();
    this.categories = data.categories;
    for (const s of data.spots) this.spots.set(s.id, s);
    for (const p of data.profiles) this.profiles.set(p.uid, p);
    this.visits = data.visits;
  }

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
    const row: SpotRow = { ...spot, id: randomUUID(), createdAt: new Date(), stats: null, ratings: {} };
    this.spots.set(row.id, row);
    return clone(row);
  }
  async setSpotStats(spotId: string, stats: SpotStats) {
    const s = this.spots.get(spotId);
    if (s) s.stats = clone(stats);
  }

  async addVisits(visits: NewVisit[]) {
    for (const v of visits) {
      this.visits.push({ ...v, id: randomUUID(), createdAt: new Date() });
      const s = this.spots.get(v.spotId);
      if (s) s.ratings[v.userId] = v.rating;
    }
  }
  async listSpotVisits(spotId: string) {
    return clone(this.visits.filter((v) => v.spotId === spotId));
  }
  async listUserVisits(userId: string) {
    return clone(this.visits.filter((v) => v.userId === userId));
  }

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

  async getProfile(uid: string) {
    const p = this.profiles.get(uid);
    return p ? clone(p) : null;
  }
  async createProfile(profile: Profile) {
    if (!this.profiles.has(profile.uid)) this.profiles.set(profile.uid, clone(profile));
    return clone(this.profiles.get(profile.uid)!);
  }
  async markOnboarded(uid: string) {
    const p = this.profiles.get(uid);
    if (p && !p.onboardedAt) p.onboardedAt = new Date();
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
