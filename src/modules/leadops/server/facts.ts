import "server-only";

import type { FactSource } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { QUALIFICATION_KEYS, isQualified, normalizeFactValue, parseFactValue, wantsMeeting } from "@/lib/leadops/qualification";
import { reportMilestone } from "@/modules/leadops/server/capi";

export interface ApplyFactsResult {
  changed: string[];
  answered: number;
  qualifiedNow: boolean;
  meetingRequested: boolean;
}

/**
 * Writes pre-qualification answers with a clear precedence: an advisor's
 * correction is never overwritten by an automatic source (keywords, AI, form).
 * Then evaluates the milestones that depend on answers:
 * - 4+ answers (or 3+ stars) → QualifiedLead to Meta (idempotent per contact).
 * - Asked for a visit / video call → "Atención" so a human takes over.
 */
export async function applyFacts(
  organizationId: string,
  contactId: string,
  facts: Partial<Record<string, string | string[]>>,
  source: FactSource,
  membershipId?: string | null,
): Promise<ApplyFactsResult> {
  const existing = await prisma.contactFact.findMany({ where: { contactId, organizationId } });
  const byKey = new Map<string, { value: string; source: FactSource }>(
    existing.map((f) => [f.key, { value: f.value, source: f.source }]),
  );
  const changed: string[] = [];

  for (const key of QUALIFICATION_KEYS) {
    const raw = facts[key];
    if (raw === undefined) continue;
    const value = normalizeFactValue(key, Array.isArray(raw) ? raw : parseFactValue(raw));
    if (!value) continue;
    const prior = byKey.get(key);
    if (prior?.value === value) continue;
    if (prior?.source === "advisor" && source !== "advisor") continue;
    await prisma.contactFact.upsert({
      where: { contactId_key: { contactId, key } },
      create: { organizationId, contactId, key, value, source, capturedByMembershipId: membershipId ?? null },
      update: { value, source, capturedByMembershipId: membershipId ?? null, capturedAt: new Date() },
    });
    byKey.set(key, { value, source });
    changed.push(key);
  }

  const current = Object.fromEntries([...byKey.entries()].map(([k, f]) => [k, f.value]));
  const answered = QUALIFICATION_KEYS.filter((k) => current[k]).length;
  const meetingRequested = changed.includes("contact_preference") && wantsMeeting(current);
  let qualifiedNow = false;

  if (changed.length > 0) {
    const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { stars: true, attentionAt: true } });
    qualifiedNow = isQualified({ answered, stars: contact?.stars ?? null });
    if (qualifiedNow) await reportMilestone(organizationId, contactId, "lead_qualified");
    if (meetingRequested && !contact?.attentionAt) {
      await prisma.contact.update({ where: { id: contactId }, data: { attentionAt: new Date() } });
    }
  }
  return { changed, answered, qualifiedNow, meetingRequested };
}
