import { z } from "zod";

import {
  currencySchema,
  emailSchema,
  optionalString,
  phoneSchema,
  requiredString,
} from "@/lib/validation/shared";

export const CONTACT_TYPES = [
  "buyer",
  "seller",
  "investor",
  "renter",
  "external_broker",
  "referrer",
  "developer",
] as const;

export const URGENCY_LEVELS = ["low", "medium", "high"] as const;

export const contactTypeSchema = z.enum(CONTACT_TYPES);
export const urgencySchema = z.enum(URGENCY_LEVELS);

export const contactPreferenceSchema = z
  .object({
    budgetMin: z.number().nonnegative().optional(),
    budgetMax: z.number().nonnegative().optional(),
    currency: currencySchema.default("MXN"),
    zones: z.array(z.string()).default([]),
    propertyTypes: z.array(z.string()).default([]),
    bedroomsMin: z.number().int().nonnegative().optional(),
    bathroomsMin: z.number().int().nonnegative().optional(),
    amenities: z.array(z.string()).default([]),
    purchaseReason: optionalString,
    urgency: urgencySchema.default("medium"),
  })
  .refine(
    (p) => p.budgetMin === undefined || p.budgetMax === undefined || p.budgetMax >= p.budgetMin,
    { message: "El presupuesto máximo debe ser mayor o igual al mínimo", path: ["budgetMax"] },
  );

export const createContactSchema = z.object({
  type: contactTypeSchema.default("buyer"),
  firstName: requiredString("El nombre"),
  lastName: requiredString("El apellido"),
  email: emailSchema.optional().or(z.literal("").transform(() => undefined)),
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  whatsapp: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  leadSourceId: z.string().uuid().optional(),
  stage: z.string().default("new"),
  assignedMembershipId: z.string().uuid().optional(),
  preference: contactPreferenceSchema.optional(),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
