import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { MODULES } from "@/config/modules";

export const metadata: Metadata = { title: MODULES.contacts.label };

export default function ContactsPage() {
  return <ModulePlaceholder moduleKey="contacts" />;
}
