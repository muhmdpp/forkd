/**
 * Background jobs. v0.1 has one: a full rebuild of spot stats and hype scores for every city.
 * Run it on a schedule (cron, Railway, GitHub Actions) with:  pnpm worker
 *
 * Planned (see docs): trust score recalculation, precomputed recommendations, receipt checks,
 * image processing. These move to a BullMQ queue on Redis when traffic needs it.
 */
import { createDb, rebuildCityStats, schema } from "@forkd/db";

const db = createDb();
const started = Date.now();
const cities = await db.select({ id: schema.cities.id }).from(schema.cities);
for (const c of cities) {
  const n = await rebuildCityStats(db, c.id);
  console.log(`[worker] ${c.id}: rebuilt stats for ${n} spots`);
}
console.log(`[worker] done in ${Date.now() - started} ms`);
await db.$client.end();
