/** Half-star rating, 0.5 to 5. */
export type Stars = number;

export type HypeVote = "gem" | "ok" | "over";

export type HeardFrom = "reel" | "friend" | "walked_by" | "forkd" | "other";

export type FeedbackReason = "cuisine" | "price" | "hype" | "other";

export type PriceBand = 1 | 2 | 3;

/** What the recommender needs to know about a spot. */
export interface SpotFeatures {
  id: string;
  categories: string[];
  /** 0 = no heat, 1 = very spicy. */
  spice: number;
  priceBand: PriceBand;
}

/** One visit as seen by the stats engine. */
export interface VisitSignal {
  userId: string;
  spotId: string;
  rating: Stars;
  /** How hyped the place seemed before the visit, 1 to 5. Null when not asked (for example the taste quiz). */
  expectation: number | null;
  heardFrom: HeardFrom | null;
  hypeVote: HypeVote | null;
  /** Reviewer trust, 0 to 1. Defaults to 1. */
  weight?: number;
}

export interface FeedbackSignal {
  spotId: string;
  reason: FeedbackReason;
}

export type HypeLabel = "overhyped" | "hidden_gem" | "lives_up" | "not_enough_data";

export interface SpotStats {
  spotId: string;
  count: number;
  /** Trust-weighted mean rating. 0 when there are no ratings. */
  avg: number;
  /** Mean pulled toward the city average so a single 5-star can't top the chart. */
  bayes: number;
  /** Counts for 0.5, 1, 1.5 ... 5 stars. Always 10 entries. */
  histogram: number[];
  /** Mean of the expectation answers, or null when nobody answered. */
  avgExpectation: number | null;
  expectationCount: number;
  /** avg rating minus avg expectation, from visits that answered both. */
  hypeGap: number | null;
  hypeVotes: Record<HypeVote, number>;
  /** Share of visits where people heard about the spot from a reel. */
  reelShare: number;
  hypeLabel: HypeLabel;
}
