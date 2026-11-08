import type { Metadata } from "next";
import { AddSpotForm } from "@/components/add-spot-form";
import { BackBar } from "@/components/ui";
import { getCategories, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Add a spot" };
export const dynamic = "force-dynamic";

export default async function NewSpot() {
  const viewer = await requireViewer("/spots/new");
  const categories = await getCategories(viewer.homeCityId);
  return (
    <main className="page cream">
      <BackBar href="/log" title="Add a spot" />
      <div className="wrap flex flex-col gap-5 pb-12">
        <div>
          <h1 className="display">Put it on the map</h1>
          <p className="muted mt-2">Know a spot nobody&rsquo;s talking about? Add it and be the first to rate it.</p>
        </div>
        <AddSpotForm categories={categories.map((c) => ({ id: c.id, label: c.label }))} />
      </div>
    </main>
  );
}
