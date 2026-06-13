import {
  BarChart3,
  Building2,
  CalendarClock,
  Columns3,
  Inbox,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/config/permissions";

export interface ModuleDefinition {
  key: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Permission required to see the module in navigation. Undefined = visible to all members. */
  permission?: Permission;
  /** Roadmap phase where the module gets its full functionality. */
  buildPhase: number;
}

export const MODULES = {
  dashboard: {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    description: "Tu centro de comando diario: qué hacer hoy para vender más.",
    icon: LayoutDashboard,
    buildPhase: 3,
  },
  inbox: {
    key: "inbox",
    href: "/inbox",
    label: "Inbox",
    description: "Todas tus conversaciones de WhatsApp, email y redes en un solo lugar.",
    icon: Inbox,
    permission: "conversations.view",
    buildPhase: 8,
  },
  contacts: {
    key: "contacts",
    href: "/contacts",
    label: "Contactos",
    description: "Compradores, vendedores e inversionistas con score y timeline unificado.",
    icon: Users,
    permission: "contacts.view",
    buildPhase: 4,
  },
  pipeline: {
    key: "pipeline",
    href: "/pipeline",
    label: "Pipeline",
    description: "Oportunidades por etapa, forecast y comisiones estimadas.",
    icon: Columns3,
    permission: "pipeline.view",
    buildPhase: 5,
  },
  properties: {
    key: "properties",
    href: "/properties",
    label: "Propiedades",
    description: "Tu inventario completo: casas, departamentos, terrenos y preventas.",
    icon: Building2,
    permission: "properties.view",
    buildPhase: 6,
  },
  visits: {
    key: "visits",
    href: "/visits",
    label: "Visitas",
    description: "Agenda de visitas con rutas inteligentes para tu día en campo.",
    icon: CalendarClock,
    permission: "visits.view",
    buildPhase: 11,
  },
  automations: {
    key: "automations",
    href: "/automations",
    label: "Automatizaciones",
    description: "Workflows que dan seguimiento por ti: triggers, condiciones y acciones.",
    icon: Workflow,
    permission: "automations.view",
    buildPhase: 12,
  },
  analytics: {
    key: "analytics",
    href: "/analytics",
    label: "Analytics",
    description: "Rendimiento por agente, fuente y propiedad. Decisiones con datos.",
    icon: BarChart3,
    permission: "analytics.view",
    buildPhase: 16,
  },
  copilot: {
    key: "copilot",
    href: "/copilot",
    label: "Copilot",
    description: "Tu asistente de IA: pregunta, analiza y ejecuta acciones con confirmación.",
    icon: Sparkles,
    permission: "copilot.use",
    buildPhase: 15,
  },
  settings: {
    key: "settings",
    href: "/settings",
    label: "Configuración",
    description: "Organización, equipo, roles, IA e integraciones.",
    icon: Settings,
    permission: "settings.manage",
    buildPhase: 2,
  },
} as const satisfies Record<string, ModuleDefinition>;

export type ModuleKey = keyof typeof MODULES;

export interface NavSection {
  label?: string;
  items: ModuleKey[];
}

/** Desktop sidebar structure. */
export const SIDEBAR_SECTIONS: NavSection[] = [
  { items: ["dashboard", "inbox", "contacts", "pipeline"] },
  { label: "Operación", items: ["properties", "visits", "automations"] },
  { label: "Inteligencia", items: ["analytics", "copilot"] },
];

/** Primary tabs of the mobile bottom navigation; the rest goes into the "Más" sheet. */
export const MOBILE_NAV_ITEMS: ModuleKey[] = ["dashboard", "inbox", "contacts", "visits"];

export const MOBILE_MORE_ITEMS: ModuleKey[] = [
  "pipeline",
  "properties",
  "automations",
  "analytics",
  "copilot",
  "settings",
];
