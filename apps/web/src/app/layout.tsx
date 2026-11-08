import { isDemoMode } from "@forkd/db";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Toast } from "@/components/toast";
// Self-hosted fonts: no third-party requests, and they work offline in the installed app.
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/nunito/900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Forkd", template: "%s · Forkd" },
  description: "Food spots for people who actually eat out. Honest ratings, personal picks, and a reality check on the hype.",
  applicationName: "Forkd",
  appleWebApp: { capable: true, title: "Forkd", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d2419",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        {isDemoMode ? <div className="banner">Demo version with sample data. Changes reset when the server restarts.</div> : null}
        {children}
        <Suspense>
          <Toast />
        </Suspense>
      </body>
    </html>
  );
}
