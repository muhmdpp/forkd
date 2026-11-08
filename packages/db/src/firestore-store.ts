import type { FeedbackReason } from "@forkd/core";
import {
  FieldPath,
  FieldValue,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { getAdminApp } from "./firebase";
import { buildSampleData } from "./sample-data";
import type {
  Category,
  Collection,
  Comment,
  CounterField,
  NewSpot,
  NewVisit,
  Notification,
  Photo,
  Profile,
  ProfilePatch,
  SpotDerived,
  SpotRow,
  Store,
  VisitRecord,
} from "./types";

/**
 * Firestore layout (no composite indexes required):
 *   categories/{id}  spots/{id}  collections/{id}  photos/{id}  rateLimits/{uid_key}  meta/seed
 *   visits/{id}            + likes/{uid}, comments/{id}
 *   users/{uid}            + following/{uid}, followers/{uid}, saved/{spotId}, feedback/{spotId}, notifications/{id}
 * All access goes through the server with the Admin SDK; firestore.rules denies browsers.
 */

const toDate = (v: unknown): Date =>
  v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : typeof v === "string" ? new Date(v) : new Date(0);
const toDateOrNull = (v: unknown): Date | null => (v == null ? null : toDate(v));

function withId<T>(snap: DocumentSnapshot): T {
  const d = snap.data() as DocumentData;
  return { ...d, id: snap.id } as T;
}

function spotFrom(snap: DocumentSnapshot): SpotRow {
  const d = snap.data()!;
  return {
    id: snap.id,
    slug: d.slug,
    name: d.name,
    cityId: d.cityId,
    area: d.area,
    priceBand: d.priceBand,
    spice: d.spice,
    mustOrder: d.mustOrder ?? null,
    categories: d.categories ?? [],
    status: d.status ?? "live",
    isSample: Boolean(d.isSample),
    createdBy: d.createdBy ?? null,
    createdAt: toDate(d.createdAt),
    coverUrl: d.coverUrl ?? null,
    stats: d.stats ?? null,
    ratings: d.ratings ?? {},
    dishes: d.dishes ?? {},
    revisitShare: d.revisitShare ?? null,
    recent30: d.recent30 ?? 0,
  };
}

function visitFrom(snap: DocumentSnapshot): VisitRecord {
  const d = snap.data()!;
  return {
    id: snap.id,
    userId: d.userId,
    handle: d.handle,
    name: d.name ?? d.handle,
    avatarUrl: d.avatarUrl ?? null,
    spotId: d.spotId,
    spotSlug: d.spotSlug ?? "",
    spotName: d.spotName ?? "",
    cityId: d.cityId,
    rating: d.rating,
    expectation: d.expectation ?? null,
    heardFrom: d.heardFrom ?? null,
    hypeVote: d.hypeVote ?? null,
    review: d.review ?? null,
    dishes: d.dishes ?? [],
    photos: d.photos ?? [],
    wouldReturn: d.wouldReturn ?? null,
    source: d.source ?? "log",
    weight: d.weight ?? 0.5,
    likeCount: d.likeCount ?? 0,
    commentCount: d.commentCount ?? 0,
    createdAt: toDate(d.createdAt),
  };
}

function profileFrom(snap: DocumentSnapshot): Profile {
  const d = snap.data()!;
  return {
    uid: snap.id,
    name: d.name ?? d.handle,
    handle: d.handle,
    bio: d.bio ?? "",
    avatarUrl: d.avatarUrl ?? null,
    homeCityId: d.homeCityId ?? "kozhikode",
    cravings: d.cravings ?? [],
    trustScore: d.trustScore ?? 0.4,
    onboardedAt: toDateOrNull(d.onboardedAt),
    isSample: Boolean(d.isSample),
    followers: d.followers ?? 0,
    following: d.following ?? 0,
    experiences: d.experiences ?? 0,
    createdAt: toDate(d.createdAt),
  };
}

function collectionFrom(snap: DocumentSnapshot): Collection {
  const d = snap.data()!;
  return {
    id: snap.id,
    ownerUid: d.ownerUid,
    ownerHandle: d.ownerHandle,
    title: d.title,
    description: d.description ?? "",
    spotIds: d.spotIds ?? [],
    isPublic: d.isPublic !== false,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

const newest = <T extends { createdAt: Date }>(a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime();
const chunk = <T>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export class FirestoreStore implements Store {
  readonly kind = "firestore" as const;
  constructor(readonly db: Firestore) {}

  private users = () => this.db.collection("users");
  private spotsCol = () => this.db.collection("spots");
  private visitsCol = () => this.db.collection("visits");

  // spots
  async listCategories() {
    const snap = await this.db.collection("categories").get();
    return snap.docs.map((d) => withId<Category>(d)).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async listCitySpots(cityId: string) {
    const snap = await this.spotsCol().where("cityId", "==", cityId).get();
    return snap.docs.map(spotFrom).filter((s) => s.status === "live");
  }
  async getSpot(id: string) {
    const snap = await this.spotsCol().doc(id).get();
    return snap.exists ? spotFrom(snap) : null;
  }
  async getSpotBySlug(slug: string) {
    const snap = await this.spotsCol().where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : spotFrom(snap.docs[0]!);
  }
  async createSpot(spot: NewSpot) {
    const ref = this.spotsCol().doc();
    const row: SpotRow = { ...spot, id: ref.id, createdAt: new Date(), stats: null, ratings: {}, dishes: {}, revisitShare: null, recent30: 0 };
    const { id: _id, ...data } = row;
    await ref.set(data);
    return row;
  }
  async updateSpotDerived(spotId: string, patch: SpotDerived) {
    const data: DocumentData = { stats: patch.stats, dishes: patch.dishes, revisitShare: patch.revisitShare, recent30: patch.recent30 };
    if (patch.coverUrl !== undefined) data.coverUrl = patch.coverUrl;
    await this.spotsCol().doc(spotId).update(data);
  }

  // experiences
  async addVisits(visits: NewVisit[]) {
    const ids: string[] = [];
    for (const group of chunk(visits, 200)) {
      const batch = this.db.batch();
      for (const v of group) {
        const ref = this.visitsCol().doc();
        ids.push(ref.id);
        batch.set(ref, { ...v, likeCount: 0, commentCount: 0, createdAt: new Date() });
        batch.update(this.spotsCol().doc(v.spotId), new FieldPath("ratings", v.userId), v.rating);
      }
      await batch.commit();
    }
    return ids;
  }
  async getVisit(id: string) {
    const snap = await this.visitsCol().doc(id).get();
    return snap.exists ? visitFrom(snap) : null;
  }
  async deleteVisit(id: string) {
    const ref = this.visitsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const v = visitFrom(snap);
    await this.db.recursiveDelete(ref);
    const others = (await this.listSpotVisits(v.spotId)).filter((x) => x.userId === v.userId);
    const spotRef = this.spotsCol().doc(v.spotId);
    await spotRef.update(new FieldPath("ratings", v.userId), others[0] ? others[0].rating : FieldValue.delete());
  }
  async listSpotVisits(spotId: string) {
    const snap = await this.visitsCol().where("spotId", "==", spotId).get();
    return snap.docs.map(visitFrom).sort(newest);
  }
  async listUserVisits(userId: string) {
    const snap = await this.visitsCol().where("userId", "==", userId).get();
    return snap.docs.map(visitFrom).sort(newest);
  }
  async listVisitsByUsers(userIds: string[], limit: number) {
    if (!userIds.length) return [];
    const results = await Promise.all(
      chunk(userIds, 30).map(async (ids) => {
        try {
          // Fast path. Needs the composite index in firestore.indexes.json.
          const snap = await this.visitsCol().where("userId", "in", ids).orderBy("createdAt", "desc").limit(limit).get();
          return snap.docs.map(visitFrom);
        } catch (err) {
          if ((err as { code?: number }).code !== 9) throw err;
          // No index yet: read without ordering and sort here.
          const snap = await this.visitsCol().where("userId", "in", ids).get();
          return snap.docs.map(visitFrom);
        }
      }),
    );
    return results
      .flat()
      .filter((v) => v.source === "log")
      .sort(newest)
      .slice(0, limit);
  }

  // likes & comments
  async setLike(visitId: string, uid: string, liked: boolean) {
    const visitRef = this.visitsCol().doc(visitId);
    const likeRef = visitRef.collection("likes").doc(uid);
    return this.db.runTransaction(async (tx) => {
      const [like, visit] = await Promise.all([tx.get(likeRef), tx.get(visitRef)]);
      if (!visit.exists || like.exists === liked) return false;
      if (liked) tx.set(likeRef, { createdAt: new Date() });
      else tx.delete(likeRef);
      tx.update(visitRef, { likeCount: FieldValue.increment(liked ? 1 : -1) });
      return true;
    });
  }
  async likedVisitIds(uid: string, visitIds: string[]) {
    if (!visitIds.length) return new Set<string>();
    const refs = visitIds.map((id) => this.visitsCol().doc(id).collection("likes").doc(uid));
    const snaps = await this.db.getAll(...refs);
    return new Set(snaps.filter((s) => s.exists).map((s) => s.ref.parent.parent!.id));
  }
  async addComment(c: Omit<Comment, "id" | "createdAt">) {
    const visitRef = this.visitsCol().doc(c.visitId);
    const ref = visitRef.collection("comments").doc();
    const row: Comment = { ...c, id: ref.id, createdAt: new Date() };
    const batch = this.db.batch();
    const { id: _id, ...data } = row;
    batch.set(ref, data);
    batch.update(visitRef, { commentCount: FieldValue.increment(1) });
    await batch.commit();
    return row;
  }
  async listComments(visitId: string) {
    const snap = await this.visitsCol().doc(visitId).collection("comments").orderBy("createdAt", "asc").get();
    return snap.docs.map((d) => {
      const x = d.data();
      return { ...(x as Comment), id: d.id, visitId, createdAt: toDate(x.createdAt) };
    });
  }

  // feedback & saves
  async listFeedback(userId: string) {
    const snap = await this.users().doc(userId).collection("feedback").get();
    return snap.docs.map((d) => ({ spotId: d.id, reason: d.data().reason as FeedbackReason }));
  }
  async setFeedback(userId: string, spotId: string, reason: FeedbackReason) {
    await this.users().doc(userId).collection("feedback").doc(spotId).set({ reason, createdAt: new Date() });
  }
  async deleteFeedback(userId: string, spotId: string) {
    await this.users().doc(userId).collection("feedback").doc(spotId).delete();
  }
  async setSaved(uid: string, spotId: string, saved: boolean) {
    const ref = this.users().doc(uid).collection("saved").doc(spotId);
    if (saved) await ref.set({ createdAt: new Date() });
    else await ref.delete();
  }
  async listSaved(uid: string) {
    const snap = await this.users().doc(uid).collection("saved").orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => d.id);
  }

  // people
  async getProfile(uid: string) {
    const snap = await this.users().doc(uid).get();
    return snap.exists ? profileFrom(snap) : null;
  }
  async getProfileByHandle(handle: string) {
    const snap = await this.users().where("handle", "==", handle).limit(1).get();
    return snap.empty ? null : profileFrom(snap.docs[0]!);
  }
  async getProfiles(uids: string[]) {
    if (!uids.length) return [];
    const snaps = await this.db.getAll(...uids.map((u) => this.users().doc(u)));
    return snaps.filter((s) => s.exists).map(profileFrom);
  }
  async createProfile(profile: Profile) {
    const ref = this.users().doc(profile.uid);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) return profileFrom(snap);
      const { uid: _uid, ...data } = profile;
      tx.set(ref, data);
      return profile;
    });
  }
  async updateProfile(uid: string, patch: ProfilePatch) {
    await this.users().doc(uid).set(patch, { merge: true });
  }
  async incrementCounter(uid: string, field: CounterField, by: number) {
    await this.users().doc(uid).set({ [field]: FieldValue.increment(by) }, { merge: true });
  }
  async setFollow(a: string, b: string, follow: boolean) {
    const out = this.users().doc(a).collection("following").doc(b);
    const inn = this.users().doc(b).collection("followers").doc(a);
    return this.db.runTransaction(async (tx) => {
      const cur = await tx.get(out);
      if (cur.exists === follow) return false;
      if (follow) {
        tx.set(out, { createdAt: new Date() });
        tx.set(inn, { createdAt: new Date() });
      } else {
        tx.delete(out);
        tx.delete(inn);
      }
      const d = follow ? 1 : -1;
      tx.set(this.users().doc(a), { following: FieldValue.increment(d) }, { merge: true });
      tx.set(this.users().doc(b), { followers: FieldValue.increment(d) }, { merge: true });
      return true;
    });
  }
  async isFollowing(a: string, b: string) {
    return (await this.users().doc(a).collection("following").doc(b).get()).exists;
  }
  async listFollowing(uid: string) {
    return (await this.users().doc(uid).collection("following").get()).docs.map((d) => d.id);
  }
  async listFollowers(uid: string) {
    return (await this.users().doc(uid).collection("followers").get()).docs.map((d) => d.id);
  }

  // collections
  async createCollection(c: Omit<Collection, "id" | "createdAt" | "updatedAt">) {
    const ref = this.db.collection("collections").doc();
    const row: Collection = { ...c, id: ref.id, createdAt: new Date(), updatedAt: new Date() };
    const { id: _id, ...data } = row;
    await ref.set(data);
    return row;
  }
  async getCollection(id: string) {
    const snap = await this.db.collection("collections").doc(id).get();
    return snap.exists ? collectionFrom(snap) : null;
  }
  async setCollectionSpot(id: string, spotId: string, included: boolean) {
    await this.db
      .collection("collections")
      .doc(id)
      .update({
        spotIds: included ? FieldValue.arrayUnion(spotId) : FieldValue.arrayRemove(spotId),
        updatedAt: new Date(),
      });
  }
  async listUserCollections(uid: string) {
    const snap = await this.db.collection("collections").where("ownerUid", "==", uid).get();
    return snap.docs.map(collectionFrom).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  async listPublicCollections(limit: number) {
    const snap = await this.db.collection("collections").where("isPublic", "==", true).limit(limit * 2).get();
    return snap.docs
      .map(collectionFrom)
      .filter((c) => c.spotIds.length > 0)
      .slice(0, limit);
  }

  // notifications
  async addNotification(uid: string, n: Omit<Notification, "id" | "createdAt" | "read">) {
    await this.users().doc(uid).collection("notifications").add({ ...n, read: false, createdAt: new Date() });
  }
  async listNotifications(uid: string, limit: number) {
    const snap = await this.users().doc(uid).collection("notifications").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => {
      const x = d.data();
      return { ...(x as Notification), id: d.id, createdAt: toDate(x.createdAt) };
    });
  }
  async markNotificationsRead(uid: string) {
    const snap = await this.users().doc(uid).collection("notifications").where("read", "==", false).get();
    for (const group of chunk(snap.docs, 400)) {
      const batch = this.db.batch();
      for (const d of group) batch.update(d.ref, { read: true });
      await batch.commit();
    }
  }

  // photos
  async putPhoto(photo: Omit<Photo, "id" | "createdAt">) {
    const ref = this.db.collection("photos").doc();
    await ref.set({ ownerUid: photo.ownerUid, contentType: photo.contentType, data: Buffer.from(photo.data), createdAt: new Date() });
    return ref.id;
  }
  async getPhoto(id: string) {
    const snap = await this.db.collection("photos").doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    return { id, ownerUid: d.ownerUid, contentType: d.contentType, data: new Uint8Array(d.data), createdAt: toDate(d.createdAt) };
  }

  async hitRateLimit(uid: string, key: string, limit: number, windowMs: number) {
    const ref = this.db.collection("rateLimits").doc(`${uid}_${key}`);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const hits = ((snap.data()?.hits as number[] | undefined) ?? []).filter((t) => now - t < windowMs);
      if (hits.length >= limit) return false;
      hits.push(now);
      tx.set(ref, { hits });
      return true;
    });
  }
}

/**
 * Loads the sample data into an empty project, once. A meta/seed document acts as a lock,
 * so concurrent server instances don't seed twice. Ids are stable, so a retry is safe.
 */
export async function seedIfEmpty(db: Firestore): Promise<void> {
  if (process.env.FORKD_SEED_SAMPLE === "0") return;
  const lock = db.collection("meta").doc("seed");
  const snap = await lock.get();
  const d = snap.data();
  if (d?.status === "done") return;
  if (d?.status === "running" && Date.now() - toDate(d.startedAt).getTime() < 10 * 60_000) return;
  try {
    if (snap.exists) await lock.set({ status: "running", startedAt: new Date() });
    else await lock.create({ status: "running", startedAt: new Date() });
  } catch {
    return; // another instance won the race
  }

  const data = buildSampleData();
  const ops: [FirebaseFirestore.DocumentReference, DocumentData][] = [];
  ops.push([db.collection("cities").doc(data.city.id), { name: data.city.name }]);
  for (const c of data.categories) ops.push([db.collection("categories").doc(c.id), { ...c }]);
  for (const s of data.spots) {
    const { id, ...rest } = s;
    ops.push([db.collection("spots").doc(id), rest]);
  }
  for (const p of data.profiles) {
    const { uid, ...rest } = p;
    ops.push([db.collection("users").doc(uid), rest]);
  }
  for (const v of data.visits) {
    const { id, ...rest } = v;
    ops.push([db.collection("visits").doc(id), rest]);
  }
  for (const [a, b] of data.follows) {
    ops.push([db.collection("users").doc(a).collection("following").doc(b), { createdAt: new Date() }]);
    ops.push([db.collection("users").doc(b).collection("followers").doc(a), { createdAt: new Date() }]);
  }
  for (const [v, u] of data.likes) ops.push([db.collection("visits").doc(v).collection("likes").doc(u), { createdAt: new Date() }]);
  for (const c of data.comments) {
    const { id, ...rest } = c;
    ops.push([db.collection("visits").doc(c.visitId).collection("comments").doc(id), rest]);
  }
  for (const c of data.collections) {
    const { id, ...rest } = c;
    ops.push([db.collection("collections").doc(id), rest]);
  }
  for (const group of chunk(ops, 400)) {
    const batch = db.batch();
    for (const [ref, value] of group) batch.set(ref, value);
    await batch.commit();
  }
  await lock.set({ status: "done", finishedAt: new Date(), docs: ops.length });
  console.log(`[forkd] seeded Firestore with ${ops.length} sample documents`);
}

export function createFirestoreStore(): FirestoreStore {
  const db = getFirestore(getAdminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true, preferRest: true });
  } catch {
    // settings() can only be called once per instance; a hot reload may call it again.
  }
  return new FirestoreStore(db);
}
