import type { FeedbackSignal, SpotFeatures, SpotStats } from "./types";

export interface TasteProfile {
  /** Per category, roughly -1 (avoid) to +1 (love). */
  affinity: Record<string, number>;
  /** Preferred spice level, 0 to 1. */
  spice: number;
  /** Preferred price band, around 1 to 3. */
  price: number;
  /** 0 = trusts buzz, 1 = very sceptical of hyped places. */
  hypeScepticism: number;
  ratedCount: number;
}

export interface UserRating {
  spotId: string;
  rating: number;
}

const CUISINE_PENALTY = 0.35;
const PRICE_PENALTY = 0.3;
const HYPE_FEEDBACK_STEP = 0.25;
/** A spot counts as "hyped" when people expected at least this much. */
const HYPED_EXPECTATION = 4;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * Build a taste profile from a user's ratings and "Not for me" feedback.
 * Pure function: the same inputs always give the same profile.
 */
export function buildTaste(
  ratings: readonly UserRating[],
  spots: ReadonlyMap<string, SpotFeatures>,
  feedback: readonly FeedbackSignal[] = [],
  stats?: ReadonlyMap<string, SpotStats>,
): TasteProfile {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  let spiceW = 0;
  let spiceSum = 0;
  let priceSum = 0;
  let hypedSeen = 0;
  let hypedDisliked = 0;
  let rated = 0;

  for (const { spotId, rating } of ratings) {
    const spot = spots.get(spotId);
    if (!spot || spot.categories.length === 0) continue;
    rated++;
    const delta = (rating - 3) / 2; // -1.25 .. +1
    for (const c of spot.categories) {
      sums[c] = (sums[c] ?? 0) + delta / spot.categories.length;
      counts[c] = (counts[c] ?? 0) + 1;
    }
    const like = Math.max(0, rating - 2.5);
    spiceW += like;
    spiceSum += like * spot.spice;
    priceSum += like * spot.priceBand;

    const exp = stats?.get(spotId)?.avgExpectation;
    if (exp != null && exp >= HYPED_EXPECTATION) {
      hypedSeen++;
      if (rating < 3) hypedDisliked++;
    }
  }

  const affinity: Record<string, number> = {};
  // Shrink toward 0: one rating moves a category, several confirm it.
  for (const c of Object.keys(sums)) affinity[c] = (sums[c] ?? 0) / ((counts[c] ?? 0) + 1);

  let pricePenalty = 0;
  let hypeFromFeedback = 0;
  for (const f of feedback) {
    const spot = spots.get(f.spotId);
    if (f.reason === "cuisine" && spot) {
      for (const c of spot.categories) affinity[c] = (affinity[c] ?? 0) - CUISINE_PENALTY;
    } else if (f.reason === "price") {
      pricePenalty += PRICE_PENALTY;
    } else if (f.reason === "hype") {
      hypeFromFeedback += HYPE_FEEDBACK_STEP;
    }
  }
  for (const c of Object.keys(affinity)) affinity[c] = clamp(affinity[c] ?? 0, -1.5, 1.5);

  return {
    affinity,
    spice: spiceW > 0 ? spiceSum / spiceW : 0.5,
    price: (spiceW > 0 ? priceSum / spiceW : 2) - pricePenalty,
    hypeScepticism: clamp(hypeFromFeedback + (hypedSeen > 0 ? (hypedDisliked / hypedSeen) * 0.6 : 0), 0, 1),
    ratedCount: rated,
  };
}
