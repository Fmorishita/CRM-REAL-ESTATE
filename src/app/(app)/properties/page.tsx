import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.properties.label };

export default function PropertiesPage() {
  return <ModulePlaceholder moduleKey="properties" />;
}
