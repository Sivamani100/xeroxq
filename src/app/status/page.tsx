"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  CheckCircle2, 
  Activity, 
  Server, 
  Cpu, 
  Database, 
  Globe,
  Clock,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatusPage() {
  const components = [
    { name: "Global Routing API", status: "operational", icon: Globe, uptime: "99.99%" },
    { name: "Ephemeral Storage (RAM)", status: "operational", icon: Database, uptime: "100%" },
    { name: "WebSocket Edge Nodes", status: "operational", icon: Activity, uptime: "99.95%" },
    { name: "Document Shredding Engine", status: "operational", icon: ShieldCheck, uptime: "100%" },
    { name: "SMS / OTP Gateway", status: "operational", icon: Server, uptime: "99.98%" },
    { name: "AP Shop Directory Sync", status: "operational", icon: Cpu, uptime: "99.99%" }
  ];

  const SystemMetrics = [
    { label: "Active Nodes Online", value: "342", sub: "across AP" },
    { label: "Routing Latency", value: "42ms", sub: "avg. p95" },
    { label: "Files Shredded Today", value: "1,204", sub: "0 retained" }
  ];

  const pastIncidents = [
    {
       date: "April 2, 2026",
       title: "Elevated Routing Latency in Vijayawada Cluster",
       status: "Resolved",
       desc: "We observed elevated latency (up to 400ms) for print jobs routed to the Vijayawada cluster due to an upstream ISP fluctuation. The redundancy layer automatically re-routed traffic. No payloads were compromised.",
       time: "14:05 IST - 14:22 IST"
    },
    {
       date: "March 28, 2026",
       title: "SMS Gateway Delay",
       status: "Resolved",
       desc: "Users experienced a 10-15 second delay in receiving their secure OTPs. The node was restarted and operations resumed normally.",
       time: "09:00 IST - 09:12 IST"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Status Hero */}
        <section className="relative pt-12 pb-16 text-center">
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="mx-auto max-w-3xl"
             >
               <h1 className="text-[40px] md:text-[64px] font-extrabold tracking-tighter text-black leading-none mb-12 uppercase">
                 Network Status
               </h1>

               {/* Giant Status Banner */}
               <div className="p-8 md:p-12 bg-emerald-50 border border-emerald-200 rounded-[32px] shadow-2xl shadow-emerald-500/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 opacity-10 blur-[100px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                     <div>
                        <div className="flex items-center gap-3 mb-3">
                           <div className="relative flex h-8 w-8 items-center justify-center">
                             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                             <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500"></span>
                           </div>
                           <h2 className="text-3xl font-black text-emerald-900 uppercase tracking-tight">All Systems Operational</h2>
                        </div>
                        <p className="text-emerald-700 font-medium">As of today, the XeroxQ decentralized mesh is functioning optimally.</p>
                     </div>
                     <div className="shrink-0 bg-white/60 border border-emerald-200 px-6 py-4 rounded-2xl backdrop-blur-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">90-Day Uptime</span>
                        <span className="text-3xl font-black text-emerald-900">99.99%</span>
                     </div>
                  </div>
               </div>
             </motion.div>
          </div>
        </section>

        {/* Live Metrics Grid */}
        <section className="py-12 border-b border-gray-100 bg-white">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {SystemMetrics.map((metric, i) => (
                 <motion.div 
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 border border-gray-100 rounded-[24px] flex items-center justify-between group hover:border-[#FB432C]/30 hover:shadow-lg transition-all duration-300"
                 >
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1 group-hover:text-[#FB432C] transition-colors">{metric.label}</span>
                       <span className="text-[11px] font-bold text-gray-400 italic">{metric.sub}</span>
                    </div>
                    <span className="text-3xl font-black text-black tracking-tight">{metric.value}</span>
                 </motion.div>
              ))}
           </div>
        </section>

        {/* Core Components */}
        <section className="py-24 bg-[#F8FAFC]">
           <div className="max-w-[1000px] mx-auto px-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-10">Platform Infrastructure</h3>
              
              <div className="space-y-4">
                 {components.map((c, i) => (
                    <motion.div
                       key={c.name}
                       initial={{ opacity: 0, x: -20 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.05 }}
                       className="p-5 bg-white border border-gray-200 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                             <c.icon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                             <span className="text-sm font-bold text-black uppercase tracking-wider block">{c.name}</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block hidden md:block">90-Day Uptime: {c.uptime}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Operational</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Past Incidents */}
        <section className="py-24 bg-white border-t border-gray-100">
           <div className="max-w-[1000px] mx-auto px-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-10">Incident History</h3>
              
              <div className="space-y-12 pl-4 border-l-2 border-gray-100">
                 {pastIncidents.map((incident, i) => (
                    <motion.div
                       key={i}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       className="relative pl-6"
                    >
                       <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-white border-4 border-gray-300" />
                       
                       <div className="mb-3 flex items-center gap-3">
                          <span className="text-[12px] font-black uppercase tracking-widest text-[#FB432C]">{incident.date}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">{incident.status}</span>
                       </div>
                       
                       <h4 className="text-xl font-bold text-black mb-3">{incident.title}</h4>
                       <p className="text-gray-500 text-sm leading-relaxed mb-4">{incident.desc}</p>
                       
                       <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-widest">{incident.time}</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
