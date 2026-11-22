import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

/**
 * Optional sub-path, e.g. "/realtorpro" to serve the CRM at
 * legacycapitalmx.com/realtorpro (the main site rewrites that path here).
 * Build-time setting: empty keeps the app at the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim().replace(/\/$/, "") || undefined;

/** Hosts that proxy to this app; Server Actions accept requests coming through them. */
const proxyOrigins = (process.env.APP_PROXY_ORIGINS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  basePath,
  experimental: proxyOrigins.length ? { serverActions: { allowedOrigins: proxyOrigins } } : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // With a base path, the bare deployment root sends people to the app.
    return basePath ? [{ source: "/", destination: basePath, permanent: false, basePath: false }] : [];
  },
};

export default nextConfig;
