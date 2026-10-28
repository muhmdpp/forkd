import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogForm } from "@/components/log-form";
import { Icon, Plate } from "@/components/ui";
import { getSpotBySlug, spotMeta } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Log a visit" };
export const dynamic = "force-dynamic";

export default async function LogSpot({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireViewer(`/log/${slug}`);
  const found = await getSpotBySlug(slug);
  if (!found) notFound();
  const { spot, model } = found;
  const { hue } = spotMeta(model, spot);
  return (
    <>
      <header className="topbar">
        <Link href={`/spots/${spot.slug}`} className="btn btn-ghost px-3" aria-label="Back">
          {Icon.back}
        </Link>
      </header>
      <div className="mb-6 flex items-center gap-3">
        <Plate name={spot.name} hue={hue} size="sm" />
        <div className="min-w-0">
          <h1 className="h2">{spot.name}</h1>
          <div className="meta">{spot.area}</div>
        </div>
      </div>
      <LogForm slug={spot.slug} />
    </>
  );
}
