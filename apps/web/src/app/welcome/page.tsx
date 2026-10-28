import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SwipeDeck } from "@/components/swipe-deck";
import { getQuizSpots } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Your taste" };
export const dynamic = "force-dynamic";

export default async function Welcome() {
  const viewer = await requireViewer("/welcome");
  if (viewer.onboarded) redirect("/");
  const spots = await getQuizSpots(viewer.cityId, 10);
  return (
    <main className="shell flex min-h-dvh flex-col gap-5 !pb-8 pt-[calc(20px+env(safe-area-inset-top))]">
      <div className="flex flex-col gap-2">
        <span className="wordmark">
          fork<span>d</span>
        </span>
        <h1 className="display mt-3">
          Swipe the spots <em>you know</em>.
        </h1>
        <p className="muted">A few swipes and Forkd learns your taste. Rate at least 3 to get picks.</p>
      </div>
      <SwipeDeck spots={spots} next="/?toast=welcome" minAnswers={3} />
    </main>
  );
}
