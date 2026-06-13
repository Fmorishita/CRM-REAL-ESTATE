import "server-only";

/**
 * Returns true only when every named environment variable is present and
 * non-empty. Adapters use this to decide whether to activate their live
 * implementation or fall back to the mock one. Credentials are never invented:
 * a missing variable always means "stay in mock/demo mode".
 */
export function hasEnv(...keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export type IntegrationMode = "live" | "mock";

/** Convenience: the mode an integration resolves to given its required vars. */
export function integrationMode(...keys: string[]): IntegrationMode {
  return hasEnv(...keys) ? "live" : "mock";
}
