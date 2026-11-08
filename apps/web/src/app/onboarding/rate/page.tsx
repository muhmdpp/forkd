import type { Metadata } from "next";
import Link from "next/link";
import { SwipeDeck } from "@/components/swipe-deck";
import { I } from "@/components/icons";
import { getRateDeck, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Rate spots you know" };
export const dynamic = "force-dynamic";

export default async function OnboardingRate() {
  const viewer = await requireViewer("/onboarding/rate", { allowNew: true });
  const spots = await getRateDeck(viewer, 10);
  return (
    <main className="page cream" style={{ display: "flex", flexDirection: "column" }}>
      <header className="topbar">
        <div className="wrap flex w-full items-center">
          <Link href="/onboarding" className="iconbtn" aria-label="Back">
            {I.back()}
          </Link>
          <div className="flex-1" />
          <span className="small font-semibold num">4/4</span>
        </div>
      </header>
      <div className="wrap flex w-full flex-1 flex-col gap-4 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="display">Been to any of these?</h1>
          <p className="muted">Rate at least 3 so your picks fit your taste.</p>
        </div>
        <SwipeDeck spots={spots} next="/?toast=welcome" minAnswers={3} doneLabel="Show my picks" />
      </div>
    </main>
  );
}
