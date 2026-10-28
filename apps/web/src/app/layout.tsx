import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Toast } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Forkd", template: "%s · Forkd" },
  description: "Eat where you'd actually love it. Personal picks and a Reel vs Real hype check for every food spot.",
  applicationName: "Forkd",
  appleWebApp: { capable: true, title: "Forkd", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#100e13" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3fa" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Unbounded:wght@500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        {children}
        <Suspense>
          <Toast />
        </Suspense>
      </body>
    </html>
  );
}
