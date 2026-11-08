import { HYPE_LABEL_SUMMARY } from "@forkd/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveButton, ShareButton } from "@/components/buttons";
import { ExperienceCard } from "@/components/cards";
import { CollectionSheet } from "@/components/collection-sheet";
import { RatingHistogram } from "@/components/hype";
import { I } from "@/components/icons";
import { NotForMe } from "@/components/not-for-me";
import { HypePill, Photo, Rating, plural, priceRange, rupees } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getSpotPage } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getSpotPage((await params).slug, null);
  if (!page) return { title: "Spot not found" };
  return {
    title: page.spot.name,
    description: `${page.spot.name}, ${page.spot.area}. Rated ${page.stats.avg.toFixed(1)}★ from ${page.stats.count} people on Forkd.`,
    openGraph: page.spot.coverUrl ? { images: [page.spot.coverUrl] } : undefined,
  };
}

const TABS = ["overview", "experiences", "menu", "info"] as const;

export default async function SpotPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const tab = TABS.find((t) => t === sp.tab) ?? "overview";
  const viewer = await getViewer();
  const page = await getSpotPage(slug, viewer);
  if (!page) notFound();
  const { spot, stats, categoryText, prediction, mine, saved, myCollections, experiences, dishes, logCount } = page;
  const tabHref = (t: string) => (t === "overview" ? `/spots/${slug}` : `/spots/${slug}?tab=${t}`);

  return (
    <main className="page with-cta">
      {/* Hero */}
      <div className="relative">
        <Photo src={spot.coverUrl} alt={spot.name} name={spot.name} ratio="4 / 3.4" priority style={{ borderRadius: 0, maxHeight: 440 }}>
          <div className="shade" style={{ background: "linear-gradient(180deg, rgb(5 14 9 / .35) 0%, transparent 30%, transparent 45%, var(--g-900) 98%)" }} />
        </Photo>
        <header className="absolute left-0 right-0 top-0" style={{ paddingTop: "calc(8px + env(safe-area-inset-top))" }}>
          <div className="wrap flex items-center gap-2">
            <Link href="/" className="iconbtn glass" aria-label="Back">
              {I.back()}
            </Link>
            <div className="flex-1" />
            <SaveButton spotId={spot.id} saved={saved} signedIn={Boolean(viewer)} className="iconbtn glass" />
            <ShareButton title={spot.name} path={`/spots/${spot.slug}`} className="iconbtn glass" />
          </div>
        </header>
        <div className="wrap absolute bottom-0 left-0 right-0 flex flex-col gap-1 pb-1">
          <h1 className="display" style={{ fontSize: 40 }}>
            {spot.name}
          </h1>
          <p className="small" style={{ color: "var(--on-g)" }}>
            {categoryText} · {spot.area}
          </p>
        </div>
      </div>

      <div className="wrap flex flex-col gap-5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            {stats.count ? (
              <>
                <Rating value={stats.avg} size={34} />
                <span className="tiny muted">{plural(stats.count, "rating")}</span>
              </>
            ) : (
              <span className="muted">No ratings yet</span>
            )}
          </div>
          <Link href={`/spots/${slug}/hype`}>
            <HypePill label={stats.hypeLabel} />
          </Link>
        </div>

        <div className="stats">
          <div>
            <b>{spot.revisitShare !== null ? `${Math.round(spot.revisitShare * 100)}%` : "–"}</b>
            <span>Would revisit</span>
          </div>
          <div>
            <b>{rupees(spot.priceBand)}</b>
            <span>{priceRange(spot.priceBand)}</span>
          </div>
          <div>
            <b style={{ color: prediction ? "var(--mint)" : undefined }}>{prediction?.match != null ? `${prediction.match}%` : spot.area.split(" ")[0]}</b>
            <span>{prediction ? "Your match" : "Area"}</span>
          </div>
        </div>

        <nav className="tabs" aria-label="Spot sections">
          {TABS.map((t) => (
            <Link key={t} href={tabHref(t)} aria-current={tab === t ? "true" : undefined} scroll={false}>
              {t === "experiences" ? `Experiences (${experiences.length})` : t[0]!.toUpperCase() + t.slice(1)}
            </Link>
          ))}
        </nav>

        {tab === "overview" ? (
          <div className="flex flex-col gap-6">
            {prediction ? (
              <section className="card flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="eyebrow muted">Our guess for you</div>
                    <div className="h1 num">{prediction.predicted?.toFixed(1)} ★</div>
                  </div>
                  <span className="pill match">{prediction.match}% taste match</span>
                </div>
                {(prediction.match ?? 0) >= 60 && prediction.reasons.length ? (
                  <ul className="why">
                    {prediction.reasons.map((r) => (
                      <li key={r}>
                        {I.checkCircle()}
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : prediction.warnings.length ? (
                  <ul className="why warn">
                    {prediction.warnings.map((r) => (
                      <li key={r}>
                        {I.flame()}
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {myCollections ? <CollectionSheet spotId={spot.id} spotName={spot.name} collections={myCollections} /> : null}
                  {!mine ? <NotForMe spotId={spot.id} spotName={spot.name} /> : null}
                </div>
              </section>
            ) : null}

            {dishes.length ? (
              <section className="flex flex-col gap-3">
                <h2 className="h2">Popular here</h2>
                <div className="rail bleed">
                  {dishes.slice(0, 6).map((d) => (
                    <div key={d.name} className="flex flex-col gap-1.5">
                      <Photo src={d.photo ?? spot.coverUrl} alt={d.name} name={d.name} ratio="1" />
                      <div className="font-semibold text-[14px] leading-tight">{d.name}</div>
                      <div className="tiny muted">{plural(d.count, "mention")}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <Link href={`/spots/${slug}/hype`} className="card flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="h2">Hype check</h2>
                {I.chevronRight({ width: 20, height: 20 })}
              </div>
              <p className="small muted">{HYPE_LABEL_SUMMARY[stats.hypeLabel]}</p>
              {stats.avgExpectation !== null && stats.count ? (
                <div className="flex items-center gap-4 small">
                  <span>
                    Expected <b className="num">{stats.avgExpectation.toFixed(1)}★</b>
                  </span>
                  <span>
                    Actual <b className="num">{stats.avg.toFixed(1)}★</b>
                  </span>
                </div>
              ) : null}
            </Link>

            {stats.count ? (
              <section className="card flex flex-col gap-3 p-4">
                <h2 className="h2">Ratings</h2>
                <RatingHistogram stats={stats} />
              </section>
            ) : null}

            {experiences.length ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <h2 className="h2">Latest experiences</h2>
                  <Link href={tabHref("experiences")} className="small font-semibold">
                    See all
                  </Link>
                </div>
                {experiences.slice(0, 2).map((e) => (
                  <ExperienceCard key={e.id} e={e} signedIn={Boolean(viewer)} showSpot={false} />
                ))}
              </section>
            ) : null}
          </div>
        ) : null}

        {tab === "experiences" ? (
          <div className="flex flex-col gap-4">
            {experiences.length ? (
              experiences.map((e) => <ExperienceCard key={e.id} e={e} signedIn={Boolean(viewer)} showSpot={false} />)
            ) : (
              <div className="empty">No written experiences yet. Be the first.</div>
            )}
          </div>
        ) : null}

        {tab === "menu" ? (
          <div className="flex flex-col gap-2">
            <p className="small muted">Dishes people mention in their experiences, most popular first.</p>
            {dishes.length ? (
              <div className="stack">
                {dishes.map((d) => (
                  <div key={d.name} className="row">
                    <Photo src={d.photo} alt="" name={d.name} style={{ width: 56, height: 56, flex: "none", borderRadius: 14 }} />
                    <div className="grow">
                      <div className="name">{d.name}</div>
                      <div className="small muted">
                        Ordered in {Math.round((d.count / Math.max(1, logCount)) * 100)}% of experiences
                      </div>
                    </div>
                    <span className="small font-bold num">{d.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">No dishes logged yet.</div>
            )}
          </div>
        ) : null}

        {tab === "info" ? (
          <div className="card stack px-4">
            <InfoRow label="Area" value={spot.area} />
            <InfoRow label="Type" value={categoryText} />
            <InfoRow label="Price" value={`${rupees(spot.priceBand)} · ${priceRange(spot.priceBand)} per person`} />
            <InfoRow label="Spice" value={spot.spice >= 0.7 ? "Very spicy" : spot.spice >= 0.4 ? "Medium" : spot.spice > 0.1 ? "Mild" : "Not spicy"} />
            {spot.mustOrder ? <InfoRow label="Must order" value={spot.mustOrder} /> : null}
            <InfoRow label="On Forkd" value={spot.isSample ? "Sample spot for the beta" : "Added by the community"} />
          </div>
        ) : null}
      </div>

      <div className="cta-bar">
        <div>
          {viewer ? (
            <Link href={`/log/${spot.slug}`} className="btn yellow wide">
              {mine ? "Log another visit" : "Log your experience"}
            </Link>
          ) : (
            <Link href={`/signin?next=/spots/${spot.slug}`} className="btn yellow wide">
              Sign in to see your match
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <span className="muted small">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
