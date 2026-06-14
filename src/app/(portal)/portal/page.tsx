import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPortalSession } from "@/lib/portal/session";
import { PortalView } from "@/modules/portal/components/portal-view";
import { getPortalData } from "@/modules/portal/server/queries";

export const metadata: Metadata = { title: "Mi portal" };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  const data = await getPortalData(session);
  return <PortalView data={data} />;
}
