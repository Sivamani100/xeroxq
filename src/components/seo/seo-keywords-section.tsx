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
  return (
    <section
      aria-label="About XeroxQ Print Service"
      className="border-t border-gray-100 bg-[#FAFAFA] py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">

          {/* Column 1 — Core Service */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">
              Xerox Shop &amp; Print Service India
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              XeroxQ is India&rsquo;s fastest way to find a <strong className="text-gray-700">xerox shop near you</strong> and print
              documents online. Whether you need to <strong className="text-gray-700">print A4 pages</strong>, photocopy ID proofs,
              or send a <strong className="text-gray-700">PDF to a nearby print shop</strong> — XeroxQ connects you instantly.
              No WhatsApp. No email. Just scan, upload &amp; print.
            </p>
          </div>

          {/* Column 2 — How it works for users */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">
              How to Print Documents Online
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              Finding a <strong className="text-gray-700">document printing service near you</strong> has never been easier.
              Open XeroxQ, locate your nearest <strong className="text-gray-700">xerox shop</strong>, scan the QR code, and
              upload your file — the shop prints it and your data vanishes immediately.
              We support <strong className="text-gray-700">PDF, DOCX, PNG, and JPG</strong> files with automatic A4 formatting.
              Works at any XeroxQ-registered <strong className="text-gray-700">photocopy centre</strong> across India.
            </p>
          </div>

          {/* Column 3 — For shop owners */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">
              Register Your Xerox Shop for Free
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              Own a <strong className="text-gray-700">xerox shop or print centre</strong>? List your business on XeroxQ for free
              and start receiving secure <strong className="text-gray-700">online print orders</strong> from customers nearby.
              No hardware investment required — just a printer and an internet connection.
              Join thousands of <strong className="text-gray-700">print shops across India</strong> already using XeroxQ to
              grow their business.
            </p>
          </div>

          {/* Column 4 — Security */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">
              Secure, Private Document Printing
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              Unlike sending files over <strong className="text-gray-700">WhatsApp to a xerox shop</strong>, XeroxQ
              uses <strong className="text-gray-700">AES-256 end-to-end encryption</strong>. Your document is never stored —
              it&rsquo;s transmitted securely, printed, then permanently deleted. Perfect for
              <strong className="text-gray-700"> Aadhaar cards, bank statements, legal documents</strong>, and other
              sensitive paperwork you can&rsquo;t risk sharing insecurely.
            </p>
          </div>

          {/* Column 5 — Use Cases */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">
              Who Uses XeroxQ?
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              <strong className="text-gray-700">Students</strong> print assignments and admit cards.
              <strong className="text-gray-700"> Professionals</strong> print office documents and contracts.
              <strong className="text-gray-700"> Travelers</strong> find the nearest <strong className="text-gray-700">xerox shop in any city</strong> across India.
              <strong className="text-gray-700"> Businesses</strong> manage bulk printing workflows.
              Everyone saves time — no more hunting for a <strong className="text-gray-700">print shop near me</strong> or hoping
              the local shop has a USB cable.
            </p>
          </div>

          {/* Column 6 — Free & Open */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">
              100% Free Online Print Platform
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              XeroxQ is completely <strong className="text-gray-700">free for everyone</strong> — customers pay nothing to
              find and use a <strong className="text-gray-700">nearby xerox shop</strong>. Shop owners list and receive
              orders at zero cost. We believe access to <strong className="text-gray-700">secure document printing</strong> is
              a right, not a premium service. Available across India — from
              <strong className="text-gray-700"> Mumbai and Delhi</strong> to
              <strong className="text-gray-700"> Tier-2 and Tier-3 cities</strong>.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
