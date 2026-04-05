"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
    <section className="min-h-[70vh] bg-white text-black flex items-center justify-center px-6 pt-[100px] pb-0 overflow-hidden relative border-t border-gray-100">
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
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
          <div className="space-y-10 max-w-xl text-left">
            <div className="space-y-4">
               <motion.div 
                 variants={{
                   hidden: { opacity: 0, y: 10 },
                   visible: { opacity: 1, y: 0 }
                 }}
                 className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 border border-black/5 rounded-full mb-4"
               >
                  <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Grow Your Business in AP</span>
               </motion.div>
               <motion.h2 
                 variants={itemVariants}
                 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-black uppercase leading-[0.9]"
               >
                 Ready to Grow <br /> Your Shop in AP?
               </motion.h2>
            </div>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-500 font-medium max-w-xl italic leading-relaxed"
            >
              Join hundreds of other xerox shop owners in Andhra Pradesh who are saving time and earning more with XeroxQ. It's 100% free.
            </motion.p>
            
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
              }}
              className="flex flex-wrap gap-4 pt-4 px-1"
            >
              <button className="group relative h-12 px-8 bg-[#FB432C] text-white rounded-full font-medium text-sm transition-all duration-300 shadow-xl shadow-brand-primary/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98]">
                Add Your Xerox Shop
              </button>
              <button className="group relative h-12 px-8 bg-black text-white rounded-full font-medium text-sm transition-all duration-300 shadow-xl shadow-black/20 hover:bg-[#FB432C] hover:scale-[1.02] active:scale-[0.98]">
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Right Marquee */}
          <motion.div 
            ref={marqueeRef} 
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 1 } }
            }}
            className="relative h-[400px] lg:h-[500px] flex items-center justify-center"
          >
            <div className="relative w-full h-full">
              <VerticalMarquee speed={18} className="h-full">
                {marqueeItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter py-8 marquee-item italic text-black/90 text-center lg:text-right"
                  >
                    {item}
                  </div>
                ))}
              </VerticalMarquee>
              
              {/* Top vignette */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-white via-white/50 to-transparent z-10"></div>
              
              {/* Bottom vignette */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/50 to-transparent z-10"></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
