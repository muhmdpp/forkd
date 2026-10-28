import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Toast } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Forkd", template: "%s · Forkd" },
  description: "Find food spots you'll actually like, with honest ratings and personal picks.",
  applicationName: "Forkd",
  appleWebApp: { capable: true, title: "Forkd", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#131413" },
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
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap"
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
