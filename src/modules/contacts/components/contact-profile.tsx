import Link from "next/link";
import { ArrowLeft, Building2, Mail, MessageCircle, Pencil, Phone } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/format";
import { ScoreBadge, StageBadge, TagChip } from "@/modules/contacts/components/contact-badges";
import { ContactFormDialog } from "@/modules/contacts/components/contact-form-dialog";
import { ContactNotes } from "@/modules/contacts/components/contact-notes";
import { ContactTimeline } from "@/modules/contacts/components/contact-timeline";
import type { ContactDetail, ContactFormOptions } from "@/modules/contacts/types";

function waLink(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

const URGENCY_LABELS: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta" };

export function ContactProfile({
  contact,
  options,
  canEdit,
}: {
  contact: ContactDetail;
  options: ContactFormOptions;
  canEdit: boolean;
}) {
  const wa = waLink(contact.whatsapp ?? contact.phone);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/contacts">
            <ArrowLeft />
            Contactos
          </Link>
        </Button>
        {canEdit ? (
          <ContactFormDialog
            options={options}
            initial={{
              id: contact.id,
              type: contact.type,
              firstName: contact.name.split(" ")[0] ?? contact.name,
              lastName: contact.name.split(" ").slice(1).join(" "),
              email: contact.email,
              phone: contact.phone,
              whatsapp: contact.whatsapp,
              stage: contact.stage,
            }}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil />
                Editar
              </Button>
            }
          />
        ) : null}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{contact.name}</h1>
              <Badge variant="secondary">{contact.typeLabel}</Badge>
              <StageBadge stage={contact.stage} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {contact.email ? <span>{contact.email}</span> : null}
              {contact.phone ? <span>{contact.phone}</span> : null}
            </div>
            {contact.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {contact.tags.map((t) => (
                  <TagChip key={t.id} name={t.name} color={t.color} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {wa ? (
            <Button asChild variant="outline" size="sm">
              <a href={wa} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                WhatsApp
              </a>
            </Button>
          ) : null}
          {contact.phone ? (
            <Button asChild variant="outline" size="icon-sm" aria-label="Llamar">
              <a href={`tel:${contact.phone}`}>
                <Phone />
              </a>
            </Button>
          ) : null}
          {contact.email ? (
            <Button asChild variant="outline" size="icon-sm" aria-label="Enviar email">
              <a href={`mailto:${contact.email}`}>
                <Mail />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: key data */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen comercial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Score">
                <ScoreBadge score={contact.score} />
              </Row>
              <Row label="Prob. de cierre">
                {contact.closeProbability != null ? `${contact.closeProbability}%` : "—"}
              </Row>
              <Row label="Agente">{contact.assignedName ?? "Sin asignar"}</Row>
              <Row label="Últ. contacto">{contact.lastContactLabel ?? "—"}</Row>
              <Row label="Próx. seguimiento">{contact.nextFollowUpLabel ?? "—"}</Row>
              <Row label="Oportunidades">{contact.openOpportunities}</Row>
              <Row label="Creado">{contact.createdAtLabel}</Row>
            </CardContent>
          </Card>

          {contact.preference ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferencias</CardTitle>
                <CardDescription>Lo que busca este cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Presupuesto">{contact.preference.budgetLabel ?? "—"}</Row>
                {contact.preference.zones.length > 0 ? (
                  <Row label="Zonas">{contact.preference.zones.join(", ")}</Row>
                ) : null}
                <Row label="Urgencia">{URGENCY_LABELS[contact.preference.urgency] ?? contact.preference.urgency}</Row>
                {contact.preference.purchaseReason ? (
                  <Row label="Motivo">{contact.preference.purchaseReason}</Row>
                ) : null}
                {contact.preference.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {contact.preference.amenities.map((a) => (
                      <Badge key={a} variant="secondary">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="timeline">
                <TabsList>
                  <TabsTrigger value="timeline">Actividad</TabsTrigger>
                  <TabsTrigger value="notes">Notas ({contact.notes.length})</TabsTrigger>
                  <TabsTrigger value="properties">Propiedades ({contact.properties.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="timeline" className="pt-4">
                  <ContactTimeline entries={contact.timeline} />
                </TabsContent>
                <TabsContent value="notes" className="pt-4">
                  <ContactNotes contactId={contact.id} notes={contact.notes} canEdit={canEdit} />
                </TabsContent>
                <TabsContent value="properties" className="pt-4">
                  {contact.properties.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Sin propiedades vinculadas.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {contact.properties.map((p) => (
                        <li
                          key={`${p.id}-${p.relation}`}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          <Building2 className="size-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.priceLabel}</p>
                          </div>
                          <Badge variant="outline">{p.relationLabel}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}
