import {
  type FeedbackSignal,
  type SpotFeatures,
  type SpotStats,
  type VisitSignal,
  computeGlobalMean,
  computeSpotStats,
} from "@forkd/core";
import { isDemoMode } from "./firebase";
import { createFirestoreStore, seedIfEmpty } from "./firestore-store";
import { MemoryStore } from "./memory-store";
import type { Category, NewVisit, Profile, SpotRow, Store, VisitRecord } from "./types";

/* ------------------------------------------------------------------ */
/* Store singleton                                                     */
/* ------------------------------------------------------------------ */

const g = globalThis as unknown as { __forkdStore?: Promise<Store> };

/** The app's store: Firestore when configured, otherwise in-memory sample data. */
export function getStore(): Promise<Store> {
  if (!g.__forkdStore) {
    g.__forkdStore = (async () => {
      // FORKD_STORE=memory forces sample data (used to test Firebase Auth without Firestore).
      if (isDemoMode || process.env.FORKD_STORE === "memory") {
        console.warn("[forkd] Firebase not configured: running in demo mode with in-memory sample data.");
        return new MemoryStore();
      }
      const store = createFirestoreStore();
      await seedIfEmpty(store.db);
      return store;
    })();
    g.__forkdStore.catch(() => {
      g.__forkdStore = undefined; // let the next request retry
    });
  }
  return g.__forkdStore;
}

/* ------------------------------------------------------------------ */
/* City model (cached briefly per server instance)                     */
/* ------------------------------------------------------------------ */

export interface CityModel {
  cityId: string;
  spots: SpotRow[];
  spotsById: Map<string, SpotRow>;
  features: Map<string, SpotFeatures>;
  stats: Map<string, SpotStats>;
  /** userId -> spotId -> latest rating */
  matrix: Map<string, Map<string, number>>;
  globalMean: number;
  categories: Category[];
  categoryById: Map<string, Category>;
}

const CACHE_MS = 30_000;
const cityCache = new Map<string, { at: number; model: Promise<CityModel> }>();

export function invalidateCity(cityId: string) {
  cityCache.delete(cityId);
}

async function buildCityModel(store: Store, cityId: string): Promise<CityModel> {
  const [spots, categories] = await Promise.all([store.listCitySpots(cityId), store.listCategories()]);
  const matrix = new Map<string, Map<string, number>>();
  let sum = 0;
  let n = 0;
  for (const s of spots) {
    for (const [uid, r] of Object.entries(s.ratings)) {
      let m = matrix.get(uid);
      if (!m) matrix.set(uid, (m = new Map()));
      m.set(s.id, r);
      sum += r;
      n++;
    }
  }
  const globalMean = n ? sum / n : computeGlobalMean([]);
  const stats = new Map<string, SpotStats>();
  for (const s of spots) stats.set(s.id, s.stats ?? computeSpotStats(s.id, [], globalMean));
  return {
    cityId,
    spots,
    spotsById: new Map(spots.map((s) => [s.id, s])),
    features: new Map(spots.map((s) => [s.id, { id: s.id, categories: s.categories, spice: s.spice, priceBand: s.priceBand }])),
    stats,
    matrix,
    globalMean,
    categories,
    categoryById: new Map(categories.map((c) => [c.id, c])),
  };
}

export async function loadCityModel(cityId: string): Promise<CityModel> {
  const hit = cityCache.get(cityId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.model;
  const store = await getStore();
  const model = buildCityModel(store, cityId);
  cityCache.set(cityId, { at: Date.now(), model });
  model.catch(() => cityCache.delete(cityId));
  return model;
}

/**
 * The city model with this user's own latest ratings overlaid, so their feed reflects a rating
 * the moment it is saved, even if another server instance still has a cached model.
 */
export async function loadCityModelFor(uid: string, cityId: string): Promise<{ model: CityModel; feedback: FeedbackSignal[] }> {
  const store = await getStore();
  const [base, visits, feedback] = await Promise.all([loadCityModel(cityId), store.listUserVisits(uid), store.listFeedback(uid)]);
  const mine = new Map<string, number>();
  for (const v of [...visits].reverse()) if (base.spotsById.has(v.spotId)) mine.set(v.spotId, v.rating);
  const matrix = new Map(base.matrix);
  matrix.set(uid, mine);
  return { model: { ...base, matrix }, feedback };
}

/* ------------------------------------------------------------------ */
/* Spots                                                               */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;

/** Latest visit per user counts once, so nobody can stack a score. */
function latestPerUser(visits: VisitRecord[]): VisitRecord[] {
  const seen = new Map<string, VisitRecord>();
  for (const v of visits) {
    const cur = seen.get(v.userId);
    if (!cur || v.createdAt > cur.createdAt) seen.set(v.userId, v);
  }
  return [...seen.values()];
}

/** Recomputes a spot's stats, dishes, revisit share, trending count and (if missing) cover. */
export async function recomputeSpot(store: Store, spotId: string): Promise<void> {
  const spot = await store.getSpot(spotId);
  if (!spot) return;
  const [visits, model] = await Promise.all([store.listSpotVisits(spotId), loadCityModel(spot.cityId)]);
  const signals: VisitSignal[] = latestPerUser(visits).map((v) => ({
    userId: v.userId,
    spotId: v.spotId,
    rating: v.rating,
    expectation: v.expectation,
    heardFrom: v.heardFrom,
    hypeVote: v.hypeVote,
    weight: Math.max(0.2, v.weight),
  }));
  const logs = visits.filter((v) => v.source === "log");
  const dishes: Record<string, number> = {};
  for (const v of logs) for (const d of v.dishes) dishes[d] = (dishes[d] ?? 0) + 1;
  const answered = logs.filter((v) => v.wouldReturn !== null);
  const now = Date.now();
  const firstPhoto = logs.find((v) => v.photos.length)?.photos[0] ?? null;
  await store.updateSpotDerived(spotId, {
    stats: computeSpotStats(spotId, signals, model.globalMean),
    dishes,
    revisitShare: answered.length ? answered.filter((v) => v.wouldReturn).length / answered.length : null,
    recent30: logs.filter((v) => now - v.createdAt.getTime() < 30 * DAY).length,
    ...(spot.coverUrl ? {} : { coverUrl: firstPhoto }),
  });
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export function slugHandle(raw: string) {
  return (
    raw
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9._]+/g, "_")
      .replace(/^[._]+|[._]+$/g, "")
      .slice(0, 20) || "foodie"
  );
}

export async function ensureProfile(uid: string, name: string, email: string | null): Promise<Profile> {
  const store = await getStore();
  const existing = await store.getProfile(uid);
  if (existing) return existing;
  const base = slugHandle(name || email?.split("@")[0] || "foodie");
  let handle = base;
  for (let i = 0; i < 5 && (await store.getProfileByHandle(handle)); i++) {
    handle = `${base.slice(0, 16)}${Math.floor(100 + Math.random() * 900)}`;
  }
  return store.createProfile({
    uid,
    name: name || handle,
    handle,
    bio: "",
    avatarUrl: null,
    homeCityId: "kozhikode",
    cravings: [],
    trustScore: 0.4,
    onboardedAt: null,
    isSample: false,
    followers: 0,
    following: 0,
    experiences: 0,
    createdAt: new Date(),
  });
}

/* ------------------------------------------------------------------ */
/* Experiences                                                         */
/* ------------------------------------------------------------------ */

export type ExperienceInput = Pick<
  NewVisit,
  "rating" | "expectation" | "heardFrom" | "hypeVote" | "review" | "dishes" | "photos" | "wouldReturn" | "source"
> & { spotId: string };

export async function recordExperiences(author: Profile, inputs: ExperienceInput[]): Promise<string[]> {
  const store = await getStore();
  const spots = new Map<string, SpotRow>();
  for (const i of inputs) {
    if (!spots.has(i.spotId)) {
      const s = await store.getSpot(i.spotId);
      if (!s) throw new Error("That spot doesn't exist any more.");
      spots.set(i.spotId, s);
    }
  }
  const visits: NewVisit[] = inputs.map((i) => {
    const s = spots.get(i.spotId)!;
    return {
      ...i,
      userId: author.uid,
      handle: author.handle,
      name: author.name,
      avatarUrl: author.avatarUrl,
      spotSlug: s.slug,
      spotName: s.name,
      cityId: s.cityId,
      weight: author.trustScore,
    };
  });
  const ids = await store.addVisits(visits);
  for (const i of inputs) if (i.source === "log") await store.deleteFeedback(author.uid, i.spotId);
  for (const id of spots.keys()) await recomputeSpot(store, id);
  const logs = inputs.filter((i) => i.source === "log").length;
  if (logs) await store.incrementCounter(author.uid, "experiences", logs);
  for (const s of spots.values()) invalidateCity(s.cityId);
  return ids;
}

export async function deleteExperience(uid: string, visitId: string): Promise<VisitRecord | null> {
  const store = await getStore();
  const v = await store.getVisit(visitId);
  if (!v || v.userId !== uid) return null;
  await store.deleteVisit(visitId);
  await recomputeSpot(store, v.spotId);
  if (v.source === "log") await store.incrementCounter(uid, "experiences", -1);
  invalidateCity(v.cityId);
  return v;
}

/* ------------------------------------------------------------------ */
/* Social                                                              */
/* ------------------------------------------------------------------ */

const actor = (p: Profile) => ({ actorUid: p.uid, actorHandle: p.handle, actorName: p.name, actorAvatar: p.avatarUrl });

export async function setLike(viewer: Profile, visitId: string, liked: boolean) {
  const store = await getStore();
  const changed = await store.setLike(visitId, viewer.uid, liked);
  if (changed && liked) {
    const v = await store.getVisit(visitId);
    if (v && v.userId !== viewer.uid) {
      await store.addNotification(v.userId, { type: "like", ...actor(viewer), visitId, spotName: v.spotName, text: null });
    }
  }
}

export async function addComment(viewer: Profile, visitId: string, text: string) {
  const store = await getStore();
  const v = await store.getVisit(visitId);
  if (!v) throw new Error("That experience was deleted.");
  const c = await store.addComment({ visitId, uid: viewer.uid, handle: viewer.handle, name: viewer.name, avatarUrl: viewer.avatarUrl, text });
  if (v.userId !== viewer.uid) {
    await store.addNotification(v.userId, { type: "comment", ...actor(viewer), visitId, spotName: v.spotName, text: text.slice(0, 140) });
  }
  return c;
}

export async function setFollow(viewer: Profile, targetUid: string, follow: boolean) {
  if (viewer.uid === targetUid) return;
  const store = await getStore();
  const changed = await store.setFollow(viewer.uid, targetUid, follow);
  if (changed && follow) {
    await store.addNotification(targetUid, { type: "follow", ...actor(viewer), visitId: null, spotName: null, text: null });
  }
}
