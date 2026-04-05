import { motion } from "framer-motion";

/**
 * SEO Keywords Section
 *
 * This is a VISIBLE, accessible section placed above the footer on key pages.
 * It contains natural-language keyword-rich content for every search intent
 * related to XeroxQ: xerox shops, A4 printing, document services, etc.
 *
 * Strategy: Google rewards pages where keywords appear in natural prose.
 * This section targets long-tail queries that the hero section cannot.
 */
export function SeoKeywordsSection() {
  const seoData = [
    {
      title: "Grow Your Xerox Shop in Andhra Pradesh",
      content: (
        <>
          XeroxQ is the best way to <strong className="text-gray-700">grow your xerox business in AP</strong>. 
          Attract more customers by offering <strong className="text-gray-700">mobile printing services</strong> 
          directly at your shop counter. No more WhatsApp or cable hassles.
        </>
      )
    },
    {
      title: "Free Software for Print Shops in AP",
      content: (
        <>
          Modernize your <strong className="text-gray-700">printing shop in Andhra Pradesh</strong> for free. 
          Register your shop, get a unique QR code, and 
          start receiving <strong className="text-gray-700">PDFs and Photos</strong> directly on your screen.
        </>
      )
    },
    {
      title: "No Joining Fees for Shop Owners",
      content: (
        <>
          If you own a <strong className="text-gray-700">xerox center or stationery shop in AP</strong>, join 
          XeroxQ today. It's 100% free with <strong className="text-gray-700">no hidden charges</strong>. 
          Use your existing printer and internet connection.
        </>
      )
    },
    {
      title: "Safe & Private for Your Shop",
      content: (
        <>
          Protect your shop from <strong className="text-gray-700">unknown WhatsApp files</strong>. XeroxQ 
          is secure and private. Files are used only for printing 
          and are <strong className="text-gray-700">deleted automatically</strong> right after the work is done.
        </>
      )
    },
    {
      title: "Who Can Join XeroxQ Network?",
      content: (
        <>
          <strong className="text-gray-700">Local Shop Owners</strong> in AP can grow their business. 
          <strong className="text-gray-700"> Print Centers</strong> can manage orders easily. 
          <strong className="text-gray-700"> Stationaries</strong> in Andhra Pradesh can 
          <strong className="text-gray-700">earn more profit</strong> by modernizing their service.
        </>
      )
    },
    {
      title: "Available for Shopkeepers Across AP",
      content: (
        <>
          XeroxQ is expanding to help shops in 
          <strong className="text-gray-700"> Visakhapatnam, Vijayawada, Guntur, and Tirupati</strong>. 
          Join the <strong className="text-gray-700">XeroxQ AP Network</strong> and 
          stay ahead of the competition in your local area.
        </>
      )
    }
  ];

  return (
    <motion.section
      aria-label="About XeroxQ Printing Service in AP"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      className="border-t border-gray-100 bg-[#FAFAFA] py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {seoData.map((item, i) => (
            <motion.div 
              key={i}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
              className="space-y-4"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">
                {item.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                {item.content}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
