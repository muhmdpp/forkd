import { getStore } from "@forkd/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/buttons";
import { Avatar, BackBar } from "@/components/ui";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "People" };

export default async function PeopleList({ params }: { params: Promise<{ handle: string; list: string }> }) {
  const { handle, list } = await params;
  if (list !== "followers" && list !== "following") notFound();
  const store = await getStore();
  const profile = await store.getProfileByHandle(decodeURIComponent(handle));
  if (!profile) notFound();
  const viewer = await getViewer();
  const ids = list === "followers" ? await store.listFollowers(profile.uid) : await store.listFollowing(profile.uid);
  const people = await store.getProfiles(ids.slice(0, 200));
  const mine = viewer ? new Set(await store.listFollowing(viewer.uid)) : new Set<string>();
  return (
    <main className="page cream">
      <BackBar href={`/u/${profile.handle}`} title={list === "followers" ? `${profile.name}'s followers` : `${profile.name} follows`} />
      <div className="wrap pb-12">
        {people.length ? (
          <div className="stack">
            {people.map((p) => (
              <div key={p.uid} className="row">
                <Link href={`/u/${p.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={p.name} src={p.avatarUrl} size={46} />
                  <div className="min-w-0">
                    <div className="name">{p.name}</div>
                    <div className="small muted">@{p.handle}</div>
                  </div>
                </Link>
                {viewer && viewer.uid !== p.uid ? <FollowButton uid={p.uid} following={mine.has(p.uid)} small /> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty mt-4">{list === "followers" ? "No followers yet." : "Not following anyone yet."}</div>
        )}
      </div>
    </main>
  );
}
