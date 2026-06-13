import { Building2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import {
  FloatingWhatsApp,
  LandingFooter,
  LandingHeader,
} from "@/modules/landing/components/landing-chrome";
import { LandingLeadForm } from "@/modules/landing/components/landing-lead-form";
import { PublicPropertyCardItem } from "@/modules/landing/components/public-property-card";
import type { PublicCompany } from "@/modules/landing/types";

export function CompanyLanding({ company }: { company: PublicCompany }) {
  const { brand } = company;
  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader brand={brand} />

      {/* Hero */}
      <section
        className="border-b border-border"
        style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})` }}
      >
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-white">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Building2 className="size-7" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{brand.name}</h1>
          {company.description ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/90">
              {company.description}
            </p>
          ) : null}
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {company.properties.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">Propiedades disponibles</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {company.properties.map((p) => (
                    <PublicPropertyCardItem key={p.slug} property={p} />
                  ))}
                </div>
              </section>
            ) : null}

            {company.agents.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">Nuestro equipo</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {company.agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs">{getInitials(agent.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.roleLabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <LandingLeadForm
              organizationId={brand.organizationId}
              accentColor={brand.accentColor}
              title="Contáctanos"
              defaultMessage="Hola, me gustaría recibir más información."
            />
          </div>
        </div>
      </main>

      <LandingFooter brand={brand} />
      <FloatingWhatsApp brand={brand} />
    </div>
  );
}
