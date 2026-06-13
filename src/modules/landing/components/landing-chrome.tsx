import Link from "next/link";
import { Building2, MessageCircle } from "lucide-react";

import type { LandingBrand } from "@/modules/landing/types";

function waLink(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

export function LandingHeader({ brand }: { brand: LandingBrand }) {
  const wa = waLink(brand.whatsapp);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={`/company/${brand.slug}`} className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Building2 className="size-4" />
          </span>
          <span className="font-semibold tracking-tight text-foreground">{brand.name}</span>
        </Link>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: brand.accentColor }}
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        ) : null}
      </div>
    </header>
  );
}

export function LandingFooter({ brand }: { brand: LandingBrand }) {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center">
        <span className="font-semibold text-foreground">{brand.name}</span>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {brand.name}. Todos los derechos reservados.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Powered by Realtor Pro CRM
        </p>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp({ brand, message }: { brand: LandingBrand; message?: string }) {
  const wa = waLink(brand.whatsapp);
  if (!wa) return null;
  const href = message ? `${wa}?text=${encodeURIComponent(message)}` : wa;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
