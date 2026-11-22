import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LeadPulse } from "@/modules/leadops/server/pulse";

/** Dashboard strip: today's lead flow and what needs a human now. */
export function LeadPulseCard({ pulse }: { pulse: LeadPulse }) {
  const items = [
    { label: "Leads hoy", value: pulse.today, href: "/leads" },
    { label: "Últimos 7 días", value: pulse.week, href: "/leads" },
    { label: "Requieren humano", value: pulse.attention, href: "/inbox?lead=attention", alert: pulse.attention > 0 },
    { label: "Chats con ventana abierta", value: pulse.windowOpen, href: "/inbox?lead=window_open" },
    { label: "Sin asesor", value: pulse.unassigned, href: "/leads?f=unassigned", alert: pulse.unassigned > 0 },
  ];
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground shadow-sm dark:bg-card dark:text-card-foreground">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3 dark:border-border">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Megaphone className="size-4 text-gold" />
          Leads de WhatsApp, Instagram, Messenger y web
        </p>
        <Link href="/leads" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
          Ver leads <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 divide-white/10 sm:grid-cols-5 sm:divide-x dark:divide-border">
        {items.map((i) => (
          <Link key={i.label} href={i.href} className="px-5 py-4 transition-colors hover:bg-white/5 dark:hover:bg-muted/40">
            <p className={cn("font-heading text-3xl font-semibold tabular-nums", i.alert && "text-gold")}>{i.value}</p>
            <p className="text-xs opacity-70">{i.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
