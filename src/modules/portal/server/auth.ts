"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { PORTAL_COOKIE, type PortalSession } from "@/lib/portal/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { DEMO_PORTAL_ACCOUNTS, type PortalType } from "@/modules/portal/accounts";

const loginSchema = z.object({ email: z.string().email() });

/**
 * Demo-grade portal login: matches the email against a client portal account and
 * stores a session cookie. Real Supabase Auth (magic link / OTP) replaces this
 * in a later phase.
 */
export async function portalLogin(input: unknown): Promise<ActionResult<void>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail("Ingresa un email válido.");
  const email = parsed.data.email.trim().toLowerCase();

  let session: PortalSession | null = null;

  if (isDemoMode()) {
    const account = DEMO_PORTAL_ACCOUNTS.find((a) => a.email === email);
    if (account) {
      session = {
        contactId: account.contactId,
        organizationId: account.organizationId,
        portalType: account.portalType,
        name: account.name,
        email: account.email,
      };
    }
  } else {
    try {
      const account = await prisma.clientPortalAccount.findFirst({
        where: { email, status: "active" },
        include: { contact: true },
      });
      if (account) {
        session = {
          contactId: account.contactId,
          organizationId: account.organizationId,
          portalType: account.portalType as PortalType,
          name: `${account.contact.firstName} ${account.contact.lastName}`,
          email: account.email,
        };
        await prisma.clientPortalAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
      }
    } catch (error) {
      console.error("portalLogin failed:", error);
      return fail("No se pudo iniciar sesión. Inténtalo de nuevo.");
    }
  }

  if (!session) return fail("No encontramos un portal asociado a ese email. Contacta a tu asesor.");

  (await cookies()).set(PORTAL_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return ok(undefined);
}

export async function portalLogout(): Promise<void> {
  (await cookies()).delete(PORTAL_COOKIE);
  redirect("/portal/login");
}
