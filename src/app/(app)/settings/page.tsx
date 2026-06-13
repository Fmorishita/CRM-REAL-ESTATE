import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Palette, Plug, ScrollText, Users } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/config/modules";
import { ROLE_LABELS } from "@/config/permissions";
import { getTenantContext } from "@/lib/auth/session";
import type { DemoTeamMember } from "@/lib/demo/session";
import { listTeam } from "@/modules/organizations/server/team";

export const metadata: Metadata = { title: MODULES.settings.label };

const teamColumns: DataTableColumn<DemoTeamMember>[] = [
  {
    key: "name",
    header: "Nombre",
    cell: (member) => <span className="font-medium text-foreground">{member.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    cell: (member) => <span className="text-muted-foreground">{member.email}</span>,
  },
  {
    key: "role",
    header: "Rol",
    cell: (member) => <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>,
  },
  {
    key: "status",
    header: "Estado",
    cell: (member) =>
      member.status === "active" ? (
        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
          Activo
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          Invitado
        </Badge>
      ),
  },
];

const upcomingSections = [
  {
    key: "integrations",
    icon: Plug,
    title: "Integraciones",
    description: "WhatsApp Business, Meta, Gmail, Google Calendar y Maps.",
    phase: 19,
  },
  {
    key: "branding",
    icon: Palette,
    title: "Branding",
    description: "Logo, colores y dominio de tus landing pages.",
    phase: 7,
  },
] as const;

export default async function SettingsPage() {
  const ctx = await getTenantContext();
  const org = ctx.organization;
  const team = await listTeam(org.id);

  const orgFacts = [
    { label: "Nombre", value: org.name },
    { label: "Plan", value: org.plan.charAt(0).toUpperCase() + org.plan.slice(1) },
    { label: "País", value: org.country },
    { label: "Moneda", value: org.defaultCurrency },
    { label: "Idioma", value: org.defaultLocale },
    { label: "Zona horaria", value: org.timezone },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={MODULES.settings.label} description={MODULES.settings.description} />

      <Card>
        <CardHeader>
          <CardTitle>Organización</CardTitle>
          <CardDescription>
            Datos generales del tenant. Editables cuando llegue la base de datos en Fase 2.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {orgFacts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-medium text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Equipo</h2>
          <Badge variant="secondary">{team.length} miembros</Badge>
        </div>
        <DataTable columns={teamColumns} data={team} getRowId={(member) => member.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/settings/ai">
          <Card className="h-full gap-2 transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="size-4 text-muted-foreground" />
                Inteligencia artificial
              </CardTitle>
              <CardDescription>Proveedor y modelo de IA por tarea, costos y aprobaciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
                Configurar
              </Badge>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/audit">
          <Card className="h-full gap-2 transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ScrollText className="size-4 text-muted-foreground" />
                Auditoría y seguridad
              </CardTitle>
              <CardDescription>Registro de acciones sensibles y aislamiento por organización.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
                Ver registro
              </Badge>
            </CardContent>
          </Card>
        </Link>
        {upcomingSections.map((section) => (
          <Card key={section.key} className="gap-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <section.icon className="size-4 text-muted-foreground" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Fase {section.phase}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
