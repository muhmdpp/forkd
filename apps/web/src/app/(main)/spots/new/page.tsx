import type { Metadata } from "next";
import { AddSpotForm } from "@/components/add-spot-form";
import { TopBar } from "@/components/ui";
import { getCategories } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Add a spot" };
export const dynamic = "force-dynamic";

export default async function NewSpot() {
  await requireViewer("/spots/new");
  const categories = await getCategories();
  return (
    <>
      <TopBar />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="display">
            Put it <em>on the map</em>
          </h1>
          <p className="muted mt-2">Know a spot nobody&rsquo;s talking about? Add it and be the first to rate it.</p>
        </div>
        <AddSpotForm categories={categories.map((c) => ({ id: c.id, label: c.label }))} />
      </div>
    </>
  );
}
