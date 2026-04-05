"use client";

import React from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'How it Works', href: '/how-it-works' },
  { name: 'Enterprise', href: '/enterprise' },
  { name: 'Community', href: '/community' },
  { name: 'Blog', href: '/blog' },
];

export function SiteHeader() {
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
        className="fixed z-50 w-full px-4 sm:px-6 top-[30px] group">
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
                  className="absolute inset-x-0 top-[80px] z-40 lg:hidden bg-white/95 backdrop-blur-xl rounded-[32px] border border-gray-100 p-8 shadow-2xl shadow-black/10 origin-top overflow-hidden"
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
