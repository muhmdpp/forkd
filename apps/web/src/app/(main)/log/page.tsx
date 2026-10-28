import type { Metadata } from "next";
import Link from "next/link";
import { Plate, TopBar } from "@/components/ui";
import { searchSpots } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Log a visit" };
export const dynamic = "force-dynamic";

export default async function LogSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const viewer = await requireViewer("/log");
  const { q = "" } = await searchParams;
  const results = await searchSpots(viewer.cityId, q);
  return (
    <>
      <TopBar />
      <div className="flex flex-col gap-4">
        <h1 className="display">
          Where&rsquo;d you <em>eat</em>?
        </h1>
        <form action="/log" className="flex gap-2">
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search spots or areas" className="input" autoComplete="off" />
          <button type="submit" className="btn btn-hot">Go</button>
        </form>
        <Link href="/rate" className="card flex items-center justify-between gap-3 p-4">
          <div>
            <div className="h3">Quick rate</div>
            <div className="meta">Swipe through spots you&rsquo;ve been to</div>
          </div>
          <span className="sticker sticker-hot">Swipe</span>
        </Link>
        {results.length ? (
          <div className="card divide overflow-hidden">
            {results.map((r) => (
              <Link key={r.spot.id} href={`/log/${r.spot.slug}`} className="row">
                <Plate name={r.spot.name} hue={r.hue} size="sm" />
                <div className="grow">
                  <div className="name">{r.spot.name}</div>
                  <div className="meta">{r.spot.area}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">No spot matches &ldquo;{q}&rdquo;.</div>
        )}
        <Link href="/spots/new" className="btn btn-block">
          Not listed? Add it
        </Link>
      </div>
    </>
  );
}
