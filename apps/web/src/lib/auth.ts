import "server-only";
import { getDb, isDemoMode, schema } from "@forkd/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

const DEFAULT_CITY = "kozhikode";

function handleFrom(name: string, email: string) {
  const base = (name || email.split("@")[0] || "foodie")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return `${base || "foodie"}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Every user gets a profile row the moment their account exists. */
export async function ensureProfile(userId: string, name: string, email: string) {
  const db = getDb();
  const [existing] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(schema.profiles)
    .values({ userId, handle: handleFrom(name, email), homeCityId: DEFAULT_CITY, trustScore: 0.4 })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)))[0]!;
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const googleEnabled = Boolean(google);

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const baseURL = process.env.BETTER_AUTH_URL ?? (vercelUrl ? `https://${vercelUrl}` : undefined);

// Demo mode (no DATABASE_URL) may also run without a secret so a first deploy works out of the box.
// Any real deployment must set BETTER_AUTH_SECRET.
const secret =
  process.env.BETTER_AUTH_SECRET ?? (isDemoMode ? "forkd-demo-mode-only-secret-set-BETTER_AUTH_SECRET" : undefined);

export const auth = betterAuth({
  appName: "Forkd",
  baseURL,
  secret,
  trustedOrigins: [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter((u): u is string => Boolean(u))
    .map((u) => `https://${u}`),
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: google,
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 30 },
  databaseHooks: {
    user: {
      create: {
        after: async (u) => {
          await ensureProfile(u.id, u.name, u.email);
        },
      },
    },
  },
  plugins: [nextCookies()],
});
