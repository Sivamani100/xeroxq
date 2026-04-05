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
    name: 'Jonathan Yombo',
    role: 'Software Engineer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'XeroxQ is really extraordinary and very practical, no need to break your head. A real gold mine for decentralized printing.',
  },
  {
    name: 'Yves Kalume',
    role: 'GDE - Android',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'With no experience in decentralized protocols I just set up my entire shop node in a few minutes thanks to the XeroxQ mesh.',
  },
  {
    name: 'Yucel Faruksahan',
    role: 'Creator, Tailkits',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'Great work on the Mercury protocol. This is one of the best privacy-first architectures I have seen so far!',
  },
  {
    name: 'Sarah Chen',
    role: 'Security Consultant',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'The AES-256 E2E encryption combined with zero data retention makes XeroxQ the gold standard for sensitive document physicalization.',
  },
  {
    name: 'Shekinah Tshiokufila',
    role: 'Senior Software Engineer',
    image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'XeroxQ is redefining the standard of secure document delivery. The shard-encrypted transmission is an incredible wonder of engineering.',
  },
  {
    name: 'Oketa Fred',
    role: 'Fullstack Developer',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'I absolutely love the mesh reliability! The autonomous shop nodes are perfectly designed and easy to use.',
  },
  {
    name: 'Zeki',
    role: 'Founder, ChatExtend',
    image: 'https://images.unsplash.com/photo-1501196356658-939db80463ef?q=80&w=120&h=120&auto=format&fit=crop',
    quote: "Using the Mercury Mesh has been like unlocking a secret privacy superpower. It's the perfect fusion of simplicity and absolute encryption.",
  },
  {
    name: 'Joseph Kitheka',
    role: 'Protocol Architect',
    image: 'https://images.unsplash.com/photo-1513910367299-bce8d8a0ebf6?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'XeroxQ has transformed the way I think about document lifecycle. The flexibility to purge transient data globally is a game-changer.',
  },
  {
    name: 'Khatab Wedaa',
    role: 'MerakiUI Creator',
    image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=120&h=120&auto=format&fit=crop',
    quote: "XeroxQ is an elegant, clean, and responsive protocol. It's very helpful to start fast with secure document physicalization.",
  },
  {
    name: 'Rodrigo Aguilar',
    role: 'TailwindAwesome Creator',
    image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'I love how structured the protocol logic is. Simple to use, and beautifully designed. Real professional grade hardware bridging.',
  },
  {
    name: 'Eric Ampire',
    role: 'Mobile Engineer',
    image: 'https://images.unsplash.com/photo-1504257432379-735520683e1c?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'The universal hardware bridging is the perfect solution for anyone. Driver independent and works across any territorial mesh sector.',
  },
  {
    name: 'Roland Tubonge',
    role: 'Security Engineer',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3dbdf5bb33?q=80&w=120&h=120&auto=format&fit=crop',
    quote: 'The protocol is so well designed that even with minimal security knowledge you can perform absolute privacy-centric miracles.',
  },
]

const chunkArray = (array: Testimonial[], chunkSize: number): Testimonial[][] => {
  const result: Testimonial[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize))
  }
  return result
}

export default function WallOfLoveSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Show only 3 initially (one from each column if possible) or just 3 total.
  // The user said "show only two or three". 
  // Given a 3-column grid, showing 3 works best (one per col).
  const displayedTestimonials = isExpanded ? testimonials : testimonials.slice(0, 3)
  const testimonialChunks = chunkArray(displayedTestimonials, Math.ceil(displayedTestimonials.length / 3))

  return (
    <section className="py-24 bg-white border-t border-gray-100 overflow-hidden">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="text-center space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/5">
             <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
             <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Community Feedback</span>
          </div>
          <h2 className="text-[40px] md:text-[54px] font-bold tracking-tighter text-black leading-none uppercase">Loved by the <br /> Community.</h2>
          <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-lg mx-auto">
             "The high-fidelity protocol for secure document delivery. Distributed, sharded, and verified by thousands."
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonialChunks.map((chunk, chunkIndex) => (
              <div key={chunkIndex} className="space-y-6">
                {chunk.map((testimonial) => (
                  <motion.div
                    key={testimonial.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="border-gray-100 bg-[#F8FAFC]/50 hover:bg-white hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-300 group">
                      <CardContent className="p-8 space-y-6">
                        <blockquote className="text-base font-medium text-black leading-relaxed italic">
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
        </div>

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
                <span>Show less signals</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Load more signals</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
