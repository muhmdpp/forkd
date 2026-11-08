/**
 * Background jobs. v0.2 has one: recompute stats, hype labels, dishes and trending counts
 * for every spot. Safe to run any time. Run on a schedule with:  pnpm worker
 *
 * Planned (see docs): trust score recalculation, precomputed recommendations, receipt checks.
 */
import { getStore, recomputeSpot } from "@forkd/db";

const started = Date.now();
const store = await getStore();
const cities = ["kozhikode"];
for (const city of cities) {
  const spots = await store.listCitySpots(city);
  for (const s of spots) await recomputeSpot(store, s.id);
  console.log(`[worker] ${city}: recomputed ${spots.length} spots`);
}
console.log(`[worker] done in ${Date.now() - started} ms`);
process.exit(0);
