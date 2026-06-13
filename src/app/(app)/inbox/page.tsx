import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.inbox.label };

export default function InboxPage() {
  return <ModulePlaceholder moduleKey="inbox" />;
}
