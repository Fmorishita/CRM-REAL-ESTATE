import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { ContactFormDialog } from "@/modules/contacts/components/contact-form-dialog";
import { ContactsKanban } from "@/modules/contacts/components/contacts-kanban";
import { ContactsTable } from "@/modules/contacts/components/contacts-table";
import { ContactsToolbar } from "@/modules/contacts/components/contacts-toolbar";
import { getContactFormOptions, listContacts } from "@/modules/contacts/server/queries";
import type { ContactFilters } from "@/modules/contacts/types";

export const metadata: Metadata = { title: MODULES.contacts.label };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function ContactsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ctx = await getTenantContext();

  const view = pick(params, "view") === "kanban" ? "kanban" : "table";
  const filters: ContactFilters = {
    search: pick(params, "search"),
    type: pick(params, "type"),
    stage: pick(params, "stage"),
    tag: pick(params, "tag"),
  };

  const [{ items, total }, options] = await Promise.all([
    listContacts(ctx, filters),
    getContactFormOptions(ctx),
  ]);

  const canCreate = hasPermission(ctx, "contacts.create");

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODULES.contacts.label}
        description={`${total} contacto${total === 1 ? "" : "s"} en ${ctx.organization.name}`}
        actions={
          <div className="flex items-center gap-2">
            {isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
            {canCreate ? <ContactFormDialog options={options} /> : null}
          </div>
        }
      />

      <Suspense fallback={null}>
        <ContactsToolbar view={view} tags={options.tags} />
      </Suspense>

      {view === "kanban" ? <ContactsKanban contacts={items} /> : <ContactsTable contacts={items} />}
    </div>
  );
}
