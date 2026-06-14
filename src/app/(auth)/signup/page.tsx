import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAuthEnabled } from "@/lib/auth/config";
import { getAuthUser } from "@/lib/auth/current-user";

import { SignUpForm } from "./signup-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignUpPage() {
  if (!isAuthEnabled()) redirect("/dashboard");
  const user = await getAuthUser();
  if (user) redirect("/dashboard");
  return <SignUpForm />;
}
