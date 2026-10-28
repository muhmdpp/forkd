import Link from "next/link";
import type { SpotCard } from "@/lib/data";
import { NotForMe } from "./not-for-me";
import { HypeSticker, Plate, Ring, SpotMeta, Stars } from "./ui";

export function RecCard({ c, hero = false }: { c: SpotCard; hero?: boolean }) {
  return (
    <article className={`${hero ? "card-pop" : "card"} flex flex-col gap-3 p-4 rise`}>
      <Link href={`/spots/${c.spot.slug}`} className="flex items-start gap-3">
        <Plate name={c.spot.name} hue={c.hue} size={hero ? "lg" : ""} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="h3">{c.spot.name}</h3>
          <SpotMeta area={c.spot.area} categoryText={c.categoryText} priceBand={c.spot.priceBand} />
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {c.stats.count > 0 ? (
              <span className="meta flex items-center gap-1">
                <Stars value={Math.round(c.stats.avg * 2) / 2} />
                <span className="num">{c.stats.avg.toFixed(1)}</span>
              </span>
            ) : null}
            {c.stats.hypeLabel !== "not_enough_data" ? <HypeSticker label={c.stats.hypeLabel} /> : null}
          </div>
        </div>
        <Ring match={c.match} />
      </Link>
      {c.reasons.length ? (
        <ul className="why" aria-label="Why we suggested this">
          {c.reasons.slice(0, hero ? 3 : 2).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Link href={`/log/${c.spot.slug}`} className={`btn ${hero ? "btn-hot" : ""} flex-1`}>
          Been here? Rate it
        </Link>
        <NotForMe spotId={c.spot.id} spotName={c.spot.name} />
      </div>
    </article>
  );
}
