import type { Reason, Warning } from "./recommend";
import type { HypeLabel, PriceBand } from "./types";

export interface ExplainLookup {
  spotName: (id: string) => string;
  categoryLabel: (id: string) => string;
}

export const rupees = (band: PriceBand | number) => "₹".repeat(Math.max(1, Math.min(3, Math.round(band))));

export function starText(r: number): string {
  const whole = Math.floor(r);
  return "★".repeat(whole) + (r - whole >= 0.5 ? "½" : "");
}

const one = (x: number) => x.toFixed(1);

/** Turn a reason code into a sentence for the "Why we suggested this" box. */
export function explainReason(r: Reason, l: ExplainLookup): string {
  switch (r.code) {
    case "SIMILAR_TO_RATED":
      return `You gave ${l.spotName(r.spotId)} ${starText(r.rating)}. This is also ${l
        .categoryLabel(r.category)
        .toLowerCase()}.`;
    case "TASTE_TWINS":
      return `${r.fans} people whose ratings track yours gave it 4★ or more.`;
    case "HIDDEN_GEM":
      return `Quiet online, loved in person: rated ${one(r.avg)}★, above what people expected.`;
    case "OVERHYPED_BUT_FITS":
      return "Most people find it overhyped, but your taste says you'll still enjoy it.";
    case "SPICE_MATCH":
      return "Spice level matches the places you rate highly.";
    case "PRICE_MATCH":
      return `Fits the price range you usually go for (${rupees(r.priceBand)}).`;
    case "COMMUNITY_FAVOURITE":
      return `Well rated by the community: ${one(r.avg)}★ from ${r.count} visits.`;
  }
}

export function explainWarning(w: Warning, l: ExplainLookup): string {
  switch (w.code) {
    case "OVERHYPED":
      return `People expected ${one(w.expected)}★ from the buzz. They actually rate it ${one(w.actual)}★.`;
    case "TWINS_DISLIKE":
      return `${w.dislikers} of ${w.raters} people with your taste rated it under 4★.`;
    case "LOW_AFFINITY":
      return `You haven't liked ${w.categories.map((c) => l.categoryLabel(c).toLowerCase()).join(" or ")} places much so far.`;
    case "PRICIER":
      return `Pricier (${rupees(w.priceBand)}) than where you usually eat.`;
  }
}

/** Short sticker labels. Written for the app's audience; keep them short enough for a badge. */
export const HYPE_LABEL_TEXT: Record<HypeLabel, string> = {
  overhyped: "All hype",
  hidden_gem: "Slept on",
  lives_up: "Legit",
  not_enough_data: "Too new to call",
};

export const HYPE_LABEL_SUMMARY: Record<HypeLabel, string> = {
  overhyped: "The reels set the bar higher than the food clears it.",
  hidden_gem: "Way better than people expected going in. Barely any reels about it.",
  lives_up: "What you saw online is pretty much what you get.",
  not_enough_data: "We need 5 visits with a hype answer before we call it.",
};
