import type { Metadata } from "next";
import { PapersClient } from "./client-page";

export const metadata: Metadata = {
  title: "Papers — Turn Rough Drafts Into Complete Word Documents",
  description:
    "Upload your project or assignment (.docx or .doc), attach your professor's official template if you have one, describe what you need in chat, and download a polished Word document.",
};

export default function PapersPage() {
  return <PapersClient />;
}
