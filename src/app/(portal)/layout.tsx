import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Portal de clientes", template: "%s · Portal" },
  robots: { index: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
