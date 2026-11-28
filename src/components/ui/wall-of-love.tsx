"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type Testimonial = {
  name: string
  role: string
  image: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: "Samba Siva",
    role: "Shop Owner, Guntur",
    image: "https://i.pravatar.cc/150?u=samba",
    quote: "XeroxQ has completely stopped the WhatsApp mess in my shop. Customers just scan the QR code and print. It saves me so much time every day!"
  },
  {
    name: "Venkatesh P.",
    role: "Shop Owner, Vijayawada",
    image: "https://i.pravatar.cc/150?u=venkat",
    quote: "I've seen a 20% increase in customers since adding my shop to the XeroxQ network. Students love the privacy and speed."
  },
  {
    name: "Prakash Rao",
    role: "Shop Owner, Vizag",
    image: "https://i.pravatar.cc/150?u=prakash",
    quote: "The setup was free and took only 5 minutes. Now my shop looks modern and I don't have to deal with cables or emails anymore."
  },
  {
    name: "Anand Kumar",
    role: "Shop Owner, Nellore",
    image: "https://i.pravatar.cc/150?u=anand",
    quote: "The best part is that it's 100% free for us. No joining fees, and the QR code system is very easy for even basic users."
  },
  {
    name: "Rajesh V.",
    role: "Shop Owner, Tirupati",
    image: "https://i.pravatar.cc/150?u=rajesh",
    quote: "XeroxQ has given my local shop a premium feel. Customers are impressed by the technology, and I get more repeat orders now."
  },
  {
    name: "Srinivas Rao",
    role: "Shop Owner, Kurnool",
    image: "https://i.pravatar.cc/150?u=srinivas",
    quote: "Managing huge volumes of student prints during exam season used to be a headache. XeroxQ's queue system is a lifesaver for my shop."
  },
  {
    name: "Lakshmi Nara",
    role: "Shop Owner, Nellore",
    image: "https://i.pravatar.cc/150?u=lakshmi",
    quote: "As a female shop owner, I value the safety XeroxQ provides. No more awkward WhatsApp exchanges with unknown numbers anymore."
  },
  {
    name: "Murali Krishna",
    role: "Shop Owner, Anantapur",
    image: "https://i.pravatar.cc/150?u=murali",
    quote: "With so many regular customers coming for quick document prints, XeroxQ makes the process 10x faster and much more organized."
  },
  {
    name: "Bhavani S.",
    role: "Shop Owner, Vizianagaram",
    image: "https://i.pravatar.cc/150?u=bhavani",
    quote: "My shop is now known as the 'Smart Xerox Point' in my area. Technology has really helped me stand out from other local shops."
  },
  {
    name: "Kiran Ch.",
    role: "Shop Owner, Kakinada",
    image: "https://i.pravatar.cc/150?u=kiran",
    quote: "100% uptime and zero maintenance cost. It works perfectly with my existing machines. Best digital tool for shop keepers in AP."
  },
  {
    name: "Savitri M.",
    role: "Shop Owner, Rajahmundry",
    image: "https://i.pravatar.cc/150?u=savitri",
    quote: "The QR code at my counter is now the most scanned thing in the shop! Modern, efficient, and definitely more profitable for me."
  }
]



export default function WallOfLoveSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Show only 3 initially (one from each column if possible) or just 3 total.
  // The user said "show only two or three". 
  // Given a 3-column grid, showing 3 works best (one per col).
  const displayedTestimonials = isExpanded ? testimonials : testimonials.slice(0, 3)
  const columns = [0, 1, 2];

  return (
    <section className="py-24 bg-[#FAFAFA] dark:bg-[#111113] border-t border-[#171717]/[0.08] dark:border-white/[0.08] overflow-hidden">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 h-7 rounded-full bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] mb-5 mx-auto">
             <div className="w-1.5 h-1.5 rounded-full bg-[#FB432C]" />
             <span className="text-[11px] font-semibold text-[#525252] dark:text-[#A1A1A6] uppercase tracking-wider leading-none">User Stories</span>
          </div>
          <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-tight mb-4">
            Hear from Xerox Shop Owners in AP
          </h2>
          <p className="text-base md:text-lg font-normal text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-2xl mx-auto">
            See how xerox shop owners across Andhra Pradesh are growing their business and saving time with XeroxQ.
          </p>
        </div>

        <motion.div
          key={isExpanded ? "expanded" : "collapsed"}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
          className="relative"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {columns.map((colIndex) => (
              <div key={colIndex} className="space-y-6">
                {displayedTestimonials
                  .filter((_, i) => i % 3 === colIndex)
                  .map((testimonial) => (
                    <motion.div
                      key={testimonial.name}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
                      }}
                    >
                      <Card className="border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] hover:border-[#FB432C]/40 transition-colors group">
                        <CardContent className="p-6 md:p-7 space-y-5">
                          <blockquote className="text-sm md:text-[15px] font-normal text-[#171717] dark:text-[#EDEDED] leading-relaxed">
                            &ldquo;{testimonial.quote}&rdquo;
                          </blockquote>

                          <div className="flex items-center gap-3.5 pt-5 border-t border-[#171717]/[0.06] dark:border-white/[0.06]">
                            <Avatar className="h-10 w-10 border border-[#171717]/[0.08] dark:border-white/[0.10]">
                              <AvatarImage src={testimonial.image} alt={testimonial.name} />
                              <AvatarFallback className="bg-[#FB432C] text-white text-xs font-semibold">{testimonial.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight flex items-center gap-1.5">
                                {testimonial.name}
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#FB432C] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[11px] font-medium text-[#737373] dark:text-[#85858B]">{testimonial.role}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            ))}
          </div>

          {!isExpanded && testimonials.length > 3 && (
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/80 dark:from-[#111113] dark:via-[#111113]/80 to-transparent flex items-end justify-center pb-6 z-10 pointer-events-none" />
          )}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "group relative flex items-center gap-2.5 px-7 h-11 rounded-full font-semibold text-sm transition-colors cursor-pointer",
              isExpanded
                ? "bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113]"
                : "bg-[#FB432C] hover:bg-[#E03923] text-white"
            )}
          >
            {isExpanded ? (
              <>
                <Minus className="w-4 h-4" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Load more reviews</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
