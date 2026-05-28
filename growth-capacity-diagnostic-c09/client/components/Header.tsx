const NAV_LINKS = [
  { label: "For Offices", href: "https://joinkwikly.com/for-offices", dropdown: true },
  { label: "For Professionals", href: "https://joinkwikly.com/for-professionals", dropdown: true },
  { label: "About Kwikly", href: "https://joinkwikly.com/about", dropdown: false },
];

export default function Header() {
  return (
    <div className="sticky top-0 z-50">
      {/* ── Main nav only (sticky) ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="w-full px-6 sm:px-10 h-[60px] flex items-center justify-between gap-6">
          {/* Logo */}
          <a href="/" className="shrink-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F52185cbc63e544f6abfcb901069ce1f1%2F906e8e50e0b0453881ae79db73764fe1?format=webp&width=400"
              alt="Kwikly"
              className="h-8 w-auto object-contain"
            />
          </a>

          {/* Nav + actions — all right-aligned */}
          <div className="flex items-center gap-1">
            <nav className="hidden md:flex items-center gap-1 mr-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1 text-sm font-semibold text-navy-800 hover:text-coral-500 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                  {link.dropdown && (
                    <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 group-hover:bg-coral-50 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  )}
                </a>
              ))}
            </nav>
            <a
              href="https://app.joinkwikly.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex text-sm font-bold text-navy-800 hover:text-coral-500 px-3 py-2 transition-colors"
            >
              Login
            </a>
            <a
              href="https://joinkwikly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-bold text-white bg-coral-500 hover:bg-coral-600 px-4 sm:px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Sign Up for free
            </a>
          </div>
        </div>
      </header>
    </div>
  );
}
