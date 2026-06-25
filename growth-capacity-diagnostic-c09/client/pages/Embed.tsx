/**
 * Minimal view for embedding in an iframe — calculator card only, no site chrome.
 *
 * Calculation breakdown opens in a dialog (visual viewport positioning in iframes).
 *
 * Webflow without the host script — set min-height on the iframe element:
 *   style="border:none;display:block;min-height:900px;"
 *
 * With the host script (auto height): kwikly-embed-host.js in page footer custom code.
 */
import { useEffect } from "react";
import CalculatorCard from "@/components/calculator/CalculatorCard";
import { EMBED_ROOT_ID, startEmbedHeightReporting } from "@/lib/embed-height";

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
    <div id={EMBED_ROOT_ID} className="bg-gray-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <CalculatorCard />
      </div>
    </div>
  );
}
