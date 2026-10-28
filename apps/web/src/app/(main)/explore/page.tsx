import type { Metadata } from "next";
import Link from "next/link";
import { HypeSticker, Plate, SampleNote, Stars, TopBar } from "@/components/ui";
import { type ExploreSort, getExplore } from "@/lib/data";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Explore" };
export const dynamic = "force-dynamic";

const SORTS: { id: ExploreSort; label: string; note: string }[] = [
  { id: "best", label: "Top rated", note: "Weighted ratings. A spot with three 5★ reviews can't jump past one with three hundred." },
  { id: "you", label: "For you", note: "Your predicted match, from your taste and people who rate like you." },
  { id: "gems", label: "Slept on", note: "Biggest gap between what people expected and what they got, in the spot's favour." },
  { id: "hyped", label: "Most hyped", note: "Highest expectations going in. Check the rating before you queue." },
];

export default async function Explore({ searchParams }: { searchParams: Promise<{ cat?: string; sort?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const cat = sp.cat ?? "all";
  let sort = (SORTS.find((s) => s.id === sp.sort)?.id ?? "best") as ExploreSort;
  if (sort === "you" && !viewer) sort = "best";
  const { rows, categories } = await getExplore(viewer?.cityId ?? "kozhikode", viewer?.id ?? null, cat, sort);
  const href = (next: { cat?: string; sort?: string }) => {
    const p = new URLSearchParams({ cat: next.cat ?? cat, sort: next.sort ?? sort });
    return `/explore?${p}`;
  };

  return (
    <>
      <TopBar />
      <div className="mt-2 flex flex-col gap-4">
        <h1 className="display">
          Explore <em>Kozhikode</em>
        </h1>
        <nav className="chips" aria-label="Category">
          {[{ id: "all", label: "All" }, ...categories].map((c) => (
            <Link key={c.id} href={href({ cat: c.id })} className="chip" aria-current={cat === c.id ? "true" : undefined}>
              {c.label}
            </Link>
          ))}
        </nav>
        <nav className="seg" aria-label="Sort">
          {SORTS.filter((s) => s.id !== "you" || viewer).map((s) => (
            <Link key={s.id} href={href({ sort: s.id })} aria-current={sort === s.id ? "true" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
        <p className="meta">{SORTS.find((s) => s.id === sort)?.note}</p>

        {rows.length ? (
          <div className="card divide overflow-hidden">
            {rows.map((r, i) => (
              <Link key={r.spot.id} href={`/spots/${r.spot.slug}`} className="row">
                <span className={`rank ${i < 3 ? "top" : ""}`}>{i + 1}</span>
                <Plate name={r.spot.name} hue={r.hue} size="sm" />
                <div className="grow">
                  <div className="name">{r.spot.name}</div>
                  <div className="meta flex flex-wrap items-center gap-x-1.5">
                    <span>{r.spot.area}</span>
                    {r.stats.count > 0 ? (
                      <>
                        · <Stars value={Math.round(r.stats.avg * 2) / 2} />
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Metric sort={sort} r={r} />
                  <HypeSticker label={r.stats.hypeLabel} flat />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">Nothing here yet. Be the first to add one.</div>
        )}
        <SampleNote />
      </div>
    </>
  );
}

function Metric({ sort, r }: { sort: ExploreSort; r: Awaited<ReturnType<typeof getExplore>>["rows"][number] }) {
  const cls = "num text-[15px] font-bold";
  if (sort === "you") return <span className={cls} style={{ color: "var(--gem)" }}>{r.match}%</span>;
  if (sort === "gems") {
    const g = r.stats.hypeGap ?? 0;
    return <span className={cls} style={{ color: g >= 0 ? "var(--gem)" : "var(--cap)" }}>{g >= 0 ? "+" : ""}{g.toFixed(1)}★</span>;
  }
  if (sort === "hyped") return <span className={cls}>{r.stats.avgExpectation?.toFixed(1) ?? "–"} hype</span>;
  return <span className={cls}>{r.stats.count ? r.stats.bayes.toFixed(1) : "–"}</span>;
}
