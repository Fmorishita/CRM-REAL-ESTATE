"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isAuthEnabled } from "@/lib/auth/config";
import { clearAuthCookie, readAuthCookie, sessionToCookie, setAuthCookie } from "@/lib/auth/cookie";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { fail, type ActionResult } from "@/lib/result";
import { signInWithPassword, signOutGoTrue, signUpWithPassword } from "@/lib/supabase/gotrue";
import type { TenantContext } from "@/lib/auth/types";
import { activateInvitedMemberships, resolveTenantForEmail } from "@/modules/organizations/server/tenant";
import { provisionOrganization } from "@/modules/organizations/server/provisioning";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  orgName: z.string().trim().min(2, "Escribe el nombre de tu organización.").max(80),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
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
    // Accept any pending invitation for this email before resolving the tenant.
    await activateInvitedMemberships(email, session.user.id);
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

/**
 * Registers a new owner and provisions their organization. Creates the Supabase
 * Auth user, then the org + owner membership. If the project requires email
 * confirmation there is no session yet, so we send the user to the login screen
 * with a notice; otherwise we sign them straight in.
 */
export async function signUpAction(
  _prev: ActionResult<void> | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  if (!isAuthEnabled()) {
    return fail("El registro no está habilitado en este entorno (modo demo).");
  }

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    orgName: formData.get("orgName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
  }

  const email = parsed.data.email.trim().toLowerCase();

  const limit = rateLimit(await clientKey("app-signup"), 5, 60_000);
  if (!limit.allowed) {
    return fail(`Demasiados intentos. Espera ${limit.retryAfterSeconds}s e inténtalo de nuevo.`);
  }

  const signUp = await signUpWithPassword(email, parsed.data.password);
  if (!signUp || !signUp.user) {
    return fail("No se pudo crear la cuenta. Es posible que ese email ya esté registrado.");
  }

  try {
    await provisionOrganization({
      email,
      name: parsed.data.name,
      orgName: parsed.data.orgName,
      authId: signUp.user.id,
    });
  } catch (error) {
    console.error("provisionOrganization failed during sign-up:", error);
    return fail("No se pudo crear tu organización. Inténtalo más tarde.");
  }

  if (signUp.session) {
    await setAuthCookie(sessionToCookie(signUp.session));
    redirect("/dashboard");
  }

  // Email confirmation required: no session yet.
  redirect("/login?confirm=1");
}

export async function signOutAction(): Promise<void> {
  const session = await readAuthCookie();
  if (session) await signOutGoTrue(session.accessToken);
  await clearAuthCookie();
  redirect("/login");
}
