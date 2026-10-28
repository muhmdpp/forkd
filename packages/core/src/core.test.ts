import { describe, expect, it } from "vitest";
import {
  type SpotFeatures,
  type VisitSignal,
  bayesianScore,
  buildTaste,
  classifyHype,
  computeAllSpotStats,
  computeSpotStats,
  createContext,
  explainReason,
  findNeighbours,
  predict,
  recommend,
  starText,
} from "./index";

const v = (userId: string, spotId: string, rating: number, extra: Partial<VisitSignal> = {}): VisitSignal => ({
  userId,
  spotId,
  rating,
  expectation: null,
  heardFrom: null,
  hypeVote: null,
  ...extra,
});

const spot = (id: string, categories: string[], spice = 0.5, priceBand: 1 | 2 | 3 = 2): SpotFeatures => ({
  id,
  categories,
  spice,
  priceBand,
});

describe("stats", () => {
  it("pulls a single 5-star toward the city mean", () => {
    const s = computeSpotStats("a", [v("u1", "a", 5)], 3.5);
    expect(s.avg).toBe(5);
    expect(s.bayes).toBeCloseTo(bayesianScore(5, 1, 3.5));
    expect(s.bayes).toBeLessThan(4);
  });

  it("fills the histogram by half star", () => {
    const s = computeSpotStats("a", [v("u1", "a", 0.5), v("u2", "a", 5), v("u3", "a", 5)], 3.5);
    expect(s.histogram).toHaveLength(10);
    expect(s.histogram[0]).toBe(1);
    expect(s.histogram[9]).toBe(2);
  });

  it("weights ratings by reviewer trust", () => {
    const s = computeSpotStats("a", [v("u1", "a", 5, { weight: 1 }), v("bot", "a", 1, { weight: 0 })], 3.5);
    expect(s.avg).toBe(5);
  });

  it("measures the hype gap from expectation answers only", () => {
    const visits = [
      ...Array.from({ length: 6 }, (_, i) => v(`u${i}`, "a", 2.5, { expectation: 5, hypeVote: "over" })),
      v("quiz", "a", 5), // no expectation, must not shift the gap
    ];
    const s = computeSpotStats("a", visits, 3.5);
    expect(s.hypeGap).toBeCloseTo(-2.5);
    expect(s.hypeLabel).toBe("overhyped");
  });

  it("needs enough samples before labelling", () => {
    expect(classifyHype(-2, 3, { gem: 0, ok: 0, over: 3 })).toBe("not_enough_data");
    expect(classifyHype(0.5, 5, { gem: 3, ok: 2, over: 0 })).toBe("hidden_gem");
    expect(classifyHype(0, 5, { gem: 0, ok: 5, over: 0 })).toBe("lives_up");
  });

  it("does not call a spot overhyped when most voters disagree", () => {
    expect(classifyHype(-0.8, 10, { gem: 3, ok: 6, over: 1 })).toBe("lives_up");
  });

  it("tracks the share of visitors who came from reels", () => {
    const s = computeSpotStats("a", [v("1", "a", 3, { heardFrom: "reel" }), v("2", "a", 3, { heardFrom: "friend" })], 3);
    expect(s.reelShare).toBe(0.5);
  });
});

describe("taste", () => {
  const spots = new Map([
    ["b1", spot("b1", ["biryani"], 0.6, 2)],
    ["c1", spot("c1", ["cafe"], 0.1, 3)],
  ]);

  it("learns category likes and dislikes", () => {
    const t = buildTaste(
      [
        { spotId: "b1", rating: 5 },
        { spotId: "c1", rating: 1 },
      ],
      spots,
    );
    expect(t.affinity.biryani).toBeGreaterThan(0);
    expect(t.affinity.cafe).toBeLessThan(0);
    expect(t.spice).toBeCloseTo(0.6);
  });

  it("applies Not for me feedback", () => {
    const t = buildTaste([], spots, [
      { spotId: "c1", reason: "cuisine" },
      { spotId: "c1", reason: "price" },
      { spotId: "c1", reason: "hype" },
    ]);
    expect(t.affinity.cafe).toBeLessThan(0);
    expect(t.price).toBeLessThan(2);
    expect(t.hypeScepticism).toBeGreaterThan(0);
  });
});

describe("neighbours", () => {
  it("finds people who rate like you and ignores those who don't", () => {
    const mine = new Map([
      ["a", 5],
      ["b", 1],
      ["c", 4],
    ]);
    const matrix = new Map([
      ["me", mine],
      ["twin", new Map([["a", 5], ["b", 1.5], ["c", 4]])],
      ["opposite", new Map([["a", 1], ["b", 5], ["c", 1]])],
      ["stranger", new Map([["a", 5]])],
    ]);
    const n = findNeighbours("me", mine, matrix);
    expect(n.map((x) => x.userId)).toEqual(["twin"]);
  });
});

describe("recommend", () => {
  // Biryani lovers and cafe lovers rate two worlds differently.
  const spots = new Map(
    [
      spot("b1", ["biryani"], 0.6, 1),
      spot("b2", ["biryani"], 0.5, 1),
      spot("b3", ["biryani"], 0.55, 2),
      spot("c1", ["cafe"], 0.1, 3),
      spot("c2", ["cafe"], 0.1, 3),
      spot("m1", ["meals"], 0.5, 1),
    ].map((s) => [s.id, s]),
  );
  const visits: VisitSignal[] = [];
  for (let i = 0; i < 6; i++) {
    visits.push(v(`bl${i}`, "b1", 5), v(`bl${i}`, "b2", 4.5), v(`bl${i}`, "b3", 4.5), v(`bl${i}`, "c1", 2));
    visits.push(v(`cl${i}`, "b1", 2), v(`cl${i}`, "c1", 5), v(`cl${i}`, "c2", 4.5), v(`cl${i}`, "b3", 2));
  }
  visits.push(v("me", "b1", 5), v("me", "c1", 1.5));

  const build = () => {
    const { globalMean, stats } = computeAllSpotStats([...spots.keys()], visits);
    const matrix = new Map<string, Map<string, number>>();
    for (const x of visits) {
      const m = matrix.get(x.userId) ?? new Map<string, number>();
      m.set(x.spotId, x.rating);
      matrix.set(x.userId, m);
    }
    return createContext({ userId: "me", spots, stats, matrix, feedback: [], globalMean });
  };

  it("ranks the user's kind of place above the other kind", () => {
    const ctx = build();
    const recs = recommend(ctx);
    const ids = recs.map((r) => r.spotId);
    expect(ids).not.toContain("b1"); // already rated
    expect(ids.indexOf("b2")).toBeLessThan(ids.indexOf("c2"));
    expect(predict(spots.get("b3")!, ctx).predicted).toBeGreaterThan(predict(spots.get("c2")!, ctx).predicted);
  });

  it("only claims taste twins that really exist", () => {
    const ctx = build();
    const p = predict(spots.get("b2")!, ctx);
    const twins = p.reasons.find((r) => r.code === "TASTE_TWINS");
    expect(twins).toBeDefined();
    if (twins?.code === "TASTE_TWINS") {
      const realFans = ctx.neighbours.filter((n) => (ctx.matrix.get(n.userId)?.get("b2") ?? 0) >= 4).length;
      expect(twins.fans).toBe(realFans);
    }
  });

  it("explains reasons in plain sentences", () => {
    const text = explainReason(
      { code: "SIMILAR_TO_RATED", spotId: "b1", rating: 4.5, category: "biryani" },
      { spotName: () => "Kallai Biryani House", categoryLabel: () => "Biryani" },
    );
    expect(text).toBe("You gave Kallai Biryani House ★★★★½. This is also biryani.");
    expect(starText(3)).toBe("★★★");
  });

  it("keeps the feed varied", () => {
    const ctx = build();
    const top3 = recommend(ctx, { limit: 3 });
    const cats = top3.map((p) => spots.get(p.spotId)!.categories[0]);
    expect(new Set(cats).size).toBeGreaterThan(1);
  });

  it("respects Not for me exclusions", () => {
    const ctx = build();
    expect(recommend(ctx, { exclude: new Set(["b2"]) }).map((r) => r.spotId)).not.toContain("b2");
  });
});
