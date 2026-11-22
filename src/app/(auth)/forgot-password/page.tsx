import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAuthEnabled } from "@/lib/auth/config";

import { ForgotPasswordForm } from "./forgot-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  if (!isAuthEnabled()) redirect("/dashboard");
  return <ForgotPasswordForm />;
}
