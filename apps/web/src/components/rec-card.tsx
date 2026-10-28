import Link from "next/link";
import type { SpotCard } from "@/lib/data";
import { NotForMe } from "./not-for-me";
import { HypeSticker, Plate, Ring, SpotMeta, Stars } from "./ui";

export function RecCard({ c, hero = false }: { c: SpotCard; hero?: boolean }) {
  return (
    <article className={`${hero ? "card-pop" : "card"} flex flex-col gap-3 p-3.5 rise`}>
      <Link href={`/spots/${c.spot.slug}`} className="relative block">
        <Plate name={c.spot.name} hue={c.hue} size="xl" />
        <div className="absolute left-3 top-3">
          <HypeSticker label={c.stats.hypeLabel} />
        </div>
        <div className="absolute right-2.5 top-2.5 rounded-full">
          <Ring match={c.match} />
        </div>
        {c.spot.isSample ? <span className="sticker flat absolute bottom-3 left-3 bg-black/40 text-white">Sample</span> : null}
      </Link>
      <div className="flex flex-col gap-1 px-0.5">
        <Link href={`/spots/${c.spot.slug}`} className="h3">
          {c.spot.name}
        </Link>
        <SpotMeta area={c.spot.area} categoryText={c.categoryText} priceBand={c.spot.priceBand} />
        {c.stats.count > 0 ? (
          <div className="meta flex items-center gap-1.5">
            <Stars value={Math.round(c.stats.avg * 2) / 2} /> <span className="num">{c.stats.avg.toFixed(1)}</span> ·{" "}
            {c.stats.count} visits
          </div>
        ) : null}
      </div>
      {c.reasons.length ? (
        <ul className="why" aria-label="Why we suggested this">
          {c.reasons.slice(0, hero ? 3 : 2).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={`/log/${c.spot.slug}`} className="btn btn-hot">
          Been here? Rate it
        </Link>
        <NotForMe spotId={c.spot.id} spotName={c.spot.name} />
      </div>
    </article>
  );
}
