'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Menu, X, Printer, Shield, Zap, Globe, Trash2, Activity, Sparkles, Cpu, Fingerprint, MousePointer2, Users } from 'lucide-react';
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

export function HeroSection() {
  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden">
        {/* Ambient background glow — light-mode only decorations */}
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(12,90%,58%,.07)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(12,90%,58%,.05)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>

        {/* ── Hero ── */}
        <section>
          <div className="relative pt-[160px] md:pt-[180px]">
            {/* subtle gradient fade at bottom */}
            <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,white_75%)]" />

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  {/* Badge */}
                  <div className="mx-auto flex w-fit items-center gap-4 rounded-full border border-gray-200 bg-gray-50 p-1 pl-6 shadow-md shadow-black/5 transition-all duration-300 group hover:bg-white">
                    <span className="text-sm font-normal text-gray-700">100% Free for Shop Owners</span>
                    <span className="block h-4 w-0.5 border-l border-gray-300 bg-white"></span>
                    <div className="bg-white group-hover:bg-gray-50 size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-gray-600" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-gray-600" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-6xl font-bold tracking-tight text-black md:text-7xl lg:mt-10 xl:text-[5rem] leading-[1.05]">
                    Privacy-First Printing,{' '}
                    <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(315deg,#FB432C 0%,#FF591E 100%)' }}>
                      Anywhere.
                    </span>
                  </h1>

                  {/* Sub-headline */}
                  <p className="mx-auto mt-6 max-w-3xl text-balance text-lg text-gray-500 font-medium leading-relaxed">
                    Walk into any XeroxQ shop, scan the QR code, upload your document it prints and vanishes. No accounts, no servers, no trace.
                  </p>
                </AnimatedGroup>

                {/* CTA buttons */}
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row">
                  <div className="bg-orange-50 rounded-full border border-brand-primary/10 p-0.5">
                    <Button
                      asChild
                      className="h-10 rounded-full px-8 text-sm font-medium bg-[#FB432C] hover:bg-black text-white shadow-xl shadow-brand-primary/20 transition-all duration-300">
                      <Link href="/register">
                        <span className="text-nowrap">Register Your Shop</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    asChild
                    className="h-10 rounded-full px-8 bg-black hover:bg-[#FB432C] text-white font-medium text-sm transition-all duration-300 shadow-xl shadow-black/20">
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
                          delayChildren: 1,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-brand-primary" />
                    <span>No Joining Fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-brand-primary" />
                    <span>Instant Shop Setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Printer className="size-4 text-brand-primary" />
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
                      delayChildren: 0.8,
                    },
                  },
                },
                ...transitionVariants,
              }}>
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative mt-10 overflow-hidden px-2 sm:mt-10 md:mt-12 w-full flex justify-center"
              >
                <div className="ring-gray-200 bg-white relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-gray-200 p-3 shadow-2xl shadow-black/10 ring-1">
                  {/* Hero dashboard mockup — light */}
                  <div className="aspect-[4/3] sm:aspect-[15/8] relative rounded-xl overflow-hidden bg-[#F8FAFC] border border-gray-100 flex flex-col w-full shadow-inner">
                    {/* Fake browser chrome */}
                    <div className="h-10 bg-white border-b border-gray-100 flex items-center gap-3 px-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-md mx-8 flex items-center px-3 gap-2">
                        <Shield className="size-3 text-brand-primary" />
                        <span className="text-[10px] text-gray-400 font-mono">xeroxq.arkio.in/admin</span>
                      </div>
                    </div>

                    {/* Mac Browser UI inside */}
                    <div className="flex-1 overflow-hidden bg-white border-t border-gray-100 flex items-center justify-center">
                      <img 
                        src="/demoscreen.png" 
                        alt="XeroxQ Dashboard Demo" 
                        className="w-full h-full object-contain sm:object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatedGroup>
          </div>
        </section>

        <HowItWorks />
        <HeroFeatures />
        <WallOfLoveSection />
      </main>
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
    <section className="pt-[100px] pb-0 bg-white border-t border-gray-100">
      <div className="mx-auto w-full max-w-[1280px] space-y-16 px-6">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Service Features</span>
          </div>
          <h2 className="text-[40px] md:text-[54px] font-bold tracking-tighter text-black leading-none mb-6 text-balance">
            Modernize Your Shop.
          </h2>
          <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
            Everything you need to grow your xerox business and managing printing efficiently in Andhra Pradesh.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-gray-100 border border-gray-100 sm:grid-cols-2 md:grid-cols-3 rounded-3xl overflow-hidden shadow-2xl shadow-black/[0.02]"
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
