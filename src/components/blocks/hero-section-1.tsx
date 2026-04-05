'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Menu, X, Printer, Shield, Zap, Globe, Trash2, Activity, Sparkles, Cpu, Fingerprint, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { HowItWorks } from "@/components/ui/how-it-works";
import WallOfLoveSection from "@/components/ui/wall-of-love";
import { FeatureCard } from "@/components/ui/grid-feature-cards";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type Variants } from 'framer-motion';


const itemVariant: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(12px)',
    y: 12,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      type: 'spring' as const,
      bounce: 0.3,
      duration: 1.5,
    },
  },
};

const transitionVariants = { item: itemVariant };

export function HeroSection() {
  return (
    <>
      <HeroHeader />
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
                    <span className="text-sm font-normal text-gray-700">Zero-Data. Zero-Trust. 100% Free.</span>
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

                  {/* Headline */}
                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-6xl font-bold tracking-tight text-black md:text-7xl lg:mt-10 xl:text-[5rem] leading-[1.05]">
                    Privacy-First Printing,{' '}
                    <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(315deg,#FB432C 0%,#FF591E 100%)' }}>
                      Anywhere.
                    </span>
                  </h1>

                  {/* Sub-headline */}
                  <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-gray-500 font-medium leading-relaxed">
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
                    <Shield className="size-4 text-brand-primary" />
                    <span>AES-256 Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-brand-primary" />
                    <span>Zero Data Retention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Printer className="size-4 text-brand-primary" />
                    <span>14,892 Active Nodes</span>
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
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}>
              <div className="relative -mr-56 mt-10 overflow-hidden px-2 sm:mr-0 sm:mt-10 md:mt-10">

                <div className="ring-gray-200 bg-white relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-gray-200 p-3 shadow-2xl shadow-black/10 ring-1">
                  {/* Hero dashboard mockup — light */}
                  <div className="aspect-[15/8] relative rounded-xl overflow-hidden bg-[#F8FAFC] border border-gray-100 flex flex-col">
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
                        className="w-full h-full object-cover object-top"
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
    title: 'Mesh Performance',
    icon: Zap,
    description: 'Ultra-low latency document transmission across our secure distributed mesh network.',
  },
  {
    title: 'Zero-Knowledge',
    icon: Shield,
    description: 'Shard-encrypted document storage ensuring your files are never at rest in a readable state.',
  },
  {
    title: 'Global Bridge',
    icon: Globe,
    description: 'Universal hardware compatibility. Connect any legacy printer to the XeroxQ mesh instantly.',
  },
  {
    title: 'Protocol Purge',
    icon: Trash2,
    description: '100% digital footprint elimination. Automatic file shredding at the hardware level on completion.',
  },
  {
    title: 'Institutional Grade',
    icon: Activity,
    description: 'Built for high-density, enterprise-scale demand with professional-grade uptime.',
  },
  {
    title: 'High Fidelity',
    icon: Printer,
    description: 'Precision-calibrated print output using our proprietary hardware bridge drivers.',
  },
];

function HeroFeatures() {
  return (
    <section className="pt-[100px] pb-0 bg-white border-t border-gray-100">
      <div className="mx-auto w-full max-w-[1280px] space-y-16 px-6">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Protocol Specifications</span>
          </div>
          <h2 className="text-[40px] md:text-[54px] font-bold tracking-tighter text-black leading-none mb-6 text-balance">
            Power. Speed. Control.
          </h2>
          <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
            Everything you need to transmit and print documents with absolute security and precision across the global mesh.
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
function HeroHeader() {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);


  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="fixed z-20 w-full px-4 sm:px-6 top-[30px] group">
        <div className={cn(
          'mx-auto max-w-6xl px-6 rounded-full border border-gray-200 bg-white/50 backdrop-blur-md transition-all duration-300 lg:px-14 shadow-sm',
          isScrolled && 'bg-white/80 max-w-4xl border-gray-200 shadow-lg lg:px-10'
        )}>
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">

            {/* Logo + mobile toggle */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="XeroxQ home"
                className="flex items-center">
                <img 
                  src="/xeroxqlogo.svg" 
                  alt="XeroxQ" 
                  className="h-10 w-auto transition-transform hover:scale-105"
                />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-50 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden text-black">
                <Menu className={cn("m-auto size-6 duration-200 transition-all", menuState ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0")} />
                <X className={cn("absolute inset-0 m-auto size-6 duration-200 transition-all", menuState ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90")} />
              </button>
            </div>

            {/* Mobile menu overlay */}
            <AnimatePresence>
              {menuState && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="fixed inset-x-4 top-[80px] z-40 lg:hidden bg-white/95 backdrop-blur-xl rounded-[32px] border border-gray-100 p-8 shadow-2xl shadow-black/10 origin-top overflow-hidden"
                >
                  <div className="flex flex-col gap-8">
                    <ul className="flex flex-col gap-6">
                      {menuItems.map((item, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMenuState(false)}
                            className="text-[20px] font-bold text-black hover:text-[#FB432C] transition-colors flex items-center justify-between group">
                            {item.name}
                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                      <Button
                        asChild
                        className="h-14 rounded-2xl w-full bg-[#FB432C] hover:bg-black text-white font-bold text-lg shadow-xl shadow-brand-primary/20 transition-all duration-300">
                        <Link href="/register" onClick={() => setMenuState(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop center links */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-gray-500 hover:text-black block duration-150 font-medium text-[11px] uppercase tracking-[0.15em]">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right CTA area - Desktop Only */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  className={cn('h-10 rounded-full px-8 text-sm bg-[#FB432C] hover:bg-black text-white font-medium shadow-xl shadow-brand-primary/20 transition-all duration-300 active:scale-95', isScrolled && 'lg:hidden')}>
                  <Link href="/register">
                    <span>Get Started</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  className={cn('h-10 rounded-full px-8 text-sm bg-[#FB432C] hover:bg-black text-white font-medium shadow-xl shadow-brand-primary/20 transition-all duration-300 active:scale-95', isScrolled ? 'lg:inline-flex' : 'hidden')}>
                  <Link href="/register">
                    <span>Register Shop</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
