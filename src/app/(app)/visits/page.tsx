import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.visits.label };

export default function VisitsPage() {
  return <ModulePlaceholder moduleKey="visits" />;
}
