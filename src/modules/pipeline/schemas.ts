import { z } from "zod";

import { currencySchema, moneySchema, requiredString } from "@/lib/validation/shared";

export const createOpportunitySchema = z.object({
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  contactId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  title: requiredString("El título"),
  amount: moneySchema,
  currency: currencySchema.default("MXN"),
  commissionAmount: moneySchema.optional(),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: z.coerce.date().optional(),
  assignedMembershipId: z.string().uuid().optional(),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export const moveOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  stageId: z.string().uuid(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type MoveOpportunityInput = z.infer<typeof moveOpportunitySchema>;
