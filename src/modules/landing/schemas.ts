import { z } from "zod";

import { emailSchema, optionalString, phoneSchema, requiredString } from "@/lib/validation/shared";

/** Public lead-capture form on landing pages. */
export const landingLeadSchema = z.object({
  // Identifies the listing/company; the org is resolved server-side from this.
  propertyId: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  name: requiredString("El nombre"),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("").transform(() => undefined)),
  message: optionalString,
  // Attribution captured from the URL.
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

export type LandingLeadInput = z.infer<typeof landingLeadSchema>;
