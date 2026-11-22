import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAuthEnabled } from "@/lib/auth/config";

import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nueva contraseña" };

export default function ResetPasswordPage() {
  if (!isAuthEnabled()) redirect("/dashboard");
  return <ResetPasswordForm />;
}
