import "server-only";

/**
 * Whether the app should read from the real database or fall back to in-memory
 * demo fixtures. Until later phases wire every module to Prisma, modules check
 * this to decide their data source. Demo mode is on when DEMO_MODE=true or when
 * no database is configured.
 */
export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  return !process.env.DATABASE_URL;
}

export { prisma } from "@/lib/db/prisma";
