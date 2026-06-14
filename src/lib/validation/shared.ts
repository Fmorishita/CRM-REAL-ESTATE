import { z } from "zod";

/** Reusable Zod primitives shared across module schemas. */

export const uuidSchema = z.string().uuid();

/** ISO 4217 currency code (3 uppercase letters). */
export const currencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Código de moneda inválido (ISO 4217)");

/** Monetary amount: non-negative, at most 2 decimals. */
export const moneySchema = z
  .number()
  .nonnegative("El monto no puede ser negativo")
  .multipleOf(0.01, "Máximo 2 decimales");

/** Loose international phone format; storage keeps the raw string. */
export const phoneSchema = z
  .string()
  .min(7)
  .max(25)
  .regex(/^[+\d][\d\s().-]+$/, "Teléfono inválido");

export const localeSchema = z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, "Locale inválido (ej. es-MX)");

export const emailSchema = z.string().email("Email inválido");

/** Trims and rejects empty strings; use for required text inputs. */
export const requiredString = (label = "Este campo") =>
  z.string().trim().min(1, `${label} es obligatorio`);

/** Optional text that normalizes "" to undefined. */
export const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();
