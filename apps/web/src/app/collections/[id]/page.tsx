import { getStore, loadCityModel } from "@forkd/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/buttons";
import { SpotListCard } from "@/components/cards";
import { BackBar, Photo } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { spotCard } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await (await getStore()).getCollection((await params).id);
  return { title: c?.title ?? "Collection" };
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params;
  const store = await getStore();
  const c = await store.getCollection(id);
  const viewer = await getViewer();
  if (!c || (!c.isPublic && c.ownerUid !== viewer?.uid)) notFound();
  const owner = await store.getProfile(c.ownerUid);
  const model = await loadCityModel(owner?.homeCityId ?? "kozhikode");
  const spots = c.spotIds.map((sid) => model.spotsById.get(sid)).filter((s) => s !== undefined).map((s) => spotCard(model, s));
  const cover = spots.find((s) => s.spot.coverUrl)?.spot.coverUrl ?? null;
  return (
    <main className="page">
      <div className="relative">
        <Photo src={cover} alt="" name={c.title} ratio="16 / 10" style={{ borderRadius: 0 }}>
          <div className="shade" style={{ background: "linear-gradient(180deg, rgb(5 14 9 / .3), rgb(13 36 25) 96%)" }} />
        </Photo>
        <BackBar href="/explore" glass right={<ShareButton title={c.title} path={`/collections/${c.id}`} className="iconbtn glass" />} />
        <div className="wrap absolute bottom-0 left-0 right-0 flex flex-col gap-1 pb-2">
          <h1 className="display">{c.title}</h1>
          <p className="small muted">
            {spots.length} places · by{" "}
            <Link href={`/u/${c.ownerHandle}`} className="font-semibold underline">
              @{c.ownerHandle}
            </Link>
          </p>
        </div>
      </div>
      <div className="wrap flex flex-col gap-3 pb-12 pt-2">
        {c.description ? <p className="muted">{c.description}</p> : null}
        {spots.length ? (
          <div className="stack">
            {spots.map((s, i) => (
              <SpotListCard key={s.spot.id} c={s} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div className="empty">No spots yet. Add some from any spot page with the save menu.</div>
        )}
      </div>
    </main>
  );
}
