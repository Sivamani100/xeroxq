"use client";

import { cn } from "@/lib/utils";
import { Layers, Search, Zap, Printer, Shield, Globe, Users, ShieldCheck } from "lucide-react";
import type React from "react";
import { motion } from "framer-motion";

// The main props for the HowItWorks component
interface HowItWorksProps extends React.HTMLAttributes<HTMLDivElement> {}

// The props for a single step card
interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

/**
 * A single step card within the "How It Works" section.
 * It displays an icon, title, description, and a list of benefits.
 */
const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
      visible: { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        transition: { type: 'spring', bounce: 0.3, duration: 0.8 }
      }
    }}
    className={cn(
      "relative rounded-2xl border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] p-6 md:p-8 text-[#171717] dark:text-[#EDEDED] transition-all duration-300 ease-in-out group",
      "hover:scale-[1.01] hover:border-[#FB432C]/40"
    )}
  >
    {/* Icon */}
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] group-hover:bg-[#FB432C] group-hover:text-white transition-colors duration-200">
      {icon}
    </div>
    {/* Title and Description */}
    <h3 className="mb-2.5 text-lg md:text-xl font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">{title}</h3>
    <p className="mb-6 text-xs md:text-sm font-normal text-[#525252] dark:text-[#A1A1A6] leading-relaxed">{description}</p>
    {/* Benefits List */}
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FB432C]/10">
            <div className="h-1.5 w-1.5 rounded-full bg-[#FB432C]"></div>
          </div>
          <span className="text-[13px] font-medium text-[#525252] dark:text-[#A1A1A6] tracking-tight">{benefit}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

/**
 * A responsive "How It Works" section that displays a 3-step process.
 * Adapted for XeroxQ high-fidelity protocol.
 */
export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const stepsData = [
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Register Your Shop",
      description: "Join our digital network in minutes. Add your shop name, location in AP, and printer details to get started.",
      benefits: [
        "Instant registration",
        "AP-wide visibility",
        "Free shop listing",
      ],
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Get Your QR Code",
      description: "We generate a unique QR code for your shop. Print it and place it at your counter for customers to scan.",
      benefits: [
        "Unique shop identity",
        "Easy for customers",
        "Modern counter look",
      ],
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Receive Orders",
      description: "Customers scan the code and upload files. You receive them instantly on your screen and start printing.",
      benefits: [
        "Zero WhatsApp mess",
        "Instant file access",
        "Happy customers",
      ],
    },
  ];

  return (
    <motion.section
      id="how-it-works"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.15
          }
        }
      }}
      className={cn("w-full bg-[#FAFAFA] dark:bg-[#111113] pt-[100px] pb-0 relative overflow-hidden", className)}
    >
      <div className="max-w-[1280px] mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
          }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 h-7 rounded-full bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] mb-6 mx-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FB432C]" />
            <span className="text-[11px] font-semibold text-[#525252] dark:text-[#A1A1A6] uppercase tracking-wider leading-none">Simple Process</span>
          </div>
          <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-tight mb-4">
            Grow Your Business in 3 Easy Steps
          </h2>
          <p className="text-base md:text-lg font-normal text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-2xl mx-auto">
            Stop worrying about cables or WhatsApp. Modernize your xerox shop and serve more customers in Andhra Pradesh with these simple steps.
          </p>
        </motion.div>

        {/* Step Indicators with Connecting Line */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delay: 0.3, duration: 0.6 } }
          }}
          className="relative mx-auto mb-12 w-full max-w-4xl hidden md:block"
        >
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-[1px] w-[66.6667%] -translate-y-1/2 bg-[#171717]/[0.10] dark:bg-white/[0.10]"
          ></div>
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] font-semibold text-[#171717] dark:text-[#EDEDED] text-sm ring-8 ring-[#FAFAFA] dark:ring-[#111113] transition-colors hover:border-[#FB432C] hover:text-[#FB432C]"
              >
                0{index + 1}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Steps Grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
};
