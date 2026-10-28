CREATE TYPE "public"."feedback_reason" AS ENUM('cuisine', 'price', 'hype', 'other');--> statement-breakpoint
CREATE TYPE "public"."heard_from" AS ENUM('reel', 'friend', 'walked_by', 'forkd', 'other');--> statement-breakpoint
CREATE TYPE "public"."hype_label" AS ENUM('overhyped', 'hidden_gem', 'lives_up', 'not_enough_data');--> statement-breakpoint
CREATE TYPE "public"."hype_vote" AS ENUM('gem', 'ok', 'over');--> statement-breakpoint
CREATE TYPE "public"."spot_status" AS ENUM('pending', 'live', 'merged', 'closed');--> statement-breakpoint
CREATE TYPE "public"."visit_source" AS ENUM('log', 'quiz');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"hue" smallint DEFAULT 30 NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"spot_id" uuid NOT NULL,
	"reason" "feedback_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"home_city_id" text NOT NULL,
	"trust_score" real DEFAULT 0.5 NOT NULL,
	"onboarded_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "spot_categories" (
	"spot_id" uuid NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "spot_categories_spot_id_category_id_pk" PRIMARY KEY("spot_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "spot_stats" (
	"spot_id" uuid PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"avg" real DEFAULT 0 NOT NULL,
	"bayes" real DEFAULT 0 NOT NULL,
	"histogram" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"avg_expectation" real,
	"expectation_count" integer DEFAULT 0 NOT NULL,
	"hype_gap" real,
	"hype_votes" jsonb DEFAULT '{"gem":0,"ok":0,"over":0}'::jsonb NOT NULL,
	"reel_share" real DEFAULT 0 NOT NULL,
	"hype_label" "hype_label" DEFAULT 'not_enough_data' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"city_id" text NOT NULL,
	"area" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"price_band" smallint NOT NULL,
	"spice" real DEFAULT 0.5 NOT NULL,
	"must_order" text,
	"status" "spot_status" DEFAULT 'live' NOT NULL,
	"created_by" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spots_slug_unique" UNIQUE("slug"),
	CONSTRAINT "spots_price_band" CHECK ("spots"."price_band" between 1 and 3),
	CONSTRAINT "spots_spice" CHECK ("spots"."spice" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"spot_id" uuid NOT NULL,
	"rating" real NOT NULL,
	"expectation" smallint,
	"heard_from" "heard_from",
	"hype_vote" "hype_vote",
	"review" text,
	"source" "visit_source" DEFAULT 'log' NOT NULL,
	"visited_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visits_rating" CHECK ("visits"."rating" >= 0.5 and "visits"."rating" <= 5 and ("visits"."rating" * 2) = round("visits"."rating" * 2)),
	CONSTRAINT "visits_expectation" CHECK ("visits"."expectation" is null or "visits"."expectation" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_home_city_id_cities_id_fk" FOREIGN KEY ("home_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_categories" ADD CONSTRAINT "spot_categories_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_categories" ADD CONSTRAINT "spot_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_stats" ADD CONSTRAINT "spot_stats_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_user_spot_idx" ON "feedback" USING btree ("user_id","spot_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "spot_categories_cat_idx" ON "spot_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "spots_city_status_idx" ON "spots" USING btree ("city_id","status");--> statement-breakpoint
CREATE INDEX "visits_user_idx" ON "visits" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "visits_spot_idx" ON "visits" USING btree ("spot_id","created_at");