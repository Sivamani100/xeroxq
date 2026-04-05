"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Terminal, 
  Code2, 
  Key, 
  Webhook, 
  Lock, 
  Server,
  Copy,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";

export default function DocsPage() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(`curl -X POST https://api.xeroxq.com/v1/jobs/route \\
  -H "Authorization: Bearer xrq_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "document_url": "s3://secure-bucket/doc.pdf",
    "target_shop_id": "shp_9849497911",
    "encryption_mode": "strict_ephemeral",
    "options": {
      "copies": 2,
      "color_mode": "grayscale"
    }
  }'`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Docs Hero */}
        <section className="relative pt-12 pb-16 border-b border-black/5 overflow-hidden">
           <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, x: -20 },
                 visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="max-w-xl"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-6">
                 <Terminal className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Developer Documentation</span>
               </div>
               
               <h1 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-black leading-none mb-6 uppercase">
                 The XeroxQ API
               </h1>
               <p className="text-lg font-medium text-gray-500 leading-relaxed italic">
                 Build zero-trace physicalization directly into your SaaS, hospital system, or government portal. Deliver secure printing to thousands of shops in AP via a single REST endpoint.
               </p>
             </motion.div>

             <motion.div 
               variants={{
                 hidden: { opacity: 0, x: 20 },
                 visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="flex-1 w-full max-w-lg"
             >
                <div className="bg-black rounded-2xl p-6 shadow-2xl relative group overflow-hidden border border-black/20">
                   <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <div className="flex gap-2">
                         <div className="w-3 h-3 rounded-full bg-[#FB432C]/80" />
                         <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                         <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[10px] font-mono text-white/50">api.xeroxq.com/v1</span>
                   </div>
                   <div className="font-mono text-sm text-green-400 space-y-2">
                      <p><span className="text-blue-400">const</span> xeroxq = <span className="text-blue-400">new</span> XeroxQ(process.env.XRQ_KEY);</p>
                      <p className="text-gray-500">// Initialize zero-knowledge routing</p>
                      <p>await xeroxq.jobs.<span className="text-yellow-200">route</span>(&#123;</p>
                      <p className="pl-4">file: documentStream,</p>
                      <p className="pl-4">shopId: <span className="text-orange-300">'shp_984949...'</span>,</p>
                      <p className="pl-4">shredAfterPrint: <span className="text-blue-400">true</span></p>
                      <p>&#125;);</p>
                   </div>
                </div>
             </motion.div>
          </div>
        </section>

        {/* Documentation Content */}
        <section className="py-24 bg-white relative z-20">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              {/* Sidebar Navigation */}
              <div className="hidden lg:block lg:col-span-3">
                 <div className="sticky top-40 space-y-8">
                    <div>
                       <h4 className="text-[10px] font-black text-black uppercase tracking-widest mb-4">Getting Started</h4>
                       <ul className="space-y-3">
                          <li className="text-[13px] font-bold text-[#FB432C] cursor-pointer">Protocol Overview</li>
                          <li className="text-[13px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer">Authentication</li>
                          <li className="text-[13px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer">Error Handling</li>
                       </ul>
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-black uppercase tracking-widest mb-4">Core Endpoints</h4>
                       <ul className="space-y-3">
                          <li className="text-[13px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer">POST /jobs/route</li>
                          <li className="text-[13px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer">GET /shops/radius</li>
                          <li className="text-[13px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer">GET /status</li>
                       </ul>
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-black uppercase tracking-widest mb-4">Event Flow</h4>
                       <ul className="space-y-3">
                          <li className="text-[13px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer">Webhooks Setup</li>
                          <li className="text-[13px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer">job.shredded Event</li>
                       </ul>
                    </div>
                 </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-9 space-y-20">
                 
                 {/* Section 1 */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                 >
                    <div className="flex items-center gap-3 mb-6">
                       <Lock className="w-6 h-6 text-black" />
                       <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Zero-Trace Architecture</h2>
                    </div>
                    <p className="text-[#64748B] font-medium leading-relaxed mb-6 text-lg">
                       The XeroxQ API is designed around absolute payload volatility. When you push a print job through our API, the payload is never stored on our central database. It is held in ephemeral memory (RAM), encrypted with a rolling session key, and streamed directly to the shop owner's client socket.
                    </p>
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4">
                       <Key className="w-6 h-6 text-amber-600 shrink-0" />
                       <div>
                          <h4 className="text-sm font-bold text-amber-900 uppercase">End-to-End Encryption Requirement</h4>
                          <p className="text-sm text-amber-800 mt-2">All files must be transmitted over TLS 1.3. We reject any integration attempting to pass payloads over unencrypted HTTP channels. Shop Owners hold the physical decryption key in their browser state.</p>
                       </div>
                    </div>
                 </motion.div>

                 {/* Section 2 */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                 >
                    <div className="flex items-center gap-3 mb-6">
                       <Server className="w-6 h-6 text-black" />
                       <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Initiating a Print Job</h2>
                    </div>
                    <p className="text-[#64748B] font-medium leading-relaxed mb-6 text-lg">
                       To trigger a physical print in a verified shop in Andhra Pradesh, utilize the <code className="bg-gray-100 text-black px-2 py-1 rounded-md text-sm">/jobs/route</code> endpoint. You must supply a valid strictly-ephemeral flag to guarantee auto-deletion post-print.
                    </p>

                    <div className="relative bg-black rounded-2xl overflow-hidden border border-black/20 group">
                       <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">CURL Request</span>
                          <button 
                             onClick={copyCode}
                             className="text-white/50 hover:text-white transition-colors"
                          >
                             {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                       </div>
                       <div className="p-6 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
<pre><code><span className="text-pink-400">curl</span> -X POST https://api.xeroxq.com/v1/jobs/route \
  -H <span className="text-yellow-200">"Authorization: Bearer xrq_live_xxxxxxxxxxxx"</span> \
  -H <span className="text-yellow-200">"Content-Type: application/json"</span> \
  -d '&#123;
    <span className="text-blue-300">"document_url"</span>: <span className="text-green-300">"s3://secure-bucket/doc.pdf"</span>,
    <span className="text-blue-300">"target_shop_id"</span>: <span className="text-green-300">"shp_9849497911"</span>,
    <span className="text-blue-300">"encryption_mode"</span>: <span className="text-green-300">"strict_ephemeral"</span>,
    <span className="text-blue-300">"options"</span>: &#123;
      <span className="text-blue-300">"copies"</span>: <span className="text-purple-300">2</span>,
      <span className="text-blue-300">"color_mode"</span>: <span className="text-green-300">"grayscale"</span>
    &#125;
  &#125;'</code></pre>
                       </div>
                    </div>
                 </motion.div>

                 {/* Section 3 */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                 >
                    <div className="flex items-center gap-3 mb-6">
                       <Webhook className="w-6 h-6 text-black" />
                       <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Webhooks & Shredding</h2>
                    </div>
                    <p className="text-[#64748B] font-medium leading-relaxed mb-6 text-lg">
                       Because our architecture does not retain state, your system must listen for webhooks to track job completion. The most critical event in the XeroxQ system is <code className="bg-gray-100 text-[#FB432C] font-bold px-2 py-1 rounded-md text-sm">job.shredded</code>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-6 border border-gray-200 rounded-2xl hover:border-black transition-colors">
                          <span className="text-[10px] font-black text-[#FB432C] uppercase tracking-widest block mb-2">Event</span>
                          <h4 className="text-lg font-bold text-black uppercase tracking-tight mb-2">job.printed</h4>
                          <p className="text-sm text-gray-500">Fired the moment the shop's local terminal successfully spools the document to the physical printer buffer.</p>
                       </div>
                       <div className="p-6 border border-gray-200 rounded-2xl hover:border-black transition-colors">
                          <span className="text-[10px] font-black text-[#FB432C] uppercase tracking-widest block mb-2">Event</span>
                          <h4 className="text-lg font-bold text-black uppercase tracking-tight mb-2">job.shredded</h4>
                          <p className="text-sm text-gray-500">Fired 30 seconds after printing, confirming the 7-pass military-grade erasure of the document from RAM.</p>
                       </div>
                    </div>
                 </motion.div>

              </div>
           </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
