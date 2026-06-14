import "server-only";

import { prisma } from "@/lib/db/prisma";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export interface ProvisionInput {
  email: string;
  name: string;
  orgName: string;
  /** Supabase Auth user id, linked to the app user. */
  authId?: string | null;
}

export interface ProvisionResult {
  organizationId: string;
  userId: string;
}

/**
 * Creates a brand-new organization with the signing-up user as its owner. Regional
 * defaults (country, currency, locale, timezone) come from the schema and are
 * editable later in Settings — no country logic is hardcoded here.
 */
export async function provisionOrganization(input: ProvisionInput): Promise<ProvisionResult> {
  const email = input.email.trim().toLowerCase();
  const slug = await uniqueSlug(slugify(input.orgName));

  return prisma.$transaction(async (tx) => {
    const ownerRole = await tx.role.findFirst({ where: { key: "owner", organizationId: null } });
    if (!ownerRole) throw new Error("Owner role not found (system roles not seeded).");

    const existing = await tx.user.findUnique({ where: { email } });
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { authId: input.authId ?? existing.authId, name: existing.name || input.name },
        })
      : await tx.user.create({ data: { email, name: input.name, authId: input.authId ?? undefined } });

    const org = await tx.organization.create({ data: { name: input.orgName, slug } });

    await tx.membership.create({
      data: { organizationId: org.id, userId: user.id, roleId: ownerRole.id, status: "active" },
    });

    return { organizationId: org.id, userId: user.id };
  });
}
