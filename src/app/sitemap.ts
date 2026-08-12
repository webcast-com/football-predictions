import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  ): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    entry("", 1.0, "daily"),
    entry("/about", 0.7, "monthly"),
    entry("/contact", 0.7, "monthly"),
    entry("/register", 0.6, "yearly"),
    entry("/login", 0.4, "yearly"),
    entry("/privacy", 0.3, "yearly"),
    entry("/cookies", 0.3, "yearly"),
  ];
}
