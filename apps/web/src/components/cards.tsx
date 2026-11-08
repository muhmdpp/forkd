import Link from "next/link";
import type { CollectionCard, ExperienceView, SpotCard } from "@/lib/data";
import { LikeButton, SaveButton, ShareButton } from "./buttons";
import { I } from "./icons";
import { Avatar, HypePill, Photo, Rating, StarRow, VOTE_TEXT, timeAgo } from "./ui";

/** The big yellow "Picked for your taste" card on Home. */
export function PickCard({ c, saved = false }: { c: SpotCard; saved?: boolean }) {
  return (
    <article className="pick rise">
      <div className="eyebrow">Picked for your taste</div>
      <div className="relative">
        <Link href={`/spots/${c.spot.slug}`} aria-label={c.spot.name}>
          <Photo src={c.spot.coverUrl} alt={c.spot.name} name={c.spot.name} ratio="16 / 11" priority />
        </Link>
        <div className="absolute right-2.5 top-2.5">
          <SaveButton spotId={c.spot.id} saved={saved} signedIn className="iconbtn glass" />
        </div>
        <div className="absolute bottom-12 left-3 right-3 flex items-center justify-between gap-2">
          {c.stats.count ? (
            <span className="pill" style={{ background: "rgb(10 20 14 / .75)", color: "#fff", fontSize: 15 }}>
              <Rating value={c.stats.avg} size={15} />
            </span>
          ) : (
            <span />
          )}
          {c.match !== null ? <span className="pill match">{c.match}% taste match</span> : null}
        </div>
      </div>
      <Link href={`/spots/${c.spot.slug}`} className="body">
        <h3 className="h2">{c.spot.name}</h3>
        <p className="small muted">
          {c.categoryText} · {c.spot.area}
        </p>
        {c.reasons[0] ? (
          <ul className="why mt-1">
            <li>
              {I.checkCircle({ style: { color: "var(--mint)" } })}
              <span>{c.reasons[0]}</span>
            </li>
          </ul>
        ) : null}
      </Link>
    </article>
  );
}

/** Compact horizontal card used in lists ("More for you", saved, search). */
export function SpotListCard({ c, rank }: { c: SpotCard; rank?: number }) {
  return (
    <Link href={`/spots/${c.spot.slug}`} className="row">
      {rank ? <span className="w-5 flex-none text-center font-bold muted num">{rank}</span> : null}
      <Photo src={c.spot.coverUrl} alt="" name={c.spot.name} style={{ width: 76, height: 76, flex: "none", borderRadius: 16 }} />
      <div className="grow flex flex-col gap-1">
        <div className="name">{c.spot.name}</div>
        <div className="small muted truncate">
          {c.categoryText} · {c.spot.area}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {c.stats.count ? <Rating value={c.stats.avg} size={13.5} /> : null}
          {c.match !== null ? <span className="pill match !py-0.5">{c.match}% match</span> : null}
          {c.stats.hypeLabel !== "not_enough_data" ? <HypePill label={c.stats.hypeLabel} icon={false} /> : null}
        </div>
      </div>
    </Link>
  );
}

/** Photo tile for horizontal rails (Trending). */
export function SpotTile({ c }: { c: SpotCard }) {
  return (
    <Link href={`/spots/${c.spot.slug}`} className="block">
      <Photo src={c.spot.coverUrl} alt={c.spot.name} name={c.spot.name} ratio="4 / 5">
        <div className="shade" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="h3 leading-tight">{c.spot.name}</div>
          <div className="tiny mt-0.5 flex items-center gap-1 opacity-90">
            {c.categoryText.split(",")[0]}
            {c.stats.count ? (
              <>
                {" "}
                · <Rating value={c.stats.avg} size={11.5} />
              </>
            ) : null}
          </div>
        </div>
      </Photo>
    </Link>
  );
}

export function CollectionTile({ c }: { c: CollectionCard }) {
  return (
    <Link
      href={`/collections/${c.id}`}
      className="relative flex min-h-[120px] items-stretch overflow-hidden"
      style={{ borderRadius: 22, background: "linear-gradient(120deg, #8e2f1f, #b5452c)" }}
    >
      <div className="relative z-10 flex flex-1 flex-col justify-center gap-1 p-4 pr-2 text-white">
        <div className="h2 leading-[1]">{c.title}</div>
        <div className="tiny opacity-85">
          {c.spotIds.length} places · by @{c.ownerHandle}
        </div>
      </div>
      {c.covers[0] ? (
        <div className="relative w-[42%] flex-none">
          <img src={c.covers[0]} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: "ellipse(80% 95% at 100% 50%)" }} />
        </div>
      ) : null}
    </Link>
  );
}

/** A post in a feed: someone's experience at a spot. */
export function ExperienceCard({ e, signedIn, showSpot = true }: { e: ExperienceView; signedIn: boolean; showSpot?: boolean }) {
  const photo = e.photos[0] ?? null;
  return (
    <article className="cream-scope overflow-hidden rise" style={{ borderRadius: 24 }}>
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/u/${e.handle}`}>
          <Avatar name={e.name} src={e.avatarUrl} size={38} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${e.handle}`} className="block truncate font-bold">
            {e.name}
          </Link>
          <div className="tiny muted">
            {timeAgo(e.createdAt)}
            {showSpot ? (
              <>
                {" "}
                · <Link href={`/spots/${e.spotSlug}`}>{e.spotName}</Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {photo ? (
        <Link href={`/e/${e.id}`} className="block px-3">
          <Photo src={photo} alt={`${e.dishes[0] ?? "Food"} at ${e.spotName}`} name={e.spotName} ratio="4 / 3">
            {e.photos.length > 1 ? (
              <span className="pill absolute right-3 top-3" style={{ background: "rgb(10 20 14 / .7)", color: "#fff" }}>
                1/{e.photos.length}
              </span>
            ) : null}
          </Photo>
        </Link>
      ) : null}
      <div className="flex flex-col gap-2 p-4 pt-3">
        <Link href={`/e/${e.id}`} className="flex flex-col gap-2">
          {showSpot ? <h3 className="h2">{e.spotName}</h3> : null}
          <div className="flex flex-wrap items-center gap-2">
            <StarRow value={e.rating} size={16} />
            <span className="font-bold num">{e.rating.toFixed(1)}</span>
            {e.hypeVote ? (
              <span className={`pill ${e.hypeVote === "over" ? "over" : e.hypeVote === "gem" ? "gem" : "worth"}`}>{VOTE_TEXT[e.hypeVote]}</span>
            ) : null}
          </div>
          {e.review ? <p className="text-[15px] leading-snug">{e.review}</p> : null}
        </Link>
        {e.dishes.length ? (
          <div className="chips">
            {e.dishes.map((d) => (
              <span key={d} className="chip !min-h-[30px] !text-[12.5px]">
                {d}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-1 flex items-center gap-5">
          <LikeButton visitId={e.id} liked={e.liked} count={e.likeCount} signedIn={signedIn} />
          <Link href={`/e/${e.id}#comments`} className="inline-flex items-center gap-1.5 font-semibold" aria-label="Comments">
            {I.comment({ width: 23, height: 23 })}
            <span className="num">{e.commentCount}</span>
          </Link>
          <div className="flex-1" />
          <ShareButton title={`${e.name} on ${e.spotName}`} path={`/e/${e.id}`} className="iconbtn !h-9 !w-9" />
        </div>
      </div>
    </article>
  );
}
