import { useEffect } from "react";
import CalculatorCard from "@/components/calculator/CalculatorCard";
import { postEmbedHeight } from "@/lib/embed-height";

/**
 * Minimal view for embedding in an iframe — calculator card only, no site chrome.
 * Example: <iframe src="https://your-domain/embed" title="Growth diagnostic" />
 */
export default function Embed() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Clinical Capacity & Growth Diagnostic | Kwikly";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Report our full content height to the parent (Webflow) so it can size the
  // iframe to match. When the iframe is exactly as tall as the content there is
  // no internal scroll, so wheel/touch events pass through to the host page
  // instead of getting trapped inside the calculator.
  useEffect(() => {
    if (window.parent === window) return; // not embedded

    postEmbedHeight();

    const observer = new ResizeObserver(postEmbedHeight);
    observer.observe(document.documentElement);

    window.addEventListener("load", postEmbedHeight);
    // Allow the parent to explicitly request the current height.
    const onMessage = (event: MessageEvent) => {
      if (event.data === "kwikly-embed-request-height") postEmbedHeight();
    };
    window.addEventListener("message", onMessage);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", postEmbedHeight);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-0">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <CalculatorCard />
      </div>
    </div>
  );
}
