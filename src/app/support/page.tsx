"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ContactCard } from "@/components/ui/contact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon, PhoneIcon, MapPinIcon, X, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Copied exactly from the landing page's custom premium accordion for style consistency
const FAQItem = ({ question, answer }: { question?: string, answer?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 py-6 last:border-0 border-t-0">
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
          "w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ml-4",
          isOpen ? "bg-[#FB432C] border-[#FB432C] rotate-45" : "bg-white group-hover:bg-gray-50"
        )}>
          <X className={cn("w-4 h-4", isOpen ? "text-white" : "text-gray-400 rotate-45")} />
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
            <p className="pt-4 text-base font-medium text-gray-500 leading-relaxed pr-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SupportPage() {
  const supportFaqs = [
    {
      question: "I lost my Print Code, what should I do?",
      answer: "Print codes (tokens) are strictly ephemeral and tied to your browser session. If you closed the window before providing the token to the shop owner, the document can no longer be retrieved due to our zero-retention security model. You will need to re-upload the document."
    },
    {
      question: "The shop scanner isn't reading my QR code.",
      answer: "Try turning up your phone's brightness to maximum. If you are scanning the shop's physical QR code with your phone, make sure you are in a well-lit area without glare blocking the camera."
    },
    {
      question: "My shop terminal shows 'Network Disconnected'.",
      answer: "Ensure your shop computer is connected to the internet. The XeroxQ terminal dashboard automatically attempts to reconnect every 5 seconds. If the issue persists, clear your browser cache or contact our Shop Support hotline below."
    },
    {
      question: "Why did my document fail to convert to PDF?",
      answer: "Our automated optimization engine handles DOCX, JPEG, and PNG files. If your file is password-protected or corrupted, the conversion will fail. Please ensure the document is unprotected before uploading."
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Support Header - Clean Landing Page Style */}
        <section className="relative pt-12 pb-16 text-center">
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="mx-auto max-w-2xl text-center"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8 mx-auto">
                 <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Command Center</span>
               </div>
               
               <h2 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-black leading-none mb-6">
                 Support Hub
               </h2>
               <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
                 We're here to help you navigate XeroxQ. Whether you're a shop owner struggling with the terminal or a user with a corrupted file, find your answers here.
               </p>
             </motion.div>
          </div>
        </section>

        {/* Global Contact Form Section - Reusing ContactCard */}
        <section className="py-16 bg-white overflow-visible relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <ContactCard
              title="Reach Out Intelligently."
              description="Our regional support team in Andhra Pradesh operates from 9 AM to 7 PM IST. Drop us a message, and we'll get back to you securely."
              contactInfo={[
                {
                  icon: MailIcon,
                  label: 'General Support',
                  value: 'support@arkio.in',
                },
                {
                  icon: PhoneIcon,
                  label: 'Shop Owner Hotline',
                  value: '+91 9849497911',
                },
                {
                  icon: MapPinIcon,
                  label: 'Operations Base',
                  value: 'Andhra Pradesh, India',
                  className: 'col-span-2 md:col-span-1 lg:col-span-1',
                }
              ]}
            >
              <form action="#" className="w-full space-y-5">
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Full Name</Label>
                  <Input type="text" placeholder="Your name" className="h-12 bg-white border-gray-200 focus:border-black transition-all rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">Contact Email</Label>
                  <Input type="email" placeholder="email@example.com" className="h-12 bg-white border-gray-200 focus:border-black transition-all rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-black uppercase tracking-widest pl-1">How can we help?</Label>
                  <Textarea placeholder="Please describe your issue in detail..." className="min-h-[120px] bg-white border-gray-200 focus:border-black transition-all rounded-lg p-4" />
                </div>
                <button 
                  type="submit" 
                  className="w-full h-12 bg-black hover:bg-[#FB432C] text-white font-bold text-[12px] uppercase tracking-widest rounded-full transition-all duration-300 shadow-xl shadow-black/10 mt-2"
                >
                  Submit Ticket
                </button>
              </form>
            </ContactCard>
          </div>
        </section>

        {/* FAQs Section - Landing Page UI Clone */}
        <section className="py-24 bg-[#F8FAFC] border-t border-gray-100">
           <div className="max-w-[800px] mx-auto px-6">
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="text-center mb-16"
              >
                 <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <LifeBuoy className="w-8 h-8 text-black" />
                 </div>
                 <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-black uppercase mb-4">
                    Troubleshooting
                 </h2>
                 <p className="text-gray-500 font-medium">Common questions about the network.</p>
              </motion.div>

              <div className="divide-y divide-gray-200 border-t border-gray-200">
                 {supportFaqs.map((faq, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 10 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                   >
                     <FAQItem 
                       question={faq.question} 
                       answer={faq.answer} 
                     />
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
