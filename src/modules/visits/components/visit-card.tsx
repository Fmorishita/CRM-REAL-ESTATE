"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Loader2,
  MapPin,
  MoreVertical,
  Navigation,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { visitStatusLabel, visitStatusTone } from "@/config/visits";
import { cn } from "@/lib/utils";
import { addVisitFeedback, rescheduleVisit, setVisitStatus } from "@/modules/visits/server/actions";
import type { VisitView } from "@/modules/visits/types";

function mapsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function VisitCard({ visit, canManage, order }: { visit: VisitView; canManage: boolean; order?: number }) {
  const router = useRouter();
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [followUp, setFollowUp] = React.useState(true);
  const [when, setWhen] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function changeStatus(status: string) {
    const result = await setVisitStatus({ visitId: visit.id, status });
    if (result.ok) {
      toast.success(`Visita marcada como "${visitStatusLabel(status)}".`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onFeedback() {
    if (!feedback.trim()) return;
    setPending(true);
    const result = await addVisitFeedback({ visitId: visit.id, feedback, createFollowUp: followUp });
    setPending(false);
    if (result.ok) {
      setFeedbackOpen(false);
      setFeedback("");
      toast.success("Feedback guardado.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onReschedule() {
    if (!when) return;
    setPending(true);
    const result = await rescheduleVisit({ visitId: visit.id, scheduledAt: when });
    setPending(false);
    if (result.ok) {
      setRescheduleOpen(false);
      toast.success("Visita reagendada.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex w-16 shrink-0 flex-col items-center rounded-lg border border-border bg-muted/40 px-1 py-2 text-center">
        {order != null ? (
          <span className="mb-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {order}
          </span>
        ) : null}
        <span className="text-sm font-semibold text-foreground">{visit.timeLabel}</span>
        <span className="text-[10px] text-muted-foreground">{visit.durationMin} min</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/contacts/${visit.contactId}`} className="text-sm font-medium text-foreground hover:underline">
              {visit.contactName}
            </Link>
            <Link
              href={`/properties/${visit.propertyId}`}
              className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:underline"
            >
              <Building2 className="size-3 shrink-0" />
              {visit.propertyTitle}
            </Link>
          </div>
          <Badge variant="outline" className={cn("shrink-0", visitStatusTone(visit.status))}>
            {visitStatusLabel(visit.status)}
          </Badge>
        </div>

        {visit.locationLabel ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {visit.locationLabel}
          </p>
        ) : null}
        {visit.feedback ? (
          <p className="mt-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Feedback:</span> {visit.feedback}
          </p>
        ) : visit.notes ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">{visit.notes}</p>
        ) : null}

        <div className="mt-2 flex items-center gap-1.5">
          {visit.mapsQuery ? (
            <Button asChild variant="outline" size="xs">
              <a href={mapsUrl(visit.mapsQuery)} target="_blank" rel="noopener noreferrer">
                <Navigation />
                Ruta
              </a>
            </Button>
          ) : null}
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Acciones de la visita">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => changeStatus("confirmed")}>
                  <Check />
                  Confirmar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeStatus("en_route")}>
                  <Navigation />
                  En camino
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                  <Check />
                  Marcar realizada + feedback
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
                  <CalendarClock />
                  Reagendar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => changeStatus("no_show")}>No asistió</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeStatus("cancelled")}>Cancelar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {/* Feedback dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback de la visita</DialogTitle>
            <DialogDescription>Marca la visita como realizada y registra el resultado.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="¿Cómo estuvo la visita? Interés del cliente, objeciones, próximos pasos…"
            rows={4}
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} className="size-4" />
            Crear tarea de seguimiento (en 2 días)
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onFeedback} disabled={pending || !feedback.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar visita</DialogTitle>
            <DialogDescription>Elige la nueva fecha y hora.</DialogDescription>
          </DialogHeader>
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onReschedule} disabled={pending || !when}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Reagendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
