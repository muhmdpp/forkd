/**
 * Seeds Kozhikode with SAMPLE spots and simulated reviewers so the recommender has data to learn from.
 * Everything inserted here is flagged is_sample = true. Re-running replaces the sample data and
 * never touches real users or real spots.
 *
 *   pnpm db:seed
 */
import { eq, inArray, sql } from "drizzle-orm";
import { createDb, rowsOf } from "./client";
import { rebuildCityStats } from "./services";
import { categories, cities, profiles, spotCategories, spots, user, visits } from "./schema";

const CITY = { id: "kozhikode", name: "Kozhikode", lat: 11.2588, lng: 75.7804 };

const CATEGORIES = [
  { id: "biryani", label: "Biryani", hue: 28 },
  { id: "arabic", label: "Mandi & Arabic", hue: 40 },
  { id: "seafood", label: "Seafood", hue: 196 },
  { id: "meals", label: "Kerala meals", hue: 132 },
  { id: "snacks", label: "Tea & snacks", hue: 88 },
  { id: "cafe", label: "Cafés", hue: 266 },
  { id: "dessert", label: "Desserts", hue: 334 },
  { id: "chinese", label: "Indo-Chinese", hue: 6 },
  { id: "bakery", label: "Bakery", hue: 50 },
];

// buzz = how loud the place is on social media (0-1); q = hidden "true" quality. Both only drive the simulation.
const SPOTS = [
  { slug: "kallai-biryani-house", name: "Kallai Biryani House", area: "Kallai Road", cats: ["biryani"], spice: 0.55, price: 2, buzz: 0.45, q: 4.2, dish: "Chicken dum biryani" },
  { slug: "beach-road-mandi-co", name: "Beach Road Mandi Co.", area: "Beach Road", cats: ["arabic"], spice: 0.3, price: 2, buzz: 0.92, q: 3.0, dish: "Mutton mandi" },
  { slug: "halwa-lane-sweets", name: "Halwa Lane Sweets", area: "SM Street", cats: ["dessert", "bakery"], spice: 0, price: 1, buzz: 0.55, q: 4.0, dish: "Black halwa" },
  { slug: "mananchira-tea-point", name: "Mananchira Tea Point", area: "Mananchira", cats: ["snacks"], spice: 0.3, price: 1, buzz: 0.12, q: 4.4, dish: "Pazhampori and sulaimani" },
  { slug: "tide-and-tamarind", name: "Tide & Tamarind", area: "Beach Road", cats: ["seafood"], spice: 0.6, price: 3, buzz: 0.82, q: 3.7, dish: "Karimeen pollichathu" },
  { slug: "second-gate-cafe", name: "Second Gate Café", area: "Nadakkavu", cats: ["cafe", "dessert"], spice: 0.1, price: 3, buzz: 0.97, q: 2.8, dish: "Biscoff freakshake" },
  { slug: "ammachis-meals", name: "Ammachi's Meals", area: "Palayam", cats: ["meals"], spice: 0.5, price: 1, buzz: 0.22, q: 4.5, dish: "Fish curry meals" },
  { slug: "pink-cloud-waffles", name: "Pink Cloud Waffles", area: "Mavoor Road", cats: ["dessert"], spice: 0, price: 2, buzz: 0.99, q: 2.7, dish: "Triple chocolate waffle" },
  { slug: "kadappuram-night-stall", name: "Kadappuram Night Stall", area: "South Beach", cats: ["seafood", "snacks"], spice: 0.75, price: 1, buzz: 0.16, q: 4.4, dish: "Kallummakkaya fry" },
  { slug: "pathiri-and-co", name: "Pathiri & Co.", area: "Kuttichira", cats: ["meals"], spice: 0.4, price: 1, buzz: 0.35, q: 4.3, dish: "Pathiri with chicken curry" },
  { slug: "wok-street", name: "Wok Street", area: "Thondayad", cats: ["chinese"], spice: 0.7, price: 2, buzz: 0.6, q: 3.4, dish: "Chilli beef" },
  { slug: "kuzhimanthi-corner", name: "Kuzhimanthi Corner", area: "Eranhipalam", cats: ["arabic"], spice: 0.35, price: 2, buzz: 0.5, q: 4.0, dish: "Chicken kuzhimanthi" },
  { slug: "old-port-bakery", name: "Old Port Bakery", area: "Valiyangadi", cats: ["bakery", "snacks"], spice: 0.2, price: 1, buzz: 0.3, q: 4.1, dish: "Egg puffs" },
  { slug: "cold-press-collective", name: "Cold Press Collective", area: "Kozhikode Beach", cats: ["cafe"], spice: 0, price: 3, buzz: 0.75, q: 3.2, dish: "Avocado toast" },
  { slug: "chemmeen-kitchen", name: "Chemmeen Kitchen", area: "West Hill", cats: ["seafood", "meals"], spice: 0.85, price: 2, buzz: 0.4, q: 4.3, dish: "Prawn roast" },
  { slug: "mittai-theruvu-falooda", name: "Mittai Theruvu Falooda", area: "SM Street", cats: ["dessert"], spice: 0, price: 1, buzz: 0.65, q: 3.9, dish: "Royal falooda" },
  { slug: "dum-box", name: "Dum Box", area: "Mavoor Road", cats: ["biryani"], spice: 0.4, price: 2, buzz: 0.88, q: 3.0, dish: "Box biryani" },
  { slug: "puthiyara-dum-kitchen", name: "Puthiyara Dum Kitchen", area: "Puthiyara", cats: ["biryani"], spice: 0.5, price: 2, buzz: 0.2, q: 4.4, dish: "Kaima rice biryani" },
  { slug: "the-brew-room", name: "The Brew Room", area: "Eranhipalam", cats: ["cafe"], spice: 0.1, price: 2, buzz: 0.35, q: 4.0, dish: "Filter coffee and banana cake" },
  { slug: "red-dragon-express", name: "Red Dragon Express", area: "Medical College", cats: ["chinese"], spice: 0.8, price: 1, buzz: 0.25, q: 3.9, dish: "Schezwan fried rice" },
];

const ARCHETYPES = [
  { tags: { seafood: 0.6, biryani: 0.5, chinese: 0.4, cafe: -0.5, dessert: -0.3 }, spice: 0.8, ps: 0.5 },
  { tags: { cafe: 0.8, dessert: 0.6, meals: -0.3, snacks: -0.2 }, spice: 0.2, ps: 0.1 },
  { tags: { dessert: 0.8, bakery: 0.6, cafe: 0.3, chinese: -0.3 }, spice: 0.2, ps: 0.4 },
  { tags: { meals: 0.7, snacks: 0.7, biryani: 0.4, cafe: -0.6 }, spice: 0.55, ps: 0.9 },
  { tags: { arabic: 0.8, biryani: 0.7, seafood: 0.2, dessert: -0.2 }, spice: 0.45, ps: 0.4 },
] as const;

const HANDLES = "anu.eats ribin_k fathima.r biryanibaba sneha_spoons calicutcraves aslam.m devika.d thattukada_tales nihal.n meera_munches shibu.s hanna.h joel.eats ayesha_a kozhikode_kitchen vishnu.v sana.s arjun_bites rizwan.r neha.n alan.a nimmi.n farhan.f gopika.g rahul.r safa.s jithin.j lakshmi.l adil.a teena.t midhun.m shahana.s kevin.k nayana.n sabith.s athira.a ameen.a diya.d sreerag.s huda.h manu.m ziya.z abhi.a rinsha.r".split(" ");

const REVIEWS = {
  hi: ["Came for the {d}, stayed for seconds. No queue, no reels, just good food.", "Better than places with ten times the hype. The {d} is the real deal.", "Simple place, serious cooking. Order the {d}.", "My go-to whenever friends visit. The {d} has been consistent for years."],
  mid: ["Decent {d}. Not life-changing, but I'd go back if I was nearby.", "Good, not great. The {d} was fine but a bit pricey for what it was.", "Solid enough. Expected a little more after all the posts."],
  lo: ["The {d} looked amazing on camera. Tasted very average.", "Paid for the interior and the lighting, not the food.", "Waited 40 minutes because of a reel. The {d} was cold and bland.", "Pretty to photograph, forgettable to eat."],
};

// Deterministic randomness so every seed produces the same data.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261028);
const gauss = () => {
  let u = 0;
  let v = 0;
  while (!u) u = rand();
  while (!v) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const halfStar = (x: number) => clamp(Math.round(x * 2) / 2, 0.5, 5);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;

async function main() {
  const db = createDb();

  await db.insert(cities).values(CITY).onConflictDoNothing();
  for (const [i, c] of CATEGORIES.entries()) {
    await db
      .insert(categories)
      .values({ ...c, sortOrder: i })
      .onConflictDoUpdate({ target: categories.id, set: { label: c.label, hue: c.hue, sortOrder: i } });
  }

  // Replace previous sample data only.
  await db.delete(spots).where(eq(spots.isSample, true));
  const sampleUsers = await db.select({ id: profiles.userId }).from(profiles).where(eq(profiles.isSample, true));
  if (sampleUsers.length) await db.delete(user).where(inArray(user.id, sampleUsers.map((u) => u.id)));

  const spotIds = new Map<string, string>();
  for (const s of SPOTS) {
    const [row] = await db
      .insert(spots)
      .values({
        slug: s.slug,
        name: s.name,
        cityId: CITY.id,
        area: s.area,
        priceBand: s.price,
        spice: s.spice,
        mustOrder: s.dish,
        status: "live",
        isSample: true,
      })
      .returning({ id: spots.id });
    spotIds.set(s.slug, row!.id);
    await db.insert(spotCategories).values(s.cats.map((categoryId) => ({ spotId: row!.id, categoryId })));
  }

  const now = Date.now();
  const visitRows: (typeof visits.$inferInsert)[] = [];
  for (const [i, handle] of HANDLES.entries()) {
    const id = `sample_${handle.replace(/[^a-z0-9]/g, "_")}`;
    await db.insert(user).values({ id, name: handle, email: `${id}@sample.forkd.invalid`, emailVerified: true });
    await db.insert(profiles).values({
      userId: id,
      handle,
      homeCityId: CITY.id,
      trustScore: Number((0.55 + rand() * 0.4).toFixed(2)),
      onboardedAt: new Date(),
      isSample: true,
    });

    const a = ARCHETYPES[i % ARCHETYPES.length]!;
    const tags: Record<string, number> = {};
    for (const c of CATEGORIES) tags[c.id] = ((a.tags as Record<string, number>)[c.id] ?? 0) + gauss() * 0.15;
    const spiceLike = clamp(a.spice + gauss() * 0.1, 0, 1);

    for (const s of SPOTS) {
      if (rand() > 0.32 + 0.4 * s.buzz) continue;
      const aff = s.cats.reduce((t, c) => t + (tags[c] ?? 0), 0) / s.cats.length;
      const rating = halfStar(s.q + 0.9 * aff - 0.9 * Math.abs(s.spice - spiceLike) - (s.price - 1) * a.ps * 0.35 + gauss() * 0.4);
      const expectation = Math.round(clamp(2 + 3 * s.buzz + gauss() * 0.6, 1, 5));
      const heardFrom = rand() < s.buzz ? "reel" : pick(["friend", "walked_by", "friend", "other"] as const);
      const hypeVote = rating <= expectation - 0.7 ? "over" : rating >= expectation + 0.2 ? "gem" : "ok";
      const tone = rating >= 4 ? REVIEWS.hi : rating <= 2.5 ? REVIEWS.lo : REVIEWS.mid;
      const createdAt = new Date(now - Math.floor(rand() * 120) * 86_400_000 - Math.floor(rand() * 86_400_000));
      visitRows.push({
        userId: id,
        spotId: spotIds.get(s.slug)!,
        rating,
        expectation,
        heardFrom,
        hypeVote,
        review: rand() < 0.55 ? pick(tone).replace("{d}", s.dish.toLowerCase()) : null,
        source: "log",
        visitedOn: createdAt.toISOString().slice(0, 10),
        createdAt,
      });
    }
  }
  for (let i = 0; i < visitRows.length; i += 200) await db.insert(visits).values(visitRows.slice(i, i + 200));

  const n = await rebuildCityStats(db, CITY.id);
  const [{ count } = { count: 0 }] = rowsOf<{ count: number }>(await db.execute(sql`select count(*)::int as count from visits`));
  console.log(`Seeded ${SPOTS.length} sample spots, ${HANDLES.length} sample reviewers, ${count} visits. Stats rebuilt for ${n} spots.`);
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
