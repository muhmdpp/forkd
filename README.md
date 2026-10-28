# Forkd

**Reels lie. Your taste doesn't.** Forkd is a Letterboxd-style app for food spots: log where you ate, rate it, and get picks ranked for *your* taste, each with a reason attached. Every spot gets a **Reel vs Real** check comparing how hyped people thought it was with how they actually rated it.

Mobile-first PWA, starting in Kozhikode.

## What's in v0.1

- **Swipe onboarding.** Bumble-style cards: right = loved it, left = nope, up or down = haven't been.
- **For You feed.** Personal match %, "why we suggested this" reasons, and a "Skip the reel" list of hyped spots that don't fit you.
- **Spot pages.** Reel vs Real bars, worth-the-hype votes, rating histogram, reviews.
- **Log a visit.** Half-star rating, how hyped it seemed beforehand, where you heard about it, hype vote, review.
- **Explore.** Top rated (Bayesian), For you, Slept on (hidden gems), Most hyped, by category.
- **Diary, taste profile ("food personality"), add a spot, Not for me with a reason.**
- **Auth.** Email + password, and Google when keys are set.

## Run it

You need Node 22 and pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

With no `DATABASE_URL`, Forkd runs in **demo mode**: an in-memory Postgres (PGlite) loaded with sample Kozhikode spots and reviewers. Anything you add resets when the server restarts.

### With a real database

```bash
cp .env.example .env          # set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d          # local Postgres 16
pnpm setup                    # migrate + seed sample data
pnpm dev
```

## Deploy to Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `apps/web`. Vercel detects Next.js and pnpm.
3. Deploy. With no env vars it runs in demo mode, which is good for showing people.

For real users, add these environment variables and redeploy:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | A Postgres URL, e.g. from [Neon](https://neon.tech) (use the pooled connection string) |
| `BETTER_AUTH_SECRET` | Output of `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your site URL, e.g. `https://forkd.vercel.app` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional, for Google sign-in |

Then run migrations once against that database from your machine: `DATABASE_URL=... pnpm setup`.

## Repo layout

```
apps/
  web/        Next.js 16 PWA: pages, server actions, auth (Better Auth)
  worker/     scheduled jobs (stats rebuild today; recs, trust checks later)
packages/
  core/       pure TypeScript: recommender, hype score, explanations (+ tests)
  db/         Drizzle schema, migrations, seed, demo database
  config/     shared TypeScript config
```

The recommendation and hype maths live in `packages/core` with no framework code, so the web app, worker and tests all run the same logic. See the architecture doc for the full design and roadmap.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the web app |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | Type check every package |
| `pnpm build` | Production build |
| `pnpm db:generate` | Create a migration after editing `packages/db/src/schema.ts` |
| `pnpm db:migrate` / `pnpm db:seed` | Apply migrations / load sample data |
| `pnpm --filter @forkd/db demo:build` | Rebuild the demo database bundle after schema or seed changes |
| `pnpm worker` | Rebuild spot stats for every city |

## Sample data

Spots tagged **Sample** and their reviewers are made up so the recommender has something to learn from. Re-running the seed replaces sample data only and never touches real users or spots.
