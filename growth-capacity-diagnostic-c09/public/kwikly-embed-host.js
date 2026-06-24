/**
 * Optional Webflow / host-page helper for the Kwikly calculator embed.
 *
 * Not required for modals — the embed handles those via the Visual Viewport API.
 * Use this only if you want the iframe to auto-size to content height.
 *
 * Add to the page custom code (before </body>):
 *   <script src="https://calc.aikwikly.com/kwikly-embed-host.js" defer></script>
 *
 * Iframe markup (no fixed height attribute when using this script):
 *   <iframe src="https://calc.aikwikly.com/embed/" width="100%" style="border:none;display:block;" scrolling="no"></iframe>
 */
(function () {
  var SELECTOR = 'iframe[src*="calc.aikwikly.com/embed"]';
  var FALLBACK_HEIGHT = 900;

  function findSourceFrame(source) {
    return Array.prototype.find.call(
      document.querySelectorAll(SELECTOR),
      function (frame) {
        try {
          return frame.contentWindow === source;
        } catch (_err) {
          return false;
        }
      },
    );
  }

  function requestHeight(frame) {
    try {
      frame.contentWindow.postMessage("kwikly-embed-request-height", "*");
    } catch (_err) {
      /* cross-origin guard */
    }
  }

  function initFrame(frame) {
    if (frame.dataset.kwiklyEmbedInit === "1") return;
    frame.dataset.kwiklyEmbedInit = "1";

    if (!frame.style.height) {
      frame.style.height = FALLBACK_HEIGHT + "px";
    }

    frame.addEventListener("load", function () {
      requestHeight(frame);
    });

    if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
      requestHeight(frame);
    }
  }

  function initAll() {
    document.querySelectorAll(SELECTOR).forEach(initFrame);
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || typeof data !== "object") return;

    var frame = findSourceFrame(event.source);
    if (!frame) return;

    if (data.type === "kwikly-embed-height" && typeof data.height === "number") {
      if (frame.dataset.kwiklyModalOpen === "1") return;
      frame.style.height = Math.max(320, Math.ceil(data.height)) + "px";
    }

    if (data.type === "kwikly-embed-modal-open") {
      frame.dataset.kwiklyModalOpen = "1";
      frame.dataset.kwiklySavedHeight = frame.style.height || "";
      frame.style.height = window.innerHeight + "px";
      frame.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }

    if (data.type === "kwikly-embed-modal-close") {
      frame.dataset.kwiklyModalOpen = "0";
      if (frame.dataset.kwiklySavedHeight) {
        frame.style.height = frame.dataset.kwiklySavedHeight;
      }
      requestHeight(frame);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
