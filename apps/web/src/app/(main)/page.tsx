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

      <section className="mt-2 flex flex-col gap-2">
        <p className="kicker">Hey {first}</p>
        <h1 className="display">
          Eat where <em>you&rsquo;d</em> love it.
        </h1>
        <p className="muted">
          Ranked for your taste from {ratedCount} spot{ratedCount === 1 ? "" : "s"} you&rsquo;ve rated, plus people who
          rate like you.
        </p>
      </section>

      {hero ? (
        <section className="mt-6 flex flex-col gap-3">
          <SectionHead title="Tonight's pick" />
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
          <SectionHead title="Also your vibe" note="Swipe for more" />
          <div className="rail">
            {rest.map((c) => (
              <RecCard key={c.spot.id} c={c} />
            ))}
          </div>
        </section>
      ) : null}

      {hypeWarnings.length ? (
        <section className="mt-8 flex flex-col gap-3">
          <SectionHead title="Skip the reel" note="Big on Instagram, weak match for you" />
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
        <span className="sticker sticker-hot self-start">Kozhikode beta</span>
        <h1 className="display" style={{ fontSize: "clamp(36px, 11vw, 52px)" }}>
          Reels lie. <em>Your taste</em> doesn&rsquo;t.
        </h1>
        <p className="muted text-[16px]">
          Rate the places you&rsquo;ve been. Forkd finds people who eat like you, picks spots you&rsquo;ll actually love,
          and calls out the ones that are all hype.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/signin?mode=signup" className="btn btn-hot btn-block">
            Find my spots
          </Link>
          <Link href="/explore" className="btn btn-ghost btn-block">
            Just browse
          </Link>
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <SectionHead title="Kozhikode's actual best" note="Weighted ratings, not follower counts" />
        <div className="card divide overflow-hidden">
          {top.map((t, i) => (
            <Link key={t.spot.id} href={`/spots/${t.spot.slug}`} className="row">
              <span className={`rank ${i < 3 ? "top" : ""}`}>{i + 1}</span>
              <Plate name={t.spot.name} hue={t.hue} size="sm" />
              <div className="grow">
                <div className="name">{t.spot.name}</div>
                <div className="meta flex items-center gap-1.5">
                  <Stars value={Math.round(t.stats.avg * 2) / 2} /> {t.spot.area}
                </div>
              </div>
              <HypeSticker label={t.stats.hypeLabel} />
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
