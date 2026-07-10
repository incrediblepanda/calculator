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
    'iframe[src*="calc.joinkwikly.com/embed"], iframe[src*="calc.aikwikly.com/embed"], iframe[data-kwikly-calc-embed]';
  var MIN_HEIGHT = 900;
  var FALLBACK_HEIGHT = MIN_HEIGHT;
  var MOBILE_BREAKPOINT = 768;
  var lastPostedViewportWidth = 0;
  var lastPostedViewportHeight = 0;

  function isMobileFrame(frame) {
    return frame.getBoundingClientRect().width < MOBILE_BREAKPOINT;
  }

  function getHostViewportHeight() {
    var vv = window.visualViewport;
    return Math.max(MIN_HEIGHT, Math.ceil(vv ? vv.height : window.innerHeight));
  }

  function applyDesktopHeight(frame, height, minHeight) {
    var floor = minHeight || MIN_HEIGHT;
    frame.style.minHeight = floor + "px";
    frame.style.height = Math.max(floor, Math.ceil(height)) + "px";
    frame.dataset.kwiklyMobileScroll = "0";
  }

  function applyMobileViewportHeight(frame) {
    var viewportH = getHostViewportHeight();
    frame.style.height = viewportH + "px";
    frame.style.minHeight = viewportH + "px";
    frame.dataset.kwiklyMobileScroll = "1";
  }

  function applyHeight(frame, height, minHeight) {
    if (isMobileFrame(frame)) {
      applyMobileViewportHeight(frame);
    } else {
      applyDesktopHeight(frame, height, minHeight);
    }
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

  function notifyMobileScrollMode(frame) {
    try {
      frame.contentWindow.postMessage(
        {
          type: "kwikly-embed-mobile-scroll",
          enabled: frame.dataset.kwiklyMobileScroll === "1",
        },
        "*",
      );
    } catch (_err) {
      /* cross-origin guard */
    }
  }

  function postFullIframeViewport(frame) {
    try {
      var height = Math.ceil(
        parseFloat(frame.style.height) || frame.getBoundingClientRect().height,
      );
      var width = Math.ceil(frame.getBoundingClientRect().width);
      if (
        width === lastPostedViewportWidth &&
        height === lastPostedViewportHeight
      ) {
        return;
      }
      lastPostedViewportWidth = width;
      lastPostedViewportHeight = height;
      frame.contentWindow.postMessage(
        {
          type: "kwikly-embed-host-viewport",
          viewport: {
            top: 0,
            left: 0,
            width: width,
            height: height,
          },
        },
        "*",
      );
    } catch (_err) {
      /* cross-origin guard */
    }
  }

  function notifyHostReady(frame) {
    try {
      frame.contentWindow.postMessage({ type: "kwikly-embed-host-ready" }, "*");
    } catch (_err) {
      /* cross-origin guard */
    }
  }

  /** Dialog overlays inside the iframe — do not resize the iframe. */
  function openEmbedModal(frame) {
    frame.dataset.kwiklyModalOpen = "1";
    postFullIframeViewport(frame);
  }

  function closeEmbedModal(frame) {
    frame.dataset.kwiklyModalOpen = "0";
    requestHeight(frame);
    [50, 150, 300, 500, 1000].forEach(function (delay) {
      window.setTimeout(function () {
        requestHeight(frame);
      }, delay);
    });
  }

  function syncMobileFrames() {
    document.querySelectorAll(SELECTOR).forEach(function (frame) {
      if (frame.dataset.kwiklyModalOpen === "1") return;
      if (!isMobileFrame(frame)) return;
      applyMobileViewportHeight(frame);
      postFullIframeViewport(frame);
      notifyMobileScrollMode(frame);
    });
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
      notifyHostReady(frame);
    });

    if (
      frame.contentDocument &&
      frame.contentDocument.readyState === "complete"
    ) {
      requestHeight(frame);
      notifyHostReady(frame);
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
      postFullIframeViewport(frame);
      notifyMobileScrollMode(frame);
    }

    if (data.type === "kwikly-embed-modal-open") {
      openEmbedModal(frame);
    }

    if (data.type === "kwikly-embed-request-viewport") {
      postFullIframeViewport(frame);
    }

    if (data.type === "kwikly-embed-modal-close") {
      closeEmbedModal(frame);
    }

    if (data.type === "kwikly-embed-scroll") {
      if (frame.dataset.kwiklyModalOpen === "1") return;
      if (frame.dataset.kwiklyMobileScroll === "1") return;
      var deltaY = typeof data.deltaY === "number" ? data.deltaY : 0;
      var deltaX = typeof data.deltaX === "number" ? data.deltaX : 0;
      if (deltaX || deltaY) {
        window.scrollBy({ left: deltaX, top: deltaY, behavior: "auto" });
      }
    }
  });

  window.addEventListener("resize", syncMobileFrames);
  var vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", syncMobileFrames);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
