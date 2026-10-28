import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "./uuid";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ------------------------------------------------------------------ */
/* Auth (shape required by Better Auth)                                */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Forkd                                                               */
/* ------------------------------------------------------------------ */

export const spotStatus = pgEnum("spot_status", ["pending", "live", "merged", "closed"]);
export const heardFrom = pgEnum("heard_from", ["reel", "friend", "walked_by", "forkd", "other"]);
export const hypeVote = pgEnum("hype_vote", ["gem", "ok", "over"]);
export const visitSource = pgEnum("visit_source", ["log", "quiz"]);
export const feedbackReason = pgEnum("feedback_reason", ["cuisine", "price", "hype", "other"]);
export const hypeLabel = pgEnum("hype_label", ["overhyped", "hidden_gem", "lives_up", "not_enough_data"]);

export const cities = pgTable("cities", {
  id: text("id").primaryKey(), // slug, e.g. "kozhikode"
  name: text("name").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: createdAt(),
});

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  handle: text("handle").notNull().unique(),
  homeCityId: text("home_city_id")
    .notNull()
    .references(() => cities.id),
  /** 0 to 1, recalculated by the worker. New accounts start low. */
  trustScore: real("trust_score").notNull().default(0.5),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(), // slug, e.g. "biryani"
  label: text("label").notNull(),
  /** Hue (0-360) used for the plate thumbnail. */
  hue: smallint("hue").notNull().default(30),
  sortOrder: smallint("sort_order").notNull().default(0),
});

export const spots = pgTable(
  "spots",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    area: text("area").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    priceBand: smallint("price_band").notNull(),
    spice: real("spice").notNull().default(0.5),
    mustOrder: text("must_order"),
    status: spotStatus("status").notNull().default("live"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("spots_city_status_idx").on(t.cityId, t.status),
    check("spots_price_band", sql`${t.priceBand} between 1 and 3`),
    check("spots_spice", sql`${t.spice} between 0 and 1`),
  ],
);

export const spotCategories = pgTable(
  "spot_categories",
  {
    spotId: uuid("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
  },
  (t) => [primaryKey({ columns: [t.spotId, t.categoryId] }), index("spot_categories_cat_idx").on(t.categoryId)],
);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    spotId: uuid("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    rating: real("rating").notNull(),
    /** How hyped it seemed before going, 1 to 5. */
    expectation: smallint("expectation"),
    heardFrom: heardFrom("heard_from"),
    hypeVote: hypeVote("hype_vote"),
    review: text("review"),
    source: visitSource("source").notNull().default("log"),
    visitedOn: date("visited_on"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("visits_user_idx").on(t.userId, t.createdAt),
    index("visits_spot_idx").on(t.spotId, t.createdAt),
    check("visits_rating", sql`${t.rating} >= 0.5 and ${t.rating} <= 5 and (${t.rating} * 2) = round(${t.rating} * 2)`),
    check("visits_expectation", sql`${t.expectation} is null or ${t.expectation} between 1 and 5`),
  ],
);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    spotId: uuid("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    reason: feedbackReason("reason").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("feedback_user_spot_idx").on(t.userId, t.spotId)],
);

/** Derived: rebuilt from visits by the app and the worker. Safe to truncate and recompute. */
export const spotStats = pgTable("spot_stats", {
  spotId: uuid("spot_id")
    .primaryKey()
    .references(() => spots.id, { onDelete: "cascade" }),
  count: integer("count").notNull().default(0),
  avg: real("avg").notNull().default(0),
  bayes: real("bayes").notNull().default(0),
  histogram: jsonb("histogram").$type<number[]>().notNull().default([]),
  avgExpectation: real("avg_expectation"),
  expectationCount: integer("expectation_count").notNull().default(0),
  hypeGap: real("hype_gap"),
  hypeVotes: jsonb("hype_votes").$type<{ gem: number; ok: number; over: number }>().notNull().default({ gem: 0, ok: 0, over: 0 }),
  reelShare: real("reel_share").notNull().default(0),
  hypeLabel: hypeLabel("hype_label").notNull().default("not_enough_data"),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const spotsRelations = relations(spots, ({ one, many }) => ({
  city: one(cities, { fields: [spots.cityId], references: [cities.id] }),
  categories: many(spotCategories),
  visits: many(visits),
  stats: one(spotStats, { fields: [spots.id], references: [spotStats.spotId] }),
}));

export const spotCategoriesRelations = relations(spotCategories, ({ one }) => ({
  spot: one(spots, { fields: [spotCategories.spotId], references: [spots.id] }),
  category: one(categories, { fields: [spotCategories.categoryId], references: [categories.id] }),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  spot: one(spots, { fields: [visits.spotId], references: [spots.id] }),
  user: one(user, { fields: [visits.userId], references: [user.id] }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(user, { fields: [profiles.userId], references: [user.id] }),
  city: one(cities, { fields: [profiles.homeCityId], references: [cities.id] }),
}));
