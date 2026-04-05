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
    <section className="py-24 bg-white border-t border-gray-100 overflow-hidden">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="text-center space-y-4 mb-20">
          <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8 mx-auto">
             <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
             <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">User Stories</span>
          </div>
          <h2 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-black leading-none mb-6">
            Hear from Xerox Shop Owners in AP
          </h2>
          <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
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
                staggerChildren: 0.1
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
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                      }}
                    >
                      <Card className="border-gray-100 bg-[#F8FAFC]/50 hover:bg-white hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-300 group">
                        <CardContent className="p-6 md:p-8 space-y-6">
                          <blockquote className="text-sm md:text-base font-medium text-black leading-relaxed italic">
                            "{testimonial.quote}"
                          </blockquote>
                          
                          <div className="flex items-center gap-4 pt-6 border-t border-black/5">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarImage src={testimonial.image} alt={testimonial.name} />
                              <AvatarFallback className="bg-black text-white text-[10px] font-black">{testimonial.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-black tracking-tight flex items-center gap-1.5">
                                {testimonial.name}
                                <ArrowUpRight className="w-3 h-3 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{testimonial.role}</div>
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
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-8 z-10" />
          )}
        </motion.div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "group relative flex items-center gap-3 px-8 h-12 bg-black text-white rounded-full font-medium text-sm transition-all duration-300 shadow-xl shadow-black/20 hover:bg-[#FB432C] hover:scale-[1.02] active:scale-[0.98]",
              isExpanded && "bg-[#FB432C] text-white border-transparent shadow-brand-primary/20 hover:bg-black"
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
