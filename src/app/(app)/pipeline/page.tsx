import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { OpportunityFormDialog } from "@/modules/pipeline/components/opportunity-form-dialog";
import { PipelineBoard } from "@/modules/pipeline/components/pipeline-board";
import { PipelineStats } from "@/modules/pipeline/components/pipeline-stats";
import { PipelineTable } from "@/modules/pipeline/components/pipeline-table";
import { PipelineToolbar } from "@/modules/pipeline/components/pipeline-toolbar";
import {
  getOpportunityFormOptions,
  getPipelineBoard,
  getPipelineRows,
} from "@/modules/pipeline/server/queries";
import type { OpportunityFilters } from "@/modules/pipeline/types";

export const metadata: Metadata = { title: MODULES.pipeline.label };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function PipelinePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ctx = await getTenantContext();

  const view = pick(params, "view") === "table" ? "table" : "board";
  const filters: OpportunityFilters = { assignedMembershipId: pick(params, "agent") };

  const [board, options] = await Promise.all([
    getPipelineBoard(ctx, filters),
    getOpportunityFormOptions(ctx),
  ]);
  const rows = view === "table" ? await getPipelineRows(ctx, filters) : [];

  const canManage = hasPermission(ctx, "pipeline.manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODULES.pipeline.label}
        description="Tus oportunidades por etapa, con forecast y comisiones."
        actions={
          <div className="flex items-center gap-2">
            {isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
            {canManage ? <OpportunityFormDialog options={options} /> : null}
          </div>
        }
      />

      <PipelineStats summary={board.summary} locale={board.locale} />

      <Suspense fallback={null}>
        <PipelineToolbar view={view} members={options.members} />
      </Suspense>

      {view === "table" ? (
        <PipelineTable rows={rows} />
      ) : (
        <PipelineBoard columns={board.columns} persist={!isDemoMode() && canManage} />
      )}
    </div>
  );
}
