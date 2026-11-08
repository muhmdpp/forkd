"use server";
import {
  type Profile,
  addComment as addCommentSvc,
  deleteExperience,
  getStore,
  invalidateCity,
  recomputeSpot,
  recordExperiences,
  setFollow,
  setLike,
  slugHandle,
} from "@forkd/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer, markGuestOnboarded } from "@/lib/auth";

export type ActionResult = { error?: string; ok?: boolean; url?: string; id?: string } | undefined;

async function me(): Promise<Profile> {
  const v = await getViewer();
  if (!v) throw new Error("Please sign in first.");
  return v;
}

async function limit(uid: string, key: string, n: number, windowMs: number, message: string) {
  const store = await getStore();
  if (!(await store.hitRateLimit(uid, key, n, windowMs))) throw new Error(message);
}

const safePath = (p: string | undefined, fallback = "/") => (p && p.startsWith("/") && !p.startsWith("//") ? p : fallback);
const HOUR = 3_600_000;

const halfStar = z.coerce
  .number()
  .min(0.5, "Pick a rating first.")
  .max(5)
  .refine((n) => Number.isInteger(n * 2), "Ratings go in half stars.");

/* ---------------- onboarding ---------------- */

export async function saveCravings(cravings: string[]) {
  const viewer = await me();
  const store = await getStore();
  const valid = new Set((await store.listCategories()).map((c) => c.id));
  await store.updateProfile(viewer.uid, { cravings: cravings.filter((c) => valid.has(c)).slice(0, 9) });
  redirect("/onboarding/rate");
}

const swipesSchema = z.array(z.object({ spotId: z.string().min(1).max(80), rating: halfStar })).max(30);

export async function saveSwipes(answers: { spotId: string; rating: number }[], next: string) {
  const viewer = await me();
  const parsed = swipesSchema.parse(answers);
  if (parsed.length) {
    await recordExperiences(
      viewer,
      parsed.map((a) => ({
        spotId: a.spotId,
        rating: a.rating,
        expectation: null,
        heardFrom: null,
        hypeVote: null,
        review: null,
        dishes: [],
        photos: [],
        wouldReturn: null,
        source: "quiz" as const,
      })),
    );
  }
  if (!viewer.onboardedAt) {
    await (await getStore()).updateProfile(viewer.uid, { onboardedAt: new Date() });
    await markGuestOnboarded();
  }
  revalidatePath("/", "layout");
  redirect(safePath(next));
}

/* ---------------- photos ---------------- */

const PHOTO_TYPES = new Set(["image/jpeg", "image/webp", "image/png"]);
const MAX_PHOTO = 900 * 1024;

/** Stores one already-resized photo and returns its URL. */
export async function uploadPhoto(form: FormData): Promise<ActionResult> {
  try {
    const viewer = await me();
    const file = form.get("photo");
    if (!(file instanceof File)) return { error: "No photo received." };
    if (!PHOTO_TYPES.has(file.type)) return { error: "Use a JPG, PNG or WebP photo." };
    if (file.size > MAX_PHOTO) return { error: "That photo is too large. Try another one." };
    await limit(viewer.uid, "photo", 40, HOUR, "You've uploaded a lot of photos. Try again in an hour.");
    const data = new Uint8Array(await file.arrayBuffer());
    const id = await (await getStore()).putPhoto({ ownerUid: viewer.uid, contentType: file.type, data });
    return { ok: true, url: `/api/photos/${id}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const photoUrl = z.string().regex(/^\/api\/photos\/[A-Za-z0-9-]{8,64}$/, "Bad photo.");

/* ---------------- experiences ---------------- */

const experienceSchema = z.object({
  spotId: z.string().min(1).max(80),
  rating: halfStar,
  hypeVote: z.enum(["gem", "ok", "over"]).nullable(),
  expectation: z.number().int().min(1).max(5).nullable(),
  heardFrom: z.enum(["reel", "friend", "walked_by", "forkd", "other"]).nullable(),
  wouldReturn: z.boolean().nullable(),
  dishes: z.array(z.string().trim().min(1).max(40)).max(8),
  photos: z.array(photoUrl).max(4),
  review: z.string().trim().max(1000, "Keep it under 1000 characters.").nullable(),
});

export type ExperienceDraft = z.input<typeof experienceSchema>;

export async function postExperience(draft: ExperienceDraft): Promise<ActionResult> {
  let id: string;
  try {
    const viewer = await me();
    const d = experienceSchema.parse(draft);
    await limit(viewer.uid, "log", 20, HOUR, "You're logging a lot right now. Try again in a bit.");
    [id] = (await recordExperiences(viewer, [
      { ...d, review: d.review || null, dishes: [...new Set(d.dishes)], source: "log" },
    ])) as [string];
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : (e as Error).message;
    return { error: issue ?? "Couldn't post that. Try again." };
  }
  revalidatePath("/", "layout");
  redirect(`/e/${id}?toast=logged`);
}

export async function deleteExperienceAction(visitId: string) {
  const viewer = await me();
  const v = await deleteExperience(viewer.uid, visitId);
  revalidatePath("/", "layout");
  redirect(v ? `/u/${viewer.handle}?toast=deleted` : "/");
}

/* ---------------- likes, comments, follows, saves ---------------- */

export async function toggleLike(visitId: string, liked: boolean) {
  const viewer = await me();
  await setLike(viewer, z.string().min(1).max(80).parse(visitId), liked);
}

export async function postComment(visitId: string, text: string): Promise<ActionResult> {
  try {
    const viewer = await me();
    const body = z.string().trim().min(1, "Write something first.").max(500).parse(text);
    await limit(viewer.uid, "comment", 30, HOUR, "Slow down a little. Try again soon.");
    await addCommentSvc(viewer, visitId, body);
    revalidatePath(`/e/${visitId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0]?.message : (e as Error).message };
  }
}

export async function followAction(targetUid: string, follow: boolean) {
  const viewer = await me();
  await limit(viewer.uid, "follow", 60, HOUR, "Too many follows. Try again later.");
  await setFollow(viewer, z.string().min(1).max(128).parse(targetUid), follow);
  revalidatePath("/", "layout");
}

export async function toggleSave(spotId: string, saved: boolean) {
  const viewer = await me();
  await (await getStore()).setSaved(viewer.uid, z.string().min(1).max(80).parse(spotId), saved);
  revalidatePath(`/u/${viewer.handle}`);
}

export async function hideSpot(spotId: string, reason: string, returnTo: string) {
  const viewer = await me();
  const r = z.enum(["cuisine", "price", "hype", "other"]).parse(reason);
  await (await getStore()).setFeedback(viewer.uid, z.string().min(1).max(80).parse(spotId), r);
  revalidatePath("/", "layout");
  const back = safePath(returnTo);
  redirect(`${back.startsWith("/spots/") ? "/" : back}?toast=hidden`);
}

/* ---------------- spots ---------------- */

const spotSchema = z.object({
  name: z.string().trim().min(2, "Give the spot a name.").max(80),
  area: z.string().trim().min(2, "Which area is it in?").max(60),
  mustOrder: z.string().trim().max(80).optional(),
  priceBand: z.coerce.number().int().min(1).max(3),
  spice: z.coerce.number().min(0).max(1),
  categories: z.array(z.string()).min(1, "Pick at least one category.").max(2, "Two categories max."),
  coverUrl: photoUrl.optional(),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function addSpot(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  let slug = "";
  try {
    const viewer = await me();
    const d = spotSchema.parse({
      name: form.get("name"),
      area: form.get("area"),
      mustOrder: form.get("mustOrder") || undefined,
      priceBand: form.get("priceBand"),
      spice: form.get("spice"),
      categories: form.getAll("categories"),
      coverUrl: form.get("coverUrl") || undefined,
    });
    await limit(viewer.uid, "spot", 10, 24 * HOUR, "You've added 10 spots today. Thanks! Try again tomorrow.");
    const store = await getStore();
    const valid = new Set((await store.listCategories()).map((c) => c.id));
    const cats = d.categories.filter((c) => valid.has(c));
    if (!cats.length) return { error: "Pick at least one category." };
    const base = slugify(`${d.name} ${d.area}`) || "spot";
    slug = base;
    for (let i = 2; await store.getSpotBySlug(slug); i++) slug = `${base}-${i}`;
    // TODO(trust): new spots should start "pending" until a second person confirms them (roadmap phase 4).
    const spot = await store.createSpot({
      slug,
      name: d.name,
      area: d.area,
      cityId: viewer.homeCityId,
      priceBand: d.priceBand as 1 | 2 | 3,
      spice: d.spice,
      mustOrder: d.mustOrder || null,
      categories: cats,
      status: "live",
      isSample: false,
      createdBy: viewer.uid,
      coverUrl: d.coverUrl ?? null,
    });
    await recomputeSpot(store, spot.id);
    invalidateCity(viewer.homeCityId);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0]?.message : (e as Error).message };
  }
  revalidatePath("/", "layout");
  redirect(`/log/${slug}?toast=added`);
}

/* ---------------- collections ---------------- */

export async function createCollection(title: string, description: string, spotId?: string): Promise<ActionResult> {
  try {
    const viewer = await me();
    const t = z.string().trim().min(2, "Name the collection.").max(60).parse(title);
    await limit(viewer.uid, "collection", 20, 24 * HOUR, "That's a lot of collections for one day.");
    const c = await (await getStore()).createCollection({
      ownerUid: viewer.uid,
      ownerHandle: viewer.handle,
      title: t,
      description: description.trim().slice(0, 200),
      spotIds: spotId ? [spotId] : [],
      isPublic: true,
    });
    revalidatePath("/", "layout");
    return { ok: true, id: c.id };
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0]?.message : (e as Error).message };
  }
}

export async function setCollectionSpot(collectionId: string, spotId: string, included: boolean) {
  const viewer = await me();
  const store = await getStore();
  const c = await store.getCollection(collectionId);
  if (!c || c.ownerUid !== viewer.uid) throw new Error("You can only edit your own collections.");
  await store.setCollectionSpot(collectionId, spotId, included);
  revalidatePath(`/collections/${collectionId}`);
}

/* ---------------- profile ---------------- */

const profileSchema = z.object({
  name: z.string().trim().min(1, "Add your name.").max(40),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Usernames need at least 3 characters.")
    .max(20)
    .regex(/^[a-z0-9._]+$/, "Use letters, numbers, dots and underscores only."),
  bio: z.string().trim().max(160, "Keep your bio under 160 characters."),
  avatarUrl: z.union([photoUrl, z.literal("")]).optional(),
});

export async function updateProfile(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  let handle = "";
  try {
    const viewer = await me();
    const d = profileSchema.parse({
      name: form.get("name"),
      handle: form.get("handle"),
      bio: form.get("bio") ?? "",
      avatarUrl: form.get("avatarUrl") ?? undefined,
    });
    const store = await getStore();
    if (d.handle !== viewer.handle) {
      const taken = await store.getProfileByHandle(d.handle);
      if (taken) return { error: `@${d.handle} is taken. Try another.` };
    }
    handle = slugHandle(d.handle);
    await store.updateProfile(viewer.uid, {
      name: d.name,
      handle,
      bio: d.bio,
      ...(d.avatarUrl !== undefined ? { avatarUrl: d.avatarUrl || null } : {}),
    });
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0]?.message : (e as Error).message };
  }
  revalidatePath("/", "layout");
  redirect(`/u/${handle}?toast=saved`);
}
