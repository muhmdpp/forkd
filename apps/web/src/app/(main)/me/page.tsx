import { rupees } from "@forkd/core";
import type { Metadata } from "next";
import Link from "next/link";
import { SignOut } from "@/components/sign-out";
import { TopBar } from "@/components/ui";
import { getDiary } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Your taste" };
export const dynamic = "force-dynamic";

function personality(top?: { label: string; affinity: number }, spice = 0.5, sceptic = 0) {
  if (sceptic > 0.5) return "Skeptical of hype";
  if (spice > 0.7) return "Loves spicy food";
  if (!top || top.affinity < 0.15) return "Still exploring";
  return `${top.label} fan`;
}

export default async function Me() {
  const viewer = await requireViewer("/me");
  const { taste, categories, stats } = await getDiary(viewer.id, viewer.cityId);
  const max = 1;
  return (
    <>
      <TopBar />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="display">Your taste</h1>
          <p className="muted mt-1">
            @{viewer.handle} · {personality(categories[0], taste.spice, taste.hypeScepticism)}
          </p>
          <p className="muted mt-2 text-[14px]">
            Built from {stats.rated} rating{stats.rated === 1 ? "" : "s"}. It updates each time you rate a spot or tap
            &ldquo;Not for me&rdquo;.
          </p>
        </div>

        <section className="card flex flex-col gap-3 p-4">
          <h2 className="h2">What you&rsquo;re into</h2>
          {categories.map((c) => {
            const w = Math.min(50, (Math.abs(c.affinity) / max) * 50);
            return (
              <div key={c.id} className="grid grid-cols-[110px_1fr] items-center gap-3 text-[13.5px]">
                <span className="truncate">{c.label}</span>
                <div className="relative h-3 rounded-full bg-[var(--bg-3)]">
                  <div className="absolute inset-y-[-3px] left-1/2 w-px bg-[var(--muted)] opacity-50" />
                  <div
                    className="absolute inset-y-0 rounded-full"
                    style={c.affinity >= 0 ? { left: "50%", width: `${w}%`, background: "var(--gem)" } : { right: "50%", width: `${w}%`, background: "var(--cap)" }}
                  />
                </div>
              </div>
            );
          })}
          <p className="meta">Right = you like it. Left = not your thing.</p>
        </section>

        <section className="card flex flex-col gap-3 p-4">
          <h2 className="h2">Your style</h2>
          <Bar label="Spice" value={taste.spice} left="Mild" right="Fire" />
          <Bar label="Budget" value={Math.min(1, Math.max(0, (taste.price - 1) / 2))} left={rupees(1)} right={rupees(3)} />
          <Bar label="Trust in hype" value={1 - taste.hypeScepticism} left="Sceptical" right="Trusting" />
        </section>

        <Link href="/rate" className="btn btn-hot btn-block">Rate more spots</Link>
        <SignOut />
      </div>
    </>
  );
}

function Bar({ label, value, left, right }: { label: string; value: number; left: string; right: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[13.5px] font-semibold">{label}</div>
      <div className="h-3 rounded-full bg-[var(--bg-3)]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(4, value * 100)}%`, background: "var(--sun)" }} />
      </div>
      <div className="meta flex justify-between text-[11.5px]"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}
