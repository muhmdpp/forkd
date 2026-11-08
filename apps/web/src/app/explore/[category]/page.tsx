import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpotListCard } from "@/components/cards";
import { BackBar } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { DEFAULT_CITY, type ListSort, getSpotList } from "@/lib/data";

export const metadata: Metadata = { title: "Explore" };
export const dynamic = "force-dynamic";

const SORTS: { id: ListSort; label: string; note: string }[] = [
  { id: "best", label: "Top rated", note: "Spots with only a few ratings are weighted less, so rankings stay fair." },
  { id: "you", label: "For you", note: "Your predicted match, from your taste and people who rate like you." },
  { id: "gems", label: "Hidden gems", note: "Places people liked more than they expected to." },
  { id: "hyped", label: "Most hyped", note: "Places people expected the most from. Compare with the rating." },
];

export default async function CategoryList({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const viewer = await getViewer();
  let sort = (SORTS.find((s) => s.id === sp.sort)?.id ?? (viewer ? "you" : "best")) as ListSort;
  if (sort === "you" && !viewer) sort = "best";
  const { category: cat, categories, rows } = await getSpotList(viewer?.homeCityId ?? DEFAULT_CITY, viewer, category, sort);
  if (category !== "all" && !cat) notFound();
  const title = cat?.label ?? "All spots";
  return (
    <main className="page">
      <BackBar href="/explore" title="" />
      <div className="wrap flex flex-col gap-4 pb-12">
        <h1 className="display">{title}</h1>
        <nav className="chips scroll" aria-label="Category">
          {[{ id: "all", label: "All" }, ...categories].map((c) => (
            <Link key={c.id} href={`/explore/${c.id}?sort=${sort}`} className="chip" aria-current={category === c.id ? "true" : undefined}>
              {c.label}
            </Link>
          ))}
        </nav>
        <nav className="tabs" aria-label="Sort">
          {SORTS.filter((s) => s.id !== "you" || viewer).map((s) => (
            <Link key={s.id} href={`/explore/${category}?sort=${s.id}`} aria-current={sort === s.id ? "true" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
        <p className="small muted">{SORTS.find((s) => s.id === sort)?.note}</p>
        {rows.length ? (
          <div className="stack">
            {rows.map((c, i) => (
              <SpotListCard key={c.spot.id} c={c} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div className="empty">Nothing here yet.</div>
        )}
      </div>
    </main>
  );
}
