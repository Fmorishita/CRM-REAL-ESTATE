import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { PropertiesGrid } from "@/modules/properties/components/properties-grid";
import { PropertiesTable } from "@/modules/properties/components/properties-table";
import { PropertiesToolbar } from "@/modules/properties/components/properties-toolbar";
import { PropertyFormDialog } from "@/modules/properties/components/property-form-dialog";
import { getPropertyFormOptions, listProperties } from "@/modules/properties/server/queries";
import type { PropertyFilters } from "@/modules/properties/types";

export const metadata: Metadata = { title: MODULES.properties.label };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ctx = await getTenantContext();

  const view = pick(params, "view") === "table" ? "table" : "grid";
  const filters: PropertyFilters = {
    search: pick(params, "search"),
    type: pick(params, "type"),
    status: pick(params, "status"),
    operation: pick(params, "operation"),
  };

  const [{ items, total }, options] = await Promise.all([
    listProperties(ctx, filters),
    getPropertyFormOptions(ctx),
  ]);

  const canManage = hasPermission(ctx, "properties.manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODULES.properties.label}
        description={`${total} propiedad${total === 1 ? "" : "es"} en tu inventario`}
        actions={
          <div className="flex items-center gap-2">
            {isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
            {canManage ? (
              <PropertyFormDialog options={options} defaultCurrency={ctx.organization.defaultCurrency} />
            ) : null}
          </div>
        }
      />

      <Suspense fallback={null}>
        <PropertiesToolbar view={view} />
      </Suspense>

      {view === "table" ? <PropertiesTable properties={items} /> : <PropertiesGrid properties={items} />}
    </div>
  );
}
