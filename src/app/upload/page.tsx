import type { Metadata } from "next";
import { UploadConnectClient } from "@/components/portal/UploadConnectClient";

export const metadata: Metadata = {
  title: "Find Your Print Shop | XeroxQ",
  description:
    "Enter your shop's URL to access your XeroxQ print portal and start uploading documents.",
};

export default function UploadRedirectPage() {
  return <UploadConnectClient />;
}
