import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { FollowButton, ShareButton } from "@/components/buttons";
import { CollectionTile, SpotListCard } from "@/components/cards";
import { I } from "@/components/icons";
import { NewCollectionButton } from "@/components/new-collection";
import { Avatar, Photo } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getProfilePage, hasUnread } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const page = await getProfilePage(decodeURIComponent(handle), null);
  return { title: page ? `${page.profile.name} (@${page.profile.handle})` : "Profile not found" };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const handle = decodeURIComponent((await params).handle);
  const sp = await searchParams;
  const viewer = await getViewer();
  const page = await getProfilePage(handle, viewer);
  if (!page) notFound();
  const { profile: p, isMe, following, experiences, collections, saved } = page;
  const tabs = isMe ? (["experiences", "collections", "saved"] as const) : (["experiences", "collections"] as const);
  const tab = tabs.find((t) => t === sp.tab) ?? "experiences";

  return (
    <main className="page cream">
      {/* Yellow header with the oversized wordmark, as in the reference */}
      <div className="relative overflow-hidden" style={{ background: "var(--mustard)", paddingTop: "env(safe-area-inset-top)" }}>
        <div className="wrap relative flex items-center justify-end gap-1 pt-2">
          {viewer && !isMe ? (
            <Link href="/" className="iconbtn mr-auto" aria-label="Back" style={{ color: "var(--g-950)" }}>
              {I.back()}
            </Link>
          ) : null}
          <ShareButton title={`${p.name} on Forkd`} path={`/u/${p.handle}`} className="iconbtn" />
          {isMe ? (
            <Link href="/settings" className="iconbtn" aria-label="Settings" style={{ color: "var(--g-950)" }}>
              {I.settings()}
            </Link>
          ) : null}
        </div>
        <div
          aria-hidden="true"
          className="wordmark pointer-events-none select-none"
          style={{ fontSize: "min(31vw, 150px)", color: "var(--g-950)", marginTop: -14, marginLeft: -6, lineHeight: 0.82, whiteSpace: "nowrap" }}
        >
          forkd<i style={{ color: "var(--g-950)" }}>.</i>
        </div>
      </div>

      <div className="wrap relative flex flex-col gap-4 pb-6">
        <div className="-mt-12">
          <span className="inline-block rounded-full p-1" style={{ background: "var(--c-100)" }}>
            <Avatar name={p.name} src={p.avatarUrl} size={92} />
          </span>
        </div>
        <div className="-mt-1 flex flex-col gap-1">
          <h1 className="display" style={{ fontSize: 34 }}>
            {p.name}
          </h1>
          <div className="small muted">@{p.handle}</div>
          {p.bio ? <p className="mt-1 text-[15px]">{p.bio}</p> : null}
        </div>

        <div className="grid grid-cols-3 text-center">
          <Stat n={p.experiences} label="Experiences" />
          <Link href={`/u/${p.handle}/followers`}>
            <Stat n={p.followers} label="Followers" />
          </Link>
          <Link href={`/u/${p.handle}/following`}>
            <Stat n={p.following} label="Following" />
          </Link>
        </div>

        <div className="flex gap-2">
          {isMe ? (
            <>
              <Link href="/settings/profile" className="btn flex-1" style={{ background: "var(--c-200)", borderColor: "var(--c-200)" }}>
                Edit profile
              </Link>
              <Link href="/taste" className="btn" style={{ background: "var(--c-200)", borderColor: "var(--c-200)" }}>
                Your taste
              </Link>
            </>
          ) : viewer ? (
            <div className="flex-1 [&>button]:w-full">
              <FollowButton uid={p.uid} following={following} />
            </div>
          ) : (
            <Link href={`/signin?next=/u/${p.handle}`} className="btn primary flex-1">
              Sign in to follow
            </Link>
          )}
        </div>

        <nav className="tabs" aria-label="Profile sections">
          {tabs.map((t) => (
            <Link key={t} href={t === "experiences" ? `/u/${p.handle}` : `/u/${p.handle}?tab=${t}`} aria-current={tab === t ? "true" : undefined} scroll={false}>
              {t[0]!.toUpperCase() + t.slice(1)}
            </Link>
          ))}
        </nav>

        {tab === "experiences" ? (
          experiences.length ? (
            <div className="grid3">
              {experiences.map((e) => (
                <Link key={e.id} href={`/e/${e.id}`} aria-label={`${e.spotName}, ${e.rating} stars`}>
                  <Photo src={e.photos[0] ?? e.coverUrl} alt="" name={e.spotName} ratio="1" style={{ borderRadius: 12 }}>
                    <div className="shade" />
                    <span className="absolute bottom-1.5 left-2 right-2 truncate text-[11.5px] font-bold text-white">
                      {e.rating.toFixed(1)}★ · {e.spotName}
                    </span>
                  </Photo>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty flex flex-col items-center gap-3">
              <p>{isMe ? "Your experiences show up here." : "No experiences yet."}</p>
              {isMe ? (
                <Link href="/log" className="btn primary sm">
                  Log your first one
                </Link>
              ) : null}
            </div>
          )
        ) : null}

        {tab === "collections" ? (
          <div className="flex flex-col gap-3">
            {isMe ? <NewCollectionButton /> : null}
            {collections.length ? collections.map((c) => <CollectionTile key={c.id} c={c} />) : <div className="empty">No collections yet.</div>}
          </div>
        ) : null}

        {tab === "saved" ? (
          saved.length ? (
            <div className="stack">
              {saved.map((c) => (
                <SpotListCard key={c.spot.id} c={c} />
              ))}
            </div>
          ) : (
            <div className="empty">Tap the bookmark on any spot to save it for later.</div>
          )
        ) : null}
      </div>
      {viewer ? (
        <>
          <div style={{ height: "calc(var(--nav-h) + 20px)" }} />
          <BottomNav handle={viewer.handle} unread={await hasUnread(viewer.uid)} />
        </>
      ) : null}
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="py-1">
      <div className="text-[20px] font-extrabold num">{n}</div>
      <div className="tiny muted">{label}</div>
    </div>
  );
}
