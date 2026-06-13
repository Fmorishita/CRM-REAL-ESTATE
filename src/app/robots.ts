import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Allow crawling of public marketing/landing surfaces; keep the authenticated
 * app and the client portal out of search indexes.
 */
export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/p/", "/company/"],
      disallow: [
        "/dashboard",
        "/inbox",
        "/contacts",
        "/pipeline",
        "/properties",
        "/visits",
        "/automations",
        "/analytics",
        "/copilot",
        "/settings",
        "/portal",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
