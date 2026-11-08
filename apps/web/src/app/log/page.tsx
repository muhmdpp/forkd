import type { Metadata } from "next";
import Link from "next/link";
import { SpotListCard } from "@/components/cards";
import { I } from "@/components/icons";
import { BackBar } from "@/components/ui";
import { getSpotList, requireViewer, searchAll } from "@/lib/data";

export const metadata: Metadata = { title: "Log an experience" };
export const dynamic = "force-dynamic";

export default async function LogSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const viewer = await requireViewer("/log");
  const { q = "" } = await searchParams;
  const spots = q ? (await searchAll(viewer.homeCityId, q)).spots : (await getSpotList(viewer.homeCityId, null, "all", "best")).rows;
  return (
    <main className="page cream">
      <BackBar href="/" title="Log an experience" />
      <div className="wrap flex flex-col gap-4 pb-12">
        <form action="/log" className="flex gap-2">
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Where did you eat?" className="input" autoComplete="off" />
          <button type="submit" className="btn primary" aria-label="Search">
            {I.search({ width: 20, height: 20 })}
          </button>
        </form>
        <Link href="/rate" className="card line flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full" style={{ background: "var(--mustard)" }}>
            {I.swipe({ width: 22, height: 22 })}
          </span>
          <div className="flex-1">
            <div className="font-bold">Rate a bunch at once</div>
            <div className="small muted">Swipe through spots you&rsquo;ve already been to</div>
          </div>
          {I.chevronRight({ width: 20, height: 20 })}
        </Link>
        {spots.length ? (
          <div className="stack">
            {spots.map((c) => (
              <div key={c.spot.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <SpotListCard c={c} />
                </div>
                <Link href={`/log/${c.spot.slug}`} className="btn sm primary">
                  Log
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No spot matches “{q}”.</div>
        )}
        <Link href="/spots/new" className="btn wide">
          {I.plus({ width: 18, height: 18 })} Not listed? Add the spot
        </Link>
      </div>
    </main>
  );
}
