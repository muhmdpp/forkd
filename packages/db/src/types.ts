import type { FeedbackReason, HeardFrom, HypeVote, PriceBand, SpotStats } from "@forkd/core";

export interface Category {
  id: string;
  label: string;
  /** Hue (0-360) for the spot thumbnail. */
  hue: number;
  sortOrder: number;
}

export interface City {
  id: string;
  name: string;
}

export interface SpotRow {
  id: string;
  slug: string;
  name: string;
  cityId: string;
  area: string;
  priceBand: PriceBand;
  /** 0 = no heat, 1 = very spicy. */
  spice: number;
  mustOrder: string | null;
  categories: string[];
  status: "pending" | "live" | "closed";
  isSample: boolean;
  createdBy: string | null;
  createdAt: Date;
  stats: SpotStats | null;
  /** userId -> latest rating. Kept on the spot so a whole city loads in one query. */
  ratings: Record<string, number>;
}

export interface VisitRecord {
  id: string;
  userId: string;
  /** Copied from the profile at write time so reviews render without extra reads. */
  handle: string;
  spotId: string;
  cityId: string;
  rating: number;
  expectation: number | null;
  heardFrom: HeardFrom | null;
  hypeVote: HypeVote | null;
  review: string | null;
  /** "log" = a full visit log; "quiz" = a swipe rating. */
  source: "log" | "quiz";
  /** Reviewer trust (0-1) at write time. */
  weight: number;
  createdAt: Date;
}

export interface Profile {
  uid: string;
  name: string;
  handle: string;
  homeCityId: string;
  trustScore: number;
  onboardedAt: Date | null;
  isSample: boolean;
  createdAt: Date;
}

export type NewSpot = Omit<SpotRow, "id" | "createdAt" | "stats" | "ratings">;
export type NewVisit = Omit<VisitRecord, "id" | "createdAt">;

/** Everything the app needs from storage. Firestore in production, memory in demo mode. */
export interface Store {
  readonly kind: "firestore" | "memory";

  listCategories(): Promise<Category[]>;
  listCitySpots(cityId: string): Promise<SpotRow[]>;
  getSpot(id: string): Promise<SpotRow | null>;
  getSpotBySlug(slug: string): Promise<SpotRow | null>;
  createSpot(spot: NewSpot): Promise<SpotRow>;
  setSpotStats(spotId: string, stats: SpotStats): Promise<void>;

  /** Saves visits and updates each spot's ratings map. */
  addVisits(visits: NewVisit[]): Promise<void>;
  listSpotVisits(spotId: string): Promise<VisitRecord[]>;
  listUserVisits(userId: string): Promise<VisitRecord[]>;

  listFeedback(userId: string): Promise<{ spotId: string; reason: FeedbackReason }[]>;
  setFeedback(userId: string, spotId: string, reason: FeedbackReason): Promise<void>;
  deleteFeedback(userId: string, spotId: string): Promise<void>;

  getProfile(uid: string): Promise<Profile | null>;
  /** Creates the profile if it doesn't exist. Returns the stored profile either way. */
  createProfile(profile: Profile): Promise<Profile>;
  markOnboarded(uid: string): Promise<void>;

  /**
   * Counts an action in a rolling window and reports whether it is still under the limit.
   * Used for write rate limits without needing database indexes.
   */
  hitRateLimit(uid: string, key: string, limit: number, windowMs: number): Promise<boolean>;
}
