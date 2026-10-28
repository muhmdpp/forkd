"use client";
import { useActionState, useState } from "react";
import { type FormState, addSpot } from "@/app/actions";

export function AddSpotForm({ categories }: { categories: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addSpot, undefined);
  const [cats, setCats] = useState<string[]>([]);
  const [price, setPrice] = useState(1);

  const toggle = (id: string) =>
    setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)));

  return (
    <form action={action} className="flex flex-col gap-5">
      {cats.map((c) => (
        <input key={c} type="hidden" name="categories" value={c} />
      ))}
      <input type="hidden" name="priceBand" value={price} />
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
          Must-order dish <span className="meta font-normal">optional</span>
        </span>
        <input id="mustOrder" name="mustOrder" maxLength={80} className="input" placeholder="e.g. Beef fry with porotta" />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="kicker mb-2">Category (up to 2)</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={cats.includes(c.id)} onClick={() => toggle(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="kicker mb-2">Price</legend>
        <div className="seg">
          {[1, 2, 3].map((p) => (
            <button key={p} type="button" aria-pressed={price === p} onClick={() => setPrice(p)}>
              {"₹".repeat(p)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Spice level</span>
        <input id="spice" name="spice" type="range" min="0" max="1" step="0.05" defaultValue="0.5" className="accent-[var(--hot)]" />
        <div className="meta flex justify-between"><span>Mild</span><span>Fire</span></div>
      </label>
      {state?.error ? <p className="error" role="alert">{state.error}</p> : null}
      <button type="submit" className="btn btn-hot btn-block" disabled={pending}>
        {pending ? "Adding…" : "Add and rate it"}
      </button>
    </form>
  );
}
