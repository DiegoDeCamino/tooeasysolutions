import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Too Easy Crew",
    short_name: "Too Easy",
    description: "Shifts, bookings and project updates for the Too Easy Solutions crew.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: THEME_COLOR.light,
    theme_color: THEME_COLOR.light,
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shifts", url: "/app/shifts", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Projects", url: "/app/projects", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
