"use client";

import React from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { DownloadModal } from '@/components/ui/download-modal';
import { ThemeToggle } from '@/lib/theme';

const menuItems = [
  { name: 'How it works', href: '/how-it-works' },
  { name: 'Shops', href: '/shops' },
  { name: 'Community', href: '/community' },
  { name: 'Blog', href: '/blog' },
];

export function SiteHeader() {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header>
        <nav
          data-state={menuState ? 'active' : undefined}
          className="fixed z-50 w-full px-4 sm:px-6 top-4 group">
          <div className={cn(
            'mx-auto max-w-6xl px-5 rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-[#19191B]/90 backdrop-blur-md transition-all duration-200 lg:px-8',
            isScrolled && 'max-w-5xl shadow-sm'
          )}>
            <div className="relative flex flex-wrap items-center justify-between gap-4 py-2.5 lg:py-3">

              {/* Logo + mobile toggle */}
              <div className="flex w-full justify-between items-center lg:w-auto">
                <Link
                  href="/"
                  aria-label="XeroxQ home"
                  className="flex items-center gap-2.5">
                  <img
                    src="/logo_color.png"
                    alt="XeroxQ"
                    className="h-7 w-7 rounded-md object-contain"
                  />
                  <span className="text-[16px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">XeroxQ</span>
                </Link>

                <div className="flex items-center gap-2 lg:hidden">
                  <ThemeToggle compact showLabel={false} />
                  <button
                    onClick={() => setMenuState(!menuState)}
                    aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                    className="relative z-50 block cursor-pointer p-2 text-[#171717] dark:text-[#EDEDED]">
                    <Menu className={cn("size-5 duration-200 transition-all", menuState ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0")} />
                    <X className={cn("absolute inset-0 m-auto size-5 duration-200 transition-all", menuState ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90")} />
                  </button>
                </div>
              </div>

              {/* Mobile menu overlay */}
              <AnimatePresence>
                {menuState && (
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-0 top-[64px] z-40 lg:hidden bg-white dark:bg-[#19191B] rounded-2xl border border-[#171717]/[0.10] dark:border-white/[0.10] p-6 shadow-xl origin-top"
                  >
                    <div className="flex flex-col gap-5">
                      <ul className="flex flex-col gap-3">
                        {menuItems.map((item, index) => (
                          <li key={index}>
                            <Link
                              href={item.href}
                              onClick={() => setMenuState(false)}
                              className="text-[15px] font-medium text-[#171717] dark:text-[#EDEDED] hover:text-[#FB432C] transition-colors flex items-center justify-between py-1">
                              {item.name}
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </Link>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4 border-t border-[#171717]/[0.08] dark:border-white/[0.08] flex flex-col gap-2.5">
                        <Link
                          href="/login"
                          onClick={() => setMenuState(false)}
                          className="h-10 rounded-lg border border-[#171717]/[0.12] dark:border-white/[0.12] text-[#171717] dark:text-[#EDEDED] text-[13px] font-medium flex items-center justify-center">
                          Shopkeeper login
                        </Link>
                        <Button
                          onClick={() => {
                            setMenuState(false);
                            setIsDownloadOpen(true);
                          }}
                          className="h-10 rounded-lg w-full bg-[#FB432C] hover:bg-[#E03923] text-white font-medium text-[13px] flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" strokeWidth={1.75} />
                          <span>Download Desktop</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop center links */}
              <div className="hidden lg:flex items-center gap-6">
                <ul className="flex gap-6 text-[13px]">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors font-medium">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right CTA area - Desktop Only */}
              <div className="hidden lg:flex items-center gap-2.5">
                <ThemeToggle compact />
                <Link
                  href="/login"
                  className="h-8 px-3 rounded-lg border border-[#171717]/[0.12] dark:border-white/[0.10] text-[13px] font-medium text-[#171717] dark:text-[#EDEDED] hover:bg-[#F4F4F5] dark:hover:bg-[#232325] inline-flex items-center transition-colors">
                  Login
                </Link>
                <Button
                  onClick={() => setIsDownloadOpen(true)}
                  className="h-8 rounded-lg px-3.5 text-[13px] bg-[#FB432C] hover:bg-[#E03923] text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <DownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
    </>
  );
}
