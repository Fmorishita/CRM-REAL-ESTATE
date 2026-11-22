#!/usr/bin/env node
/**
 * Applies pending Prisma migrations during the PRODUCTION build on Vercel, so
 * schema changes ship with the code that needs them (the sandbox and laptops
 * never need direct database access). Skipped everywhere else.
 *
 * If the database was created before migration history existed (Prisma error
 * P3005: schema not empty), it is baselined ONLY when the init schema is
 * clearly present (the `organizations` table exists); later migrations then
 * run normally. Any other failure stops the build, so a broken migration never
 * reaches production and the previous deployment keeps serving.
 */
import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV;
if (env !== "production" || process.env.SKIP_DB_MIGRATE === "1") {
  console.log(`[migrate] skipped (VERCEL_ENV=${env ?? "local"})`);
  process.exit(0);
}
if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.log("[migrate] skipped: DATABASE_URL/DIRECT_URL not set");
  process.exit(0);
}

/**
 * Supabase's direct host (db.<ref>.supabase.co) is IPv6-only and build machines
 * are IPv4. Migrations then go through the Supavisor *session* pooler (port
 * 5432 on the same pooler host as DATABASE_URL), which supports DDL.
 */
function migrationUrl() {
  const direct = new URL(process.env.DIRECT_URL);
  if (!/^db\.[a-z0-9]+\.supabase\.co$/.test(direct.hostname)) return process.env.DIRECT_URL;
  const pooled = new URL(process.env.DATABASE_URL);
  if (!pooled.hostname.endsWith(".pooler.supabase.com")) return process.env.DIRECT_URL;
  pooled.port = "5432";
  pooled.search = "";
  console.log("[migrate] using the Supabase session pooler (IPv4) for migrations");
  return pooled.toString();
}

const DIRECT = migrationUrl();
const run = (cmd) =>
  execSync(cmd, { stdio: "pipe", encoding: "utf8", env: { ...process.env, DIRECT_URL: DIRECT, DATABASE_URL: DIRECT } });

function deploy() {
  const out = run("pnpm exec prisma migrate deploy");
  console.log(out);
}

try {
  deploy();
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  if (!output.includes("P3005")) {
    console.error(output);
    console.error("[migrate] failed — build stopped so production keeps the previous deployment.");
    process.exit(1);
  }
  console.log("[migrate] database has no migration history (P3005); checking for the init schema…");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: DIRECT });
  const rows = await prisma.$queryRaw`SELECT to_regclass('public.organizations') IS NOT NULL AS present`;
  await prisma.$disconnect();
  if (!rows?.[0]?.present) {
    console.error("[migrate] init schema not found; refusing to baseline automatically.");
    process.exit(1);
  }
  run("pnpm exec prisma migrate resolve --applied 00000000000000_init");
  console.log("[migrate] baselined 00000000000000_init; applying the rest…");
  deploy();
}
