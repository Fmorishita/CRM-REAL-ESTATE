import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Public, crawlable routes only. Tenant landing pages (`/p/[slug]`,
 * `/company/[slug]`) are per-organization and are exposed through each org's own
 * branding/domain rather than this root sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/portal/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
