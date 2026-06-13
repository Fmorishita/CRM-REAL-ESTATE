import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyLanding } from "@/modules/landing/components/company-landing";
import { getPublicCompany } from "@/modules/landing/server/public-queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getPublicCompany(slug);
  if (!company) return { title: "Inmobiliaria no encontrada" };
  return {
    title: company.seoTitle,
    description: company.seoDescription,
    openGraph: {
      title: company.seoTitle,
      description: company.seoDescription,
      type: "website",
    },
  };
}

export default async function CompanyLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getPublicCompany(slug);
  if (!company) notFound();
  return <CompanyLanding company={company} />;
}
