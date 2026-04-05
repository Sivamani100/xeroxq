"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef } from "react";

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
  "Students & Academic Labs",
  "Legal & Notary Nodes",
  "Logistics & Global Ports",
  "Travel & Transit Hubs",
  "Enterprise Security Teams",
  "Open Source Contributors",
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

  return (
    <section className="min-h-[70vh] bg-white text-black flex items-center justify-center px-6 pt-[100px] pb-0 overflow-hidden relative border-t border-gray-100">
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="w-full max-w-7xl animate-fade-in-up relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-10 max-w-xl text-left">
            <div className="space-y-4">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 border border-black/5 rounded-full mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Scale the Protocol</span>
               </div>
               <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black animate-fade-in-up uppercase leading-[0.9]">
                 Ready to Join <br /> the Mesh?
               </h2>
            </div>
            
            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed italic animate-fade-in-up [animation-delay:400ms]">
              "Start physicalizing your documents with absolute privacy. Join thousands of users in the global XeroxQ protocol mesh today."
            </p>
            
            <div className="flex flex-wrap gap-4 animate-fade-in-up [animation-delay:600ms] pt-4 px-1">
              <button className="group relative h-12 px-8 bg-[#FB432C] text-white rounded-full font-medium text-sm transition-all duration-300 shadow-xl shadow-brand-primary/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98]">
                Register Your Node
              </button>
              <button className="group relative h-12 px-8 bg-black text-white rounded-full font-medium text-sm transition-all duration-300 shadow-xl shadow-black/20 hover:bg-[#FB432C] hover:scale-[1.02] active:scale-[0.98]">
                Protocol Documentation
              </button>
            </div>
          </div>

          {/* Right Marquee */}
          <div ref={marqueeRef} className="relative h-[400px] lg:h-[500px] flex items-center justify-center animate-fade-in-up [animation-delay:400ms]">
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
          </div>
        </div>
      </div>
    </section>
  );
}
