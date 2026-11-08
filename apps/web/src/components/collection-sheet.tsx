"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCollection, setCollectionSpot } from "@/app/actions";
import { I } from "./icons";

export function CollectionSheet({
  spotId,
  spotName,
  collections,
}: {
  spotId: string;
  spotName: string;
  collections: { id: string; title: string; spotIds: string[] }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(() => new Map(collections.map((c) => [c.id, c.spotIds.includes(spotId)])));
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <>
      <button type="button" className="btn sm" onClick={() => setOpen(true)}>
        {I.list({ width: 16, height: 16 })}
        Add to list
      </button>
      {open ? (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="cs-title">
            <div className="grab" />
            <h2 id="cs-title" className="h1">
              Add {spotName} to a list
            </h2>
            {collections.length ? (
              <div className="flex flex-col gap-2">
                {collections.map((c) => {
                  const on = state.get(c.id) ?? false;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="card line flex items-center gap-3 px-4 py-3 text-left"
                      aria-pressed={on}
                      onClick={() => {
                        setState(new Map(state).set(c.id, !on));
                        start(() => setCollectionSpot(c.id, spotId, !on));
                      }}
                    >
                      <span className="flex-1 font-bold">{c.title}</span>
                      <span
                        className="grid h-6 w-6 place-items-center rounded-md border-2"
                        style={{ borderColor: on ? "var(--g-900)" : "var(--c-line)", background: on ? "var(--g-900)" : "transparent", color: "#fff" }}
                      >
                        {on ? I.check({ width: 14, height: 14 }) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="muted small">Lists help you plan where to eat. Make your first one.</p>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                start(async () => {
                  const res = await createCollection(title, "", spotId);
                  if (res?.error) setError(res.error);
                  else {
                    setTitle("");
                    setOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              <input
                id="new-list"
                className="input"
                placeholder="New list, e.g. Date night"
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button type="submit" className="btn primary" disabled={pending || title.trim().length < 2}>
                Create
              </button>
            </form>
            {error ? <p className="error">{error}</p> : null}
            <button type="button" className="btn ghost wide" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
