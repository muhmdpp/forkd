import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HypeBars } from "@/components/hype";
import { I } from "@/components/icons";
import { BackBar, HypePill, Photo } from "@/components/ui";
import { getSpotPage } from "@/lib/data";

export const metadata: Metadata = { title: "Hype check" };
export const dynamic = "force-dynamic";

export default async function HypeCheck({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getSpotPage(slug, null);
  if (!page) notFound();
  const { spot, stats, categoryText } = page;
  const votes = stats.hypeVotes.gem + stats.hypeVotes.ok + stats.hypeVotes.over;
  const pct = (n: number) => Math.round((n / Math.max(1, votes)) * 100);
  const ready = stats.hypeLabel !== "not_enough_data" && stats.avgExpectation !== null;
  const headline =
    stats.hypeLabel === "overhyped"
      ? `${pct(stats.hypeVotes.over)}% of visitors called it overhyped.`
      : stats.hypeLabel === "hidden_gem"
        ? `${pct(stats.hypeVotes.gem)}% said it beat their expectations.`
        : `${pct(stats.hypeVotes.ok + stats.hypeVotes.gem)}% said it lived up to the hype.`;

  return (
    <main className="page cream">
      <BackBar href={`/spots/${slug}`} title="Hype Check" />
      <div className="wrap flex flex-col gap-4 pb-12">
        <Photo src={spot.coverUrl} alt={spot.name} name={spot.name} ratio="16 / 8" style={{ borderRadius: 22 }}>
          <div className="shade" />
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 p-4 text-white">
            <div className="min-w-0">
              <div className="h1 truncate">{spot.name}</div>
              <div className="small opacity-90">
                {categoryText.split(",")[0]} · {spot.area}
              </div>
            </div>
            <HypePill label={stats.hypeLabel} icon={false} />
          </div>
        </Photo>

        {ready ? (
          <>
            <HypeBars stats={stats} />
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3 small font-semibold"
              style={{
                background: stats.hypeLabel === "overhyped" ? "var(--red-soft)" : "var(--mint-soft)",
                color: stats.hypeLabel === "overhyped" ? "#9e2e1c" : "#145c40",
              }}
            >
              {stats.hypeLabel === "overhyped" ? I.trendDown({ width: 18, height: 18 }) : I.trendUp({ width: 18, height: 18 })}
              {headline}
            </div>
            <div className="card line flex flex-col gap-2 p-4">
              <div className="small font-bold">How people voted</div>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                <div style={{ flex: stats.hypeVotes.gem, background: "var(--mint)" }} />
                <div style={{ flex: stats.hypeVotes.ok, background: "var(--mustard)" }} />
                <div style={{ flex: stats.hypeVotes.over, background: "var(--red)" }} />
              </div>
              <div className="tiny muted flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <b style={{ color: "var(--mint)" }}>{pct(stats.hypeVotes.gem)}%</b> better than expected
                </span>
                <span>
                  <b style={{ color: "#a57d00" }}>{pct(stats.hypeVotes.ok)}%</b> as expected
                </span>
                <span>
                  <b style={{ color: "var(--red)" }}>{pct(stats.hypeVotes.over)}%</b> overhyped
                </span>
              </div>
              {stats.reelShare > 0 ? <p className="tiny muted">{Math.round(stats.reelShare * 100)}% heard about it from a reel.</p> : null}
            </div>
          </>
        ) : (
          <div className="empty">We need at least 5 experiences with a hype answer before we can call it. Log yours to help.</div>
        )}

        <section className="mt-2 flex flex-col gap-3">
          <h2 className="h2">Hype status</h2>
          <Legend icon={I.flame} bg="var(--red-soft)" color="var(--red)" title="Overhyped" text="The buzz is bigger than the experience." />
          <Legend icon={I.thumb} bg="#fdf1c4" color="#a57d00" title="Lives up to it" text="It matches what people say." />
          <Legend icon={I.gem} bg="var(--mint-soft)" color="var(--mint)" title="Hidden gem" text="Better than what most people expect." />
        </section>
        <Link href={`/log/${slug}`} className="btn primary wide mt-2">
          Been here? Add your hype vote
        </Link>
      </div>
    </main>
  );
}

function Legend({ icon, bg, color, title, text }: { icon: (p: object) => React.ReactNode; bg: string; color: string; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full" style={{ background: bg, color }}>
        {icon({ width: 20, height: 20 })}
      </span>
      <div>
        <div className="font-bold">{title}</div>
        <div className="small muted">{text}</div>
      </div>
    </div>
  );
}
