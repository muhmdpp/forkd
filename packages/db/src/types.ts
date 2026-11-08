import type { FeedbackReason, HeardFrom, HypeVote, PriceBand, SpotStats } from "@forkd/core";

export interface Category {
  id: string;
  label: string;
  /** Hue (0-360) for fallbacks when there is no photo. */
  hue: number;
  sortOrder: number;
  imageUrl: string | null;
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
  /** Cover photo URL (an uploaded photo or a sample image). */
  coverUrl: string | null;
  stats: SpotStats | null;
  /** userId -> latest rating. Kept on the spot so a whole city loads in one query. */
  ratings: Record<string, number>;
  /** Dish name -> how many experiences mention it. Powers "Popular here" and the menu tab. */
  dishes: Record<string, number>;
  /** Share of people who said they'd go back, 0-1, or null when nobody answered. */
  revisitShare: number | null;
  /** Experiences in the last 30 days. Powers "Trending". */
  recent30: number;
}

/** A logged visit. Shown in the app as an "experience". */
export interface VisitRecord {
  id: string;
  userId: string;
  /** Copied from the profile at write time so feeds render without extra reads. */
  handle: string;
  name: string;
  avatarUrl: string | null;
  spotId: string;
  spotSlug: string;
  spotName: string;
  cityId: string;
  rating: number;
  expectation: number | null;
  heardFrom: HeardFrom | null;
  hypeVote: HypeVote | null;
  review: string | null;
  dishes: string[];
  photos: string[];
  wouldReturn: boolean | null;
  /** "log" = a full experience; "quiz" = a swipe rating (private, not shown in feeds). */
  source: "log" | "quiz";
  /** Reviewer trust (0-1) at write time. */
  weight: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
}

export interface Profile {
  uid: string;
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  homeCityId: string;
  cravings: string[];
  trustScore: number;
  onboardedAt: Date | null;
  isSample: boolean;
  followers: number;
  following: number;
  experiences: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  visitId: string;
  uid: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  text: string;
  createdAt: Date;
}

export interface Collection {
  id: string;
  ownerUid: string;
  ownerHandle: string;
  title: string;
  description: string;
  spotIds: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = "follow" | "like" | "comment";

export interface Notification {
  id: string;
  type: NotificationType;
  actorUid: string;
  actorHandle: string;
  actorName: string;
  actorAvatar: string | null;
  visitId: string | null;
  spotName: string | null;
  text: string | null;
  read: boolean;
  createdAt: Date;
}

export interface Photo {
  id: string;
  ownerUid: string;
  contentType: string;
  data: Uint8Array;
  createdAt: Date;
}

export type NewSpot = Omit<SpotRow, "id" | "createdAt" | "stats" | "ratings" | "dishes" | "revisitShare" | "recent30">;
export type NewVisit = Omit<VisitRecord, "id" | "createdAt" | "likeCount" | "commentCount">;
export type SpotDerived = Pick<SpotRow, "stats" | "dishes" | "revisitShare" | "recent30"> & { coverUrl?: string | null };
export type ProfilePatch = Partial<Pick<Profile, "name" | "handle" | "bio" | "avatarUrl" | "cravings" | "onboardedAt">>;
export type CounterField = "followers" | "following" | "experiences";

/** Everything the app needs from storage. Firestore in production, memory in demo mode. */
export interface Store {
  readonly kind: "firestore" | "memory";

  // spots
  listCategories(): Promise<Category[]>;
  listCitySpots(cityId: string): Promise<SpotRow[]>;
  getSpot(id: string): Promise<SpotRow | null>;
  getSpotBySlug(slug: string): Promise<SpotRow | null>;
  createSpot(spot: NewSpot): Promise<SpotRow>;
  updateSpotDerived(spotId: string, patch: SpotDerived): Promise<void>;

  // experiences
  /** Saves visits, updates each spot's ratings map, and returns the new ids. */
  addVisits(visits: NewVisit[]): Promise<string[]>;
  getVisit(id: string): Promise<VisitRecord | null>;
  deleteVisit(id: string): Promise<void>;
  listSpotVisits(spotId: string): Promise<VisitRecord[]>;
  listUserVisits(userId: string): Promise<VisitRecord[]>;
  /** Experiences by any of these users, newest first. */
  listVisitsByUsers(userIds: string[], limit: number): Promise<VisitRecord[]>;

  // likes & comments
  setLike(visitId: string, uid: string, liked: boolean): Promise<boolean>;
  likedVisitIds(uid: string, visitIds: string[]): Promise<Set<string>>;
  addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment>;
  listComments(visitId: string): Promise<Comment[]>;

  // feedback & saves
  listFeedback(userId: string): Promise<{ spotId: string; reason: FeedbackReason }[]>;
  setFeedback(userId: string, spotId: string, reason: FeedbackReason): Promise<void>;
  deleteFeedback(userId: string, spotId: string): Promise<void>;
  setSaved(uid: string, spotId: string, saved: boolean): Promise<void>;
  listSaved(uid: string): Promise<string[]>;

  // people
  getProfile(uid: string): Promise<Profile | null>;
  getProfileByHandle(handle: string): Promise<Profile | null>;
  getProfiles(uids: string[]): Promise<Profile[]>;
  /** Creates the profile if it doesn't exist. Returns the stored profile either way. */
  createProfile(profile: Profile): Promise<Profile>;
  updateProfile(uid: string, patch: ProfilePatch): Promise<void>;
  incrementCounter(uid: string, field: CounterField, by: number): Promise<void>;
  /** Returns true if the state changed. */
  setFollow(followerUid: string, followeeUid: string, follow: boolean): Promise<boolean>;
  isFollowing(followerUid: string, followeeUid: string): Promise<boolean>;
  listFollowing(uid: string): Promise<string[]>;
  listFollowers(uid: string): Promise<string[]>;

  // collections
  createCollection(c: Omit<Collection, "id" | "createdAt" | "updatedAt">): Promise<Collection>;
  getCollection(id: string): Promise<Collection | null>;
  setCollectionSpot(id: string, spotId: string, included: boolean): Promise<void>;
  listUserCollections(uid: string): Promise<Collection[]>;
  listPublicCollections(limit: number): Promise<Collection[]>;

  // notifications
  addNotification(uid: string, n: Omit<Notification, "id" | "createdAt" | "read">): Promise<void>;
  listNotifications(uid: string, limit: number): Promise<Notification[]>;
  markNotificationsRead(uid: string): Promise<void>;

  // photos
  putPhoto(photo: Omit<Photo, "id" | "createdAt">): Promise<string>;
  getPhoto(id: string): Promise<Photo | null>;

  /** Counts an action in a rolling window and reports whether it is still under the limit. */
  hitRateLimit(uid: string, key: string, limit: number, windowMs: number): Promise<boolean>;
}
