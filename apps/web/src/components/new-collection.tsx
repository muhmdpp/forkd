"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCollection } from "@/app/actions";
import { I } from "./icons";

export function NewCollectionButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <button type="button" className="btn wide" onClick={() => setOpen(true)}>
        {I.plus({ width: 18, height: 18 })} New collection
      </button>
      {open ? (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nc-title"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setError(null);
              start(async () => {
                const res = await createCollection(String(f.get("title") ?? ""), String(f.get("description") ?? ""));
                if (res?.error) setError(res.error);
                else if (res?.id) router.push(`/collections/${res.id}?toast=created`);
              });
            }}
          >
            <div className="grab" />
            <h2 id="nc-title" className="h1">
              New collection
            </h2>
            <label className="field">
              <span>Name</span>
              <input id="title" name="title" className="input" placeholder="Best late-night biryani" maxLength={60} required />
            </label>
            <label className="field">
              <span>
                Description <span className="muted font-normal">optional</span>
              </span>
              <input id="description" name="description" className="input" placeholder="What ties these spots together?" maxLength={200} />
            </label>
            <p className="tiny muted">Add spots to it from any spot page with “Add to list”.</p>
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" className="btn primary wide" disabled={pending}>
              {pending ? "Creating…" : "Create collection"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
