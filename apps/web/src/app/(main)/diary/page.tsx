import type { Metadata } from "next";
import Link from "next/link";
import { Plate, Stars, TopBar } from "@/components/ui";
import { getDiary } from "@/lib/data";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Diary" };
export const dynamic = "force-dynamic";

const VOTE = { gem: "Better than hyped", ok: "As promised", over: "All hype" } as const;

export default async function Diary() {
  const viewer = await requireViewer("/diary");
  const { entries, stats } = await getDiary(viewer.id, viewer.cityId);
  let lastMonth = "";
  return (
    <>
      <TopBar />
      <div className="flex flex-col gap-5">
        <h1 className="display">
          Your food <em>diary</em>
        </h1>
        <div className="grid grid-cols-3 gap-2">
          <Stat n={String(stats.rated)} label="spots rated" />
          <Stat n={stats.avg ? stats.avg.toFixed(1) : "–"} label="avg rating" />
          <Stat n={String(entries.length)} label="visits logged" />
        </div>
        {entries.length ? (
          <div className="card px-4 py-1">
            {entries.map((e) => {
              const d = new Date(e.createdAt);
              const month = d.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
              const head = month !== lastMonth ? ((lastMonth = month), month) : null;
              return (
                <div key={e.id}>
                  {head ? <div className="kicker pb-1 pt-4">{head}</div> : null}
                  <Link href={`/spots/${e.slug}`} className="flex items-center gap-3 border-t border-[var(--line)] py-3 first:border-0">
                    <div className="w-10 flex-none text-center">
                      <div className="num text-[20px] font-bold leading-none">{d.toLocaleString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" })}</div>
                      <div className="text-[10px] uppercase muted">{d.toLocaleString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" })}</div>
                    </div>
                    <Plate name={e.name} hue={e.hue} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{e.name}</div>
                      <div className="meta">
                        <Stars value={e.rating} />
                        {e.hypeVote ? ` · ${VOTE[e.hypeVote]}` : ""}
                      </div>
                      {e.review ? <p className="mt-0.5 line-clamp-2 text-[13.5px]">{e.review}</p> : null}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty flex flex-col items-center gap-3">
            <p>No visits logged yet. Your swipes count toward your taste, but your diary starts with your first log.</p>
            <Link href="/log" className="btn btn-hot">Log a visit</Link>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="card p-3">
      <div className="num text-[24px] font-bold">{n}</div>
      <div className="meta text-[12px]">{label}</div>
    </div>
  );
}
