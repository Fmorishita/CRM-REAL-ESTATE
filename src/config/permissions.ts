export const PERMISSIONS = [
  "contacts.view",
  "contacts.create",
  "contacts.edit",
  "contacts.delete",
  "pipeline.view",
  "pipeline.manage",
  "conversations.view",
  "conversations.reply",
  "properties.view",
  "properties.manage",
  "properties.publish",
  "visits.view",
  "visits.manage",
  "automations.view",
  "automations.manage",
  "analytics.view",
  "copilot.use",
  "ai.configure",
  "users.manage",
  "settings.manage",
  "data.export",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = [
  "super_admin",
  "owner",
  "admin",
  "broker",
  "team_leader",
  "agent",
  "assistant",
  "marketing",
  "viewer",
  "client",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  owner: "Owner",
  admin: "Admin",
  broker: "Broker",
  team_leader: "Team Leader",
  agent: "Agente",
  assistant: "Asistente",
  marketing: "Marketing",
  viewer: "Viewer",
  client: "Cliente",
};

const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];

const AGENT_PERMISSIONS: Permission[] = [
  "contacts.view",
  "contacts.create",
  "contacts.edit",
  "pipeline.view",
  "pipeline.manage",
  "conversations.view",
  "conversations.reply",
  "properties.view",
  "visits.view",
  "visits.manage",
  "copilot.use",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  broker: [...AGENT_PERMISSIONS, "properties.manage", "properties.publish", "analytics.view", "data.export"],
  team_leader: [...AGENT_PERMISSIONS, "contacts.delete", "automations.view", "analytics.view"],
  agent: AGENT_PERMISSIONS,
  assistant: [
    "contacts.view",
    "contacts.create",
    "conversations.view",
    "conversations.reply",
    "properties.view",
    "visits.view",
    "visits.manage",
  ],
  marketing: [
    "contacts.view",
    "properties.view",
    "properties.publish",
    "automations.view",
    "automations.manage",
    "analytics.view",
  ],
  viewer: ["contacts.view", "pipeline.view", "properties.view", "visits.view", "analytics.view"],
  client: [],
};
