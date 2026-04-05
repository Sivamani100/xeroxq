"use client";

import { cn } from "@/lib/utils";
import { Layers, Search, Zap, Printer, Shield, Globe } from "lucide-react";
import type React from "react";

// The main props for the HowItWorks component
interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

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
  <div
    className={cn(
      "relative rounded-2xl border bg-white p-8 text-black transition-all duration-500 ease-in-out group",
      "hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-primary/5 hover:border-[#FB432C]/30"
    )}
  >
    {/* Icon */}
    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-lg shadow-black/20 group-hover:bg-[#FB432C] group-hover:scale-110 transition-all duration-500">
      {icon}
    </div>
    {/* Title and Description */}
    <h3 className="mb-3 text-xl font-bold tracking-tight">{title}</h3>
    <p className="mb-8 text-sm font-medium text-gray-500 leading-relaxed">{description}</p>
    {/* Benefits List */}
    <ul className="space-y-4">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black/5">
            <div className="h-1.5 w-1.5 rounded-full bg-black"></div>
          </div>
          <span className="text-[13px] font-bold text-gray-600 uppercase tracking-tight">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
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
      icon: <Zap className="h-6 w-6" />,
      title: "Transmit Document",
      description:
        "Securely upload your document via the XeroxQ protocol. Every byte is shard-encrypted and distributed across our secure mesh.",
      benefits: [
        "End-to-end shard encryption",
        "Instant mesh distribution",
        "Zero-knowledge storage",
      ],
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Select Mesh Node",
      description:
        "Locate the nearest high-fidelity printer node. Compare hardware density, uptime, and pricing for optimal results.",
      benefits: [
        "Real-time node availability",
        "Global printer network access",
        "Transparent credit pricing",
      ],
    },
    {
      icon: <Printer className="h-6 w-6" />,
      title: "Hardware Bridge",
      description:
        "Use your unique security token at the physical node to initiate the print. No digital footprint left behind.",
      benefits: [
        "Physical token verification",
        "Instant hardware syncing",
        "Automatic file purge on completion",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className={cn("w-full bg-white pt-[100px] pb-0 relative overflow-hidden", className)}
      {...props}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-[1280px] mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Operational Protocol</span>
          </div>
          <h2 className="text-[40px] md:text-[54px] font-bold tracking-tighter text-black leading-none mb-6">
            How it works
          </h2>
          <p className="text-lg font-medium text-gray-500 leading-relaxed italic">
            "Our service uses advanced mesh technologies for secure document delivery and high-fidelity printing."
          </p>
        </div>

        {/* Step Indicators with Connecting Line */}
        <div className="relative mx-auto mb-12 w-full max-w-4xl hidden md:block">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-[1px] w-[66.6667%] -translate-y-1/2 bg-gray-100"
          ></div>
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-white border border-gray-100 font-bold text-black text-sm shadow-sm ring-8 ring-white transition-all duration-300 hover:border-[#FB432C] hover:text-[#FB432C] hover:scale-110"
              >
                0{index + 1}
              </div>
            ))}
          </div>
        </div>

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
    </section>
  );
};
