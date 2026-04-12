"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Printer,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  Zap,
  ChevronRight,
  Star,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Play,
  Wifi,
  Lock,
  BarChart3,
  MessageCircle,
  PhoneCall,
  Sparkles,
  IndianRupee,
  HeartHandshake,
  Bell,
} from "lucide-react";

/* ─── Animated counter hook ─── */
function useCounter(end: number, duration = 2000, trigger: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, end, duration]);
  return count;
}

/* ─── Section wrapper ─── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Step card ─── */
interface StepCardProps {
  step: string | number;
  icon: React.ElementType;
  title: string;
  desc: string;
  delay?: number;
}
function StepCard({ step, icon: Icon, title, desc, delay = 0 }: StepCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-white rounded-2xl border border-[#E8ECF0] p-7 hover:border-[#FB432C]/30 hover:shadow-xl hover:shadow-[#FB432C]/5 transition-all duration-500"
    >
      <div className="absolute top-7 right-7 text-5xl font-black text-[#F1F5F9] select-none group-hover:text-[#FB432C]/10 transition-colors duration-300">
        {step}
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FB432C]/10 to-[#FF6B4A]/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-[#FB432C]" />
      </div>
      <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ─── Feature pill ─── */
interface FeaturePillProps {
  icon: React.ElementType;
  label: string;
}
function FeaturePill({ icon: Icon, label }: FeaturePillProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8ECF0] text-sm font-semibold text-[#475569] shadow-sm hover:border-[#FB432C]/40 hover:text-[#FB432C] transition-all duration-300 cursor-default">
      <Icon className="w-4 h-4" />
      {label}
    </div>
  );
}

/* ─── Testimonial card ─── */
interface TestimonialCardProps {
  name: string;
  shop: string;
  location: string;
  quote: string;
  rating: number;
  delay?: number;
}
function TestimonialCard({ name, shop, location, quote, rating, delay = 0 }: TestimonialCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border border-[#E8ECF0] p-6 flex flex-col gap-4 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500"
    >
      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-[#FB432C] text-[#FB432C]" />
        ))}
      </div>
      <p className="text-[#334155] text-sm leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-[#F1F5F9]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FB432C] to-[#FF6B4A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-bold text-[#1A1A2E]">{name}</div>
          <div className="text-xs text-[#94A3B8]">{shop} · {location}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Stat counter ─── */
interface StatCounterProps {
  value: number;
  suffix: string;
  label: string;
  trigger: boolean;
}
function StatCounter({ value, suffix, label, trigger }: StatCounterProps) {
  const count = useCounter(value, 2000, trigger);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="text-4xl md:text-5xl font-black text-[#FB432C] tabular-nums">
        {count.toLocaleString("en-IN")}{suffix}
      </div>
      <div className="text-sm font-medium text-[#94A3B8] uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function ForShopsPage() {
  const router = useRouter();
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "XeroxQ ki cost kya hai? (How much does it cost?)",
      a: "XeroxQ bilkul FREE hai aapke liye! Setup karne ke liye koi charge nahi, monthly fee nahi. Hum chahte hain ki AP ke local shops grow karein.",
    },
    {
      q: "Kya mujhe naya machine ya computer kharidna padega?",
      a: "Nahi! XeroxQ aapke existing machine aur computer ke saath kaam karta hai. Sirf ek internet connection aur browser chahiye.",
    },
    {
      q: "QR code se print kaise aata hai?",
      a: "Customer aapke shop ka QR scan karta hai → apna file upload karta hai → aapke dashboard pe seedha aa jaata hai. Phir aap ek click mein print kar sakte ho.",
    },
    {
      q: "kya yeh WhatsApp se better hai?",
      a: "Bahut zyada! WhatsApp mein files miss hote hain, quality kharab hoti hai, aur customer data phone mein rehta hai. XeroxQ mein files automatically delete hote hain printing ke baad — completely private.",
    },
    {
      q: "Agar customer shop pe aata hai tab kya?",
      a: "QR code scan karke file upload karta hai wahi shop pe. Aapke screen pe immediately dikhai deta hai. No USB, no email, no confusion.",
    },
    {
      q: "Main apna shop kaise add karun?",
      a: "Sirf 'Register Your Shop' button click karo, apna naam aur location dalo — aur instantly QR code mil jaayega. 2 minute ka kaam!",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC] font-sans selection:bg-[#FB432C] selection:text-white">

      {/* ═══════════ NAV ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E8ECF0] flex items-center justify-between px-6 md:px-12 h-16">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-[#FB432C] rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Printer className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black text-[#1A1A2E] tracking-tight">XeroxQ</span>
        </div>
        <button
          onClick={() => router.push("/register")}
          className="h-9 px-5 bg-[#FB432C] text-white text-sm font-semibold rounded-full hover:bg-[#E03520] hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-[#FB432C]/30"
        >
          Register Free →
        </button>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6 min-h-[85vh] flex flex-col items-center justify-center text-center">
        {/* BG decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-[#FB432C]/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FB432C]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-orange-100/60 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FB432C]/8 border border-[#FB432C]/15 text-[#FB432C] text-xs font-bold uppercase tracking-widest mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          XeroxQ for Shop Owners — Andhra Pradesh
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black text-[#1A1A2E] tracking-tighter leading-[1.02] max-w-4xl mx-auto mb-6"
        >
          Apne Xerox Shop Ka{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-[#FB432C]">Business Double</span>
            <span className="absolute -bottom-1 left-0 right-0 h-3 bg-[#FB432C]/10 rounded-full -z-0" />
          </span>{" "}
          Karo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed font-medium mb-10"
        >
          XeroxQ ek{" "}
          <strong className="text-[#1A1A2E]">Free Digital System</strong> hai jo aapke xerox shop mein customers ko{" "}
          <strong className="text-[#1A1A2E]">QR code scan karke</strong> directly file print karwane deta hai —
          no WhatsApp, no USB, no confusion.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.push("/register")}
            className="group h-14 px-8 bg-[#FB432C] text-white font-bold text-base rounded-full hover:bg-[#E03520] hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-[#FB432C]/40 flex items-center gap-2.5"
          >
            Shop Register Karo — Free Mein
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
          <button
            onClick={() => router.push("/#faq")}
            className="h-14 px-8 bg-white text-[#1A1A2E] font-bold text-base rounded-full border-2 border-[#E8ECF0] hover:border-[#FB432C] hover:text-[#FB432C] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Aur Jaano ↓
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex flex-wrap gap-3 justify-center mt-10"
        >
          {[
            { icon: ShieldCheck, label: "100% Free Forever" },
            { icon: Lock, label: "Privacy First" },
            { icon: Wifi, label: "Works on Any Device" },
            { icon: Zap, label: "2-Minute Setup" },
          ].map((f) => (
            <FeaturePill key={f.label} {...f} />
          ))}
        </motion.div>
      </section>

      {/* ═══════════ PROBLEM STATEMENT ═══════════ */}
      <Section className="py-20 px-6 bg-white border-y border-[#E8ECF0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest mb-4">
              😤 Ab Tak Ki Problem
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1A1A2E] tracking-tight mb-4">
              Aapke Shop Mein Yeh Problems Hain Na?
            </h2>
            <p className="text-[#64748B] max-w-xl mx-auto font-medium">
              Hum jaante hain. Isliye XeroxQ banaya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                emoji: "📱",
                problem: "WhatsApp pe files aate hain",
                desc: "Customer WhatsApp pe bhejta hai — files miss hote hain, quality kharab hoti hai, message history mein dhoond do.",
              },
              {
                emoji: "💾",
                problem: "USB pendrive ka jhanjhat",
                desc: "Har baar pendrive laata hai customer. Kabhi virus hota hai, kabhi format match nahi karta. Time waste.",
              },
              {
                emoji: "⏳",
                problem: "Queue manage nahi hota",
                desc: "Ek saath 5 customers hain, sab chillate hain, aap confuse ho jaate ho. Kaun pehle aaya, kya print karna hai?",
              },
              {
                emoji: "🔒",
                problem: "Customer data phone mein rehta hai",
                desc: "WhatsApp mein documents permanently store hote hain. Customer ki private files aapke phone mein — risk hai na?",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-xl bg-red-50/50 border border-red-100"
              >
                <div className="text-3xl flex-shrink-0">{item.emoji}</div>
                <div>
                  <div className="font-bold text-[#1A1A2E] mb-1">{item.problem}</div>
                  <div className="text-sm text-[#64748B] leading-relaxed">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ SOLUTION — HOW IT WORKS ═══════════ */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold uppercase tracking-widest mb-4">
              ✅ XeroxQ ka Solution
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-[#1A1A2E] tracking-tight mb-4">
              Kaise Kaam Karta Hai?
            </h2>
            <p className="text-[#64748B] max-w-xl mx-auto font-medium text-lg">
              Sirf 3 simple steps — aap aur aapka customer dono khush!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              step="1"
              icon={QrCode}
              title="QR Code Lagao Shop Pe"
              desc="Register karne ke baad aapko ek unique QR code milega. Ise print karke shop ke counter pe chipkao — anyone aata hai scan kare ga."
              delay={0}
            />
            <StepCard
              step="2"
              icon={Smartphone}
              title="Customer File Upload Karta Hai"
              desc="Customer apne phone se QR scan karta hai aur directly file upload karta hai — PDF, Word, image sab supported. No app download needed."
              delay={0.1}
            />
            <StepCard
              step="3"
              icon={Printer}
              title="Aap Print Karo — Done!"
              desc="File instantly aapke dashboard mein aata hai. Ek click mein preview karo, edit karo, aur print karo. Customer ki ID aapke paas safe nahi rehti."
              delay={0.2}
            />
          </div>

          {/* Flow visualization */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-[#FB432C]/5 to-orange-50 border border-[#FB432C]/15">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              {[
                { icon: "📱", label: "Customer scans QR" },
                { icon: "→", label: "", isArrow: true },
                { icon: "📤", label: "File upload hota hai" },
                { icon: "→", label: "", isArrow: true },
                { icon: "🖥️", label: "Aapke screen pe aata hai" },
                { icon: "→", label: "", isArrow: true },
                { icon: "🖨️", label: "Print ho jaata hai!" },
              ].map((item, i) =>
                item.isArrow ? (
                  <div key={i} className="text-[#FB432C] font-black text-2xl hidden md:block">→</div>
                ) : (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="text-xs font-bold text-[#475569] max-w-[100px]">{item.label}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════ STATS ═══════════ */}
      <section
        ref={statsRef}
        className="py-20 px-6 bg-[#1A1A2E]"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              XeroxQ Ka Real Impact
            </h2>
            <p className="text-[#94A3B8] font-medium">Andhra Pradesh ke shops ka data</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={500} suffix="+" label="Happy Shops" trigger={statsInView} />
            <StatCounter value={25000} suffix="+" label="Jobs Printed" trigger={statsInView} />
            <StatCounter value={98} suffix="%" label="Satisfaction Rate" trigger={statsInView} />
            <StatCounter value={0} suffix="₹" label="Cost to Join" trigger={statsInView} />
          </div>
        </div>
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <Section className="py-24 px-6 bg-white border-y border-[#E8ECF0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FB432C]/8 border border-[#FB432C]/15 text-[#FB432C] text-xs font-bold uppercase tracking-widest mb-4">
              💰 Business Benefits
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-[#1A1A2E] tracking-tight mb-4">
              Aapke Shop Ko Kya Milega?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                color: "from-green-50 to-emerald-50",
                iconColor: "text-green-600",
                title: "Zyada Customers",
                desc: "Digital system dekh ke naye customers aate hain. Modern shop = zyada trust = zyada business.",
              },
              {
                icon: Clock,
                color: "from-blue-50 to-indigo-50",
                iconColor: "text-blue-600",
                title: "Time Bachao",
                desc: "No more WhatsApp forwarding, no USB issues. Customer file upload karta hai, aap directly print karo.",
              },
              {
                icon: IndianRupee,
                color: "from-yellow-50 to-amber-50",
                iconColor: "text-amber-600",
                title: "Zyada Revenue",
                desc: "Queue system se zyada jobs handle kar sako. Efficient workflow = zyada printing = zyada earning.",
              },
              {
                icon: ShieldCheck,
                color: "from-purple-50 to-violet-50",
                iconColor: "text-purple-600",
                title: "Privacy Guarantee",
                desc: "Customer ki files print hone ke baad automatically delete hoti hain. Legal aur ethical way to operate.",
              },
              {
                icon: Bell,
                color: "from-orange-50 to-red-50",
                iconColor: "text-[#FB432C]",
                title: "Real-Time Notifications",
                desc: "Nayi job aate hi aapke screen pe notification aata hai — sound ke saath! Koi order miss nahi hoga.",
              },
              {
                icon: BarChart3,
                color: "from-teal-50 to-cyan-50",
                iconColor: "text-teal-600",
                title: "Dashboard & Analytics",
                desc: "Kitne jobs complete hue, kitne pending hain — sab ek jagah dekhne milega. Smart business decisions lo.",
              },
            ].map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${b.color} border border-white hover:-translate-y-1 hover:shadow-lg transition-all duration-400`}
              >
                <b.icon className={`w-8 h-8 ${b.iconColor} mb-4`} />
                <h3 className="font-bold text-[#1A1A2E] text-base mb-2">{b.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ VS WHATSAPP COMPARISON ═══════════ */}
      <Section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#1A1A2E] tracking-tight mb-4">
              XeroxQ vs WhatsApp
            </h2>
            <p className="text-[#64748B] font-medium">Khud decide karo — kaunsa better hai?</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#E8ECF0] shadow-xl">
            <div className="grid grid-cols-3 bg-[#F8FAFC] text-sm font-bold text-center py-4 border-b border-[#E8ECF0]">
              <div className="text-[#94A3B8]">Feature</div>
              <div className="text-[#FB432C] flex items-center justify-center gap-2">
                <div className="w-5 h-5 bg-[#FB432C] rounded-md flex items-center justify-center">
                  <Printer className="w-3 h-3 text-white" />
                </div>
                XeroxQ
              </div>
              <div className="text-[#64748B] flex items-center justify-center gap-1.5">
                💬 WhatsApp
              </div>
            </div>
            {[
              ["File quality", "✅ Original quality", "❌ Compressed hoti hai"],
              ["Privacy", "✅ Auto delete", "❌ Forever stored"],
              ["Queue management", "✅ Dashboard mein sab", "❌ Messages mein dhoondo"],
              ["Notification", "✅ Real-time alert", "❌ Miss ho sakta hai"],
              ["Multiple files", "✅ Easy", "❌ Confusing"],
              ["Cost", "✅ Free", "✅ Free"],
              ["Professional look", "✅ Modern shop", "❌ Unprofessional"],
              ["Data safety", "✅ Compliant", "❌ Risk hai"],
            ].map(([feature, xeroxq, whatsapp], i) => (
              <div
                key={i}
                className={`grid grid-cols-3 text-sm py-3.5 px-4 border-b border-[#F1F5F9] ${i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}
              >
                <div className="font-medium text-[#475569]">{feature}</div>
                <div className="text-center font-medium text-[#1A1A2E]">{xeroxq}</div>
                <div className="text-center font-medium text-[#94A3B8]">{whatsapp}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <Section className="py-24 px-6 bg-white border-y border-[#E8ECF0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FB432C]/8 border border-[#FB432C]/15 text-[#FB432C] text-xs font-bold uppercase tracking-widest mb-4">
              ⭐ Real Shop Owners
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1A1A2E] tracking-tight">
              Unke Shops Ne Kya Kaha
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              name="Ravi Kumar"
              shop="Sri Sai Xerox"
              location="Vijayawada"
              quote="Pehle WhatsApp pe files gum ho jaate the. Ab QR system se sab controlled hai. Mahine mein 30% zyada jobs ho rahe hain."
              rating={5}
              delay={0}
            />
            <TestimonialCard
              name="Lakshmi Devi"
              shop="Digital Print Hub"
              location="Guntur"
              quote="Setup sirf 5 minute mein hua. Ab customers khud file upload karte hain, mujhe kuch nahi karna. Real-time notification bahut helpful hai!"
              rating={5}
              delay={0.1}
            />
            <TestimonialCard
              name="Venkat Rao"
              shop="Prakash Prints"
              location="Vizag"
              quote="Students bahut aate hain mere shop mein. Ab sabke files organized rehte hain. No confusion, no arguments. Business smooth ho gaya."
              rating={5}
              delay={0.2}
            />
          </div>
        </div>
      </Section>

      {/* ═══════════ FAQ ═══════════ */}
      <Section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#1A1A2E] tracking-tight mb-4">
              Questions & Answers
            </h2>
            <p className="text-[#64748B] font-medium">Aapke mind mein jo bhi sawaal hai — yahan milega jawab</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  openFaq === i
                    ? "border-[#FB432C]/30 bg-[#FB432C]/3"
                    : "border-[#E8ECF0] bg-white hover:border-[#FB432C]/20"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left group"
                >
                  <span className={`font-semibold text-sm md:text-base transition-colors ${openFaq === i ? "text-[#FB432C]" : "text-[#1A1A2E]"}`}>
                    {faq.q}
                  </span>
                  <span className={`ml-4 flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-black transition-all duration-300 ${openFaq === i ? "bg-[#FB432C] border-[#FB432C] text-white rotate-45" : "border-[#E8ECF0] text-[#94A3B8]"}`}>
                    +
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-[#64748B] leading-relaxed text-sm">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <Section className="py-24 px-6 bg-[#1A1A2E]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="inline-flex w-16 h-16 rounded-2xl bg-[#FB432C] items-center justify-center mb-8 shadow-2xl shadow-[#FB432C]/40"
          >
            <HeartHandshake className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
            Ready Ho? Chalo Start Karte Hain!
          </h2>
          <p className="text-[#94A3B8] text-lg mb-10 leading-relaxed">
            Andhra Pradesh ke{" "}
            <span className="text-white font-bold">500+ shops</span> already XeroxQ use kar rahe hain.
            <br />
            Aapka shop bhi aaj se digital ho sakta hai — bilkul{" "}
            <span className="text-[#FB432C] font-bold">free mein!</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <button
              onClick={() => router.push("/register")}
              className="group h-14 px-10 bg-[#FB432C] text-white font-bold text-base rounded-full hover:bg-white hover:text-[#FB432C] transition-all duration-300 shadow-2xl shadow-[#FB432C]/50 flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95"
            >
              Shop Register Karo — Free!
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="tel:+919849497911"
              className="h-14 px-10 bg-white/10 text-white font-bold text-base rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95"
            >
              <PhoneCall className="w-5 h-5" />
              Call Karo: 9849497911
            </a>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              "✅ No Hidden Charges",
              "✅ Existing Hardware Works",
              "✅ 2-Minute Setup",
              "✅ 24/7 Support",
            ].map((item) => (
              <span key={item} className="text-sm text-[#64748B] font-medium">{item}</span>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="py-8 px-6 bg-[#111827] text-center text-[#4B5563] text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-[#FB432C] rounded-md flex items-center justify-center">
            <Printer className="w-3 h-3 text-white" />
          </div>
          <span className="text-white font-bold">XeroxQ</span>
        </div>
        <p>© {new Date().getFullYear()} XeroxQ · Andhra Pradesh's Digital Printing Network</p>
        <p className="mt-1">
          <a href="mailto:support@arkio.in" className="hover:text-[#FB432C] transition-colors">support@arkio.in</a>
          {" · "}
          <a href="tel:+919849497911" className="hover:text-[#FB432C] transition-colors">+91 98494 97911</a>
        </p>
      </footer>
    </div>
  );
}
