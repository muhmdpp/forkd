import type { Metadata } from "next";
import Link from "next/link";
import { SwipeDeck } from "@/components/swipe-deck";
import { BackBar } from "@/components/ui";
import { getRateDeck, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Quick rate" };
export const dynamic = "force-dynamic";

export default async function QuickRate() {
  const viewer = await requireViewer("/rate");
  const spots = await getRateDeck(viewer, 15);
  return (
    <main className="page cream" style={{ display: "flex", flexDirection: "column" }}>
      <BackBar href="/" title="Quick rate" />
      <div className="wrap flex w-full flex-1 flex-col gap-4 pb-8">
        {spots.length ? (
          <SwipeDeck spots={spots} next="/?toast=rated" minAnswers={1} doneLabel="Save" />
        ) : (
          <div className="empty mt-4">
            You&rsquo;ve rated every spot we know.{" "}
            <Link href="/spots/new" className="font-bold underline">
              Add one
            </Link>
            .
          </div>
        )}
      </div>
    </main>
  );
}
