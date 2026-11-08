# Forkd

**Food spots for people who actually eat out.** Log where you ate, rate it, and get picks ranked for *your* taste, each with a reason. Every spot gets a **Hype Check**: how hyped people thought it was before going, compared with how they rated it after.

Mobile-first web app (installable as a PWA), starting in Kozhikode. Built with Next.js (React) and Firebase.

## What's in v0.2

- **Onboarding:** splash, two intro slides, pick your cravings, then a Bumble-style swipe deck (right = liked it, left = didn't, up or down = haven't been).
- **Home:** *For You* with a "Picked for your taste" card, match %, reasons and a "Skip the reel" list. *Following* is a feed of experiences from people you follow, plus "people who eat like you" suggestions.
- **Explore:** category circles, Trending, Collections, Hidden gems, Top rated, category lists with four rankings, and search across spots, dishes, areas and @people.
- **Spot page:** hero photo, rating, hype label, would-revisit %, price, your match, and Overview / Experiences / Menu / Info tabs. Save it, add it to a list, share it, or tap "Not for me".
- **Hype Check:** expected vs actual rating, how people voted, and how many came from reels.
- **Log an experience:** dishes you tried, half-star rating, hype vote, up to 4 photos (resized on the phone before upload), a review, whether you'd go back, and how hyped it was beforehand.
- **Social:** experience posts with a photo carousel, likes, comments, follows, followers and following lists, and an Activity tab for notifications.
- **Profile:** avatar, bio, stats, Experiences grid, Collections and Saved spots; edit profile; your taste profile.
- **Sign-in:** Firebase Auth (Google + email). With no Firebase configured, the app runs in **demo mode** with sample data and guest sign-in.

## Run it locally

You need Node 22 and pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev            # http://localhost:3000, demo mode
```

### Against Firebase emulators (no real project needed)

```bash
npm i -g firebase-tools
pnpm emulators      # Firestore on 8080, Auth on 9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_PROJECT_ID=demo-forkd pnpm dev
```

## Deploy (Vercel + Firebase)

1. **Firebase console:** create a project, then Firestore (production mode, `asia-south1`) and Authentication (Email/Password + Google).
2. **Authentication → Settings → Authorized domains:** add your Vercel domains.
3. **Vercel → Settings → Environment Variables:**

| Variable | Value |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | The whole JSON file from Project settings → Service accounts → Generate new private key. Secret. |
| `FIREBASE_WEB_CONFIG` | The `firebaseConfig = { ... }` block from Project settings → Your apps → Web app. |

4. Vercel **Root Directory** = `apps/web`. Deploy.
5. Open `/api/health`. It should say `"mode":"firebase"` and list 20 spots. On first launch the app fills an empty Firestore with the Kozhikode sample data (set `FORKD_SEED_SAMPLE=0` to skip).

Optional: `firebase deploy --only firestore` publishes `firestore.rules` (browsers get no direct access; production-mode Firestore already denies them) and an index that speeds up the Following feed. The app works without the index.

## How data is stored

All reads and writes go through the server with the Firebase Admin SDK. No composite indexes are required.

```
spots/{id}       name, area, categories, cover, stats, ratings map, dishes, trending count
visits/{id}      an experience: rating, dishes, photos, review, hype vote  (+ likes/, comments/)
users/{uid}      profile and counters  (+ following/, followers/, saved/, feedback/, notifications/)
collections/{id} categories/{id}  photos/{id}  rateLimits/{id}  meta/seed
```

Photos are resized in the browser and stored in Firestore (under 1 MB each), served from `/api/photos/:id` with long caching. This avoids needing the paid Blaze plan for Cloud Storage; moving to Storage later only changes `putPhoto` and `getPhoto`.

## Repo layout

```
apps/
  web/        Next.js 16 app: screens, server actions, sessions, photo route
  worker/     scheduled job: recompute stats, hype labels, dishes and trending
packages/
  core/       pure TypeScript: recommender, hype score, explanations (+ tests)
  db/         Store interface, Firestore and in-memory stores, sample data, social services
  config/     shared TypeScript config
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the web app |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | Type check every package |
| `pnpm build` | Production build |
| `pnpm emulators` | Firebase emulators for local development |
| `pnpm worker` | Recompute every spot's stats |

## Sample data

Sample spots, reviewers, follows and comments are made up so the recommender and feeds have something to show. Photos are free [Unsplash](https://unsplash.com/license) images. Everything sample is flagged `isSample`.
