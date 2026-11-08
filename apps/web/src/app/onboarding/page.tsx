import type { Metadata } from "next";
import { CravingsPicker } from "@/components/cravings-picker";
import { getCategories, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Your cravings" };
export const dynamic = "force-dynamic";

export default async function Cravings() {
  const viewer = await requireViewer("/onboarding", { allowNew: true });
  const categories = await getCategories(viewer.homeCityId);
  return <CravingsPicker categories={categories.map((c) => ({ id: c.id, label: c.label, imageUrl: c.imageUrl }))} initial={viewer.cravings} />;
}
