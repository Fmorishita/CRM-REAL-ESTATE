"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isAuthEnabled } from "@/lib/auth/config";
import { clearAuthCookie, readAuthCookie, sessionToCookie, setAuthCookie } from "@/lib/auth/cookie";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { fail, type ActionResult } from "@/lib/result";
import { signInWithPassword, signOutGoTrue } from "@/lib/supabase/gotrue";
import type { TenantContext } from "@/lib/auth/types";
import { resolveTenantForEmail } from "@/modules/organizations/server/tenant";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Signs in against Supabase Auth, then requires the account to map to an active
 * membership in this app. Without a membership we sign the Supabase session back
 * out so a valid auth user with no access can't hold a half-open session.
 */
export async function signInAction(
  _prev: ActionResult<void> | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  if (!isAuthEnabled()) {
    return fail("La autenticación no está habilitada en este entorno (modo demo).");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail("Ingresa un email y una contraseña válidos.");

  const email = parsed.data.email.trim().toLowerCase();

  const limit = rateLimit(await clientKey("app-login"), 10, 60_000);
  if (!limit.allowed) {
    return fail(`Demasiados intentos. Espera ${limit.retryAfterSeconds}s e inténtalo de nuevo.`);
  }

  const session = await signInWithPassword(email, parsed.data.password);
  if (!session) return fail("Email o contraseña incorrectos.");

  let ctx: TenantContext | null = null;
  try {
    ctx = await resolveTenantForEmail(email);
  } catch (error) {
    console.error("resolveTenantForEmail failed during sign-in:", error);
    await signOutGoTrue(session.accessToken);
    return fail("No se pudo iniciar sesión. Inténtalo más tarde.");
  }

  if (!ctx) {
    await signOutGoTrue(session.accessToken);
    return fail("Tu cuenta no tiene acceso a ninguna organización. Contacta a tu administrador.");
  }

  await setAuthCookie(sessionToCookie(session));
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const session = await readAuthCookie();
  if (session) await signOutGoTrue(session.accessToken);
  await clearAuthCookie();
  redirect("/login");
}
