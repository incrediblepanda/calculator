import { useEffect } from "react";
import CalculatorCard from "@/components/calculator/CalculatorCard";

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

  return (
    <div className="bg-gray-50 min-h-0">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <CalculatorCard />
      </div>
    </div>
  );
}
