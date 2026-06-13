import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { MODULES, type ModuleKey } from "@/config/modules";

/** Shell page shown while a module awaits its build phase. */
export function ModulePlaceholder({ moduleKey }: { moduleKey: ModuleKey }) {
  const moduleDef = MODULES[moduleKey];

  return (
    <div className="space-y-6">
      <PageHeader
        title={moduleDef.label}
        description={moduleDef.description}
        actions={<Badge variant="secondary">Fase {moduleDef.buildPhase}</Badge>}
      />
      <EmptyState
        icon={moduleDef.icon}
        title="Este módulo está en camino"
        description={`${moduleDef.label} se construye en la Fase ${moduleDef.buildPhase} del roadmap. La navegación, permisos y arquitectura ya están listos para recibirlo.`}
      />
    </div>
  );
}
