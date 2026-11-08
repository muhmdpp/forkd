"use client";
import { useState, useTransition } from "react";
import { deleteExperienceAction } from "@/app/actions";
import { I } from "./icons";

export function PostMenu({ visitId }: { visitId: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" className="iconbtn" aria-label="More options" onClick={() => setOpen(true)}>
        {I.more()}
      </button>
      {open ? (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && (setOpen(false), setConfirm(false))}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Experience options">
            <div className="grab" />
            {confirm ? (
              <>
                <h2 className="h1">Delete this experience?</h2>
                <p className="muted small">Its photos, likes and comments go too. Your rating stops counting toward the spot.</p>
                <button
                  type="button"
                  className="btn wide"
                  style={{ background: "var(--red)", borderColor: "var(--red)", color: "#fff" }}
                  disabled={pending}
                  onClick={() => start(() => deleteExperienceAction(visitId))}
                >
                  {pending ? "Deleting…" : "Delete"}
                </button>
              </>
            ) : (
              <button type="button" className="card line px-4 py-3 text-left font-bold" style={{ color: "var(--red)" }} onClick={() => setConfirm(true)}>
                Delete experience
              </button>
            )}
            <button type="button" className="btn ghost wide" onClick={() => (setOpen(false), setConfirm(false))}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
