import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";

/** Records a sensitive action in the audit log. Never throws — auditing must not break the action. */
export async function auditLog(
  ctx: TenantContext,
  action: string,
  entity?: { type: string; id: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        membershipId: ctx.membership.id,
        action,
        entityType: entity?.type,
        entityId: entity?.id,
        metadata: entity?.metadata as never,
      },
    });
  } catch (error) {
    console.error("auditLog failed:", error);
  }
}
