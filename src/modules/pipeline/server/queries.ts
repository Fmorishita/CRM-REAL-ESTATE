import "server-only";

import type { Prisma } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDayMonth } from "@/lib/format";
import {
  DEMO_OPP_FORM_OPTIONS,
  demoPipelineBoard,
  demoPipelineRows,
} from "@/modules/pipeline/demo";
import type {
  OpportunityCard,
  OpportunityFilters,
  OpportunityFormOptions,
  OpportunityRow,
  PipelineBoard,
  PipelineColumn,
} from "@/modules/pipeline/types";

const oppInclude = {
  contact: true,
  property: true,
  assignedMembership: { include: { user: true } },
} satisfies Prisma.OpportunityInclude;

type OppPayload = Prisma.OpportunityGetPayload<{ include: typeof oppInclude }>;

function toCard(o: OppPayload, currency: string, locale: string): OpportunityCard {
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
  return {
    id: o.id,
    title: o.title,
    stageId: o.stageId,
    contactId: o.contactId,
    contactName: `${o.contact.firstName} ${o.contact.lastName}`,
    propertyTitle: o.property?.title ?? null,
    amount: Number(o.amount),
    amountLabel: cur(Number(o.amount)),
    commissionLabel: o.commissionAmount != null ? cur(Number(o.commissionAmount)) : null,
    probability: o.probability,
    assignedName: o.assignedMembership?.user.name ?? null,
    closeDateLabel: o.expectedCloseDate ? formatDayMonth(o.expectedCloseDate, locale) : null,
    aiRisk: o.aiRisk,
  };
}

export async function getPipelineBoard(
  ctx: TenantContext,
  filters: OpportunityFilters = {},
): Promise<PipelineBoard> {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  if (isDemoMode()) return demoPipelineBoard(ctx);
  try {
    const organizationId = ctx.organization.id;
    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId, isDefault: true },
      include: { stages: { orderBy: { position: "asc" } } },
    });
    if (!pipeline) return demoPipelineBoard(ctx);

    const where: Prisma.OpportunityWhereInput = { organizationId, pipelineId: pipeline.id, deletedAt: null };
    if (filters.assignedMembershipId) where.assignedMembershipId = filters.assignedMembershipId;

    const opps = await prisma.opportunity.findMany({
      where,
      include: oppInclude,
      orderBy: { updatedAt: "desc" },
    });

    const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
    const byStage = new Map<string, OpportunityCard[]>();
    for (const o of opps) {
      const card = toCard(o, currency, locale);
      const list = byStage.get(o.stageId) ?? [];
      list.push(card);
      byStage.set(o.stageId, list);
    }

    let openCount = 0;
    let totalValue = 0;
    let weighted = 0;
    let wonValue = 0;
    for (const o of opps) {
      const amount = Number(o.amount);
      const stage = pipeline.stages.find((s) => s.id === o.stageId);
      if (stage?.isWon) {
        wonValue += amount;
      } else if (!stage?.isLost) {
        openCount += 1;
        totalValue += amount;
        weighted += (amount * o.probability) / 100;
      }
    }

    const columns: PipelineColumn[] = pipeline.stages.map((stage) => {
      const cards = byStage.get(stage.id) ?? [];
      const total = cards.reduce((sum, c) => sum + c.amount, 0);
      return {
        id: stage.id,
        key: stage.key,
        name: stage.name,
        probability: stage.probability,
        isWon: stage.isWon,
        isLost: stage.isLost,
        totalValueLabel: cur(total),
        cards,
      };
    });

    return {
      columns,
      summary: {
        openCount,
        totalValueLabel: cur(totalValue),
        weightedForecastLabel: cur(weighted),
        wonValueLabel: cur(wonValue),
      },
      currency,
      locale,
    };
  } catch (error) {
    console.error("getPipelineBoard failed, falling back to demo data:", error);
    return demoPipelineBoard(ctx);
  }
}

export async function getPipelineRows(
  ctx: TenantContext,
  filters: OpportunityFilters = {},
): Promise<OpportunityRow[]> {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  if (isDemoMode()) return demoPipelineRows(ctx);
  try {
    const where: Prisma.OpportunityWhereInput = { organizationId: ctx.organization.id, deletedAt: null };
    if (filters.assignedMembershipId) where.assignedMembershipId = filters.assignedMembershipId;
    const opps = await prisma.opportunity.findMany({
      where,
      include: { ...oppInclude, stage: true },
      orderBy: { amount: "desc" },
    });
    const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
    return opps.map((o) => ({
      id: o.id,
      title: o.title,
      contactName: `${o.contact.firstName} ${o.contact.lastName}`,
      contactId: o.contactId,
      propertyTitle: o.property?.title ?? null,
      stageName: o.stage.name,
      stageKey: o.stage.key,
      amountLabel: cur(Number(o.amount)),
      commissionLabel: o.commissionAmount != null ? cur(Number(o.commissionAmount)) : null,
      probability: o.probability,
      assignedName: o.assignedMembership?.user.name ?? null,
      closeDateLabel: o.expectedCloseDate ? formatDayMonth(o.expectedCloseDate, locale) : null,
    }));
  } catch (error) {
    console.error("getPipelineRows failed, falling back to demo data:", error);
    return demoPipelineRows(ctx);
  }
}

export async function getOpportunityFormOptions(ctx: TenantContext): Promise<OpportunityFormOptions> {
  if (isDemoMode()) return DEMO_OPP_FORM_OPTIONS;
  try {
    const organizationId = ctx.organization.id;
    const [pipeline, contacts, properties, members] = await Promise.all([
      prisma.pipeline.findFirst({
        where: { organizationId, isDefault: true },
        include: { stages: { orderBy: { position: "asc" } } },
      }),
      prisma.contact.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { firstName: "asc" },
        take: 500,
        select: { id: true, firstName: true, lastName: true },
      }),
      prisma.property.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { title: "asc" },
        take: 500,
        select: { id: true, title: true },
      }),
      prisma.membership.findMany({
        where: { organizationId, status: "active" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return {
      pipelineId: pipeline?.id ?? "",
      stages: (pipeline?.stages ?? []).filter((s) => !s.isWon && !s.isLost).map((s) => ({ id: s.id, name: s.name })),
      contacts: contacts.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })),
      properties: properties.map((p) => ({ id: p.id, title: p.title })),
      members: members.map((m) => ({ id: m.id, name: m.user.name })),
      defaultCurrency: ctx.organization.defaultCurrency,
    };
  } catch (error) {
    console.error("getOpportunityFormOptions failed, falling back to demo data:", error);
    return DEMO_OPP_FORM_OPTIONS;
  }
}
