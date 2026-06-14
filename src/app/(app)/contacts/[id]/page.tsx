import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { ContactProfile } from "@/modules/contacts/components/contact-profile";
import { getContact, getContactFormOptions } from "@/modules/contacts/server/queries";
import { getPropertyMatches } from "@/modules/matching/server/queries";
import { getContactIntelligence } from "@/modules/intelligence/server/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getTenantContext();
  const contact = await getContact(ctx, id);
  return { title: contact ? contact.name : "Contacto" };
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();

  const [contact, options, matches, intelligence] = await Promise.all([
    getContact(ctx, id),
    getContactFormOptions(ctx),
    getPropertyMatches(ctx, id),
    getContactIntelligence(ctx, id),
  ]);
  if (!contact) notFound();

  return (
    <ContactProfile
      contact={contact}
      options={options}
      canEdit={hasPermission(ctx, "contacts.edit")}
      matches={matches}
      intelligence={intelligence}
    />
  );
}
