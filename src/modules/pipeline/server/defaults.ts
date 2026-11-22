import "server-only";

import { prisma } from "@/lib/db/prisma";

/** Real-estate sales stages. Keys are shared with analytics (qualified+ funnel). */
export const DEFAULT_PIPELINE_STAGES = [
  { key: "new", name: "Nuevo lead", probability: 5, isWon: false, isLost: false },
  { key: "contacted", name: "Contactado", probability: 15, isWon: false, isLost: false },
  { key: "qualified", name: "Calificado", probability: 30, isWon: false, isLost: false },
  { key: "visit_scheduled", name: "Visita agendada", probability: 55, isWon: false, isLost: false },
  { key: "visit_done", name: "Visita realizada", probability: 65, isWon: false, isLost: false },
  { key: "negotiation", name: "Oferta / negociación", probability: 80, isWon: false, isLost: false },
  { key: "documentation", name: "Apartado / documentación", probability: 90, isWon: false, isLost: false },
  { key: "won", name: "Ganado", probability: 100, isWon: true, isLost: false },
  { key: "lost", name: "Perdido", probability: 0, isWon: false, isLost: true },
] as const;

/** Creates the organization's default sales pipeline once (idempotent). */
export async function ensureDefaultPipeline(organizationId: string) {
  const existing = await prisma.pipeline.findFirst({
    where: { organizationId, isDefault: true },
    include: { stages: { orderBy: { position: "asc" } } },
  });
  if (existing) return existing;
  return prisma.pipeline.create({
    data: {
      organizationId,
      name: "Ventas",
      isDefault: true,
      stages: { create: DEFAULT_PIPELINE_STAGES.map((s, position) => ({ ...s, position })) },
    },
    include: { stages: { orderBy: { position: "asc" } } },
  });
}
