import { type Neighbour, type RatingMatrix, findNeighbours } from "./neighbours";
import { type TasteProfile, type UserRating, buildTaste } from "./taste";
import type { FeedbackSignal, PriceBand, SpotFeatures, SpotStats } from "./types";

/** Why we think you will like a spot. Every code comes from the same numbers as the score. */
export type Reason =
  | { code: "SIMILAR_TO_RATED"; spotId: string; rating: number; category: string }
  | { code: "TASTE_TWINS"; fans: number }
  | { code: "HIDDEN_GEM"; avg: number }
  | { code: "OVERHYPED_BUT_FITS" }
  | { code: "SPICE_MATCH" }
  | { code: "PRICE_MATCH"; priceBand: PriceBand }
  | { code: "COMMUNITY_FAVOURITE"; avg: number; count: number };

/** Why a spot may not be for you. */
export type Warning =
  | { code: "OVERHYPED"; expected: number; actual: number }
  | { code: "TWINS_DISLIKE"; dislikers: number; raters: number }
  | { code: "LOW_AFFINITY"; categories: string[] }
  | { code: "PRICIER"; priceBand: PriceBand };

export interface Prediction {
  spotId: string;
  /** Predicted rating for this user, 0.5 to 5. */
  predicted: number;
  /** 0 to 100, for display. */
  match: number;
  reasons: Reason[];
  warnings: Warning[];
}

export interface RecommenderInput {
  userId: string;
  spots: ReadonlyMap<string, SpotFeatures>;
  stats: ReadonlyMap<string, SpotStats>;
  /** Everyone's ratings in the city, including this user's. */
  matrix: RatingMatrix;
  feedback: readonly FeedbackSignal[];
  globalMean: number;
}

export interface RecommenderContext extends RecommenderInput {
  mine: ReadonlyMap<string, number>;
  taste: TasteProfile;
  neighbours: Neighbour[];
}

// Model weights. Tune these with offline evaluation, not by feel.
export const WEIGHTS = {
  affinity: 1.2,
  spiceMiss: 1.1,
  priceMiss: 0.45,
  scepticism: 0.9,
  collaborative: 0.5,
  spiceTolerance: 0.18,
  priceTolerance: 0.3,
  /** Score penalty per earlier pick from the same main category. */
  diversity: 0.25,
} as const;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function createContext(input: RecommenderInput): RecommenderContext {
  const mine = input.matrix.get(input.userId) ?? new Map<string, number>();
  const ratings: UserRating[] = [...mine].map(([spotId, rating]) => ({ spotId, rating }));
  return {
    ...input,
    mine,
    taste: buildTaste(ratings, input.spots, input.feedback, input.stats),
    neighbours: findNeighbours(input.userId, mine, input.matrix),
  };
}

export function predict(spot: SpotFeatures, ctx: RecommenderContext): Prediction {
  const { taste } = ctx;
  const stats = ctx.stats.get(spot.id);
  const base = stats && stats.count > 0 ? stats.bayes : ctx.globalMean - 0.1;

  const aff = spot.categories.length
    ? spot.categories.reduce((a, c) => a + (taste.affinity[c] ?? 0), 0) / spot.categories.length
    : 0;
  const spiceMiss = Math.max(0, Math.abs(spot.spice - taste.spice) - WEIGHTS.spiceTolerance);
  const priceMiss = Math.max(0, spot.priceBand - taste.price - WEIGHTS.priceTolerance);
  const reelPenalty = taste.hypeScepticism * Math.max(0, (stats?.reelShare ?? 0) - 0.4);

  const content =
    base +
    WEIGHTS.affinity * aff -
    WEIGHTS.spiceMiss * spiceMiss -
    WEIGHTS.priceMiss * priceMiss -
    WEIGHTS.scepticism * reelPenalty;

  let wSum = 0;
  let rSum = 0;
  let raters = 0;
  let fans = 0;
  for (const n of ctx.neighbours) {
    const r = ctx.matrix.get(n.userId)?.get(spot.id);
    if (r === undefined) continue;
    wSum += n.weight;
    rSum += n.weight * r;
    raters++;
    if (r >= 4) fans++;
  }
  const cf = wSum > 0 && raters >= 2 ? rSum / wSum : null;
  const predicted = clamp(
    cf === null ? content : WEIGHTS.collaborative * cf + (1 - WEIGHTS.collaborative) * content,
    0.5,
    5,
  );

  return {
    spotId: spot.id,
    predicted,
    match: Math.round(clamp((predicted - 1) / 3.8, 0, 1) * 100),
    reasons: buildReasons(spot, ctx, { aff, spiceMiss, raters, fans, stats }),
    warnings: buildWarnings(spot, ctx, { aff, priceMiss, raters, fans, stats }),
  };
}

interface Signals {
  aff: number;
  raters: number;
  fans: number;
  stats: SpotStats | undefined;
}

function buildReasons(
  spot: SpotFeatures,
  ctx: RecommenderContext,
  s: Signals & { spiceMiss: number },
): Reason[] {
  const scored: { w: number; r: Reason }[] = [];

  // Strongest rated spot sharing a category.
  let best: { spotId: string; rating: number; category: string } | null = null;
  for (const [spotId, rating] of ctx.mine) {
    if (spotId === spot.id || rating < 4) continue;
    const other = ctx.spots.get(spotId);
    const category = other?.categories.find((c) => spot.categories.includes(c));
    if (category && (!best || rating > best.rating)) best = { spotId, rating, category };
  }
  if (best) scored.push({ w: 2, r: { code: "SIMILAR_TO_RATED", ...best } });
  if (s.fans >= 2) scored.push({ w: 2.5, r: { code: "TASTE_TWINS", fans: s.fans } });

  const label = s.stats?.hypeLabel;
  if (label === "hidden_gem" && s.stats) scored.push({ w: 2.2, r: { code: "HIDDEN_GEM", avg: s.stats.avg } });

  const pred = s.stats ? s.stats.bayes + WEIGHTS.affinity * s.aff : 0;
  if (label === "overhyped" && pred >= 3.6) scored.push({ w: 1.5, r: { code: "OVERHYPED_BUT_FITS" } });
  if (s.spiceMiss === 0 && spot.spice > 0.3 && ctx.taste.ratedCount > 0) {
    scored.push({ w: 1, r: { code: "SPICE_MATCH" } });
  }
  if (spot.priceBand <= Math.round(ctx.taste.price) && ctx.taste.ratedCount > 0) {
    scored.push({ w: 0.8, r: { code: "PRICE_MATCH", priceBand: spot.priceBand } });
  }
  if (scored.length === 0 && s.stats && s.stats.count > 0) {
    scored.push({ w: 0.5, r: { code: "COMMUNITY_FAVOURITE", avg: s.stats.avg, count: s.stats.count } });
  }
  return scored.sort((a, b) => b.w - a.w).slice(0, 3).map((x) => x.r);
}

function buildWarnings(
  spot: SpotFeatures,
  ctx: RecommenderContext,
  s: Signals & { priceMiss: number },
): Warning[] {
  const out: Warning[] = [];
  const st = s.stats;
  if (st?.hypeLabel === "overhyped" && st.avgExpectation !== null) {
    out.push({ code: "OVERHYPED", expected: st.avgExpectation, actual: st.avg });
  }
  if (s.raters - s.fans >= 2) out.push({ code: "TWINS_DISLIKE", dislikers: s.raters - s.fans, raters: s.raters });
  if (s.aff < -0.2) out.push({ code: "LOW_AFFINITY", categories: spot.categories });
  if (s.priceMiss > 0) out.push({ code: "PRICIER", priceBand: spot.priceBand });
  return out.slice(0, 2);
}

export interface RecommendOptions {
  /** Spot ids to leave out (already rated, hidden with "Not for me"). */
  exclude?: ReadonlySet<string>;
  limit?: number;
}

/** Rank every candidate spot for one user, with a light diversity re-rank. */
export function recommend(ctx: RecommenderContext, opts: RecommendOptions = {}): Prediction[] {
  const exclude = opts.exclude ?? new Set<string>();
  const limit = opts.limit ?? 20;
  const pool: { p: Prediction; cat: string }[] = [];
  for (const spot of ctx.spots.values()) {
    if (exclude.has(spot.id) || ctx.mine.has(spot.id)) continue;
    pool.push({ p: predict(spot, ctx), cat: spot.categories[0] ?? "" });
  }
  pool.sort((a, b) => b.p.predicted - a.p.predicted);

  // Greedy pick: same-category picks lose a little each time, so the feed isn't ten biryani places.
  const picked: Prediction[] = [];
  const catCount = new Map<string, number>();
  while (picked.length < limit && pool.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const item = pool[i]!;
      const score = item.p.predicted - WEIGHTS.diversity * (catCount.get(item.cat) ?? 0);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    const [chosen] = pool.splice(bestIdx, 1);
    if (!chosen) break;
    picked.push(chosen.p);
    catCount.set(chosen.cat, (catCount.get(chosen.cat) ?? 0) + 1);
  }
  return picked;
}
