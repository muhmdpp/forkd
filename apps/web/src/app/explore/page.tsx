import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { CollectionTile, SpotListCard, SpotTile } from "@/components/cards";
import { CategoryIcon, I } from "@/components/icons";
import { SectionTitle } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { CITY_NAME, DEFAULT_CITY, getExplore, hasUnread } from "@/lib/data";

export const metadata: Metadata = { title: "Explore" };
export const dynamic = "force-dynamic";

const CIRCLES = ["var(--mustard)", "var(--pink)", "var(--teal)", "#f08a74", "#f7e3a8"];

export default async function Explore() {
  const viewer = await getViewer();
  const city = viewer?.homeCityId ?? DEFAULT_CITY;
  const { categories, trending, gems, top, collections } = await getExplore(city);
  const cityName = CITY_NAME[city] ?? city;
  return (
    <main className="page">
      <div className={`wrap ${viewer ? "with-nav" : "pb-12"}`}>
        <header className="flex items-center gap-3 pb-4" style={{ paddingTop: "calc(14px + env(safe-area-inset-top))" }}>
          <h1 className="display flex-1" style={{ fontSize: 42 }}>
            Explore
          </h1>
          <Link href="/search" className="iconbtn filled" aria-label="Search">
            {I.search()}
          </Link>
        </header>

        <nav className="chips scroll bleed px-[max(18px,env(safe-area-inset-left))]" aria-label="Categories" style={{ gap: 14 }}>
          {categories.map((c, i) => (
            <Link key={c.id} href={`/explore/${c.id}`} className="flex w-[58px] flex-none flex-col items-center gap-1.5">
              <span className="grid h-[54px] w-[54px] place-items-center rounded-full" style={{ background: CIRCLES[i % CIRCLES.length], color: "var(--g-950)" }}>
                <CategoryIcon id={c.id} width={26} height={26} />
              </span>
              <span className="tiny text-center font-semibold leading-tight">{c.label}</span>
            </Link>
          ))}
          <Link href="/explore/all" className="flex w-[58px] flex-none flex-col items-center gap-1.5">
            <span className="grid h-[54px] w-[54px] place-items-center rounded-full" style={{ background: "var(--g-800)" }}>
              {I.grid({ width: 24, height: 24 })}
            </span>
            <span className="tiny font-semibold">All</span>
          </Link>
        </nav>

        <section className="mt-7 flex flex-col gap-3">
          <SectionTitle title={`Trending in ${cityName}`} href="/explore/all?sort=best" />
          <div className="rail bleed">
            {trending.map((c) => (
              <SpotTile key={c.spot.id} c={c} />
            ))}
          </div>
        </section>

        {collections.length ? (
          <section className="mt-8 flex flex-col gap-3">
            <SectionTitle title="Collections" />
            <div className="flex flex-col gap-3">
              {collections.slice(0, 4).map((c) => (
                <CollectionTile key={c.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}

        {gems.length ? (
          <section className="mt-8 flex flex-col gap-3">
            <SectionTitle title="Hidden gems" href="/explore/all?sort=gems" />
            <p className="small muted -mt-1">Places people liked more than they expected to.</p>
            <div className="rail bleed">
              {gems.map((c) => (
                <SpotTile key={c.spot.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 flex flex-col gap-1">
          <SectionTitle title="Top rated" href="/explore/all?sort=best" />
          <div className="stack">
            {top.map((c, i) => (
              <SpotListCard key={c.spot.id} c={c} rank={i + 1} />
            ))}
          </div>
        </section>

        {viewer ? (
          <Link href="/spots/new" className="card mt-8 flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full" style={{ background: "var(--g-800)" }}>
              {I.plus({ width: 20, height: 20 })}
            </span>
            <div className="flex-1">
              <div className="font-bold">Know a spot we&rsquo;re missing?</div>
              <div className="small muted">Add it and be the first to rate it.</div>
            </div>
          </Link>
        ) : null}
        <p className="tiny muted mt-8">
          Sample spots and reviewers are made up for the beta. Photos from{" "}
          <a href="https://unsplash.com" className="underline" target="_blank" rel="noreferrer">
            Unsplash
          </a>
          .
        </p>
      </div>
      {viewer ? <BottomNav handle={viewer.handle} unread={await hasUnread(viewer.uid)} /> : null}
    </main>
  );
}
