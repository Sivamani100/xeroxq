"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X,
  MailIcon, 
  PhoneIcon, 
  MapPinIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/blocks/hero-section-1";
import CTAWithVerticalMarquee from "@/components/ui/cta-with-text-marquee";
import { ContactCard } from "@/components/ui/contact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Custom Premium Accordion for "Super Duper" feel (Light Mode)
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E2E8F0] py-6 last:border-0 border-t-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className={cn(
          "text-lg font-bold transition-colors duration-300",
          isOpen ? "text-black" : "text-black/60 group-hover:text-black"
        )}>
          {question}
        </span>
        <div className={cn(
          "w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center transition-all duration-300 shadow-sm",
          isOpen ? "bg-[#FB432C] border-[#FB432C] rotate-45" : "bg-white group-hover:bg-[#F8FAFC]"
        )}>
          <X className={cn("w-4 h-4", isOpen ? "text-white" : "text-[#94A3B8] rotate-45")} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-[#64748B] leading-relaxed max-w-2xl font-medium italic">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white overflow-hidden">
      <main className="space-y-0">
        <HeroSection />

        {/* FAQ Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          id="faq" 
          className="pt-20 pb-0 bg-white border-t border-[#E2E8F0]"
        >
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5 space-y-8 text-left">
                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-full mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                      <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Knowledge Base</span>
                   </div>
                  <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-none uppercase">Your questions <br /> answered.</h2>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed max-w-sm italic">
                    Everything you need to know about XeroxQ. For deep technical insights, visit our documentation.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/help-center')} 
                  className="h-12 px-8 bg-black text-white hover:bg-[#FB432C] font-medium text-sm rounded-full transition-all duration-300 shadow-xl shadow-black/20"
                >
                  Full Help Center
                </Button>
              </div>
              <div className="lg:col-span-7">
                 <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0] text-left">
                    <FAQItem 
                      question="How is XeroxQ different from standard cloud printing?" 
                      answer="Unlike legacy cloud printing, XeroxQ is decentralized. We never store your documents on a central server. Everything is encrypted locally via the Mercury protocol."
                    />
                    <FAQItem 
                      question="Is it safe for sensitive legal documents?" 
                      answer="Absolutely. We use institutional AES-256 E2E encryption. Shop nodes only receive transient document fragments and purge them immediately upon completion."
                    />
                    <FAQItem 
                      question="How do I register my shop as a node?" 
                      answer="Simply create an admin account, set up your hardware bridge, and print your unique shop QR poster to start accepting secure signals."
                    />
                    <FAQItem 
                      question="Which document types are supported?" 
                      answer="Our protocol currently supports PDF, DOCX, PNG, and JPG. All files are normalized to high-fidelity print formats autonomously within the mesh."
                    />
                 </div>
              </div>
            </div>
          </div>
        </motion.section>
        
        <CTAWithVerticalMarquee />

        {/* Global Inquiries / Support Section */}
        <section className="pt-[100px] pb-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <ContactCard
              title="Global Protocol Inquiries"
              description="Seeking technical deep-dives into the Mercury mesh, partnership node integration, or enterprise-grade document physicalization audits? Our protocol engineers are on standby."
              contactInfo={[
                {
                  icon: MailIcon,
                  label: 'Protocol Support',
                  value: 'support@xeroxq.arkio.in',
                },
                {
                  icon: PhoneIcon,
                  label: 'Mesh Hotwire',
                  value: '+1 (800) XEROX-Q',
                },
                {
                  icon: MapPinIcon,
                  label: 'Mercury Hub',
                  value: 'Decentralized Node Network',
                  className: 'col-span-2 md:col-span-1 lg:col-span-1',
                }
              ]}
            >
              <form action="#" className="w-full space-y-5">
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Identity Signature</Label>
                  <Input type="text" placeholder="Your full name" className="h-12 bg-white border-gray-200 focus:border-black transition-all rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Signal Vector (Email)</Label>
                  <Input type="email" placeholder="email@address.com" className="h-12 bg-white border-gray-200 focus:border-black transition-all rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Enquiry Fragment</Label>
                  <Textarea placeholder="How can the Mercury Mesh assist your physicalization logic?" className="min-h-[120px] bg-white border-gray-200 focus:border-black transition-all rounded-lg p-4" />
                </div>
                <button 
                  type="submit" 
                  className="w-full h-12 bg-[#FB432C] hover:bg-black text-white font-medium text-sm rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-brand-primary/20 mt-2"
                >
                  Transmit Enquiry
                </button>
              </form>
            </ContactCard>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
