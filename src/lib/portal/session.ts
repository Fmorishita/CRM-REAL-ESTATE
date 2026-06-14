import "server-only";

import { cookies } from "next/headers";

import type { PortalAccount } from "@/modules/portal/accounts";

export const PORTAL_COOKIE = "portal_session";

export interface PortalSession {
  contactId: string;
  organizationId: string;
  portalType: PortalAccount["portalType"];
  name: string;
  email: string;
}

/**
 * Reads the portal session from a cookie. This is a lightweight, demo-grade
 * session; Supabase Auth for the customer portal replaces it in a later phase.
 */
export async function getPortalSession(): Promise<PortalSession | null> {
  const raw = (await cookies()).get(PORTAL_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PortalSession;
    if (!parsed.contactId || !parsed.organizationId || !parsed.portalType) return null;
    return parsed;
  } catch {
    return null;
  }
}
