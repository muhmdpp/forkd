import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogFlow } from "@/components/log-flow";
import { getSpotBySlug, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Log an experience" };
export const dynamic = "force-dynamic";

export default async function LogSpot({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireViewer(`/log/${slug}`);
  const found = await getSpotBySlug(slug);
  if (!found) notFound();
  const { spot } = found;
  const dishes = Object.entries(spot.dishes)
    .sort((a, b) => b[1] - a[1])
    .map(([d]) => d)
    .slice(0, 8);
  if (spot.mustOrder && !dishes.includes(spot.mustOrder)) dishes.unshift(spot.mustOrder);
  return (
    <LogFlow
      spot={{ id: spot.id, slug: spot.slug, name: spot.name, area: spot.area, coverUrl: spot.coverUrl }}
      suggestedDishes={dishes}
    />
  );
}
