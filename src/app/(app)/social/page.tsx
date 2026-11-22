import type { Metadata } from "next";
import { AlertCircle, CalendarClock, ExternalLink } from "lucide-react";
import { ChannelIcon } from "@/modules/dashboard/components/channel-badge";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { listRecentPosts, socialConfig } from "@/lib/social/meta";
import { SocialComposer } from "@/modules/social/components/composer";

export const metadata: Metadata = { title: MODULES.social.label };

export default async function SocialPage() {
  const ctx = await getTenantContext();
  if (!hasPermission(ctx, "properties.publish")) {
    return <p className="text-sm text-muted-foreground">No tienes permiso para publicar en redes.</p>;
  }
  const cfg = socialConfig();
  const { posts, error } = await listRecentPosts();
  const locale = ctx.organization.defaultLocale;
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: ctx.organization.timezone }).format(new Date(iso));

  return (
    <div className="space-y-6">
      <PageHeader title={MODULES.social.label} description={MODULES.social.description} />

      {!cfg.connected ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Falta conectar la página de Facebook</p>
            <p className="text-muted-foreground">
              Se necesita un token de página con permisos para publicar en Facebook e Instagram. En cuanto esté, aquí aparecerán tus publicaciones.
            </p>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Nueva publicación</CardTitle>
            <CardDescription>Se publica directo en las cuentas de la marca.</CardDescription>
          </CardHeader>
          <CardContent>
            <SocialComposer connected={cfg.connected} hasInstagram={Boolean(cfg.igUserId)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Publicaciones recientes</CardTitle>
            <CardDescription>Leídas de Meta en tiempo real.</CardDescription>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Sin publicaciones" description="Cuando conectes la página, aquí verás lo publicado y lo programado." />
            ) : (
              <ul className="divide-y divide-border">
                {posts.map((p) => (
                  <li key={`${p.network}:${p.id}`} className="flex gap-3 py-3">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="size-16 shrink-0 rounded-md border border-border object-cover" />
                    ) : (
                      <div className="size-16 shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {p.network === "facebook" ? <ChannelIcon channel="facebook" /> : <ChannelIcon channel="instagram" />}
                        {fmt(p.publishedAt)}
                        {p.scheduled ? <Badge variant="secondary">Programada</Badge> : null}
                      </div>
                      <p className="line-clamp-2 text-sm">{p.text || "(sin texto)"}</p>
                      {p.permalink ? (
                        <a href={p.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          Ver en {p.network === "facebook" ? "Facebook" : "Instagram"} <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
