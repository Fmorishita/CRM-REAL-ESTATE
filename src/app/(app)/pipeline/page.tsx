import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.pipeline.label };

export default function PipelinePage() {
  return <ModulePlaceholder moduleKey="pipeline" />;
}
