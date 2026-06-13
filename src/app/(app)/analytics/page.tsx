import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.analytics.label };

export default function AnalyticsPage() {
  return <ModulePlaceholder moduleKey="analytics" />;
}
