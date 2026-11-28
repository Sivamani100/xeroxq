"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { DownloadModal } from "@/components/ui/download-modal";

interface VerticalMarqueeProps {
  children: ReactNode;
  pauseOnHover?: boolean;
  reverse?: boolean;
  className?: string;
  speed?: number;
  onItemsRef?: (items: HTMLElement[]) => void;
}

function VerticalMarquee({
  children,
  pauseOnHover = false,
  reverse = false,
  className,
  speed = 30,
  onItemsRef,
}: VerticalMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onItemsRef && containerRef.current) {
      const items = Array.from(containerRef.current.querySelectorAll('.marquee-item')) as HTMLElement[];
      onItemsRef(items);
    }
  }, [onItemsRef]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group flex flex-col overflow-hidden",
        className
      )}
      style={
        {
          "--duration": `${speed}s`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex shrink-0 flex-col animate-marquee-vertical",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex shrink-0 flex-col animate-marquee-vertical",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}

const marqueeItems = [
  "Grow Your Business",
  "Zero WhatsApp Mess",
  "Instant QR Printing",
  "More Customers",
  "AP Shop Network",
  "Easy Shop Management",
  "Free Service",
  "Modern Xerox Shop"
];

export default function CTAWithVerticalMarquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  useEffect(() => {
    const marqueeContainer = marqueeRef.current;
    if (!marqueeContainer) return;

    const updateOpacity = () => {
      const items = marqueeContainer.querySelectorAll('.marquee-item');
      const containerRect = marqueeContainer.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height / 2;

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterY = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(centerY - itemCenterY);
        const maxDistance = containerRect.height / 2;
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const opacity = 1 - normalizedDistance * 0.75;
        (item as HTMLElement).style.opacity = opacity.toString();
      });
    };

    const animationFrame = () => {
      updateOpacity();
      requestAnimationFrame(animationFrame);
    };

    const frame = requestAnimationFrame(animationFrame);

    return () => cancelAnimationFrame(frame);
  }, []);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <section className="min-h-[65vh] bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center px-6 pt-[100px] pb-0 overflow-hidden relative border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="w-full max-w-7xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-8 max-w-xl text-left">
            <div className="space-y-4">
               <motion.div
                 variants={{
                   hidden: { opacity: 0, y: 10 },
                   visible: { opacity: 1, y: 0 }
                 }}
                 className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-full mb-3"
               >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FB432C]" />
                  <span className="text-[11px] font-semibold text-[#525252] dark:text-[#A1A1A6] uppercase tracking-wider">Grow Your Business in AP</span>
               </motion.div>
               <motion.h2
                 variants={itemVariants}
                 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-[1.06]"
               >
                 Ready to Grow <br /> Your Shop in AP?
               </motion.h2>
            </div>

            <motion.p
              variants={itemVariants}
              className="text-base md:text-lg text-[#525252] dark:text-[#A1A1A6] font-normal max-w-xl leading-relaxed"
            >
              Join hundreds of other xerox shop owners in Andhra Pradesh who are saving time and earning more with XeroxQ. It&apos;s 100% free.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
              }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <button
                type="button"
                onClick={() => setIsDownloadOpen(true)}
                className="h-11 px-7 bg-[#FB432C] hover:bg-[#E03923] text-white rounded-full font-semibold text-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Desktop App</span>
              </button>
              <Link
                href="/how-it-works"
                className="h-11 px-7 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] rounded-full font-semibold text-sm transition-colors hover:bg-[#FB432C] dark:hover:bg-[#FB432C] dark:hover:text-white inline-flex items-center"
              >
                See How It Works
              </Link>
            </motion.div>
          </div>

          {/* Right Marquee */}
          <motion.div
            ref={marqueeRef}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
            }}
            className="relative h-[400px] lg:h-[500px] flex items-center justify-center"
          >
            <div className="relative w-full h-full">
              <VerticalMarquee speed={18} className="h-full">
                {marqueeItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-3xl md:text-5xl font-semibold tracking-tight py-7 marquee-item text-[#171717] dark:text-[#EDEDED] text-center lg:text-right"
                  >
                    {item}
                  </div>
                ))}
              </VerticalMarquee>

              {/* Top vignette */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-[#FAFAFA] via-[#FAFAFA]/60 dark:from-[#111113] dark:via-[#111113]/60 to-transparent z-10"></div>

              {/* Bottom vignette */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/60 dark:from-[#111113] dark:via-[#111113]/60 to-transparent z-10"></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      <DownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
    </section>
  );
}
