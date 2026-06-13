import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyLanding } from "@/modules/landing/components/property-landing";
import { getPublicProperty } from "@/modules/landing/server/public-queries";

// Public listing data is per-request; render on demand.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublicProperty(slug);
  if (!property) return { title: "Propiedad no encontrada" };
  return {
    title: property.seoTitle,
    description: property.seoDescription,
    openGraph: {
      title: property.seoTitle,
      description: property.seoDescription,
      type: "website",
      images: property.ogImage ? [{ url: property.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: property.seoTitle,
      description: property.seoDescription,
      images: property.ogImage ? [property.ogImage] : undefined,
    },
  };
}

export default async function PropertyLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPublicProperty(slug);
  if (!property) notFound();
  return <PropertyLanding property={property} />;
}
