import "server-only";

import { INTEGRATIONS } from "@/lib/integrations/registry";
import type { IntegrationView } from "@/modules/integrations/types";

/**
 * Resolves the live/mock status of every integration from the environment.
 * Status is derived purely from configured credentials — never invented — so the
 * settings UI honestly reflects what is actually connected.
 */
export function listIntegrations(): IntegrationView[] {
  return INTEGRATIONS.map((def) => {
    const missingEnv = def.requiredEnv.filter((key) => !process.env[key]?.trim());
    const connected = def.requiredEnv.length > 0 && missingEnv.length === 0;
    return {
      ...def,
      connected,
      mode: connected ? "live" : "mock",
      missingEnv,
    };
  });
}

export function integrationsSummary(views: IntegrationView[]): { connected: number; total: number } {
  return { connected: views.filter((v) => v.connected).length, total: views.length };
}
