import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

/**
 * Canonical seed for environments with direct database access (`pnpm db:seed`).
 * Executes the same prisma/seed.sql that was applied to the hosted demo DB,
 * so there is a single source of truth for the "Morishita Realty Group" dataset.
 */
const prisma = new PrismaClient();

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(join(here, "seed.sql"), "utf8");

  // Strip SQL line comments, then split on statement boundaries. DO $$ ... $$
  // blocks are absent from the seed, so a simple semicolon split is safe here.
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.$transaction(
    statements.map((statement) => prisma.$executeRawUnsafe(statement)),
  );

  const [orgs, contacts, properties] = await Promise.all([
    prisma.organization.count(),
    prisma.contact.count(),
    prisma.property.count(),
  ]);
  console.log(`Seed complete: ${orgs} orgs, ${contacts} contacts, ${properties} properties.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
