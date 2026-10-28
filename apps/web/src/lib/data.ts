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
import { type CityModel, type SpotRow, getDb, loadCityModel, loadUserFeedback, schema } from "@forkd/db";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { cache } from "react";

export const getCityModel = cache((cityId: string) => loadCityModel(getDb(), cityId));

export function lookupFor(model: CityModel): ExplainLookup {
  return {
    spotName: (id) => model.spotsById.get(id)?.name ?? "a spot you rated",
    categoryLabel: (id) => model.categoryLabels.get(id)?.label ?? id,
  };
}

export interface SpotCard {
  spot: SpotRow;
  stats: SpotStats;
  hue: number;
  categoryText: string;
  match: number;
  predicted: number;
  reasons: string[];
  warnings: string[];
}

function card(model: CityModel, p: Prediction): SpotCard {
  const spot = model.spotsById.get(p.spotId)!;
  const l = lookupFor(model);
  return {
    spot,
    stats: model.stats.get(spot.id)!,
    hue: model.categoryLabels.get(spot.categories[0] ?? "")?.hue ?? 30,
    categoryText: spot.categories.map(l.categoryLabel).join(" · "),
    match: p.match,
    predicted: p.predicted,
    reasons: p.reasons.map((r) => explainReason(r, l)),
    warnings: p.warnings.map((w) => explainWarning(w, l)),
  };
}

export function spotMeta(model: CityModel, spot: SpotRow) {
  const l = lookupFor(model);
  return {
    hue: model.categoryLabels.get(spot.categories[0] ?? "")?.hue ?? 30,
    categoryText: spot.categories.map(l.categoryLabel).join(" · "),
    stats: model.stats.get(spot.id)!,
  };
}

async function contextFor(userId: string, model: CityModel) {
  const feedback = await loadUserFeedback(getDb(), userId);
  const ctx = createContext({
    userId,
    spots: model.features,
    stats: model.stats,
    matrix: model.matrix,
    feedback,
    globalMean: model.globalMean,
  });
  return { ctx, hidden: new Set(feedback.map((f) => f.spotId)) };
}

export async function getFeed(userId: string, cityId: string) {
  const model = await getCityModel(cityId);
  const { ctx, hidden } = await contextFor(userId, model);
  const picks = recommend(ctx, { exclude: hidden, limit: 8 }).map((p) => card(model, p));

  const hypeWarnings = model.spots
    .filter((s) => !ctx.mine.has(s.id) && !hidden.has(s.id))
    .map((s) => predict(model.features.get(s.id)!, ctx))
    .filter((p) => {
      const st = model.stats.get(p.spotId)!;
      return (st.hypeLabel === "overhyped" || st.reelShare >= 0.6) && p.predicted < 3.4;
    })
    .sort((a, b) => a.predicted - b.predicted)
    .slice(0, 3)
    .map((p) => card(model, p));

  return { ratedCount: ctx.mine.size, picks, hypeWarnings };
}

export async function getTopRated(cityId: string, limit = 5) {
  const model = await getCityModel(cityId);
  return [...model.spots]
    .sort((a, b) => model.stats.get(b.id)!.bayes - model.stats.get(a.id)!.bayes)
    .slice(0, limit)
    .map((s) => ({ spot: s, ...spotMeta(model, s) }));
}

export type ExploreSort = "best" | "you" | "gems" | "hyped";

export async function getExplore(cityId: string, userId: string | null, category: string, sort: ExploreSort) {
  const model = await getCityModel(cityId);
  let rows = model.spots
    .filter((s) => category === "all" || s.categories.includes(category))
    .map((s) => ({ spot: s, ...spotMeta(model, s), match: null as number | null }));

  if (sort === "you" && userId) {
    const { ctx } = await contextFor(userId, model);
    rows = rows.map((r) => ({ ...r, match: predict(model.features.get(r.spot.id)!, ctx).match }));
    rows.sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
  } else if (sort === "gems") {
    rows = rows.filter((r) => r.stats.hypeGap !== null && r.stats.hypeLabel !== "not_enough_data");
    rows.sort((a, b) => (b.stats.hypeGap ?? 0) - (a.stats.hypeGap ?? 0));
  } else if (sort === "hyped") {
    rows.sort((a, b) => (b.stats.avgExpectation ?? 0) - (a.stats.avgExpectation ?? 0));
  } else {
    rows.sort((a, b) => b.stats.bayes - a.stats.bayes);
  }
  const categories = [...model.categoryLabels].map(([id, c]) => ({ id, label: c.label }));
  return { rows, categories };
}

export async function getSpotBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.spots.id, cityId: schema.spots.cityId })
    .from(schema.spots)
    .where(and(eq(schema.spots.slug, slug), eq(schema.spots.status, "live")));
  if (!row) return null;
  const model = await getCityModel(row.cityId);
  const spot = model.spotsById.get(row.id);
  return spot ? { model, spot } : null;
}

export async function getSpotPage(slug: string, userId: string | null) {
  const found = await getSpotBySlug(slug);
  if (!found) return null;
  const { model, spot } = found;
  const db = getDb();

  const reviews = await db
    .select({
      id: schema.visits.id,
      rating: schema.visits.rating,
      review: schema.visits.review,
      hypeVote: schema.visits.hypeVote,
      createdAt: schema.visits.createdAt,
      handle: schema.profiles.handle,
    })
    .from(schema.visits)
    .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.visits.userId))
    .where(and(eq(schema.visits.spotId, spot.id), isNotNull(schema.visits.review)))
    .orderBy(desc(schema.visits.createdAt))
    .limit(12);

  let mine: { rating: number; review: string | null } | null = null;
  let prediction: SpotCard | null = null;
  if (userId) {
    const [v] = await db
      .select({ rating: schema.visits.rating, review: schema.visits.review })
      .from(schema.visits)
      .where(and(eq(schema.visits.spotId, spot.id), eq(schema.visits.userId, userId)))
      .orderBy(desc(schema.visits.createdAt))
      .limit(1);
    mine = v ?? null;
    if (!mine) {
      const { ctx } = await contextFor(userId, model);
      prediction = card(model, predict(model.features.get(spot.id)!, ctx));
    }
  }
  return { spot, ...spotMeta(model, spot), reviews, mine, prediction };
}

export async function getDiary(userId: string, cityId: string) {
  const db = getDb();
  const model = await getCityModel(cityId);
  const { ctx, hidden } = await contextFor(userId, model);
  const entries = await db
    .select({
      id: schema.visits.id,
      rating: schema.visits.rating,
      review: schema.visits.review,
      hypeVote: schema.visits.hypeVote,
      createdAt: schema.visits.createdAt,
      visitedOn: schema.visits.visitedOn,
      spotId: schema.visits.spotId,
      slug: schema.spots.slug,
      name: schema.spots.name,
      area: schema.spots.area,
    })
    .from(schema.visits)
    .innerJoin(schema.spots, eq(schema.spots.id, schema.visits.spotId))
    .where(and(eq(schema.visits.userId, userId), eq(schema.visits.source, "log")))
    .orderBy(desc(schema.visits.createdAt))
    .limit(200);

  const ratings = [...ctx.mine.values()];
  const categories = [...model.categoryLabels].map(([id, c]) => ({
    id,
    label: c.label,
    affinity: ctx.taste.affinity[id] ?? 0,
  }));
  categories.sort((a, b) => b.affinity - a.affinity);

  return {
    entries: entries.map((e) => {
      const s = model.spotsById.get(e.spotId);
      return { ...e, hue: s ? spotMeta(model, s).hue : 30 };
    }),
    stats: {
      rated: ratings.length,
      avg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      hidden: hidden.size,
    },
    taste: ctx.taste,
    categories,
  };
}

export async function getQuizSpots(cityId: string, limit = 10) {
  const model = await getCityModel(cityId);
  return [...model.spots]
    .sort((a, b) => model.stats.get(b.id)!.count - model.stats.get(a.id)!.count)
    .slice(0, limit)
    .map((s) => ({ id: s.id, name: s.name, area: s.area, mustOrder: s.mustOrder, priceBand: s.priceBand, ...spotMeta(model, s) }))
    .map(({ stats: _stats, ...rest }) => rest);
}

/** Spots the user hasn't rated or hidden, most visited first: the quick-rate swipe deck. */
export async function getRateDeck(userId: string, cityId: string, limit = 15) {
  const model = await getCityModel(cityId);
  const { ctx, hidden } = await contextFor(userId, model);
  return model.spots
    .filter((s) => !ctx.mine.has(s.id) && !hidden.has(s.id))
    .sort((a, b) => model.stats.get(b.id)!.count - model.stats.get(a.id)!.count)
    .slice(0, limit)
    .map((s) => {
      const { stats: _s, ...meta } = spotMeta(model, s);
      return { id: s.id, name: s.name, area: s.area, mustOrder: s.mustOrder, priceBand: s.priceBand, ...meta };
    });
}

export async function searchSpots(cityId: string, q: string) {
  const model = await getCityModel(cityId);
  const needle = q.trim().toLowerCase();
  return model.spots
    .filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.area.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 30)
    .map((s) => ({ spot: s, ...spotMeta(model, s) }));
}

export async function getCategories() {
  const db = getDb();
  return db.select().from(schema.categories).orderBy(schema.categories.sortOrder);
}
