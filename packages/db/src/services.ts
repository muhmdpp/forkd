import {
  type FeedbackSignal,
  type PriceBand,
  type SpotFeatures,
  type SpotStats,
  type VisitSignal,
  computeGlobalMean,
  computeSpotStats,
} from "@forkd/core";
import { and, eq, inArray, sql } from "drizzle-orm";
import { type Database, rowsOf } from "./client";
import { categories, feedback, profiles, spotCategories, spotStats, spots, visits } from "./schema";

export interface SpotRow {
  id: string;
  slug: string;
  name: string;
  area: string;
  cityId: string;
  priceBand: PriceBand;
  spice: number;
  mustOrder: string | null;
  isSample: boolean;
  categories: string[];
}

export interface CityModel {
  cityId: string;
  spots: SpotRow[];
  spotsById: Map<string, SpotRow>;
  features: Map<string, SpotFeatures>;
  stats: Map<string, SpotStats>;
  /** userId -> spotId -> latest rating */
  matrix: Map<string, Map<string, number>>;
  globalMean: number;
  categoryLabels: Map<string, { label: string; hue: number }>;
}

/**
 * Latest visit per user and spot, with the reviewer's trust as weight.
 * Repeat visits by the same person count once, so nobody can stack a score.
 */
export async function latestVisitSignals(db: Database, cityId: string, spotId?: string): Promise<VisitSignal[]> {
  type Row = {
    user_id: string;
    spot_id: string;
    rating: number;
    expectation: number | null;
    heard_from: VisitSignal["heardFrom"];
    hype_vote: VisitSignal["hypeVote"];
    trust: number | null;
  };
  const result = await db.execute(sql`
    select distinct on (v.user_id, v.spot_id)
      v.user_id, v.spot_id, v.rating, v.expectation, v.heard_from, v.hype_vote, p.trust_score as trust
    from ${visits} v
    join ${spots} s on s.id = v.spot_id
    left join ${profiles} p on p.user_id = v.user_id
    where s.city_id = ${cityId} and s.status = 'live'
    ${spotId ? sql`and v.spot_id = ${spotId}` : sql``}
    order by v.user_id, v.spot_id, v.created_at desc
  `);
  return rowsOf<Row>(result).map((r) => ({
    userId: r.user_id,
    spotId: r.spot_id,
    rating: Number(r.rating),
    expectation: r.expectation === null ? null : Number(r.expectation),
    heardFrom: r.heard_from,
    hypeVote: r.hype_vote,
    // Low-trust accounts still count, just less. Floor keeps new users from vanishing.
    weight: Math.max(0.2, Number(r.trust ?? 0.5)),
  }));
}

export async function loadSpots(db: Database, cityId: string): Promise<SpotRow[]> {
  const rows = await db
    .select({
      id: spots.id,
      slug: spots.slug,
      name: spots.name,
      area: spots.area,
      cityId: spots.cityId,
      priceBand: spots.priceBand,
      spice: spots.spice,
      mustOrder: spots.mustOrder,
      isSample: spots.isSample,
      cats: sql<string[]>`coalesce(array_agg(${spotCategories.categoryId} order by ${spotCategories.categoryId}) filter (where ${spotCategories.categoryId} is not null), '{}')`,
    })
    .from(spots)
    .leftJoin(spotCategories, eq(spotCategories.spotId, spots.id))
    .where(and(eq(spots.cityId, cityId), eq(spots.status, "live")))
    .groupBy(spots.id);
  return rows.map(({ cats, ...r }) => ({ ...r, priceBand: r.priceBand as PriceBand, categories: cats }));
}

export async function loadCategoryLabels(db: Database) {
  const rows = await db.select().from(categories).orderBy(categories.sortOrder);
  return new Map(rows.map((c) => [c.id, { label: c.label, hue: c.hue }]));
}

function statsFromRow(r: typeof spotStats.$inferSelect): SpotStats {
  return {
    spotId: r.spotId,
    count: r.count,
    avg: r.avg,
    bayes: r.bayes,
    histogram: r.histogram,
    avgExpectation: r.avgExpectation,
    expectationCount: r.expectationCount,
    hypeGap: r.hypeGap,
    hypeVotes: r.hypeVotes,
    reelShare: r.reelShare,
    hypeLabel: r.hypeLabel,
  };
}

/** Everything the recommender needs for one city, in three queries. */
export async function loadCityModel(db: Database, cityId: string): Promise<CityModel> {
  const [spotRows, signals, labels] = await Promise.all([
    loadSpots(db, cityId),
    latestVisitSignals(db, cityId),
    loadCategoryLabels(db),
  ]);
  const ids = spotRows.map((s) => s.id);
  const statRows = ids.length ? await db.select().from(spotStats).where(inArray(spotStats.spotId, ids)) : [];
  const globalMean = computeGlobalMean(signals);
  const stats = new Map<string, SpotStats>();
  for (const r of statRows) stats.set(r.spotId, statsFromRow(r));
  for (const id of ids) if (!stats.has(id)) stats.set(id, computeSpotStats(id, [], globalMean));

  const matrix = new Map<string, Map<string, number>>();
  for (const v of signals) {
    let m = matrix.get(v.userId);
    if (!m) matrix.set(v.userId, (m = new Map()));
    m.set(v.spotId, v.rating);
  }

  return {
    cityId,
    spots: spotRows,
    spotsById: new Map(spotRows.map((s) => [s.id, s])),
    features: new Map(
      spotRows.map((s) => [s.id, { id: s.id, categories: s.categories, spice: s.spice, priceBand: s.priceBand }]),
    ),
    stats,
    matrix,
    globalMean,
    categoryLabels: labels,
  };
}

export async function loadUserFeedback(db: Database, userId: string): Promise<FeedbackSignal[]> {
  return db.select({ spotId: feedback.spotId, reason: feedback.reason }).from(feedback).where(eq(feedback.userId, userId));
}

async function upsertStats(db: Database, s: SpotStats) {
  const values = {
    spotId: s.spotId,
    count: s.count,
    avg: s.avg,
    bayes: s.bayes,
    histogram: s.histogram,
    avgExpectation: s.avgExpectation,
    expectationCount: s.expectationCount,
    hypeGap: s.hypeGap,
    hypeVotes: s.hypeVotes,
    reelShare: s.reelShare,
    hypeLabel: s.hypeLabel,
  };
  await db.insert(spotStats).values(values).onConflictDoUpdate({ target: spotStats.spotId, set: values });
}

/** Recompute one spot after a visit is logged. Cheap: one spot's visits plus the city mean. */
export async function recomputeSpotStats(db: Database, spotId: string): Promise<SpotStats | null> {
  const [spot] = await db.select({ cityId: spots.cityId }).from(spots).where(eq(spots.id, spotId));
  if (!spot) return null;
  const [mean] = rowsOf<{ mean: number | null }>(await db.execute(sql`
    select avg(v.rating)::float8 as mean from ${visits} v join ${spots} s on s.id = v.spot_id where s.city_id = ${spot.cityId}
  `));
  const signals = await latestVisitSignals(db, spot.cityId, spotId);
  const stats = computeSpotStats(spotId, signals, mean?.mean ?? computeGlobalMean([]));
  await upsertStats(db, stats);
  return stats;
}

/** Full rebuild for a city. Run by the worker on a schedule; safe to run any time. */
export async function rebuildCityStats(db: Database, cityId: string): Promise<number> {
  const [spotRows, signals] = await Promise.all([loadSpots(db, cityId), latestVisitSignals(db, cityId)]);
  const globalMean = computeGlobalMean(signals);
  const bySpot = new Map<string, VisitSignal[]>();
  for (const v of signals) {
    const list = bySpot.get(v.spotId);
    if (list) list.push(v);
    else bySpot.set(v.spotId, [v]);
  }
  for (const s of spotRows) await upsertStats(db, computeSpotStats(s.id, bySpot.get(s.id) ?? [], globalMean));
  return spotRows.length;
}
