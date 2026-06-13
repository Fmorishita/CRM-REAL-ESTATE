import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { ContactProfile } from "@/modules/contacts/components/contact-profile";
import { getContact, getContactFormOptions } from "@/modules/contacts/server/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getTenantContext();
  const contact = await getContact(ctx, id);
  return { title: contact ? contact.name : "Contacto" };
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();

  const [contact, options] = await Promise.all([getContact(ctx, id), getContactFormOptions(ctx)]);
  if (!contact) notFound();

  return <ContactProfile contact={contact} options={options} canEdit={hasPermission(ctx, "contacts.edit")} />;
}
