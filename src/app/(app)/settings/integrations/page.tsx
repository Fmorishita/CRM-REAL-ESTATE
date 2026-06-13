import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Plug,
  Webhook,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import type { IntegrationCategory } from "@/lib/integrations/registry";
import { integrationsSummary, listIntegrations } from "@/modules/integrations/server/queries";

export const metadata: Metadata = { title: "Integraciones" };

const CATEGORY_META: Record<IntegrationCategory, { label: string; icon: LucideIcon }> = {
  messaging: { label: "Mensajería", icon: MessageSquare },
  email: { label: "Correo", icon: Mail },
  calendar: { label: "Calendario", icon: CalendarClock },
  maps: { label: "Mapas y rutas", icon: MapPin },
  automation: { label: "Automatización", icon: Webhook },
};

const CATEGORY_ORDER: IntegrationCategory[] = ["messaging", "email", "calendar", "maps", "automation"];

export default async function IntegrationsPage() {
  const ctx = await getTenantContext();
  if (!hasPermission(ctx, "settings.manage")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Integraciones" description="Conecta tus canales y herramientas." />
        <p className="text-sm text-muted-foreground">No tienes permiso para administrar integraciones.</p>
      </div>
    );
  }

  const integrations = listIntegrations();
  const { connected, total } = integrationsSummary(integrations);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/settings">
          <ArrowLeft />
          Configuración
        </Link>
      </Button>

      <PageHeader
        title="Integraciones"
        description="Conecta WhatsApp, Meta, correo, calendario, mapas y webhooks. Cada integración funciona en modo demo hasta que agregues sus credenciales."
        actions={
          <Badge variant="secondary">
            {connected} de {total} conectadas
          </Badge>
        }
      />

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <Plug className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">Arquitectura por adaptadores</p>
          <p className="text-muted-foreground">
            Cada canal implementa una interfaz estable con un adaptador mock que ya funciona. El adaptador real se
            activa solo cuando configuras sus variables de entorno; nunca inventamos credenciales. Consulta{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/08-integrations.md</code> para los pasos.
          </p>
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = integrations.filter((integration) => integration.category === category);
        if (items.length === 0) return null;
        const meta = CATEGORY_META[category];
        return (
          <section key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <meta.icon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{meta.label}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((integration) => (
                <Card key={integration.id} className="gap-3">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-sm">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                      {integration.connected ? (
                        <Badge variant="outline" className="shrink-0 text-emerald-600 dark:text-emerald-400">
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">
                          Modo demo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {integration.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>

                    {!integration.connected && integration.missingEnv.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Variables por configurar</p>
                        <div className="flex flex-wrap gap-1.5">
                          {integration.missingEnv.map((key) => (
                            <code key={key} className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                              {key}
                            </code>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <a
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      Documentación del proveedor
                      <ExternalLink className="size-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
