import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forkd",
    short_name: "Forkd",
    description: "Food spots for people who actually eat out.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d2419",
    theme_color: "#0d2419",
    categories: ["food", "lifestyle", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
