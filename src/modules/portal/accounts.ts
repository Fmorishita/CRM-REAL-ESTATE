export type PortalType = "buyer" | "seller" | "investor";

export interface PortalAccount {
  email: string;
  contactId: string;
  name: string;
  portalType: PortalType;
  organizationId: string;
}

/** Demo portal accounts, mirroring the seeded client_portal_accounts. */
export const DEMO_PORTAL_ACCOUNTS: PortalAccount[] = [
  { email: "roberto.gomez@gmail.com", contactId: "d4000000-0000-4000-8000-000000000001", name: "Roberto Gómez", portalType: "buyer", organizationId: "14ffd897-81d1-409e-9f50-c96a416e0d26" },
  { email: "carmen.ruiz@gmail.com", contactId: "d4000000-0000-4000-8000-000000000008", name: "Carmen Ruiz", portalType: "seller", organizationId: "14ffd897-81d1-409e-9f50-c96a416e0d26" },
  { email: "eduardo.v@empresa.mx", contactId: "d4000000-0000-4000-8000-000000000005", name: "Eduardo Villarreal", portalType: "investor", organizationId: "14ffd897-81d1-409e-9f50-c96a416e0d26" },
];
