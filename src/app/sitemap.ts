import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tooeasy.example";
  return ["/", "/about", "/community", "/projects", "/faq", "/contact"].map((p) => ({ url: base + p }));
}



