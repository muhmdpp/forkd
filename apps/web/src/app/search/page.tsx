import type { Metadata } from "next";
import Link from "next/link";
import { SpotListCard } from "@/components/cards";
import { I } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { DEFAULT_CITY, searchAll } from "@/lib/data";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const viewer = await getViewer();
  const { spots, people } = await searchAll(viewer?.homeCityId ?? DEFAULT_CITY, q);
  return (
    <main className="page">
      <header className="topbar">
        <form action="/search" className="wrap flex w-full items-center gap-2 py-2">
          <Link href="/explore" className="iconbtn" aria-label="Back">
            {I.back()}
          </Link>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus
            placeholder="Spots, dishes, areas or @people"
            className="input !rounded-full !py-2.5"
            autoComplete="off"
          />
        </form>
      </header>
      <div className="wrap flex flex-col gap-4 pb-12">
        {!q ? <p className="muted small pt-2">Try “biryani”, “Beach Road” or “falooda”.</p> : null}
        {people.map((p) => (
          <Link key={p.uid} href={`/u/${p.handle}`} className="row">
            <Avatar name={p.name} src={p.avatarUrl} size={48} />
            <div className="grow">
              <div className="name">{p.name}</div>
              <div className="small muted">@{p.handle}</div>
            </div>
          </Link>
        ))}
        {spots.length ? (
          <div className="stack">
            {spots.map((c) => (
              <SpotListCard key={c.spot.id} c={c} />
            ))}
          </div>
        ) : q ? (
          <div className="empty flex flex-col items-center gap-3">
            <p>No spots match “{q}”.</p>
            {viewer ? (
              <Link href="/spots/new" className="btn sm primary">
                Add it
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
