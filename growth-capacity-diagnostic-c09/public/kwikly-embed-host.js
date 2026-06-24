/**
 * Webflow / host-page helper for the Kwikly calculator embed.
 *
 * Add to the page's custom code (before </body>):
 *   <script src="https://calc.aikwikly.com/kwikly-embed-host.js" defer></script>
 *
 * Then use a flexible iframe (no fixed height attribute):
 *   <iframe src="https://calc.aikwikly.com/embed/" width="100%" style="border:none;display:block;" scrolling="no"></iframe>
 */
(function () {
  function findSourceFrame(source) {
    return Array.prototype.find.call(
      document.querySelectorAll('iframe[src*="calc.aikwikly.com/embed"]'),
      function (frame) {
        try {
          return frame.contentWindow === source;
        } catch (_err) {
          return false;
        }
      },
    );
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || typeof data !== "object") return;

    var frame = findSourceFrame(event.source);
    if (!frame) return;

    if (data.type === "kwikly-embed-height" && typeof data.height === "number") {
      frame.style.height = Math.max(320, Math.ceil(data.height)) + "px";
    }

    if (data.type === "kwikly-embed-modal-open") {
      frame.scrollIntoView({ block: "start", inline: "nearest", behavior: "instant" });
    }
  });
})();
