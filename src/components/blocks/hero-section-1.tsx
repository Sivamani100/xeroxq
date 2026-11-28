'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Menu, X, Printer, Shield, Zap, Globe, Trash2, Activity, Sparkles, Cpu, Fingerprint, MousePointer2, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { HowItWorks } from "@/components/ui/how-it-works";
import WallOfLoveSection from "@/components/ui/wall-of-love";
import { FeatureCard } from "@/components/ui/grid-feature-cards";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type Variants } from 'framer-motion';
import { SiteHeader } from "@/components/layout/site-header";


const itemVariant: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(10px)',
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      bounce: 0.25,
      duration: 1.2,
      delay: 0.1,
    },
  },
};

const transitionVariants = { item: itemVariant };

import { DownloadModal } from '@/components/ui/download-modal';

export function HeroSection() {
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false);

  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED]">
        {/* ── Hero ── */}
        <section>
          <div className="relative pt-[150px] md:pt-[170px]">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  {/* Badge */}
                  <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#19191B] p-1 pl-5 transition-colors duration-200 group">
                    <span className="text-xs sm:text-sm font-medium text-[#525252] dark:text-[#A1A1A6]">100% Free for Shop Owners</span>
                    <span className="block h-4 w-px bg-[#171717]/[0.12] dark:bg-white/[0.12]" />
                    <div className="bg-[#F4F4F5] dark:bg-[#232325] size-6 overflow-hidden rounded-full duration-300">
                      <div className="flex w-12 -translate-x-1/2 duration-300 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-[#525252] dark:text-[#A1A1A6]" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-[#525252] dark:text-[#A1A1A6]" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] md:text-7xl lg:mt-10 xl:text-[4.75rem] leading-[1.06]">
                    Privacy-First Printing,{' '}
                    <span className="text-[#FB432C]">
                      Anywhere.
                    </span>
                  </h1>

                  {/* Sub-headline */}
                  <p className="mx-auto mt-6 max-w-3xl text-balance text-lg text-[#525252] dark:text-[#A1A1A6] font-normal leading-relaxed">
                    Walk into any XeroxQ shop, scan the QR code, upload your document — it prints and vanishes. No accounts, no servers, no trace.
                  </p>
                </AnimatedGroup>

                {/* CTA buttons */}
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.35,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row">
                  <Button
                    onClick={() => setIsDownloadOpen(true)}
                    className="h-12 rounded-full px-8 text-base font-semibold bg-[#FB432C] hover:bg-[#E03923] text-white transition-colors flex items-center gap-2 cursor-pointer">
                    <Download className="size-4" />
                    <span className="text-nowrap">Download Now (.exe)</span>
                  </Button>
                  <Button
                    asChild
                    className="h-12 rounded-full px-8 bg-[#171717] dark:bg-[#EDEDED] hover:bg-[#2C2C2E] dark:hover:bg-white text-white dark:text-[#111113] font-semibold text-sm transition-colors">
                    <Link href="/how-it-works">
                      <span className="text-nowrap">See How It Works</span>
                      <ChevronRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                </AnimatedGroup>

                {/* Trust badges */}
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.5,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[#525252] dark:text-[#A1A1A6]">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-[#FB432C]" />
                    <span>No Joining Fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#FB432C]" />
                    <span>Instant Shop Setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Printer className="size-4 text-[#FB432C]" />
                    <span>Available Across AP</span>
                  </div>
                </AnimatedGroup>
              </div>
            </div>

            {/* App preview screenshot */}
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.45,
                    },
                  },
                },
                ...transitionVariants,
              }}>
              <div className="relative mt-10 overflow-hidden px-2 sm:mt-10 md:mt-12 w-full flex justify-center">
                <div className="bg-white dark:bg-[#19191B] relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[#171717]/[0.10] dark:border-white/[0.10] p-3">
                  <div className="aspect-[4/3] sm:aspect-[15/8] relative rounded-xl overflow-hidden bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.06] flex flex-col w-full">
                    {/* Browser chrome */}
                    <div className="h-10 bg-white dark:bg-[#19191B] border-b border-[#171717]/[0.06] dark:border-white/[0.08] flex items-center gap-3 px-4">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 h-6 bg-[#F4F4F5] dark:bg-[#232325] rounded-md mx-8 flex items-center px-3 gap-2">
                        <Shield className="size-3 text-[#FB432C]" />
                        <span className="text-[10px] text-[#737373] dark:text-[#85858B] font-mono">xeroxq.arkio.in/admin</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden bg-white dark:bg-[#111113] flex items-center justify-center">
                      <img
                        src="/demoscreen.png"
                        alt="XeroxQ Dashboard Demo"
                        className="w-full h-full object-contain sm:object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        <HowItWorks />
        <HeroFeatures />
        <WallOfLoveSection />
      </main>
      <DownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
    </>
  );
}

// ──────────────────────────────────────────────
// Nav items
// ──────────────────────────────────────────────
const menuItems = [
  { name: 'How it Works', href: '/how-it-works' },
  { name: 'Enterprise', href: '/enterprise' },
  { name: 'Community', href: '/community' },
  { name: 'Blog', href: '/blog' },
];

// ──────────────────────────────────────────────
// HeroFeatures — XeroxQ Protocol Features
// ──────────────────────────────────────────────
const features = [
  {
    title: 'Attract More Customers',
    icon: Users,
    description: 'Show your shop to thousands of people in Andhra Pradesh looking for a high-quality xerox shop near them.',
  },
  {
    title: 'Zero WhatsApp Mess',
    icon: Trash2,
    description: 'No more checking for documents on WhatsApp or email. Let our system handle it for you.',
  },
  {
    title: 'Any Xerox Machine',
    icon: Printer,
    description: 'Our software works with every printer and xerox machine in AP without any new hardware.',
  },
  {
    title: 'Instant File Delete',
    icon: Shield,
    description: 'Files are deleted right after printing. Your customers will feel very safe using your xerox shop.',
  },
  {
    title: 'Modern Shop Image',
    icon: Sparkles,
    description: 'Make your shop look like a premium brand in your neighborhood. Show people you use the latest tech.',
  },
  {
    title: 'Extra Earnings',
    icon: Activity,
    description: 'Get more print orders from mobile users every day and increase your shop profit in Andhra Pradesh.',
  },
];

function HeroFeatures() {
  return (
    <section className="pt-[100px] pb-0 bg-[#FAFAFA] dark:bg-[#111113] border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
      <div className="mx-auto w-full max-w-[1280px] space-y-14 px-6">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FB432C]" />
            <span className="text-[11px] font-semibold text-[#525252] dark:text-[#A1A1A6] uppercase tracking-wider">Service Features</span>
          </div>
          <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-tight mb-4 text-balance">
            Modernize Your Shop.
          </h2>
          <p className="text-base md:text-lg font-normal text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-2xl mx-auto">
            Everything you need to grow your xerox business and manage printing efficiently in Andhra Pradesh.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.2}
          className="grid grid-cols-1 divide-x divide-y divide-[#171717]/[0.08] dark:divide-white/[0.08] border border-[#171717]/[0.08] dark:border-white/[0.08] sm:grid-cols-2 md:grid-cols-3 rounded-2xl overflow-hidden"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}

function AnimatedContainer({ className, delay = 0.1, children }: { className?: string; delay?: number; children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', y: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
