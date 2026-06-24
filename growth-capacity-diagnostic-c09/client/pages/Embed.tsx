import { useEffect } from "react";
import CalculatorCard from "@/components/calculator/CalculatorCard";
import { startEmbedHeightReporting } from "@/lib/embed-height";

/**
 * Minimal view for embedding in an iframe — calculator card only, no site chrome.
 *
 * Webflow / host page — iframe only (no page script required):
 *   <iframe
 *     src="https://calc.aikwikly.com/embed/"
 *     width="100%"
 *     height="1400"
 *     style="border:none;display:block;"
 *     scrolling="no"
 *     title="Kwikly Clinical Capacity Calculator"
 *   ></iframe>
 *
 * Modals use the Visual Viewport API so they stay on-screen when the host page
 * has scrolled. Use a fixed height (~1400px) tall enough for the full calculator.
 *
 * Optional auto-height (no fixed height attribute): add before </body>
 *   <script src="https://calc.aikwikly.com/kwikly-embed-host.js" defer></script>
 */
export default function Embed() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Clinical Capacity & Growth Diagnostic | Kwikly";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => startEmbedHeightReporting(), []);

  return (
    <div className="bg-gray-50 min-h-0">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <CalculatorCard />
      </div>
    </div>
  );
}
