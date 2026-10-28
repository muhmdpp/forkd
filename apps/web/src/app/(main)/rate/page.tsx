import type { Metadata } from "next";
import Link from "next/link";
import { SwipeDeck } from "@/components/swipe-deck";
import { TopBar } from "@/components/ui";
import { getRateDeck } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Quick rate" };
export const dynamic = "force-dynamic";

export default async function QuickRate() {
  const viewer = await requireViewer("/rate");
  const spots = await getRateDeck(viewer.id, viewer.cityId);
  return (
    <>
      <TopBar />
      <div className="flex flex-col gap-4">
        <h1 className="display">
          Quick <em>rate</em>
        </h1>
        {spots.length ? (
          <SwipeDeck spots={spots} next="/?toast=logged" minAnswers={1} doneLabel="Save" />
        ) : (
          <div className="empty">
            You&rsquo;ve rated every spot we know. <Link href="/spots/new" className="text-hot underline">Add one</Link>.
          </div>
        )}
      </div>
    </>
  );
}
