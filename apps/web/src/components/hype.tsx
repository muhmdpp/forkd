import type { SpotStats } from "@forkd/core";

/** Expected (what the buzz promised) vs actual (what people rated). */
export function HypeBars({ stats }: { stats: SpotStats }) {
  const exp = stats.avgExpectation ?? 0;
  const gap = stats.hypeGap ?? 0;
  const actualColor = gap <= -0.6 ? "var(--red)" : gap >= 0.35 ? "var(--mint)" : "var(--mustard)";
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="card line p-4">
        <div className="font-bold small">Expected</div>
        <div className="tiny muted">heard on reels, friends, etc.</div>
        <div className="mt-2 flex items-center gap-1.5 text-[30px] font-extrabold num">
          {exp.toFixed(1)}
          <span style={{ color: "var(--fg)", fontSize: 22 }}>★</span>
        </div>
      </div>
      <div className="card line p-4">
        <div className="font-bold small">Actual</div>
        <div className="tiny muted">community rating</div>
        <div className="mt-2 flex items-center gap-1.5 text-[30px] font-extrabold num">
          {stats.avg.toFixed(1)}
          <span style={{ color: actualColor, fontSize: 22 }}>★</span>
        </div>
      </div>
    </div>
  );
}

export function RatingHistogram({ stats }: { stats: SpotStats }) {
  const max = Math.max(1, ...stats.histogram);
  return (
    <div>
      <div className="flex h-14 items-end gap-[3px]" role="img" aria-label="How people rated it, from half a star to five stars">
        {stats.histogram.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.max(5, (v / max) * 100)}%`, background: (i + 1) / 2 >= 4 ? "var(--mustard)" : "var(--surface-2)" }}
          />
        ))}
      </div>
      <div className="tiny muted mt-1 flex justify-between">
        <span>½★</span>
        <span>5★</span>
      </div>
    </div>
  );
}
