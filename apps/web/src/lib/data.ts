import "server-only";
import {
  type ExplainLookup,
  type Prediction,
  type SpotStats,
  createContext,
  explainReason,
  explainWarning,
  predict,
  recommend,
} from "@forkd/core";
import {
  type CityModel,
  type Collection,
  type Profile,
  type SpotRow,
  type VisitRecord,
  getStore,
  loadCityModel,
  loadCityModelFor,
} from "@forkd/db";
import { redirect } from "next/navigation";
import { getViewer } from "./auth";

export const DEFAULT_CITY = "kozhikode";
export const CITY_NAME: Record<string, string> = { kozhikode: "Kozhikode" };

/* ------------------------------------------------------------------ */
/* Viewer                                                              */
/* ------------------------------------------------------------------ */

/** Signed-in, onboarded viewer or a redirect. */
export async function requireViewer(next = "/", { allowNew = false } = {}): Promise<Profile> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (!allowNew && !viewer.onboardedAt) redirect("/onboarding");
  return viewer;
}

export async function hasUnread(uid: string) {
  const store = await getStore();
  const list = await store.listNotifications(uid, 20);
  return list.some((n) => !n.read);
}

/* ------------------------------------------------------------------ */
/* Spot cards                                                          */
/* ------------------------------------------------------------------ */

export function lookupFor(model: CityModel): ExplainLookup {
  return {
    spotName: (id) => model.spotsById.get(id)?.name ?? "a spot you rated",
    categoryLabel: (id) => model.categoryById.get(id)?.label ?? id,
  };
}

export interface SpotCard {
  spot: SpotRow;
  stats: SpotStats;
  categoryText: string;
  match: number | null;
  predicted: number | null;
  reasons: string[];
  warnings: string[];
}

export function spotCard(model: CityModel, spot: SpotRow, p?: Prediction): SpotCard {
  const l = lookupFor(model);
  return {
    spot,
    stats: model.stats.get(spot.id)!,
    categoryText: spot.categories.map(l.categoryLabel).join(", "),
    match: p ? p.match : null,
    predicted: p ? p.predicted : null,
    reasons: p ? p.reasons.map((r) => explainReason(r, l)) : [],
    warnings: p ? p.warnings.map((w) => explainWarning(w, l)) : [],
  };
}

async function contextFor(viewer: Profile) {
  const { model, feedback } = await loadCityModelFor(viewer.uid, viewer.homeCityId);
  const ctx = createContext({
    userId: viewer.uid,
    spots: model.features,
    stats: model.stats,
    matrix: model.matrix,
    feedback: [
      ...feedback,
      // Cravings from onboarding act as gentle positive signals until real ratings take over.
    ],
    globalMean: model.globalMean,
  });
  // Cravings: a small boost to chosen categories, fading as the person rates more spots.
  const boost = Math.max(0, 0.5 - ctx.taste.ratedCount * 0.05);
  for (const c of viewer.cravings) ctx.taste.affinity[c] = (ctx.taste.affinity[c] ?? 0) + boost;
  return { model, ctx, hidden: new Set(feedback.map((f) => f.spotId)) };
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

export async function getForYou(viewer: Profile) {
  const { model, ctx, hidden } = await contextFor(viewer);
  const picks = recommend(ctx, { exclude: hidden, limit: 8 }).map((p) => spotCard(model, model.spotsById.get(p.spotId)!, p));
  const skip = model.spots
    .filter((s) => !ctx.mine.has(s.id) && !hidden.has(s.id))
    .map((s) => predict(model.features.get(s.id)!, ctx))
    .filter((p) => model.stats.get(p.spotId)!.hypeLabel === "overhyped" && p.predicted < 3.5)
    .sort((a, b) => a.predicted - b.predicted)
    .slice(0, 3)
    .map((p) => spotCard(model, model.spotsById.get(p.spotId)!, p));
  return { picks, skip, ratedCount: ctx.mine.size };
}

export interface ExperienceView extends VisitRecord {
  liked: boolean;
  coverUrl: string | null;
}

async function withLikes(viewer: Profile | null, visits: VisitRecord[], cityId = DEFAULT_CITY): Promise<ExperienceView[]> {
  const store = await getStore();
  const model = await loadCityModel(cityId);
  const liked = viewer ? await store.likedVisitIds(viewer.uid, visits.map((v) => v.id)) : new Set<string>();
  return visits.map((v) => ({ ...v, liked: liked.has(v.id), coverUrl: model.spotsById.get(v.spotId)?.coverUrl ?? null }));
}

export async function getFollowingFeed(viewer: Profile) {
  const store = await getStore();
  const following = await store.listFollowing(viewer.uid);
  const visits = (await store.listVisitsByUsers(following, 40)).filter((v) => v.review || v.photos.length);
  const feed = await withLikes(viewer, visits, viewer.homeCityId);
  // Suggest people who rate like you and you don't follow yet.
  const { ctx } = await contextFor(viewer);
  const skip = new Set([...following, viewer.uid]);
  const twinIds = ctx.neighbours.map((n) => n.userId).filter((u) => !skip.has(u)).slice(0, 6);
  const twins = await store.getProfiles(twinIds);
  const simById = new Map(ctx.neighbours.map((n) => [n.userId, n.similarity]));
  return {
    feed,
    following: following.length,
    suggestions: twins.map((p) => ({ profile: p, similarity: Math.round((simById.get(p.uid) ?? 0) * 100) })),
  };
}

/* ------------------------------------------------------------------ */
/* Explore & search                                                    */
/* ------------------------------------------------------------------ */

export interface CollectionCard extends Collection {
  covers: string[];
}

export async function collectionCards(model: CityModel, collections: Collection[]): Promise<CollectionCard[]> {
  return collections.map((c) => ({
    ...c,
    covers: c.spotIds
      .map((id) => model.spotsById.get(id)?.coverUrl)
      .filter((x): x is string => Boolean(x))
      .slice(0, 3),
  }));
}

export async function getExplore(cityId: string) {
  const store = await getStore();
  const model = await loadCityModel(cityId);
  const trending = [...model.spots]
    .sort((a, b) => b.recent30 - a.recent30 || model.stats.get(b.id)!.bayes - model.stats.get(a.id)!.bayes)
    .slice(0, 8)
    .map((s) => spotCard(model, s));
  const gems = model.spots
    .filter((s) => model.stats.get(s.id)!.hypeLabel === "hidden_gem")
    .sort((a, b) => (model.stats.get(b.id)!.hypeGap ?? 0) - (model.stats.get(a.id)!.hypeGap ?? 0))
    .slice(0, 6)
    .map((s) => spotCard(model, s));
  const top = [...model.spots]
    .sort((a, b) => model.stats.get(b.id)!.bayes - model.stats.get(a.id)!.bayes)
    .slice(0, 5)
    .map((s) => spotCard(model, s));
  const collections = await collectionCards(model, await store.listPublicCollections(8));
  return { categories: model.categories, trending, gems, top, collections };
}

export type ListSort = "best" | "gems" | "hyped" | "you";

export async function getSpotList(cityId: string, viewer: Profile | null, category: string, sort: ListSort) {
  const model = await loadCityModel(cityId);
  let spots = model.spots.filter((s) => category === "all" || s.categories.includes(category));
  let preds = new Map<string, Prediction>();
  if (sort === "you" && viewer) {
    const { ctx } = await contextFor(viewer);
    preds = new Map(spots.map((s) => [s.id, predict(model.features.get(s.id)!, ctx)]));
    spots = spots.sort((a, b) => preds.get(b.id)!.predicted - preds.get(a.id)!.predicted);
  } else if (sort === "gems") {
    spots = spots
      .filter((s) => model.stats.get(s.id)!.hypeGap !== null && model.stats.get(s.id)!.hypeLabel !== "not_enough_data")
      .sort((a, b) => (model.stats.get(b.id)!.hypeGap ?? 0) - (model.stats.get(a.id)!.hypeGap ?? 0));
  } else if (sort === "hyped") {
    spots = spots.sort((a, b) => (model.stats.get(b.id)!.avgExpectation ?? 0) - (model.stats.get(a.id)!.avgExpectation ?? 0));
  } else {
    spots = spots.sort((a, b) => model.stats.get(b.id)!.bayes - model.stats.get(a.id)!.bayes);
  }
  return {
    category: model.categoryById.get(category) ?? null,
    categories: model.categories,
    rows: spots.map((s) => spotCard(model, s, preds.get(s.id))),
  };
}

export async function searchAll(cityId: string, q: string) {
  const store = await getStore();
  const model = await loadCityModel(cityId);
  const needle = q.trim().toLowerCase();
  if (!needle) return { spots: [], people: [] };
  const spots = model.spots
    .filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.area.toLowerCase().includes(needle) ||
        Object.keys(s.dishes).some((d) => d.toLowerCase().includes(needle)) ||
        s.categories.some((c) => (model.categoryById.get(c)?.label ?? c).toLowerCase().includes(needle)),
    )
    .slice(0, 20)
    .map((s) => spotCard(model, s));
  const exact = needle.replace(/^@/, "");
  const person = await store.getProfileByHandle(exact);
  return { spots, people: person ? [person] : [] };
}

/* ------------------------------------------------------------------ */
/* Spot                                                                */
/* ------------------------------------------------------------------ */

export async function getSpotBySlug(slug: string) {
  const store = await getStore();
  const spot = await store.getSpotBySlug(slug);
  if (!spot || spot.status !== "live") return null;
  const model = await loadCityModel(spot.cityId);
  return { spot: model.spotsById.get(spot.id) ?? spot, model };
}

export async function getSpotPage(slug: string, viewer: Profile | null) {
  const found = await getSpotBySlug(slug);
  if (!found) return null;
  const { spot, model } = found;
  const store = await getStore();
  const visits = await store.listSpotVisits(spot.id);
  const logs = visits.filter((v) => v.source === "log");
  const card = spotCard(model, spot);
  let prediction: SpotCard | null = null;
  let mine: VisitRecord | null = null;
  let saved = false;
  let myCollections: Collection[] = [];
  if (viewer) {
    mine = visits.find((v) => v.userId === viewer.uid) ?? null;
    const { ctx } = await contextFor(viewer);
    prediction = spotCard(model, spot, predict(model.features.get(spot.id)!, ctx));
    const [savedIds, cols] = await Promise.all([store.listSaved(viewer.uid), store.listUserCollections(viewer.uid)]);
    saved = savedIds.includes(spot.id);
    myCollections = cols;
  }
  const experiences = await withLikes(
    viewer,
    logs.filter((v) => v.review || v.photos.length),
    spot.cityId,
  );
  const dishes = Object.entries(spot.dishes)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      photo: logs.find((v) => v.dishes.includes(name) && v.photos.length)?.photos[0] ?? null,
    }));
  return { ...card, prediction, mine, saved, myCollections, experiences, dishes, logCount: logs.length };
}

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

export async function getExperience(id: string, viewer: Profile | null) {
  const store = await getStore();
  const v = await store.getVisit(id);
  if (!v || v.source !== "log") return null;
  const [view] = await withLikes(viewer, [v], v.cityId);
  const comments = await store.listComments(id);
  const model = await loadCityModel(v.cityId);
  const spot = model.spotsById.get(v.spotId) ?? null;
  return { experience: view!, comments, spot, stats: spot ? model.stats.get(spot.id)! : null };
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export async function getProfilePage(handle: string, viewer: Profile | null) {
  const store = await getStore();
  const profile = await store.getProfileByHandle(handle);
  if (!profile) return null;
  const isMe = viewer?.uid === profile.uid;
  const [visits, collections, following, savedIds] = await Promise.all([
    store.listUserVisits(profile.uid),
    store.listUserCollections(profile.uid),
    viewer && !isMe ? store.isFollowing(viewer.uid, profile.uid) : Promise.resolve(false),
    isMe ? store.listSaved(profile.uid) : Promise.resolve([] as string[]),
  ]);
  const model = await loadCityModel(profile.homeCityId);
  const experiences = await withLikes(viewer, visits.filter((v) => v.source === "log"), profile.homeCityId);
  const saved = savedIds.map((id) => model.spotsById.get(id)).filter((s): s is SpotRow => Boolean(s)).map((s) => spotCard(model, s));
  const cards = await collectionCards(model, collections.filter((c) => c.isPublic || isMe));
  return { profile, isMe, following, experiences, collections: cards, saved };
}

export async function getPeople(uids: string[]) {
  const store = await getStore();
  return store.getProfiles(uids);
}

/* ------------------------------------------------------------------ */
/* Onboarding & taste                                                  */
/* ------------------------------------------------------------------ */

export async function getRateDeck(viewer: Profile, limit = 12) {
  const { model, ctx, hidden } = await contextFor(viewer);
  const preferred = new Set(viewer.cravings);
  return model.spots
    .filter((s) => !ctx.mine.has(s.id) && !hidden.has(s.id))
    .sort((a, b) => {
      const pa = a.categories.some((c) => preferred.has(c)) ? 1 : 0;
      const pb = b.categories.some((c) => preferred.has(c)) ? 1 : 0;
      return pb - pa || model.stats.get(b.id)!.count - model.stats.get(a.id)!.count;
    })
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      name: s.name,
      area: s.area,
      coverUrl: s.coverUrl,
      categoryText: s.categories.map((c) => model.categoryById.get(c)?.label ?? c).join(", "),
      mustOrder: s.mustOrder,
      priceBand: s.priceBand,
    }));
}

export async function getTaste(viewer: Profile) {
  const { model, ctx } = await contextFor(viewer);
  const categories = model.categories
    .map((c) => ({ id: c.id, label: c.label, affinity: ctx.taste.affinity[c.id] ?? 0 }))
    .sort((a, b) => b.affinity - a.affinity);
  return { taste: ctx.taste, categories, rated: ctx.mine.size };
}

export async function getCategories(cityId = DEFAULT_CITY) {
  return (await loadCityModel(cityId)).categories;
}
