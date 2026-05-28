import Header from "@/components/Header";
import CalculatorCard from "@/components/calculator/CalculatorCard";

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── App banner (scrolls with page, not sticky) ────────────────────── */}
      <div className="bg-navy-800 text-white">
        <div className="w-full px-6 sm:px-10 h-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white/60 shrink-0"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            <span className="text-xs font-semibold text-white/90">Download the Kwikly App Today</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-white/25 hover:border-white/50 text-white rounded-md px-2.5 py-1 transition-colors">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <span className="text-[11px] font-semibold">App Store</span>
            </a>
            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-white/25 hover:border-white/50 text-white rounded-md px-2.5 py-1 transition-colors">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M3.18 23.76c.3.17.64.22.99.14l12.76-7.37-2.78-2.78-10.97 9.99v.02zM.5 1.58C.19 1.9 0 2.38 0 3.01v17.98c0 .63.19 1.11.51 1.43l.08.07 10.07-10.07v-.24L.58 1.5l-.08.08zM20.99 10.37l-2.83-1.63-3.1 3.1 3.1 3.1 2.85-1.64c.81-.47.81-1.23-.02-1.93zM3.18.24l12.98 7.5-2.78 2.78L.99.1A1.13 1.13 0 0 1 1.99 0c.41 0 .82.08 1.19.24z"/></svg>
              <span className="text-[11px] font-semibold">Google Play</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white overflow-hidden">
        {/* Mobile: single column stack. Desktop: two-column side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[660px]">

          {/* Left: copy */}
          <div className="flex items-center order-1">
            <div className="w-full max-w-[640px] lg:ml-auto px-5 sm:px-8 lg:pl-8 lg:pr-14 xl:pr-20 pt-10 pb-6 sm:pt-14 sm:pb-8 lg:py-20">
              {/* Trust line */}
              <p className="text-sm font-semibold text-gray-400 mb-5 tracking-wide">
                The growth lever trusted by 20,000+ practices nationwide
              </p>

              <h1 className="text-[2rem] sm:text-[2.4rem] lg:text-[2.9rem] font-semibold leading-[1.08] tracking-tight">
                <span style={{ color: '#023661' }}>How much production is your practice{" "}</span>
                <span className="text-coral-500">leaving on the table?</span>
              </h1>

              {/* Image — mobile only, between heading and body copy */}
              <div className="block lg:hidden mt-6 rounded-xl overflow-hidden aspect-[4/3] bg-gray-100">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F52185cbc63e544f6abfcb901069ce1f1%2Ff810880f4caf482ebd8e8efba66728e1?format=webp&width=800&height=1200"
                  alt="Dental professional"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <p className="mt-5 text-base text-gray-500 leading-relaxed font-medium">
                See how staffing gaps reduce access to care, restrict clinical
                capacity, and impact production. Then model how better coverage
                can protect revenue and unlock growth.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <a
                  href="#calculator"
                  className="inline-flex items-center justify-center bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-6 py-3.5 rounded-lg transition-colors"
                >
                  Run My Growth Diagnostic
                </a>
                <a
                  href="https://joinkwikly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-navy-800 hover:text-coral-500 font-bold text-sm transition-colors py-3.5"
                >
                  <span className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-navy-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                  See how Kwikly works
                </a>
              </div>
            </div>
          </div>

          {/* Right: image — desktop only, fills column */}
          <div className="hidden lg:block relative bg-gray-100 order-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F52185cbc63e544f6abfcb901069ce1f1%2Ff810880f4caf482ebd8e8efba66728e1?format=webp&width=800&height=1200"
              alt="Dental professional"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* ── Calculator ───────────────────────────────────────────────────────── */}
      <section
        id="calculator"
        className="bg-gray-50 border-y border-gray-100 py-12 sm:py-16"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <CalculatorCard />
        </div>
      </section>

      {/* ── Value prop ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-10 sm:gap-20">
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-coral-500 mb-5">
                The Kwikly Philosophy
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy-900 leading-[1.1] tracking-tight">
                Staffing isn't a cost center.
                <br />
                <span className="text-coral-500">
                  It's a Growth Lever.
                </span>
              </h2>
            </div>
            <div className="flex-1 max-w-sm">
              <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed mb-6">
                Kwikly's workforce platform protects your existing production,
                expands clinical capacity, and accelerates patient flow,
                turning unstaffed hygiene operatories from a cost center into a growth lever.
              </p>
              <a
                href="https://joinkwikly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-7 py-3.5 rounded-lg transition-colors"
              >
                See how Kwikly works →
              </a>
            </div>
          </div>

          {/* Feature trio */}
          <div className="mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {[
              {
                title: "Protect Production",
                body: "Stop losing revenue to unused hygiene columns. Kwikly's on-demand staffing network fills gaps fast.",
              },
              {
                title: "Expand Capacity",
                body: "Open unused chairs and extended hours with confidence, knowing you'll have the staff to support them.",
              },
              {
                title: "Accelerate Growth",
                body: "Reduce patient backlogs, improve access to care, and turn staffing into your competitive advantage.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white px-7 py-8">
                <div className="w-2 h-2 rounded-full bg-coral-500 mb-5" />
                <h3 className="text-base font-semibold text-navy-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F52185cbc63e544f6abfcb901069ce1f1%2F906e8e50e0b0453881ae79db73764fe1?format=webp&width=400"
            alt="Kwikly"
            className="h-7 w-auto object-contain"
          />
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} Kwikly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
