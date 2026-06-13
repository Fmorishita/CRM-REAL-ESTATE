import type { Channel } from "@prisma/client";

import type {
  ChatMessage,
  ConversationDetail,
  ConversationListItem,
  InboxData,
  InboxFilters,
  InboxOptions,
} from "@/modules/inbox/types";

interface DemoConversation {
  id: string;
  channel: Channel;
  contactId: string;
  contactName: string;
  contactPhone: string;
  status: string;
  priority: "low" | "normal" | "high";
  assignedName: string | null;
  assignedMembershipId: string | null;
  lastLabel: string;
  unread: number;
  aiSummary: string;
  aiIntent: string;
  aiSentiment: string;
  messages: { dir: "inbound" | "outbound"; author: "contact" | "member"; body: string; time: string }[];
}

const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "b9000000-0000-4000-8000-000000000001",
    channel: "whatsapp",
    contactId: "d4000000-0000-4000-8000-000000000002",
    contactName: "Patricia Núñez",
    contactPhone: "+52 55 300 0002",
    status: "needs_attention",
    priority: "high",
    assignedName: "Mariana López",
    assignedMembershipId: "bb24edb0-8464-432a-bb71-8c6a3c69cdce",
    lastLabel: "hace 20 minutos",
    unread: 2,
    aiSummary: "Cliente inversionista pregunta por enganche y fecha de entrega de la preventa en Tijuana.",
    aiIntent: "alta_intencion_compra",
    aiSentiment: "positive",
    messages: [
      { dir: "inbound", author: "contact", body: "Hola, vi la preventa de Torre Altitude. ¿Cuál es el enganche y cuándo entregan?", time: "hace 40 min" },
      { dir: "outbound", author: "member", body: "¡Hola Patricia! El enganche es del 20% y la entrega está programada para junio 2027. ¿Le comparto el brochure?", time: "hace 35 min" },
      { dir: "inbound", author: "contact", body: "Sí por favor, y también las formas de pago disponibles.", time: "hace 20 min" },
    ],
  },
  {
    id: "b9000000-0000-4000-8000-000000000002",
    channel: "whatsapp",
    contactId: "d4000000-0000-4000-8000-000000000001",
    contactName: "Roberto Gómez",
    contactPhone: "+52 646 300 0001",
    status: "open",
    priority: "normal",
    assignedName: "Carlos Mendoza",
    assignedMembershipId: "ecc9315a-fdd8-414d-8766-487b0c7f7387",
    lastLabel: "hace 1 día",
    unread: 0,
    aiSummary: "Cliente interesado en casa de Ensenada, solicitó más fotos del interior.",
    aiIntent: "solicitud_informacion",
    aiSentiment: "neutral",
    messages: [
      { dir: "inbound", author: "contact", body: "Me encantó la casa de Ensenada. ¿Tienen más fotos del interior y la cocina?", time: "hace 1 día" },
    ],
  },
  {
    id: "b9000000-0000-4000-8000-000000000003",
    channel: "email",
    contactId: "d4000000-0000-4000-8000-000000000003",
    contactName: "Luis Fernández",
    contactPhone: "+52 664 300 0003",
    status: "waiting_customer",
    priority: "normal",
    assignedName: "Mariana López",
    assignedMembershipId: "bb24edb0-8464-432a-bb71-8c6a3c69cdce",
    lastLabel: "hace 5 horas",
    unread: 0,
    aiSummary: "Se envió confirmación de visita al departamento de Polanco para el viernes.",
    aiIntent: "agendar_visita",
    aiSentiment: "positive",
    messages: [
      { dir: "inbound", author: "contact", body: "Buenas, me interesa agendar una visita al depto de Polanco.", time: "hace 6 horas" },
      { dir: "outbound", author: "member", body: "Hola Luis, confirmamos tu visita al depto de Polanco el viernes a las 5pm. ¿Te queda bien?", time: "hace 5 horas" },
    ],
  },
  {
    id: "b9000000-0000-4000-8000-000000000004",
    channel: "webchat",
    contactId: "d4000000-0000-4000-8000-000000000010",
    contactName: "Fernanda Aguirre",
    contactPhone: "+52 81 300 0010",
    status: "new",
    priority: "normal",
    assignedName: null,
    assignedMembershipId: null,
    lastLabel: "hace 2 horas",
    unread: 1,
    aiSummary: "Nuevo lead del sitio interesado en desarrollo en Monterrey.",
    aiIntent: "solicitud_informacion",
    aiSentiment: "neutral",
    messages: [
      { dir: "inbound", author: "contact", body: "Hola, vi el desarrollo de Cumbres. ¿Tienen disponibilidad de 3 recámaras?", time: "hace 2 horas" },
    ],
  },
];

function toListItem(c: DemoConversation): ConversationListItem {
  const last = c.messages[c.messages.length - 1];
  return {
    id: c.id,
    channel: c.channel,
    contactId: c.contactId,
    contactName: c.contactName,
    status: c.status,
    priority: c.priority,
    snippet: last?.body ?? c.aiSummary,
    lastMessageLabel: c.lastLabel,
    unreadCount: c.unread,
    assignedName: c.assignedName,
  };
}

export function demoInboxData(filters: InboxFilters = {}): InboxData {
  let items = DEMO_CONVERSATIONS.map(toListItem);
  if (filters.channel) items = items.filter((c) => c.channel === filters.channel);
  if (filters.status) items = items.filter((c) => c.status === filters.status);
  if (filters.unassigned) items = items.filter((c) => c.assignedName === null);
  return {
    conversations: items,
    counts: {
      all: DEMO_CONVERSATIONS.length,
      unassigned: DEMO_CONVERSATIONS.filter((c) => c.assignedName === null).length,
      needsAttention: DEMO_CONVERSATIONS.filter((c) => c.status === "needs_attention").length,
    },
  };
}

export function demoConversationDetail(id: string): ConversationDetail | null {
  const c = DEMO_CONVERSATIONS.find((x) => x.id === id);
  if (!c) return null;
  const messages: ChatMessage[] = c.messages.map((m, i) => ({
    id: `${c.id}-m${i}`,
    direction: m.dir,
    authorType: m.author,
    authorName: m.author === "member" ? c.assignedName : c.contactName,
    body: m.body,
    timeLabel: m.time,
    status: "delivered",
  }));
  return {
    id: c.id,
    channel: c.channel,
    contactId: c.contactId,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    status: c.status,
    priority: c.priority,
    assignedMembershipId: c.assignedMembershipId,
    assignedName: c.assignedName,
    aiSummary: c.aiSummary,
    aiIntent: c.aiIntent,
    aiSentiment: c.aiSentiment,
    messages,
    internalNotes: [],
  };
}

export function demoFirstConversationId(): string {
  return DEMO_CONVERSATIONS[0]!.id;
}

export const DEFAULT_QUICK_REPLIES = [
  { id: "qr-1", title: "Saludo", body: "¡Hola! Gracias por tu interés. ¿En qué puedo ayudarte hoy?" },
  { id: "qr-2", title: "Agendar visita", body: "Con gusto agendamos una visita. ¿Qué día y horario te queda mejor?" },
  { id: "qr-3", title: "Enviar info", body: "Te comparto la información de la propiedad. ¿Tienes alguna pregunta específica?" },
  { id: "qr-4", title: "Seguimiento", body: "Hola, ¿pudiste revisar la información que te envié? Quedo atento a tus comentarios." },
];

export const DEMO_INBOX_OPTIONS: InboxOptions = {
  members: [
    { id: "m-carlos", name: "Carlos Mendoza" },
    { id: "m-mariana", name: "Mariana López" },
    { id: "m-sofia", name: "Sofía Hernández" },
  ],
  quickReplies: DEFAULT_QUICK_REPLIES,
  properties: [
    { id: "b2000000-0000-4000-8000-000000000004", title: "Preventa Torre Altitude Tijuana", priceLabel: "$4,750,000" },
    { id: "b2000000-0000-4000-8000-000000000001", title: "Casa frente al mar en Ensenada", priceLabel: "$12,500,000" },
    { id: "b2000000-0000-4000-8000-000000000002", title: "Departamento en Polanco CDMX", priceLabel: "$8,900,000" },
  ],
};
