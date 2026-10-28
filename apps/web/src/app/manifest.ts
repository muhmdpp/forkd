import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forkd",
    short_name: "Forkd",
    description: "Personal food spot picks and a Reel vs Real hype check.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#100e13",
    theme_color: "#100e13",
    categories: ["food", "lifestyle", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
