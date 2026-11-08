import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LikeButton, SaveButton, ShareButton } from "@/components/buttons";
import { CommentForm } from "@/components/comments";
import { I } from "@/components/icons";
import { PhotoCarousel } from "@/components/photo-carousel";
import { PostMenu } from "@/components/post-menu";
import { Avatar, CITY_LABEL, StarRow, VOTE_TEXT, timeAgo } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getExperience } from "@/lib/data";
import { getStore } from "@forkd/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getExperience((await params).id, null);
  if (!data) return { title: "Experience not found" };
  const e = data.experience;
  return {
    title: `${e.name} at ${e.spotName}`,
    description: e.review ?? `${e.rating}★ at ${e.spotName}`,
    openGraph: e.photos[0] ? { images: [e.photos[0]] } : undefined,
  };
}

export default async function ExperiencePage({ params }: Props) {
  const { id } = await params;
  const viewer = await getViewer();
  const data = await getExperience(id, viewer);
  if (!data) notFound();
  const { experience: e, comments } = data;
  const saved = viewer ? (await (await getStore()).listSaved(viewer.uid)).includes(e.spotId) : false;
  const photos = e.photos.length ? e.photos : e.coverUrl ? [e.coverUrl] : [];

  return (
    <main className="page cream">
      <header className="topbar">
        <div className="wrap flex w-full items-center gap-3 py-2">
          <Link href={`/spots/${e.spotSlug}`} className="iconbtn -ml-2" aria-label="Back">
            {I.back()}
          </Link>
          <Link href={`/u/${e.handle}`} className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar name={e.name} src={e.avatarUrl} size={38} />
            <div className="min-w-0">
              <div className="truncate font-bold leading-tight">{e.name}</div>
              <div className="tiny muted">
                Visited {timeAgo(e.createdAt)} · {CITY_LABEL[e.cityId] ?? e.cityId}
              </div>
            </div>
          </Link>
          {viewer?.uid === e.userId ? <PostMenu visitId={e.id} /> : null}
        </div>
      </header>

      <div className="wrap flex flex-col gap-4 pb-12">
        {photos.length ? <PhotoCarousel photos={photos} alt={`${e.dishes[0] ?? "Food"} at ${e.spotName}`} /> : null}

        <div className="flex flex-col gap-2">
          <Link href={`/spots/${e.spotSlug}`} className="h1 inline-flex items-center gap-1">
            {e.spotName}
            {I.chevronRight({ width: 22, height: 22 })}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StarRow value={e.rating} size={18} />
            <span className="text-[20px] font-extrabold num">{e.rating.toFixed(1)}</span>
            {e.hypeVote ? (
              <span className={`pill ${e.hypeVote === "over" ? "over" : e.hypeVote === "gem" ? "gem" : "worth"}`}>
                {e.hypeVote === "over" ? I.flame() : I.checkCircle()}
                {VOTE_TEXT[e.hypeVote]}
              </span>
            ) : null}
            {e.wouldReturn === true ? <span className="pill match">Would go back</span> : null}
          </div>
        </div>

        {e.review ? <p className="text-[16px] leading-relaxed">{e.review}</p> : null}

        {e.dishes.length ? (
          <div className="chips">
            {e.dishes.map((d) => (
              <span key={d} className="chip">
                {d}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-5 border-y py-2" style={{ borderColor: "var(--line)" }}>
          <LikeButton visitId={e.id} liked={e.liked} count={e.likeCount} signedIn={Boolean(viewer)} />
          <a href="#comments" className="inline-flex items-center gap-1.5 font-semibold" aria-label="Comments">
            {I.comment({ width: 23, height: 23 })}
            <span className="num">{comments.length}</span>
          </a>
          <div className="flex-1" />
          <SaveButton spotId={e.spotId} saved={saved} signedIn={Boolean(viewer)} />
          <ShareButton title={`${e.name} at ${e.spotName}`} path={`/e/${e.id}`} />
        </div>

        <section id="comments" className="flex flex-col gap-4 scroll-mt-20">
          <h2 className="h2">Comments</h2>
          {comments.length ? (
            <ul className="flex flex-col gap-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Link href={`/u/${c.handle}`}>
                    <Avatar name={c.name} src={c.avatarUrl} size={34} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="small">
                      <Link href={`/u/${c.handle}`} className="font-bold">
                        {c.name}
                      </Link>{" "}
                      <span className="muted">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-[15px]">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No comments yet.</p>
          )}
          <CommentForm visitId={e.id} signedIn={Boolean(viewer)} />
        </section>
      </div>
    </main>
  );
}
