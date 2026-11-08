import { getStore } from "@forkd/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { FollowButton } from "@/components/buttons";
import { ExperienceCard, PickCard, SpotListCard } from "@/components/cards";
import { I } from "@/components/icons";
import { NotForMe } from "@/components/not-for-me";
import { Splash } from "@/components/splash";
import { Avatar, SectionTitle, Wordmark } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { CITY_NAME, getFollowingFeed, getForYou, hasUnread } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return <Splash />;
  if (!viewer.onboardedAt) redirect("/onboarding");
  const tab = (await searchParams).tab === "following" ? "following" : "for-you";
  const unread = await hasUnread(viewer.uid);

  return (
    <main className="page">
      <div className="wrap with-nav">
        <header className="flex items-start gap-3 pb-4" style={{ paddingTop: "calc(14px + env(safe-area-inset-top))" }}>
          <div className="flex flex-1 flex-col gap-1">
            <Wordmark size={30} />
            <span className="inline-flex items-center gap-1 small font-semibold muted">
              {I.pin({ width: 15, height: 15 })}
              {CITY_NAME[viewer.homeCityId] ?? viewer.homeCityId}
            </span>
          </div>
          <Link href="/activity" className={`iconbtn ${unread ? "dot" : ""}`} aria-label={unread ? "Activity, new" : "Activity"}>
            {I.bell()}
          </Link>
          <Link href={`/u/${viewer.handle}`} aria-label="Your profile">
            <Avatar name={viewer.name} src={viewer.avatarUrl} size={40} />
          </Link>
        </header>

        <h1 className="display" style={{ fontSize: 44 }}>
          Hungry for something good?
        </h1>
        <p className="muted mt-2">Discover places worth your time.</p>

        <nav className="seg mt-5" aria-label="Feed">
          <Link href="/" aria-current={tab === "for-you" ? "true" : undefined}>
            For You
          </Link>
          <Link href="/?tab=following" aria-current={tab === "following" ? "true" : undefined}>
            Following
          </Link>
        </nav>

        <div className="mt-5">{tab === "for-you" ? <ForYou uid={viewer.uid} /> : <Following />}</div>
      </div>
      <BottomNav handle={viewer.handle} unread={unread} />
    </main>
  );

  async function ForYou({ uid }: { uid: string }) {
    const { picks, skip, ratedCount } = await getForYou(viewer!);
    const saved = new Set(await (await getStore()).listSaved(uid));
    const [hero, ...rest] = picks;
    return (
      <div className="flex flex-col gap-8">
        {hero ? (
          <div className="flex flex-col gap-3">
            <PickCard c={hero} saved={saved.has(hero.spot.id)} />
            <div className="flex justify-end">
              <NotForMe spotId={hero.spot.id} spotName={hero.spot.name} />
            </div>
          </div>
        ) : (
          <div className="empty">You&rsquo;ve rated every spot we know nearby. Add one we&rsquo;re missing.</div>
        )}
        {ratedCount < 5 ? (
          <Link href="/rate" className="card flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full" style={{ background: "var(--mustard)", color: "var(--mustard-ink)" }}>
              {I.swipe({ width: 22, height: 22 })}
            </span>
            <div className="flex-1">
              <div className="font-bold">Sharpen your picks</div>
              <div className="small muted">Swipe through a few more spots you&rsquo;ve been to.</div>
            </div>
            {I.chevronRight({ width: 20, height: 20 })}
          </Link>
        ) : null}
        {rest.length ? (
          <section className="flex flex-col gap-1">
            <SectionTitle title="More for you" />
            <div className="stack">
              {rest.map((c) => (
                <SpotListCard key={c.spot.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}
        {skip.length ? (
          <section className="flex flex-col gap-1">
            <SectionTitle title="Skip the reel" note="Hyped, but not your taste" />
            <div className="stack">
              {skip.map((c) => (
                <SpotListCard key={c.spot.id} c={c} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  async function Following() {
    const { feed, following, suggestions } = await getFollowingFeed(viewer!);
    return (
      <div className="flex flex-col gap-5">
        {suggestions.length ? (
          <section className="flex flex-col gap-3">
            <SectionTitle title={following ? "More people who eat like you" : "Follow people who eat like you"} />
            <div className="rail wide bleed">
              {suggestions.map(({ profile: p, similarity }) => (
                <div key={p.uid} className="card flex flex-col items-center gap-2 p-4 text-center">
                  <Link href={`/u/${p.handle}`} className="flex flex-col items-center gap-2">
                    <Avatar name={p.name} src={p.avatarUrl} size={56} />
                    <div className="font-bold">{p.name}</div>
                    <div className="tiny muted">
                      @{p.handle} · {similarity}% taste overlap
                    </div>
                  </Link>
                  <FollowButton uid={p.uid} following={false} small />
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {feed.length ? (
          feed.map((e) => <ExperienceCard key={e.id} e={e} signedIn />)
        ) : (
          <div className="empty">
            {following ? "The people you follow haven't posted yet." : "Follow a few people and their experiences show up here."}
          </div>
        )}
      </div>
    );
  }
}
