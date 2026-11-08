import { getStore } from "@forkd/db";
import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { I } from "@/components/icons";
import { Avatar, timeAgo } from "@/components/ui";
import { requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

export default async function Activity() {
  const viewer = await requireViewer("/activity");
  const store = await getStore();
  const items = await store.listNotifications(viewer.uid, 60);
  if (items.some((n) => !n.read)) await store.markNotificationsRead(viewer.uid);

  return (
    <main className="page">
      <div className="wrap with-nav">
        <header className="pb-4" style={{ paddingTop: "calc(14px + env(safe-area-inset-top))" }}>
          <h1 className="display" style={{ fontSize: 42 }}>
            Activity
          </h1>
        </header>
        {items.length ? (
          <ul className="stack">
            {items.map((n) => {
              const href = n.type === "follow" ? `/u/${n.actorHandle}` : `/e/${n.visitId}`;
              return (
                <li key={n.id}>
                  <Link href={href} className="row">
                    <span className="relative">
                      <Avatar name={n.actorName} src={n.actorAvatar} size={46} />
                      <span
                        className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full"
                        style={{
                          background: n.type === "like" ? "var(--red)" : n.type === "comment" ? "var(--mustard)" : "var(--mint)",
                          color: n.type === "comment" ? "var(--mustard-ink)" : "#fff",
                          border: "2px solid var(--g-900)",
                        }}
                      >
                        {n.type === "like"
                          ? I.heartFill({ width: 12, height: 12 })
                          : n.type === "comment"
                            ? I.comment({ width: 12, height: 12 })
                            : I.plus({ width: 12, height: 12 })}
                      </span>
                    </span>
                    <div className="grow">
                      <p className="text-[14.5px] leading-snug">
                        <b>{n.actorName}</b>{" "}
                        {n.type === "follow"
                          ? "started following you."
                          : n.type === "like"
                            ? `liked your experience at ${n.spotName}.`
                            : `commented on ${n.spotName}: “${n.text}”`}
                      </p>
                      <span className="tiny muted">{timeAgo(n.createdAt)}</span>
                    </div>
                    {!n.read ? <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: "var(--mustard)" }} aria-label="New" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty mt-2">
            When people follow you, like or comment on your experiences, it shows up here.
          </div>
        )}
      </div>
      <BottomNav handle={viewer.handle} />
    </main>
  );
}
