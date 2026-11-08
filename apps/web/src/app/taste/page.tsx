import type { Metadata } from "next";
import Link from "next/link";
import { BackBar, rupees } from "@/components/ui";
import { getTaste, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Your taste" };
export const dynamic = "force-dynamic";

function personality(top?: { label: string; affinity: number }, spice = 0.5, sceptic = 0) {
  if (sceptic > 0.5) return "Hype detector";
  if (spice > 0.7) return "Spice hunter";
  if (!top || top.affinity < 0.15) return "Still exploring";
  return `${top.label} fan`;
}

export default async function Taste() {
  const viewer = await requireViewer("/taste");
  const { taste, categories, rated } = await getTaste(viewer);
  return (
    <main className="page cream">
      <BackBar href={`/u/${viewer.handle}`} title="Your taste" />
      <div className="wrap flex flex-col gap-5 pb-12">
        <div className="pick">
          <div className="eyebrow">Your food personality</div>
          <div className="display px-1.5 pb-2" style={{ fontSize: 44 }}>
            {personality(categories[0], taste.spice, taste.hypeScepticism)}
          </div>
        </div>
        <p className="muted small">
          Built from {rated} rating{rated === 1 ? "" : "s"}. It changes every time you rate a spot or tap “Not for me”.
        </p>
        <section className="card line flex flex-col gap-3 p-4">
          <h2 className="h2">What you&rsquo;re into</h2>
          {categories.map((c) => {
            const w = Math.min(50, Math.abs(c.affinity) * 50);
            return (
              <div key={c.id} className="grid grid-cols-[110px_1fr] items-center gap-3 small">
                <span className="truncate font-semibold">{c.label}</span>
                <div className="relative h-3 rounded-full" style={{ background: "var(--c-200)" }}>
                  <div className="absolute inset-y-[-3px] left-1/2 w-px" style={{ background: "var(--muted)", opacity: 0.4 }} />
                  <div
                    className="absolute inset-y-0 rounded-full"
                    style={c.affinity >= 0 ? { left: "50%", width: `${w}%`, background: "var(--mint)" } : { right: "50%", width: `${w}%`, background: "var(--red)" }}
                  />
                </div>
              </div>
            );
          })}
          <p className="tiny muted">Right of centre: you like it. Left: not your thing.</p>
        </section>
        <section className="card line flex flex-col gap-4 p-4">
          <h2 className="h2">Your style</h2>
          <Bar label="Spice" value={taste.spice} left="Mild" right="Fire" />
          <Bar label="Budget" value={Math.min(1, Math.max(0, (taste.price - 1) / 2))} left={rupees(1)} right={rupees(3)} />
          <Bar label="Hype radar" value={taste.hypeScepticism} left="Trusts the buzz" right="Sceptical" />
        </section>
        <Link href="/rate" className="btn primary wide">
          Rate more spots
        </Link>
      </div>
    </main>
  );
}

function Bar({ label, value, left, right }: { label: string; value: number; left: string; right: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="small font-semibold">{label}</div>
      <div className="h-3 rounded-full" style={{ background: "var(--c-200)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(4, value * 100)}%`, background: "var(--mustard)" }} />
      </div>
      <div className="tiny muted flex justify-between">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}
