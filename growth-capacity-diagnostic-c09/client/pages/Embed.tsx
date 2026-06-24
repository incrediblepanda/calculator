import { useEffect } from "react";
import CalculatorCard from "@/components/calculator/CalculatorCard";
import { startEmbedHeightReporting } from "@/lib/embed-height";

/**
 * Minimal view for embedding in an iframe — calculator card only, no site chrome.
 *
 * Host page setup (both required):
 * 1. Script: <script src="https://calc.aikwikly.com/kwikly-embed-host.js" defer></script>
 * 2. Iframe without a fixed height="" attribute
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
