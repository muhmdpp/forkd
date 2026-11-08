import { getStore, isDemoMode, loadCityModel } from "@forkd/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Public status check: which data source is live and whether it answers. No secrets. */
export async function GET() {
  const started = Date.now();
  try {
    const store = await getStore();
    const model = await loadCityModel("kozhikode");
    return NextResponse.json({
      ok: true,
      mode: isDemoMode ? "demo" : "firebase",
      store: store.kind,
      spots: model.spots.length,
      raters: model.matrix.size,
      ms: Date.now() - started,
    });
  } catch (err) {
    console.error("[forkd] health check failed", err);
    return NextResponse.json({ ok: false, mode: isDemoMode ? "demo" : "firebase", error: (err as Error).message }, { status: 500 });
  }
}
