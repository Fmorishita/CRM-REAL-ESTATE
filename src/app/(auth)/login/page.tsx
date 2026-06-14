import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAuthEnabled } from "@/lib/auth/config";
import { getAuthUser } from "@/lib/auth/current-user";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Iniciar sesión" };

const ERROR_MESSAGES: Record<string, string> = {
  "no-access": "Tu cuenta no tiene acceso a ninguna organización. Contacta a tu administrador.",
  unavailable: "El servicio no está disponible temporalmente. Inténtalo más tarde.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // In demo mode there is no sign-in; the app is open with the demo tenant.
  if (!isAuthEnabled()) redirect("/dashboard");

  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;
  return <LoginForm initialError={error ? (ERROR_MESSAGES[error] ?? null) : null} />;
}
