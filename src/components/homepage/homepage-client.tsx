"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X,
  MailIcon, 
  PhoneIcon, 
  MapPinIcon,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/blocks/hero-section-1";
import CTAWithVerticalMarquee from "@/components/ui/cta-with-text-marquee";
import { ContactCard } from "@/components/ui/contact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeoKeywordsSection } from "@/components/seo/seo-keywords-section";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

// Custom Premium Accordion for "Super Duper" feel (Light Mode)
const FAQItem = ({ question, answer, isLoading }: { question?: string, answer?: string, isLoading?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (isLoading) {
    return (
      <div className="py-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
           <SkeletonLoader type="text" />
           <div className="w-8 h-8 rounded-lg bg-[#F4F4F5] dark:bg-[#232325] animate-pulse" />
        </div>
      </div>
    );
  }
  return (
    <div className="border-b border-[#171717]/[0.08] dark:border-white/[0.08] py-6 last:border-0 border-t-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className={cn(
          "text-lg font-semibold transition-colors duration-200",
          isOpen ? "text-[#171717] dark:text-[#EDEDED]" : "text-[#525252] dark:text-[#A1A1A6] group-hover:text-[#171717] dark:group-hover:text-[#EDEDED]"
        )}>
          {question}
        </span>
        <div className={cn(
          "w-8 h-8 rounded-lg border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center transition-all duration-200",
          isOpen ? "bg-[#FB432C] border-[#FB432C] rotate-45" : "bg-white dark:bg-[#19191B] group-hover:bg-[#F4F4F5] dark:group-hover:bg-[#232325]"
        )}>
          <X className={cn("w-4 h-4", isOpen ? "text-white" : "text-[#737373] dark:text-[#85858B] rotate-45")} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-2xl font-normal">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function HomePageClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [contactStatus, setContactStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] flex flex-col items-center justify-center p-6 space-y-12">
        <SkeletonLoader type="hero" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] selection:bg-[#FB432C] selection:text-white overflow-hidden">
      <main className="space-y-0">
        <HeroSection />

        {/* FAQ Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
              }
            }
          }}
          id="faq"
          className="pt-20 pb-0 bg-[#FAFAFA] dark:bg-[#111113] border-t border-[#171717]/[0.08] dark:border-white/[0.08]"
        >
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
                }}
                className="lg:col-span-5 space-y-8 text-left"
              >
                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-3.5 h-7 bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-full mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FB432C]" />
                      <span className="text-[11px] font-semibold text-[#525252] dark:text-[#A1A1A6] uppercase tracking-wider leading-none">Common Questions</span>
                   </div>
                  <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-tight mb-4">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-base font-normal text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-xl">
                    Got a question about our service in Andhra Pradesh? Here are the answers to the most common things people ask.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/help-center')}
                  className="h-11 px-7 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] hover:bg-[#FB432C] dark:hover:bg-[#FB432C] dark:hover:text-white font-semibold text-sm rounded-full transition-colors"
                >
                  Full Help Center
                </Button>
              </motion.div>
              <div className="lg:col-span-7">
                 <div className="divide-y divide-[#171717]/[0.08] dark:divide-white/[0.08] border-t border-[#171717]/[0.08] dark:border-white/[0.08] text-left">
                    {[
                      {
                        question: "How much does it cost to join XeroxQ?",
                        answer: "Joining XeroxQ is 100% free for all xerox shop owners in Andhra Pradesh. There are no hidden charges or monthly fees. We want to help local shops grow."
                      },
                      {
                        question: "Do I need to buy any new hardware or printers?",
                        answer: "No! XeroxQ works with your existing xerox machines and computers. You only need an internet connection and a browser to receive print orders."
                      },
                      {
                        question: "How does the QR code system work for my shop?",
                        answer: "After you register, we generate a unique QR code for your shop. Customers simply scan it to upload their files directly to your print queue. It's that simple."
                      },
                      {
                        question: "Is it safe to receive files from customers this way?",
                        answer: "Yes, it's much safer than WhatsApp. Files are only used for printing and are automatically deleted immediately after. We don't store any customer data."
                      },
                      {
                        question: "How can I add my shop to the XeroxQ network?",
                        answer: "Just click on the 'Add Your Shop' button, fill in your shop name and location in AP, and you'll get your QR code instantly to start serving customers."
                      }
                    ].map((faq, i) => (
                      <motion.div
                        key={i}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                        }}
                      >
                        <FAQItem
                          question={faq.question}
                          answer={faq.answer}
                        />
                      </motion.div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </motion.section>

        <CTAWithVerticalMarquee />

        {/* Global Inquiries / Support Section */}
        <section className="pt-[100px] pb-24 bg-[#FAFAFA] dark:bg-[#111113]">
          <div className="max-w-7xl mx-auto px-6">
            <ContactCard
              title="Add Your Shop"
              description="Want to grow your xerox business and get more customers in AP? Register your shop now and get your unique QR code instantly."
              contactInfo={[
                {
                  icon: MailIcon,
                  label: 'Shop Support',
                  value: 'support@arkio.in',
                },
                {
                  icon: PhoneIcon,
                  label: 'Owner Hotline',
                  value: '+91 9849497911',
                },
                {
                  icon: MapPinIcon,
                  label: 'Network',
                  value: 'Across Andhra Pradesh',
                  className: 'col-span-2 md:col-span-1 lg:col-span-1',
                }
              ]}
            >
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setContactStatus(null);
                  const formData = new FormData(e.currentTarget);
                  const shopName = formData.get("shopName") as string;
                  const email = formData.get("email") as string;
                  const message = formData.get("message") as string;

                  try {
                    const { error } = await supabase.from("contact_submissions").insert({
                      shop_name: shopName,
                      owner_email: email,
                      message: message
                    });

                    if (error) throw error;
                    setContactStatus({
                      type: "success",
                      text: "Shop registration request sent. Our team will reach out soon.",
                    });
                    (e.target as HTMLFormElement).reset();
                  } catch (err) {
                    console.error("Submission Failure:", err);
                    setContactStatus({
                      type: "error",
                      text: "Failed to dispatch registration request. Please check your connection.",
                    });
                  }
                }}
                className="w-full space-y-5"
              >
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] pl-1">Shop Name</Label>
                  <Input name="shopName" required type="text" placeholder="Enter your xerox shop name" className="h-11 rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] pl-1">Owner Email</Label>
                  <Input name="email" required type="email" placeholder="owner@email.com" className="h-11 rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] pl-1">Your Message</Label>
                  <Textarea name="message" placeholder="Tell us more about your shop and location..." className="min-h-[120px] rounded-lg p-3.5" />
                </div>
                {contactStatus && (
                  <p
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-medium",
                      contactStatus.type === "error"
                        ? "bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D]"
                        : "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A]"
                    )}
                  >
                    {contactStatus.text}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full h-11 bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold text-sm rounded-full transition-colors cursor-pointer"
                >
                  Join the Network
                </button>
              </form>
            </ContactCard>
          </div>
        </section>
      </main>

      {/* SEO Content Section — keyword-rich prose for search engines */}
      <SeoKeywordsSection />

      <SiteFooter />
    </div>
  );
}
