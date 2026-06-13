import type { IntegrationDefinition } from "@/lib/integrations/registry";

export interface IntegrationView extends IntegrationDefinition {
  /** True when every required env var is configured. */
  connected: boolean;
  mode: "live" | "mock";
  /** Required env vars that are still missing (empty when connected). */
  missingEnv: string[];
}
