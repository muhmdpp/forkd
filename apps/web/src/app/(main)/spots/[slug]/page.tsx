import { HYPE_LABEL_SUMMARY } from "@forkd/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotForMe } from "@/components/not-for-me";
import { HypeSticker, Icon, Plate, Ring, SpotMeta, Stars } from "@/components/ui";
import { getSpotPage } from "@/lib/data";
import { getViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSpotPage(slug, null);
  if (!page) return { title: "Spot not found" };
  return {
    title: page.spot.name,
    description: `${page.spot.name}, ${page.spot.area}. Rated ${page.stats.avg.toFixed(1)}★ from ${page.stats.count} visits on Forkd.`,
  };
}

const VOTE_TEXT = { gem: "Better than expected", ok: "As expected", over: "Overhyped" } as const;

export default async function SpotPage({ params }: Props) {
  const { slug } = await params;
  const viewer = await getViewer();
  const page = await getSpotPage(slug, viewer?.id ?? null);
  if (!page) notFound();
  const { spot, stats, hue, categoryText, reviews, mine, prediction } = page;
  const maxBar = Math.max(1, ...stats.histogram);
  const votes = stats.hypeVotes.gem + stats.hypeVotes.ok + stats.hypeVotes.over;
  const pct = (n: number) => `${Math.round((n / Math.max(1, votes)) * 100)}%`;
  const reel = stats.avgExpectation;
  const showHype = stats.hypeLabel !== "not_enough_data" && reel !== null;

  return (
    <>
      <header className="topbar">
        <Link href="/" className="btn btn-ghost px-3" aria-label="Back">
          {Icon.back}
        </Link>
        <div className="flex-1" />
        {viewer && !mine ? <NotForMe spotId={spot.id} spotName={spot.name} /> : null}
      </header>

      <section className="mt-1 flex items-center gap-4">
        <Plate name={spot.name} hue={hue} size="lg" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="display">
            {spot.name}
          </h1>
          <SpotMeta area={spot.area} categoryText={categoryText} priceBand={spot.priceBand} />
          <div className="flex flex-wrap gap-2">
            <HypeSticker label={stats.hypeLabel} />
          </div>
        </div>
      </section>

      {spot.mustOrder ? (
        <p className="mt-4">
          <span className="muted">Must order: </span>
          <b className="font-semibold">{spot.mustOrder}</b>
        </p>
      ) : null}

      {/* Your verdict or our guess */}
      <section className="mt-5">
        {mine ? (
          <div className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="kicker">You rated it</div>
              <Stars value={mine.rating} className="text-[22px]" />
              {mine.review ? <p className="mt-1 text-[14px]">{mine.review}</p> : null}
            </div>
            <Link href={`/log/${spot.slug}`} className="btn">
              Log again
            </Link>
          </div>
        ) : prediction ? (
          <div className="card-pop flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="kicker">Our guess for you</div>
                <div className="num text-[24px] font-bold">{prediction.predicted.toFixed(1)} ★</div>
              </div>
              <Ring match={prediction.match} />
            </div>
            {prediction.match >= 60 && prediction.reasons.length ? (
              <ul className="why">{prediction.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            ) : prediction.warnings.length ? (
              <ul className="why warn">{prediction.warnings.map((r) => <li key={r}>{r}</li>)}</ul>
            ) : null}
            <Link href={`/log/${spot.slug}`} className="btn btn-hot btn-block">
              Been here? Rate it
            </Link>
          </div>
        ) : (
          <Link href={`/signin?next=/spots/${spot.slug}`} className="btn btn-hot btn-block">
            Sign in to see your match
          </Link>
        )}
      </section>

      {/* Reel vs Real */}
      <section className="card mt-4 flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="h2">Hype check</h2>
          {stats.hypeGap !== null && showHype ? (
            <span className={`sticker ${stats.hypeGap >= 0 ? "sticker-gem" : "sticker-cap"}`}>
              {stats.hypeGap >= 0 ? "+" : ""}
              {stats.hypeGap.toFixed(1)}★
            </span>
          ) : null}
        </div>
        <p className="muted text-[14px]">{HYPE_LABEL_SUMMARY[stats.hypeLabel]}</p>
        {showHype ? (
          <>
            <div className="rvr">
              <div className="rvr-row">
                <span className="lbl muted">Expected</span>
                <div className="rvr-bar">
                  <div style={{ width: `${(reel / 5) * 100}%`, background: "var(--muted)" }} />
                </div>
                <span className="num text-right font-bold">{reel.toFixed(1)}</span>
              </div>
              <div className="rvr-row">
                <span className="lbl">Actual rating</span>
                <div className="rvr-bar">
                  <div style={{ width: `${(stats.avg / 5) * 100}%`, background: "var(--sun)" }} />
                </div>
                <span className="num text-right font-bold">{stats.avg.toFixed(1)}</span>
              </div>
            </div>
            <p className="meta">
              What people expected before going, compared with what they rated it after.
              {stats.reelShare > 0 ? ` ${Math.round(stats.reelShare * 100)}% heard about it from a reel.` : ""}
            </p>
            {votes > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="text-[14px] font-semibold">Was it worth the hype?</div>
                <div className="votes">
                  <div style={{ flex: stats.hypeVotes.gem, background: "var(--gem)" }} />
                  <div style={{ flex: stats.hypeVotes.ok, background: "var(--legit)" }} />
                  <div style={{ flex: stats.hypeVotes.over, background: "var(--cap)" }} />
                </div>
                <div className="meta flex flex-wrap gap-x-4 gap-y-1">
                  <span><b style={{ color: "var(--gem)" }}>{pct(stats.hypeVotes.gem)}</b> better than expected</span>
                  <span><b style={{ color: "var(--legit)" }}>{pct(stats.hypeVotes.ok)}</b> as expected</span>
                  <span><b style={{ color: "var(--cap)" }}>{pct(stats.hypeVotes.over)}</b> overhyped</span>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      {/* Ratings */}
      {stats.count > 0 ? (
        <section className="card mt-4 flex flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="h2">Ratings</h2>
            <span className="meta">{stats.count} visits</span>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <div className="num text-[36px] font-bold leading-none">{stats.avg.toFixed(1)}</div>
              <Stars value={Math.round(stats.avg * 2) / 2} className="mt-1 block" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="hist" role="img" aria-label="Rating distribution from half a star to five stars">
                {stats.histogram.map((v, i) => (
                  <div key={i} className={(i + 1) / 2 >= 4 ? "hi" : ""} style={{ height: `${Math.max(5, (v / maxBar) * 100)}%` }} />
                ))}
              </div>
              <div className="meta mt-1 flex justify-between text-[11px]">
                <span>½★</span>
                <span>5★</span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Reviews */}
      <section className="mt-6 flex flex-col gap-3">
        <h2 className="h2">What people said</h2>
        {reviews.length ? (
          <div className="card divide overflow-hidden">
            {reviews.map((r) => (
              <article key={r.id} className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <b>@{r.handle}</b>
                  <Stars value={r.rating} />
                </div>
                <p className="text-[14.5px]">{r.review}</p>
                {r.hypeVote ? (
                  <span className="meta">{VOTE_TEXT[r.hypeVote]}</span>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">No reviews yet. Yours could be the first.</div>
        )}
      </section>
    </>
  );
}
