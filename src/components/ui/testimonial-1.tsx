"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Testimonial1() {


  return (
    <div className="bg-[#FAFAFA] dark:bg-[#111113] pt-[100px] pb-0 px-4 md:px-8 lg:px-16 relative overflow-hidden flex flex-col items-center justify-start">
      {/* Side Navigation Buttons */}
      <button className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-lg flex items-center justify-center text-[#171717] dark:text-[#EDEDED] hover:bg-[#F4F4F5] dark:hover:bg-[#232325] transition-colors z-20">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-lg flex items-center justify-center text-[#171717] dark:text-[#EDEDED] hover:bg-[#F4F4F5] dark:hover:bg-[#232325] transition-colors z-20">
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="max-w-6xl mx-auto w-full">
        {/* Community Badge */}
        <div className="flex justify-center mb-[40px]">
          <div className="bg-[#F4F4F5] dark:bg-[#19191B] text-[#525252] dark:text-[#A1A1A6] px-5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-semibold border border-[#171717]/[0.08] dark:border-white/[0.08]">
            Our Community
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center max-w-5xl mx-auto relative text-[#171717] dark:text-[#EDEDED]">
          <h2 className="text-3xl md:text-8xl lg:text-[55px] leading-[1.2] tracking-tight">
            <span className="font-medium opacity-100 block mb-1">
              We make it easy for printers and
            </span>
            <span className="font-bold block">
              and their customers to coordinate
            </span>
             <span className="font-medium opacity-100 block mb-1">
              and automate all prints
            </span>
          </h2>
        </div>

       
      </div>
    </div>
  );
}
