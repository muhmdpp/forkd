"use server";
import { getDb, recomputeSpotStats, schema } from "@forkd/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSpotBySlug } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export type FormState = { error?: string } | undefined;

const halfStar = z.coerce
  .number()
  .min(0.5, "Pick a rating first.")
  .max(5)
  .refine((n) => Number.isInteger(n * 2), "Ratings go in half stars.");

const logSchema = z.object({
  slug: z.string().min(1),
  rating: halfStar,
  expectation: z.coerce.number().int().min(1).max(5).optional(),
  heardFrom: z.enum(["reel", "friend", "walked_by", "forkd", "other"]).optional(),
  hypeVote: z.enum(["gem", "ok", "over"]).optional(),
  review: z.string().trim().max(1000, "Keep the review under 1000 characters.").optional(),
});

/** Simple per-user write limit. Swap for Redis when we run more than one server. */
async function assertUnderLimit(userId: string, perHour: number) {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.visits)
    .where(and(eq(schema.visits.userId, userId), gte(schema.visits.createdAt, sql`now() - interval '1 hour'`)));
  if ((row?.n ?? 0) >= perHour) throw new Error("You're logging a lot right now. Try again in a bit.");
}

const empty = (v: FormDataEntryValue | null) => (v === null || v === "" ? undefined : v);

export async function logVisit(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer("/log");
  const parsed = logSchema.safeParse({
    slug: form.get("slug"),
    rating: form.get("rating"),
    expectation: empty(form.get("expectation")),
    heardFrom: empty(form.get("heardFrom")),
    hypeVote: empty(form.get("hypeVote")),
    review: empty(form.get("review")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const found = await getSpotBySlug(parsed.data.slug);
  if (!found) return { error: "That spot doesn't exist any more." };

  try {
    await assertUnderLimit(viewer.id, 30);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const db = getDb();
  const { spot } = found;
  await db.insert(schema.visits).values({
    userId: viewer.id,
    spotId: spot.id,
    rating: parsed.data.rating,
    expectation: parsed.data.expectation ?? null,
    heardFrom: parsed.data.heardFrom ?? null,
    hypeVote: parsed.data.hypeVote ?? null,
    review: parsed.data.review || null,
    source: "log",
    visitedOn: new Date().toISOString().slice(0, 10),
  });
  // A logged visit beats an earlier "Not for me".
  await db.delete(schema.feedback).where(and(eq(schema.feedback.userId, viewer.id), eq(schema.feedback.spotId, spot.id)));
  await recomputeSpotStats(db, spot.id);

  revalidatePath("/", "layout");
  redirect(`/spots/${spot.slug}?toast=logged`);
}

const feedbackSchema = z.object({
  spotId: z.uuid(),
  reason: z.enum(["cuisine", "price", "hype", "other"]),
});

export async function hideSpot(spotId: string, reason: string, returnTo: string) {
  const viewer = await requireViewer();
  const parsed = feedbackSchema.parse({ spotId, reason });
  const db = getDb();
  await db
    .insert(schema.feedback)
    .values({ userId: viewer.id, spotId: parsed.spotId, reason: parsed.reason })
    .onConflictDoUpdate({
      target: [schema.feedback.userId, schema.feedback.spotId],
      set: { reason: parsed.reason, createdAt: new Date() },
    });
  revalidatePath("/", "layout");
  const safe = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  redirect(`${safe.startsWith("/spots/") ? "/" : safe}?toast=hidden`);
}

export async function undoHide(spotId: string) {
  const viewer = await requireViewer();
  await getDb()
    .delete(schema.feedback)
    .where(and(eq(schema.feedback.userId, viewer.id), eq(schema.feedback.spotId, z.uuid().parse(spotId))));
  revalidatePath("/", "layout");
}

const addSpotSchema = z.object({
  name: z.string().trim().min(2, "Give the spot a name.").max(80),
  area: z.string().trim().min(2, "Which area is it in?").max(60),
  mustOrder: z.string().trim().max(80).optional(),
  priceBand: z.coerce.number().int().min(1).max(3),
  spice: z.coerce.number().min(0).max(1),
  categories: z.array(z.string()).min(1, "Pick at least one category.").max(2, "Two categories max."),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function addSpot(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer("/spots/new");
  const parsed = addSpotSchema.safeParse({
    name: form.get("name"),
    area: form.get("area"),
    mustOrder: empty(form.get("mustOrder")),
    priceBand: form.get("priceBand"),
    spice: form.get("spice"),
    categories: form.getAll("categories"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const db = getDb();
  const [today] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.spots)
    .where(and(eq(schema.spots.createdBy, viewer.id), gte(schema.spots.createdAt, sql`now() - interval '1 day'`)));
  if ((today?.n ?? 0) >= 10) return { error: "You've added 10 spots today. Thanks! Try again tomorrow." };

  const base = slugify(`${parsed.data.name} ${parsed.data.area}`) || "spot";
  let slug = base;
  for (let i = 2; ; i++) {
    const [taken] = await db.select({ id: schema.spots.id }).from(schema.spots).where(eq(schema.spots.slug, slug));
    if (!taken) break;
    slug = `${base}-${i}`;
  }

  const valid = await db.select({ id: schema.categories.id }).from(schema.categories);
  const allowed = new Set(valid.map((c) => c.id));
  const cats = parsed.data.categories.filter((c) => allowed.has(c));
  if (!cats.length) return { error: "Pick at least one category." };

  // TODO(trust): new spots go to "pending" once moderation and second-user confirmation exist (roadmap phase 4).
  const [created] = await db
    .insert(schema.spots)
    .values({
      slug,
      name: parsed.data.name,
      area: parsed.data.area,
      cityId: viewer.cityId,
      priceBand: parsed.data.priceBand,
      spice: parsed.data.spice,
      mustOrder: parsed.data.mustOrder ?? null,
      createdBy: viewer.id,
      status: "live",
    })
    .returning({ id: schema.spots.id });
  await db.insert(schema.spotCategories).values(cats.map((categoryId) => ({ spotId: created!.id, categoryId })));
  await recomputeSpotStats(db, created!.id);

  revalidatePath("/", "layout");
  redirect(`/log/${slug}?toast=added`);
}

const quizSchema = z.array(z.object({ spotId: z.uuid(), rating: halfStar })).max(20);

/** Saves swipe-deck answers (onboarding and quick rate). Marks the user as onboarded. */
export async function saveSwipes(answers: { spotId: string; rating: number }[], next: string) {
  const viewer = await requireViewer("/welcome");
  const parsed = quizSchema.parse(answers);
  const db = getDb();
  if (parsed.length) {
    await db.insert(schema.visits).values(
      parsed.map((a) => ({ userId: viewer.id, spotId: a.spotId, rating: a.rating, source: "quiz" as const })),
    );
    for (const a of parsed) await recomputeSpotStats(db, a.spotId);
  }
  if (!viewer.onboarded) {
    await db.update(schema.profiles).set({ onboardedAt: new Date() }).where(eq(schema.profiles.userId, viewer.id));
  }
  revalidatePath("/", "layout");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safe);
}
