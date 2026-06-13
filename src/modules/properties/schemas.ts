import { z } from "zod";

import { currencySchema, moneySchema, optionalString, requiredString } from "@/lib/validation/shared";

export const PROPERTY_TYPES = [
  "house",
  "apartment",
  "land",
  "office",
  "retail",
  "warehouse",
  "development",
  "presale",
  "vacation_rental",
  "rental",
] as const;

export const OPERATION_TYPES = ["sale", "rent", "presale"] as const;

export const PROPERTY_STATUSES = ["available", "reserved", "sold", "rented", "paused"] as const;

export const propertyTypeSchema = z.enum(PROPERTY_TYPES);
export const operationTypeSchema = z.enum(OPERATION_TYPES);
export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (usa minúsculas y guiones)");

export const createPropertySchema = z.object({
  title: requiredString("El título"),
  slug: slugSchema,
  description: optionalString,
  propertyType: propertyTypeSchema,
  operation: operationTypeSchema.default("sale"),
  status: propertyStatusSchema.default("available"),
  price: moneySchema,
  currency: currencySchema.default("MXN"),
  zone: optionalString,
  city: optionalString,
  state: optionalString,
  country: z.string().default("MX"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  parking: z.number().int().nonnegative().optional(),
  lotSizeM2: z.number().nonnegative().optional(),
  builtM2: z.number().nonnegative().optional(),
  amenities: z.array(z.string()).default([]),
  commissionPct: z.number().min(0).max(100).optional(),
  assignedMembershipId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
