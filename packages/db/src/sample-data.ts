/**
 * Deterministic SAMPLE data for Kozhikode: spots, simulated reviewers, their experiences,
 * follows, likes, comments and collections. Used to seed Firestore on first launch and to
 * fill the in-memory demo store. Everything is flagged isSample, and ids are stable.
 *
 * Photos are free-to-use Unsplash images (https://unsplash.com/license), hotlinked as
 * Unsplash asks. Restaurants and reviewers are fictional.
 */
import { computeAllSpotStats } from "@forkd/core";
import type { Category, City, Collection, Comment, Profile, SpotRow, VisitRecord } from "./types";

const U = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const SAMPLE_CITY: City = { id: "kozhikode", name: "Kozhikode" };

export const SAMPLE_CATEGORIES: Category[] = [
  { id: "biryani", label: "Biryani", hue: 28, sortOrder: 0, imageUrl: U("1631515243349-e0cb75fb8d3a", 400) },
  { id: "arabic", label: "Mandi", hue: 40, sortOrder: 1, imageUrl: U("1555939594-58d7cb561ad1", 400) },
  { id: "seafood", label: "Seafood", hue: 196, sortOrder: 2, imageUrl: U("1786222084052-fb6f27bfb135", 400) },
  { id: "meals", label: "Kerala meals", hue: 132, sortOrder: 3, imageUrl: U("1625398407796-82650a8c135f", 400) },
  { id: "snacks", label: "Snacks", hue: 88, sortOrder: 4, imageUrl: U("1601050690597-df0568f70950", 400) },
  { id: "cafe", label: "Cafe", hue: 266, sortOrder: 5, imageUrl: U("1507133750040-4a8f57021571", 400) },
  { id: "dessert", label: "Dessert", hue: 334, sortOrder: 6, imageUrl: U("1611928237590-087afc90c6fd", 400) },
  { id: "chinese", label: "Chinese", hue: 6, sortOrder: 7, imageUrl: U("1512058564366-18510be2db19", 400) },
  { id: "bakery", label: "Bakery", hue: 50, sortOrder: 8, imageUrl: U("1777544575746-96654957db13", 400) },
];

/** Extra photos per category, used on sample experiences. */
const GALLERY: Record<string, string[]> = {
  biryani: ["1716550781939-beb7d7247aae", "1719239885399-f87d992e0f18", "1633945274309-2c16c9682a8c", "1752673508949-f4aeeaef75f0", "1589302168068-964664d93dc0"],
  arabic: ["1708184528306-f75a0a5118ee", "1555939594-58d7cb561ad1", "1728910156510-77488f19b152"],
  seafood: ["1786222084052-fb6f27bfb135", "1626727873980-fa047e09507f", "1759244566095-d6047dfde9c9", "1625943555419-56a2cb596640"],
  meals: ["1625398407796-82650a8c135f", "1786227905994-235e1799292e", "1694849789325-914b71ab4075", "1668236543090-82eba5ee5976"],
  snacks: ["1601050690597-df0568f70950", "1668236543090-82eba5ee5976"],
  cafe: ["1592663527359-cf6642f54cff", "1763683943943-c2ac7a370251", "1507133750040-4a8f57021571", "1763683944193-c4635a3d3999"],
  dessert: ["1572490122747-3968b75cc699", "1641665271888-575e46923776", "1619158403521-ed9795026d47", "1611928237590-087afc90c6fd"],
  chinese: ["1512058564366-18510be2db19", "1758979690131-11e2aa0b142b", "1788601299617-3052a7c8fa70"],
  bakery: ["1770650195496-f8b577782ca3", "1777544575746-96654957db13"],
};

// buzz = how loud the place is on social media (0-1); q = hidden "true" quality. Both only drive the simulation.
const SPOTS = [
  { slug: "kallai-biryani-house", name: "Kallai Biryani House", area: "Kallai Road", cats: ["biryani"], spice: 0.55, price: 2, buzz: 0.45, q: 4.2, cover: "1589302168068-964664d93dc0", dishes: ["Chicken dum biryani", "Mutton biryani", "Chicken 65", "Fresh lime soda"] },
  { slug: "beach-road-mandi-co", name: "Beach Road Mandi Co.", area: "Beach Road", cats: ["arabic"], spice: 0.3, price: 2, buzz: 0.92, q: 3.0, cover: "1708184528306-f75a0a5118ee", dishes: ["Mutton mandi", "Chicken mandi", "Alfaham", "Kunafa"] },
  { slug: "halwa-lane-sweets", name: "Halwa Lane Sweets", area: "SM Street", cats: ["dessert", "bakery"], spice: 0, price: 1, buzz: 0.55, q: 4.0, cover: "1777544575746-96654957db13", dishes: ["Black halwa", "Banana chips", "Pineapple halwa"] },
  { slug: "mananchira-tea-point", name: "Mananchira Tea Point", area: "Mananchira", cats: ["snacks"], spice: 0.3, price: 1, buzz: 0.12, q: 4.4, cover: "1601050690597-df0568f70950", dishes: ["Pazhampori", "Sulaimani", "Samosa", "Unnakaya"] },
  { slug: "tide-and-tamarind", name: "Tide & Tamarind", area: "Beach Road", cats: ["seafood"], spice: 0.6, price: 3, buzz: 0.82, q: 3.7, cover: "1786222084052-fb6f27bfb135", dishes: ["Karimeen pollichathu", "Prawn roast", "Appam", "Fish curry"] },
  { slug: "second-gate-cafe", name: "Second Gate Café", area: "Nadakkavu", cats: ["cafe", "dessert"], spice: 0.1, price: 3, buzz: 0.97, q: 2.8, cover: "1572490122747-3968b75cc699", dishes: ["Biscoff freakshake", "Cold coffee", "Loaded fries"] },
  { slug: "ammachis-meals", name: "Ammachi's Meals", area: "Palayam", cats: ["meals"], spice: 0.5, price: 1, buzz: 0.22, q: 4.5, cover: "1625398407796-82650a8c135f", dishes: ["Fish curry meals", "Beef fry", "Payasam"] },
  { slug: "pink-cloud-waffles", name: "Pink Cloud Waffles", area: "Mavoor Road", cats: ["dessert"], spice: 0, price: 2, buzz: 0.99, q: 2.7, cover: "1641665271888-575e46923776", dishes: ["Triple chocolate waffle", "Red velvet waffle", "Ice cream sundae"] },
  { slug: "kadappuram-night-stall", name: "Kadappuram Night Stall", area: "South Beach", cats: ["seafood", "snacks"], spice: 0.75, price: 1, buzz: 0.16, q: 4.4, cover: "1626727873980-fa047e09507f", dishes: ["Kallummakkaya fry", "Squid fry", "Kappa and fish curry"] },
  { slug: "pathiri-and-co", name: "Pathiri & Co.", area: "Kuttichira", cats: ["meals"], spice: 0.4, price: 1, buzz: 0.35, q: 4.3, cover: "1786227905994-235e1799292e", dishes: ["Pathiri with chicken curry", "Neypathiri", "Erachi pathiri"] },
  { slug: "wok-street", name: "Wok Street", area: "Thondayad", cats: ["chinese"], spice: 0.7, price: 2, buzz: 0.6, q: 3.4, cover: "1758979690131-11e2aa0b142b", dishes: ["Chilli beef", "Hakka noodles", "Dragon chicken"] },
  { slug: "kuzhimanthi-corner", name: "Kuzhimanthi Corner", area: "Eranhipalam", cats: ["arabic"], spice: 0.35, price: 2, buzz: 0.5, q: 4.0, cover: "1555939594-58d7cb561ad1", dishes: ["Chicken kuzhimanthi", "Mutton madfoon", "Hummus"] },
  { slug: "old-port-bakery", name: "Old Port Bakery", area: "Valiyangadi", cats: ["bakery", "snacks"], spice: 0.2, price: 1, buzz: 0.3, q: 4.1, cover: "1770650195496-f8b577782ca3", dishes: ["Egg puffs", "Plum cake", "Cream bun"] },
  { slug: "cold-press-collective", name: "Cold Press Collective", area: "Kozhikode Beach", cats: ["cafe"], spice: 0, price: 3, buzz: 0.75, q: 3.2, cover: "1592663527359-cf6642f54cff", dishes: ["Avocado toast", "Iced latte", "Acai bowl"] },
  { slug: "chemmeen-kitchen", name: "Chemmeen Kitchen", area: "West Hill", cats: ["seafood", "meals"], spice: 0.85, price: 2, buzz: 0.4, q: 4.3, cover: "1625943555419-56a2cb596640", dishes: ["Prawn roast", "Fish fry meals", "Crab roast"] },
  { slug: "mittai-theruvu-falooda", name: "Mittai Theruvu Falooda", area: "SM Street", cats: ["dessert"], spice: 0, price: 1, buzz: 0.65, q: 3.9, cover: "1619158403521-ed9795026d47", dishes: ["Royal falooda", "Kulfi", "Avil milk"] },
  { slug: "dum-box", name: "Dum Box", area: "Mavoor Road", cats: ["biryani"], spice: 0.4, price: 2, buzz: 0.88, q: 3.0, cover: "1633945274309-2c16c9682a8c", dishes: ["Box biryani", "Chicken lollipop"] },
  { slug: "puthiyara-dum-kitchen", name: "Puthiyara Dum Kitchen", area: "Puthiyara", cats: ["biryani"], spice: 0.5, price: 2, buzz: 0.2, q: 4.4, cover: "1752673508949-f4aeeaef75f0", dishes: ["Kaima rice biryani", "Beef biryani", "Chicken roast"] },
  { slug: "the-brew-room", name: "The Brew Room", area: "Eranhipalam", cats: ["cafe"], spice: 0.1, price: 2, buzz: 0.35, q: 4.0, cover: "1763683943943-c2ac7a370251", dishes: ["Filter coffee", "Banana cake", "Cheese toast"] },
  { slug: "red-dragon-express", name: "Red Dragon Express", area: "Medical College", cats: ["chinese"], spice: 0.8, price: 1, buzz: 0.25, q: 3.9, cover: "1512058564366-18510be2db19", dishes: ["Schezwan fried rice", "Chilli chicken", "Gobi manchurian"] },
];

const ARCHETYPES = [
  { tags: { seafood: 0.6, biryani: 0.5, chinese: 0.4, cafe: -0.5, dessert: -0.3 }, spice: 0.8, ps: 0.5 },
  { tags: { cafe: 0.8, dessert: 0.6, meals: -0.3, snacks: -0.2 }, spice: 0.2, ps: 0.1 },
  { tags: { dessert: 0.8, bakery: 0.6, cafe: 0.3, chinese: -0.3 }, spice: 0.2, ps: 0.4 },
  { tags: { meals: 0.7, snacks: 0.7, biryani: 0.4, cafe: -0.6 }, spice: 0.55, ps: 0.9 },
  { tags: { arabic: 0.8, biryani: 0.7, seafood: 0.2, dessert: -0.2 }, spice: 0.45, ps: 0.4 },
] as const;

const PEOPLE = [
  ["anu.eats", "Anu Thomas", "Biryani first, questions later."],
  ["ribin_k", "Ribin K", "Weekend food walks around Kozhikode."],
  ["fathima.r", "Fathima R", "Dessert hunter. Will travel for falooda."],
  ["biryanibaba", "Shameer", "Ranking every biryani in Malabar, slowly."],
  ["sneha_spoons", "Sneha", "Cafe hopper with strong opinions on cold coffee."],
  ["calicutcraves", "Jishnu", "If it's fried and sold after 9pm, I've tried it."],
  ["aslam.m", "Aslam M", "Mandi loyalist."],
  ["devika.d", "Devika", "Meals on a banana leaf, always."],
  ["thattukada_tales", "Rahul Nair", "Thattukadas over fine dining."],
  ["nihal.n", "Nihal", ""],
  ["meera_munches", "Meera", "Sweet tooth, honest reviews."],
  ["shibu.s", "Shibu", ""],
  ["hanna.h", "Hanna", "Seafood or nothing."],
  ["joel.eats", "Joel", "Eats out more than he should."],
  ["ayesha_a", "Ayesha", "Arabic food and good company."],
  ["kozhikode_kitchen", "Liya", "Home cook reviewing restaurants."],
  ["vishnu.v", "Vishnu", ""],
  ["sana.s", "Sana", "Cafes and quiet corners."],
  ["arjun_bites", "Arjun", "Spice level: maximum."],
  ["rizwan.r", "Rizwan", ""],
  ["neha.n", "Neha", "Bakeries are my love language."],
  ["alan.a", "Alan", ""],
  ["nimmi.n", "Nimmi", "Kerala meals in every district."],
  ["farhan.f", "Farhan", "Mandi, then kunafa."],
  ["gopika.g", "Gopika", ""],
  ["rahul.r", "Rahul R", "Late-night food runs."],
  ["safa.s", "Safa", "Desserts and reels, but honest."],
  ["jithin.j", "Jithin", ""],
  ["lakshmi.l", "Lakshmi", "Filter coffee purist."],
  ["adil.a", "Adil", ""],
  ["teena.t", "Teena", "Cafes that let you stay for hours."],
  ["midhun.m", "Midhun", ""],
  ["shahana.s", "Shahana", "Biryani and beach walks."],
  ["kevin.k", "Kevin", ""],
  ["nayana.n", "Nayana", "Snacks under ₹50."],
  ["sabith.s", "Sabith", ""],
  ["athira.a", "Athira", "Trying every new cafe so you don't have to."],
  ["ameen.a", "Ameen", ""],
  ["diya.d", "Diya", "Sweet things only."],
  ["sreerag.s", "Sreerag", ""],
  ["huda.h", "Huda", "Overhyped places, beware."],
  ["manu.m", "Manu", ""],
  ["ziya.z", "Ziya", "Chinese food in Kerala is its own cuisine."],
  ["abhi.a", "Abhi", ""],
  ["rinsha.r", "Rinsha", "Honest about hype."],
] as const;

const REVIEWS = {
  hi: [
    "Came for the {d}, stayed for seconds. No queue, no reels, just good food.",
    "Better than places with ten times the hype. The {d} is the real deal.",
    "Simple place, serious cooking. Order the {d}.",
    "My go-to whenever friends visit. The {d} has been consistent for years.",
    "The {d} is just perfect. Spicy, juicy and full of flavour. Always a good pick.",
  ],
  mid: [
    "Decent {d}. Not life-changing, but I'd go back if I was nearby.",
    "Good, not great. The {d} was fine but a bit pricey for what it was.",
    "Solid enough. Expected a little more after all the posts.",
  ],
  lo: [
    "The {d} looked amazing on camera. Tasted very average.",
    "Paid for the interior and the lighting, not the food.",
    "Waited 40 minutes because of a reel. The {d} was cold and bland.",
    "Pretty to photograph, forgettable to eat.",
  ],
};

const COMMENTS = [
  "Tried this too! Totally agree.",
  "Adding this to my list.",
  "Was it crowded?",
  "Their {d} is underrated.",
  "Going this weekend because of this.",
  "Hard disagree, I loved it.",
  "Thanks for the honest review.",
];

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SampleData {
  city: City;
  categories: Category[];
  spots: SpotRow[];
  profiles: Profile[];
  visits: VisitRecord[];
  follows: [string, string][];
  likes: [string, string][];
  comments: Comment[];
  collections: Collection[];
}

export const sampleUid = (handle: string) => `sample_${handle.replace(/[^a-z0-9]/g, "_")}`;

/** Builds the full sample dataset. Same output on every call. */
export function buildSampleData(now = Date.UTC(2026, 10, 8)): SampleData {
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
  const DAY = 86_400_000;
  const created = new Date(now - 200 * DAY);

  const spots: SpotRow[] = SPOTS.map((s) => ({
    id: `sample-${s.slug}`,
    slug: s.slug,
    name: s.name,
    cityId: SAMPLE_CITY.id,
    area: s.area,
    priceBand: s.price as 1 | 2 | 3,
    spice: s.spice,
    mustOrder: s.dishes[0] ?? null,
    categories: [...s.cats],
    status: "live",
    isSample: true,
    createdBy: null,
    createdAt: created,
    coverUrl: U(s.cover),
    stats: null,
    ratings: {},
    dishes: {},
    revisitShare: null,
    recent30: 0,
  }));

  const profiles: Profile[] = [];
  const visits: VisitRecord[] = [];
  for (const [i, [handle, name, bio]] of PEOPLE.entries()) {
    const uid = sampleUid(handle);
    const trust = Number((0.55 + rand() * 0.4).toFixed(2));
    profiles.push({
      uid,
      name,
      handle,
      bio,
      avatarUrl: null,
      homeCityId: SAMPLE_CITY.id,
      cravings: [],
      trustScore: trust,
      onboardedAt: created,
      isSample: true,
      followers: 0,
      following: 0,
      experiences: 0,
      createdAt: created,
    });

    const a = ARCHETYPES[i % ARCHETYPES.length]!;
    const tags: Record<string, number> = {};
    for (const c of SAMPLE_CATEGORIES) tags[c.id] = ((a.tags as Record<string, number>)[c.id] ?? 0) + gauss() * 0.15;
    const spiceLike = clamp(a.spice + gauss() * 0.1, 0, 1);

    for (const [j, s] of SPOTS.entries()) {
      if (rand() > 0.32 + 0.4 * s.buzz) continue;
      const aff = s.cats.reduce((t, c) => t + (tags[c] ?? 0), 0) / s.cats.length;
      const rating = halfStar(s.q + 0.9 * aff - 0.9 * Math.abs(s.spice - spiceLike) - (s.price - 1) * a.ps * 0.35 + gauss() * 0.4);
      const expectation = Math.round(clamp(2 + 3 * s.buzz + gauss() * 0.6, 1, 5));
      const heardFrom = rand() < s.buzz ? "reel" : pick(["friend", "walked_by", "friend", "other"] as const);
      const hypeVote = rating <= expectation - 0.7 ? "over" : rating >= expectation + 0.2 ? "gem" : "ok";
      const tone = rating >= 4 ? REVIEWS.hi : rating <= 2.5 ? REVIEWS.lo : REVIEWS.mid;
      const createdAt = new Date(now - Math.floor(rand() * 120) * DAY - Math.floor(rand() * DAY));
      const dish = pick(s.dishes);
      const dishes = rand() < 0.4 ? [...new Set([dish, pick(s.dishes)])] : [dish];
      const hasReview = rand() < 0.6;
      const pool = GALLERY[s.cats[0]!] ?? [];
      const photos = hasReview && rand() < 0.55 ? [U(s.cover), ...(rand() < 0.5 ? [U(pick(pool))] : [])] : [];
      const spot = spots[j]!;
      visits.push({
        id: `sample-v${String(visits.length).padStart(4, "0")}`,
        userId: uid,
        handle,
        name,
        avatarUrl: null,
        spotId: spot.id,
        spotSlug: spot.slug,
        spotName: spot.name,
        cityId: SAMPLE_CITY.id,
        rating,
        expectation,
        heardFrom,
        hypeVote,
        review: hasReview ? pick(tone).replace("{d}", dish.toLowerCase()) : null,
        dishes,
        photos: [...new Set(photos)],
        wouldReturn: rating >= 3.5 ? rand() < 0.9 : rating >= 2.5 ? rand() < 0.4 : rand() < 0.08,
        source: "log",
        weight: trust,
        likeCount: 0,
        commentCount: 0,
        createdAt,
      });
      spot.ratings[uid] = rating;
      for (const d of dishes) spot.dishes[d] = (spot.dishes[d] ?? 0) + 1;
    }
  }

  // Derived spot fields.
  const { stats } = computeAllSpotStats(
    spots.map((s) => s.id),
    visits.map((v) => ({ ...v })),
  );
  for (const s of spots) {
    s.stats = stats.get(s.id) ?? null;
    const sv = visits.filter((v) => v.spotId === s.id);
    const answered = sv.filter((v) => v.wouldReturn !== null);
    s.revisitShare = answered.length ? answered.filter((v) => v.wouldReturn).length / answered.length : null;
    s.recent30 = sv.filter((v) => now - v.createdAt.getTime() < 30 * DAY).length;
  }

  // Follows: everyone follows a handful of people.
  const follows: [string, string][] = [];
  for (const p of profiles) {
    const n = 3 + Math.floor(rand() * 6);
    const picked = new Set<string>();
    while (picked.size < n) {
      const other = pick(profiles).uid;
      if (other !== p.uid) picked.add(other);
    }
    for (const o of picked) follows.push([p.uid, o]);
  }
  const byUid = new Map(profiles.map((p) => [p.uid, p]));
  for (const [a, b] of follows) {
    byUid.get(a)!.following++;
    byUid.get(b)!.followers++;
  }

  // Likes and comments on reviewed experiences.
  const likes: [string, string][] = [];
  const comments: Comment[] = [];
  for (const v of visits) {
    byUid.get(v.userId)!.experiences++;
    if (!v.review) continue;
    const likers = new Set<string>();
    const n = Math.floor(rand() * (v.photos.length ? 14 : 5));
    while (likers.size < n) likers.add(pick(profiles).uid);
    likers.delete(v.userId);
    for (const l of likers) likes.push([v.id, l]);
    v.likeCount = likers.size;
    const nc = rand() < 0.35 ? 1 + Math.floor(rand() * 2) : 0;
    for (let k = 0; k < nc; k++) {
      const c = pick(profiles);
      if (c.uid === v.userId) continue;
      comments.push({
        id: `${v.id}-c${k}`,
        visitId: v.id,
        uid: c.uid,
        handle: c.handle,
        name: c.name,
        avatarUrl: null,
        text: pick(COMMENTS).replace("{d}", (v.dishes[0] ?? "food").toLowerCase()),
        createdAt: new Date(v.createdAt.getTime() + (k + 1) * 3_600_000),
      });
      v.commentCount++;
    }
  }

  const byStats = (ids: string[]) => ids;
  const ofCat = (c: string) => spots.filter((s) => s.categories.includes(c));
  const owner = (h: string) => byUid.get(sampleUid(h))!;
  const coll = (id: string, h: string, title: string, description: string, spotIds: string[]): Collection => ({
    id: `sample-${id}`,
    ownerUid: owner(h).uid,
    ownerHandle: h,
    title,
    description,
    spotIds: byStats(spotIds),
    isPublic: true,
    createdAt: created,
    updatedAt: created,
  });
  const collections: Collection[] = [
    coll("biryani-guide", "biryanibaba", "The Kozhikode Biryani Guide", "Every biryani worth the drive, ranked by people who actually ate them.", [...ofCat("biryani"), ...ofCat("arabic")].map((s) => s.id)),
    coll("slept-on", "huda.h", "Slept-on gems", "Quiet places that beat the hyped ones.", spots.filter((s) => s.stats?.hypeLabel === "hidden_gem").slice(0, 8).map((s) => s.id)),
    coll("late-night", "calicutcraves", "Late-night eats", "Still serving after 9pm.", ["kadappuram-night-stall", "red-dragon-express", "mananchira-tea-point", "wok-street"].map((x) => `sample-${x}`)),
    coll("sweet-tooth", "fathima.r", "For the sweet tooth", "Halwa, falooda and the rest.", ofCat("dessert").map((s) => s.id)),
  ];

  return { city: SAMPLE_CITY, categories: SAMPLE_CATEGORIES, spots, profiles, visits, follows, likes, comments, collections };
}
