"use client";
import { useActionState, useRef, useState } from "react";
import { type ActionResult, addSpot } from "@/app/actions";
import { resizeAndUpload } from "@/lib/photos";
import { I } from "./icons";
import { Photo } from "./ui";

export function AddSpotForm({ categories }: { categories: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addSpot, undefined);
  const [cats, setCats] = useState<string[]>([]);
  const [price, setPrice] = useState(1);
  const [cover, setCover] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toggle = (id: string) => setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)));

  return (
    <form action={action} className="flex flex-col gap-5">
      {cats.map((c) => (
        <input key={c} type="hidden" name="categories" value={c} />
      ))}
      <input type="hidden" name="priceBand" value={price} />
      <input type="hidden" name="coverUrl" value={cover} />

      <button
        type="button"
        className="overflow-hidden text-left"
        style={{ borderRadius: 20 }}
        onClick={() => fileRef.current?.click()}
        aria-label={cover ? "Change cover photo" : "Add a cover photo"}
      >
        {cover ? (
          <Photo src={cover} alt="Cover photo" name="cover" ratio="16 / 9" />
        ) : (
          <div className="grid place-items-center gap-1 py-10 small muted" style={{ border: "1.5px dashed var(--line)", borderRadius: 20 }}>
            {I.camera({ width: 28, height: 28 })}
            {uploading ? "Uploading…" : "Add a cover photo (optional)"}
          </div>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setUploading(true);
          setUploadError(null);
          try {
            setCover(await resizeAndUpload(f));
          } catch (err) {
            setUploadError((err as Error).message);
          } finally {
            setUploading(false);
          }
        }}
      />
      {uploadError ? <p className="error">{uploadError}</p> : null}

      <label className="field">
        <span>Name</span>
        <input id="name" name="name" required maxLength={80} className="input" placeholder="e.g. Ikka's Thattukada" />
      </label>
      <label className="field">
        <span>Area</span>
        <input id="area" name="area" required maxLength={60} className="input" placeholder="e.g. Feroke" />
      </label>
      <label className="field">
        <span>
          Must-order dish <span className="muted font-normal">optional</span>
        </span>
        <input id="mustOrder" name="mustOrder" maxLength={80} className="input" placeholder="e.g. Beef fry with porotta" />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">
          Category <span className="muted font-normal small">up to 2</span>
        </legend>
        <div className="chips">
          {categories.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={cats.includes(c.id)} onClick={() => toggle(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Price per person</legend>
        <div className="optcards">
          {[
            [1, "₹", "Under ₹200"],
            [2, "₹₹", "₹200 – ₹500"],
            [3, "₹₹₹", "₹500+"],
          ].map(([p, sym, label]) => (
            <button key={p} type="button" className="optcard" aria-pressed={price === p} onClick={() => setPrice(p as number)}>
              <b className="text-[16px]">{sym}</b>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Spice level</span>
        <input id="spice" name="spice" type="range" min="0" max="1" step="0.05" defaultValue="0.5" style={{ accentColor: "var(--g-900)" }} />
        <div className="tiny muted flex justify-between">
          <span>Mild</span>
          <span>Very spicy</span>
        </div>
      </label>
      {state?.error ? <p className="error" role="alert">{state.error}</p> : null}
      <button type="submit" className="btn primary wide" disabled={pending || uploading}>
        {pending ? "Adding…" : "Add and log my experience"}
      </button>
    </form>
  );
}
