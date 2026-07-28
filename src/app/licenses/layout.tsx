import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Software & Open Source Licenses | XeroxQ",
  description:
    "Comprehensive software license attributions, third-party component disclosures, and permissive open-source compliance for the XeroxQ platform.",
  openGraph: {
    title: "Software & Open Source Licenses | XeroxQ",
    description: "Third-party open-source attributions and legal license compliance matrix for XeroxQ.",
  },
};

export default function LicensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
