/**
 * Optional Webflow / host-page helper for the Kwikly calculator embed.
 *
 * Add to the page custom code (before </body>):
 *   <script src="https://calc.joinkwikly.com/kwikly-embed-host.js" defer></script>
 *
 * With this script (no fixed height attribute on the iframe):
 *   <iframe src="https://calc.joinkwikly.com/embed/" width="100%" style="border:none;display:block;" scrolling="no"></iframe>
 *
 * Without this script, set min-height on the iframe so it does not collapse:
 *   style="border:none;display:block;min-height:900px;"
 *
 * Local testing: run `pnpm dev`, open http://localhost:8080/embed-host-test.html
 */
(function () {
  var SELECTOR =
    'iframe[src*="calc.joinkwikly.com/embed"], iframe[data-kwikly-calc-embed]';
  var MIN_HEIGHT = 900;
  var FALLBACK_HEIGHT = MIN_HEIGHT;

  function applyHeight(frame, height, minHeight) {
    var floor = minHeight || MIN_HEIGHT;
    frame.style.minHeight = floor + "px";
    frame.style.height = Math.max(floor, Math.ceil(height)) + "px";
  }

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

    frame.style.minHeight = MIN_HEIGHT + "px";
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
      applyHeight(frame, data.height, data.minHeight);
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
