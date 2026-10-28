import Link from "next/link";
import { redirect } from "next/navigation";
import { RecCard } from "@/components/rec-card";
import { HypeSticker, Plate, SampleNote, SectionHead, Stars, TopBar } from "@/components/ui";
import { getFeed, getTopRated } from "@/lib/data";
import { getViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

const DEFAULT_CITY = "kozhikode";

export default async function Home() {
  const viewer = await getViewer();
  if (!viewer) return <Landing />;
  if (!viewer.onboarded) redirect("/welcome");

  const { ratedCount, picks, hypeWarnings } = await getFeed(viewer.id, viewer.cityId);
  const [hero, ...rest] = picks;
  const first = viewer.name.split(" ")[0] || viewer.handle;

  return (
    <>
      <TopBar>
        <Link href="/spots/new" className="btn btn-ghost">
          + Add spot
        </Link>
      </TopBar>

      <section className="mt-1 flex flex-col gap-1">
        <h1 className="display">Hi {first}</h1>
        <p className="muted">
          Picks based on the {ratedCount} spot{ratedCount === 1 ? "" : "s"} you&rsquo;ve rated.
        </p>
      </section>

      {hero ? (
        <section className="mt-6 flex flex-col gap-3">
          <SectionHead title="Top pick for you" />
          <RecCard c={hero} hero />
        </section>
      ) : (
        <div className="empty mt-6">
          You&rsquo;ve rated everything nearby. <Link href="/spots/new" className="text-hot underline">Add a spot</Link> to
          keep going.
        </div>
      )}

      {rest.length ? (
        <section className="mt-8 flex flex-col gap-3">
          <SectionHead title="More for you" />
          <div className="flex flex-col gap-3">
            {rest.map((c) => (
              <RecCard key={c.spot.id} c={c} />
            ))}
          </div>
        </section>
      ) : null}

      {hypeWarnings.length ? (
        <section className="mt-8 flex flex-col gap-3">
          <SectionHead title="Popular, but maybe not for you" />
          <div className="card divide overflow-hidden">
            {hypeWarnings.map((c) => (
              <Link key={c.spot.id} href={`/spots/${c.spot.slug}`} className="row">
                <Plate name={c.spot.name} hue={c.hue} size="sm" />
                <div className="grow">
                  <div className="name">{c.spot.name}</div>
                  <div className="meta">{c.warnings[0] ?? c.categoryText}</div>
                </div>
                <HypeSticker label={c.stats.hypeLabel} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <SampleNote />
      </div>
    </>
  );
}

async function Landing() {
  const top = await getTopRated(DEFAULT_CITY, 5);
  return (
    <>
      <TopBar>
        <Link href="/signin" className="btn btn-ghost">
          Sign in
        </Link>
      </TopBar>
      <section className="mt-6 flex flex-col gap-4">
        <p className="kicker">Now in Kozhikode</p>
        <h1 className="display" style={{ fontSize: "30px" }}>
          Find food spots you&rsquo;ll actually like.
        </h1>
        <p className="muted">
          Rate places you&rsquo;ve been. Forkd learns your taste, suggests spots that suit you, and shows when a place
          is more hype than food.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/signin?mode=signup" className="btn btn-hot btn-block">
            Get started
          </Link>
          <Link href="/explore" className="btn btn-ghost btn-block">
            Just browse
          </Link>
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <SectionHead title="Top rated in Kozhikode" />
        <div className="card divide overflow-hidden">
          {top.map((t, i) => (
            <Link key={t.spot.id} href={`/spots/${t.spot.slug}`} className="row">
              <span className="rank">{i + 1}</span>
              <Plate name={t.spot.name} hue={t.hue} size="sm" />
              <div className="grow">
                <div className="name">{t.spot.name}</div>
                <div className="meta truncate">
                  <Stars value={Math.round(t.stats.avg * 2) / 2} /> · {t.spot.area}
                </div>
              </div>
              <span className="num font-semibold">{t.stats.avg.toFixed(1)}</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="mt-8">
        <SampleNote />
      </div>
    </>
  );
}
