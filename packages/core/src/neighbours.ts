/** userId -> (spotId -> rating) */
export type RatingMatrix = ReadonlyMap<string, ReadonlyMap<string, number>>;

export interface Neighbour {
  userId: string;
  /** 0 to 1, 1 = identical ratings on shared spots. */
  similarity: number;
  /** How much this person's opinion counts in predictions. */
  weight: number;
  shared: number;
}

export const MIN_SHARED = 2;
export const MIN_SIMILARITY = 0.45;

/**
 * Find "taste twins": people whose ratings on spots you both rated are close to yours.
 * Similarity = 1 - mean absolute difference / 3, so a 3-star gap on every spot scores 0.
 */
export function findNeighbours(
  userId: string,
  mine: ReadonlyMap<string, number>,
  matrix: RatingMatrix,
  limit = 50,
): Neighbour[] {
  const out: Neighbour[] = [];
  for (const [otherId, theirs] of matrix) {
    if (otherId === userId) continue;
    let shared = 0;
    let diff = 0;
    for (const [spotId, r] of mine) {
      const t = theirs.get(spotId);
      if (t !== undefined) {
        shared++;
        diff += Math.abs(t - r);
      }
    }
    if (shared < MIN_SHARED) continue;
    const similarity = Math.max(0, 1 - diff / shared / 3);
    if (similarity <= MIN_SIMILARITY) continue;
    const weight = (similarity - MIN_SIMILARITY) ** 2 * Math.min(shared, 5);
    out.push({ userId: otherId, similarity, weight, shared });
  }
  return out.sort((a, b) => b.weight - a.weight).slice(0, limit);
}
