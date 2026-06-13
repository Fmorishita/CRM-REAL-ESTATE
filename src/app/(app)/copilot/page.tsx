import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.copilot.label };

export default function CopilotPage() {
  return <ModulePlaceholder moduleKey="copilot" />;
}
