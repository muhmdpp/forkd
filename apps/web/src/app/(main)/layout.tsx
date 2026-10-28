import { isDemoMode } from "@forkd/db";
import { BottomNav } from "@/components/bottom-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isDemoMode ? (
        <div className="border-b border-[var(--line)] bg-[var(--bg-3)] px-4 py-1.5 text-center text-[12.5px] text-[var(--muted)] pt-[calc(6px+env(safe-area-inset-top))]">
          Demo version: sample data, and your changes may reset.
        </div>
      ) : null}
      <main className="shell">{children}</main>
      <BottomNav />
    </>
  );
}
