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
      <div className="py-6 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between">
           <SkeletonLoader type="text" />
           <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navbar Skeleton Chassis */}
        <div className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center px-6 lg:px-[82px] justify-between fixed top-0 z-50">
          <Skeleton className="w-32 h-10 rounded-xl" />
          <div className="hidden lg:flex gap-8">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
          </div>
          <Skeleton className="w-32 h-11 rounded-full" />
        </div>

        {/* Hero Skeleton Chassis */}
        <div className="max-w-[1440px] mx-auto px-6 pt-40 pb-20 lg:px-[82px] flex flex-col items-center">
           <SkeletonLoader type="hero" />
        </div>

        {/* Value Props Skeleton Grid */}
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <SkeletonLoader type="card" />
             <SkeletonLoader type="card" />
             <SkeletonLoader type="card" />
          </div>
        </div>

        {/* FAQ Area Skeleton */}
        <div className="max-w-[1280px] mx-auto px-6 py-20 border-t border-gray-100">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5 space-y-6">
                 <Skeleton className="w-40 h-8 rounded-full" />
                 <Skeleton className="w-full h-20" />
                 <Skeleton className="w-[60%] h-4" />
              </div>
              <div className="lg:col-span-7 space-y-8">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="py-6 border-b border-gray-100 flex justify-between items-center">
                      <Skeleton className="w-[70%] h-6" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white overflow-hidden">
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
                staggerChildren: 0.1,
                delayChildren: 0.2
              }
            }
          }}
          id="faq" 
          className="pt-20 pb-0 bg-white border-t border-[#E2E8F0]"
        >
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <motion.div 
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                }}
                className="lg:col-span-5 space-y-8 text-left"
              >
                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2.5 px-4 h-8 bg-brand-primary/5 border border-brand-primary/10 rounded-full mb-8">
                      <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Common Questions</span>
                   </div>
                  <h2 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-black leading-none mb-6">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
                    Got a question about our service in Andhra Pradesh? Here are the answers to the most common things people ask.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/help-center')} 
                  className="h-12 px-8 bg-black text-white hover:bg-[#FB432C] font-medium text-sm rounded-full transition-all duration-300 shadow-xl shadow-black/20"
                >
                  Full Help Center
                </Button>
              </motion.div>
              <div className="lg:col-span-7">
                 <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0] text-left">
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
                          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
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
        <section className="pt-[100px] pb-24 bg-white">
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
              <form action="#" className="w-full space-y-5">
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Shop Name</Label>
                  <Input type="text" placeholder="Enter your xerox shop name" className="h-12 bg-white border-gray-200 focus:border-black transition-all rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Owner Email</Label>
                  <Input type="email" placeholder="owner@email.com" className="h-12 bg-white border-gray-200 focus:border-black transition-all rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Your Message</Label>
                  <Textarea placeholder="Tell us more about your shop and location..." className="min-h-[120px] bg-white border-gray-200 focus:border-black transition-all rounded-lg p-4" />
                </div>
                <button 
                  type="submit" 
                  className="w-full h-12 bg-[#FB432C] hover:bg-black text-white font-medium text-sm rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-brand-primary/20 mt-2"
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
