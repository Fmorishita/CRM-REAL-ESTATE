import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.automations.label };

export default function AutomationsPage() {
  return <ModulePlaceholder moduleKey="automations" />;
}
