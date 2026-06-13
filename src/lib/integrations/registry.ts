/**
 * Single source of truth for every external integration the product can speak
 * to. Pure data (no React, no server-only) so it can be imported anywhere — the
 * settings UI, docs generation, and the status resolver all read from here.
 *
 * Each integration ships a stable adapter interface with a working mock, and a
 * live implementation that activates only when its `requiredEnv` variables are
 * configured. Optional variables enhance the integration (e.g. webhook verify
 * tokens) but are not needed to go live.
 */

export type IntegrationCategory = "messaging" | "email" | "calendar" | "maps" | "automation";

export interface IntegrationDefinition {
  id: string;
  name: string;
  category: IntegrationCategory;
  /** One-line description shown in settings. */
  description: string;
  /** All of these must be set for the live adapter to activate. */
  requiredEnv: string[];
  /** Nice-to-have variables that unlock extra behaviour. */
  optionalEnv?: string[];
  /** Human-readable capabilities unlocked when connected. */
  capabilities: string[];
  /** Provider documentation for obtaining credentials. */
  docsUrl: string;
  /** Roadmap phase that introduced the adapter. */
  phase: number;
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "messaging",
    description: "Envía y recibe mensajes desde el Inbox con la WhatsApp Cloud API de Meta.",
    requiredEnv: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
    optionalEnv: ["WHATSAPP_BUSINESS_ACCOUNT_ID", "WHATSAPP_WEBHOOK_VERIFY_TOKEN"],
    capabilities: ["Mensajes salientes", "Plantillas aprobadas", "Webhooks de mensajes entrantes"],
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    phase: 19,
  },
  {
    id: "meta",
    name: "Instagram y Messenger",
    category: "messaging",
    description: "Responde DMs de Instagram y Facebook Messenger e ingiere Lead Ads vía Graph API.",
    requiredEnv: ["META_PAGE_ACCESS_TOKEN"],
    optionalEnv: ["META_APP_ID", "META_APP_SECRET"],
    capabilities: ["DMs de Instagram", "Facebook Messenger", "Ingesta de Lead Ads"],
    docsUrl: "https://developers.facebook.com/docs/messenger-platform",
    phase: 19,
  },
  {
    id: "email",
    name: "Correo (Gmail)",
    category: "email",
    description: "Envía correos transaccionales y de seguimiento desde la cuenta del agente.",
    requiredEnv: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "EMAIL_FROM"],
    optionalEnv: ["GMAIL_ACCESS_TOKEN"],
    capabilities: ["Correos salientes", "Hilos de conversación", "Firma del agente"],
    docsUrl: "https://developers.google.com/gmail/api/guides/sending",
    phase: 19,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "calendar",
    description: "Sincroniza visitas como eventos con recordatorios e invitados.",
    requiredEnv: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET"],
    optionalEnv: ["GOOGLE_CALENDAR_ACCESS_TOKEN"],
    capabilities: ["Crear eventos de visita", "Invitar al cliente", "Recordatorios automáticos"],
    docsUrl: "https://developers.google.com/calendar/api/guides/create-events",
    phase: 19,
  },
  {
    id: "google-maps",
    name: "Google Maps",
    category: "maps",
    description: "Geocodifica direcciones y optimiza rutas de visitas. Sin clave, usa el planificador mock.",
    requiredEnv: ["GOOGLE_MAPS_API_KEY"],
    capabilities: ["Geocoding de propiedades", "Distancias reales", "Optimización de rutas"],
    docsUrl: "https://developers.google.com/maps/documentation",
    phase: 19,
  },
  {
    id: "webhooks",
    name: "Webhooks salientes",
    category: "automation",
    description: "Emite eventos firmados con HMAC hacia Zapier, Make o n8n para automatizar flujos externos.",
    requiredEnv: ["WEBHOOK_SIGNING_SECRET"],
    capabilities: ["Eventos firmados (HMAC SHA-256)", "Zapier / Make / n8n", "Reintentos idempotentes"],
    docsUrl: "https://zapier.com/apps/webhook/integrations",
    phase: 19,
  },
];
