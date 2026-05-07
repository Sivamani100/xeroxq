"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  User,
  ShieldCheck,
  Zap,
  MessageCircle,
  Smartphone,
  Lock,
  Clock,
  CheckCircle2,
  ArrowRight,
  Globe,
  Users,
  FileText,
  Printer,
  TrendingUp,
  Cpu,
  Database,
  Wifi,
  Eye,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Target,
  Rocket,
  Brain,
  DollarSign,
  TrendingDown,
  PiggyBank,
  Calculator,
  Receipt,
  CreditCard,
  Wallet,
  Coins,
  Banknote,
  ChartBar,
  PieChart,
  LineChart,
  Activity,
  Percent,
  Timer,
  Building,
  Store,
  ShoppingCart,
  Package,
  Truck,
  Settings,
  Wrench,
  Hammer,
  HardDrive,
  Monitor,
  Keyboard,
  Mouse,
  Cable,
  Plug,
  Battery,
  Thermometer,
  Gauge
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "The Economics of Printing: Why Traditional Shops Are Losing Money and How XeroxQ Delivers 300% ROI",
    author: "XeroxQ Labs",
    role: "Business Analytics Division",
    date: "May 08, 2026",
    readTime: "25 min",
    category: "Engineering",
    content: [
      { type: "p", text: "The printing industry is experiencing a silent economic crisis. While customers see only final price of their print jobs, shop owners are struggling with razor-thin margins, rising costs, and declining revenues. The traditional business model that sustained copy shops for decades is now fundamentally broken. This is not just about efficiency—it is about survival in an economy that rewards automation and punishes manual processes." },
      
      { type: "h2", text: "The Broken Economics of Traditional Printing" },
      { type: "p", text: "Traditional print shops operate on a business model that has not evolved since 1990s. They charge per-page rates that have not kept pace with inflation, while their costs have skyrocketed. Rent, electricity, labor, maintenance, and supplies consume 85-90% of revenue, leaving almost nothing for profit or reinvestment." },
      
      { type: "p", text: "What makes this situation particularly dangerous is the illusion of profitability. Shop owners focus on revenue per job without accounting for true costs of doing business. They see cash coming in daily but fail to track slow drain of resources that is pushing their businesses toward insolvency." },
      
      { type: "p", text: "The economics are even worse when you factor in opportunity costs. The time spent on manual administrative tasks, customer service, and troubleshooting could be invested in business development, customer acquisition, or service expansion. Traditional shops are literally working harder while earning less." },

      { type: "h3", text: "The Labor Cost Death Spiral" },
      { type: "p", text: "Labor is the single biggest expense for traditional print shops, typically accounting for 35-45% of total costs. The manual nature of traditional printing requires multiple employees to handle customer service, document processing, equipment operation, and quality control." },
      
      { type: "p", text: "What is particularly devastating is that labor costs are rising faster than print prices can increase. Minimum wage increases, competition for skilled workers, and need for technical expertise create a cost spiral that shop owners cannot escape through price increases alone." },
      
      { type: "p", text: "The productivity of these labor hours is shockingly low. Studies show that manual shop employees spend 60% of their time on non-value-added activities: explaining processes to customers, fixing configuration errors, managing paperwork, and waiting for equipment. Only 40% of their time actually contributes to revenue-generating activities." },

      { type: "h3", text: "The Equipment Utilization Trap" },
      { type: "p", text: "Print shops invest heavily in equipment that sits idle most of time. The average utilization rate for traditional shop equipment is 30-40%, meaning that expensive machines are generating revenue for less than half of their available time." },
      
      { type: "p", text: "This underutilization creates a vicious cycle. Low utilization means high per-page costs, which forces shops to charge higher prices, which reduces demand, which further lowers utilization. The result is a death spiral where shops cannot invest in better equipment because they cannot afford it, and they cannot attract more customers because their prices are too high." },
      
      { type: "p", text: "The situation worsens with equipment depreciation. Most shops calculate depreciation based on theoretical usage rather than actual utilization, meaning they are underestimating their true costs and overestimating their profitability." }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        <article className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            <aside className="hidden lg:block lg:col-span-3 sticky top-32">
              <div className="space-y-10">
                 <button 
                  onClick={() => router.push('/blog')}
                  className="flex items-center gap-3 text-[10px] font-black text-[#94A3B8] hover:text-black uppercase tracking-[0.3em] transition-all group"
                 >
                   <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Registry
                 </button>

                 <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Written By</span>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                             <Calculator className="w-5 h-5 text-white" />
                          </div>
                          <div>
                             <div className="font-bold text-black text-xs tracking-tight">{post.author}</div>
                             <div className="text-[10px] font-black text-[#64748B] uppercase tracking-tighter">{post.role}</div>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-8 border-t border-[#E2E8F0]">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Published</span>
                          <span className="text-xs font-bold text-black mt-1 uppercase tracking-tight">{post.date}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Read Time</span>
                          <span className="text-xs font-bold text-black uppercase tracking-tight">{post.readTime}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                       <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-green-600 hover:text-white transition-all text-[#64748B]">
                          <Share2 className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-green-600 hover:text-white transition-all text-[#64748B]">
                          <Bookmark className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>

                 <div className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                       <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-[11px] text-[#64748B] font-black uppercase tracking-tight leading-relaxed">
                       This article was verified by our global protocol security auditors on May 08, 2026.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-md border border-green-200">
                      <DollarSign className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-green-700 uppercase">{post.category}</span>
                   </div>
                   <h1 className="text-4xl lg:text-6xl font-bold text-black tracking-tighter leading-[0.95]">
                      {post.title}
                   </h1>
                </div>

                <div className="prose prose-slate max-w-none space-y-10">
                  {post.content.map((item, i) => {
                    if (item.type === "p") return <p key={i} className="text-lg text-[#475569] font-medium leading-[1.6]">{item.text}</p>;
                    if (item.type === "h2") return <h2 key={i} className="text-2xl font-bold text-black tracking-tight pt-8 uppercase">{item.text}</h2>;
                    if (item.type === "h3") return <h3 key={i} className="text-xl font-bold text-black tracking-tight pt-6">{item.text}</h3>;
                    return null;
                  })}
                </div>

                
                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Data Privacy Nightmare</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Customer Experience Revolution</span>
                   </button>
                </div>
              </div>
            </div>

          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
