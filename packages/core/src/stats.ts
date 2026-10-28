import type { HypeLabel, HypeVote, SpotStats, VisitSignal } from "./types";

/** How many visits worth of "city average" each spot starts with. */
export const BAYES_PRIOR_WEIGHT = 5;
/** Visits with an expectation answer needed before we show a hype label. */
export const MIN_HYPE_SAMPLES = 5;
export const OVERHYPED_GAP = -0.6;
export const OVERHYPED_VOTE_SHARE = 0.4;
export const HIDDEN_GEM_GAP = 0.35;
/** Used before a city has any ratings. */
export const DEFAULT_GLOBAL_MEAN = 3.5;

const w = (v: VisitSignal) => v.weight ?? 1;

export function computeGlobalMean(visits: readonly VisitSignal[]): number {
  let sum = 0;
  let weight = 0;
  for (const v of visits) {
    sum += v.rating * w(v);
    weight += w(v);
  }
  return weight > 0 ? sum / weight : DEFAULT_GLOBAL_MEAN;
}

export function bayesianScore(avg: number, weight: number, globalMean: number): number {
  return (BAYES_PRIOR_WEIGHT * globalMean + avg * weight) / (BAYES_PRIOR_WEIGHT + weight);
}

export function classifyHype(
  hypeGap: number | null,
  expectationCount: number,
  votes: Record<HypeVote, number>,
): HypeLabel {
  if (hypeGap === null || expectationCount < MIN_HYPE_SAMPLES) return "not_enough_data";
  const totalVotes = votes.gem + votes.ok + votes.over;
  const overShare = totalVotes > 0 ? votes.over / totalVotes : null;
  // With no votes yet, the measured gap decides on its own.
  if (hypeGap <= OVERHYPED_GAP && (overShare === null || overShare >= OVERHYPED_VOTE_SHARE)) {
    return "overhyped";
  }
  if (hypeGap >= HIDDEN_GEM_GAP) return "hidden_gem";
  return "lives_up";
}

/** Aggregate every visit for one spot into its public stats. */
export function computeSpotStats(
  spotId: string,
  visits: readonly VisitSignal[],
  globalMean: number,
): SpotStats {
  const histogram = Array<number>(10).fill(0);
  const hypeVotes: Record<HypeVote, number> = { gem: 0, ok: 0, over: 0 };
  let sum = 0;
  let weight = 0;
  let expSum = 0;
  let expRatingSum = 0;
  let expWeight = 0;
  let expectationCount = 0;
  let reel = 0;
  let heardCount = 0;

  for (const v of visits) {
    const vw = w(v);
    sum += v.rating * vw;
    weight += vw;
    const bucket = Math.min(9, Math.max(0, Math.round(v.rating * 2) - 1));
    histogram[bucket] = (histogram[bucket] ?? 0) + 1;
    if (v.hypeVote) hypeVotes[v.hypeVote]++;
    if (v.heardFrom) {
      heardCount++;
      if (v.heardFrom === "reel") reel++;
    }
    if (v.expectation !== null) {
      expectationCount++;
      expSum += v.expectation * vw;
      expRatingSum += v.rating * vw;
      expWeight += vw;
    }
  }

  const avg = weight > 0 ? sum / weight : 0;
  const avgExpectation = expWeight > 0 ? expSum / expWeight : null;
  // Compare like with like: only visits that answered the expectation question.
  const hypeGap = expWeight > 0 ? expRatingSum / expWeight - expSum / expWeight : null;

  return {
    spotId,
    count: visits.length,
    avg,
    bayes: weight > 0 ? bayesianScore(avg, weight, globalMean) : globalMean,
    histogram,
    avgExpectation,
    expectationCount,
    hypeGap,
    hypeVotes,
    reelShare: heardCount > 0 ? reel / heardCount : 0,
    hypeLabel: classifyHype(hypeGap, expectationCount, hypeVotes),
  };
}

/** Group visits by spot and compute stats for every spot id given. */
export function computeAllSpotStats(
  spotIds: readonly string[],
  visits: readonly VisitSignal[],
): { globalMean: number; stats: Map<string, SpotStats> } {
  const globalMean = computeGlobalMean(visits);
  const bySpot = new Map<string, VisitSignal[]>();
  for (const v of visits) {
    const list = bySpot.get(v.spotId);
    if (list) list.push(v);
    else bySpot.set(v.spotId, [v]);
  }
  const stats = new Map<string, SpotStats>();
  for (const id of spotIds) stats.set(id, computeSpotStats(id, bySpot.get(id) ?? [], globalMean));
  return { globalMean, stats };
}
