import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { PropertyDetailView } from "@/modules/properties/components/property-detail";
import { getProperty, getPropertyFormOptions } from "@/modules/properties/server/queries";
import { getClientMatches } from "@/modules/matching/server/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getTenantContext();
  const property = await getProperty(ctx, id);
  return { title: property ? property.title : "Propiedad" };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();

  const [property, options] = await Promise.all([getProperty(ctx, id), getPropertyFormOptions(ctx)]);
  if (!property) notFound();

  const clientMatches = await getClientMatches(ctx, property.id);

  return (
    <PropertyDetailView
      property={property}
      options={options}
      defaultCurrency={ctx.organization.defaultCurrency}
      canManage={hasPermission(ctx, "properties.manage")}
      canPublish={hasPermission(ctx, "properties.publish")}
      clientMatches={clientMatches}
    />
  );
}
