import { isDemoMode } from "@forkd/db";
import { BottomNav } from "@/components/bottom-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isDemoMode ? (
        <div className="bg-[var(--hot)] px-4 py-1.5 text-center text-[12px] font-semibold text-[var(--hot-ink)] pt-[calc(6px+env(safe-area-inset-top))]">
          Demo mode: sample data, and anything you add resets when the server restarts.
        </div>
      ) : null}
      <main className="shell">{children}</main>
      <BottomNav />
    </>
  );
}
