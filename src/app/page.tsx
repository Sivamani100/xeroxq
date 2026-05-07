import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";
import { SEO_CONFIGS } from "@/lib/seo/metadata";
import { 
  OrganizationStructuredData,
  WebSiteStructuredData,
  LocalBusinessStructuredData,
  FAQStructuredData,
  WebApplicationStructuredData,
  SearchActionStructuredData
} from "@/components/seo/structured-data";
import HomePageClient from "@/components/homepage/homepage-client";

export const metadata: Metadata = generateMetadata(SEO_CONFIGS.HOME);

export default function LandingPage() {
  return (
    <>
      {/* Comprehensive Structured Data for SEO */}
      <OrganizationStructuredData />
      <WebSiteStructuredData />
      <LocalBusinessStructuredData />
      <WebApplicationStructuredData />
      <SearchActionStructuredData />
      <FAQStructuredData faqs={[
        { question: "How much does it cost to join XeroxQ?", answer: "Joining XeroxQ is 100% free for all xerox shop owners in Andhra Pradesh. There are no hidden charges or monthly fees. We want to help local shops grow." },
        { question: "Do I need to buy any new hardware or printers?", answer: "No! XeroxQ works with your existing xerox machines and computers. You only need an internet connection and a browser to receive print orders." },
        { question: "How does the QR code system work for my shop?", answer: "After you register, we generate a unique QR code for your shop. Customers simply scan it to upload their files directly to your print queue. It's that simple." },
        { question: "Is it safe to receive files from customers this way?", answer: "Yes, it's much safer than WhatsApp. Files are only used for printing and are automatically deleted immediately after. We don't store any customer data." },
        { question: "How can I add my shop to the XeroxQ network?", answer: "Just click on the 'Add Your Shop' button, fill in your shop name and location in AP, and you'll get your QR code instantly to start serving customers." }
      ]} />
      
      {/* Client Component for Interactive Elements */}
      <HomePageClient />
    </>
  );
}
