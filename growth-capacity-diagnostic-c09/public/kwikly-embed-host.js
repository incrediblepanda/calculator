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
  var MODAL_MIN_HEIGHT = 320;
  var modalFrame = null;
  var modalViewportListeners = null;

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

  function postFullIframeViewport(frame) {
    try {
      var height = Math.ceil(
        parseFloat(frame.style.height) || frame.getBoundingClientRect().height,
      );
      var width = Math.ceil(frame.getBoundingClientRect().width);
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

  function detachModalViewportListeners() {
    if (!modalViewportListeners) return;
    var update = modalViewportListeners.update;
    window.removeEventListener("resize", update);
    var vv = window.visualViewport;
    if (vv) {
      vv.removeEventListener("resize", update);
    }
    modalViewportListeners = null;
  }

  function getModalFrameHeight() {
    var vv = window.visualViewport;
    return Math.max(MODAL_MIN_HEIGHT, Math.ceil(vv ? vv.height : window.innerHeight));
  }

  function postIframeViewport(frame, height, width) {
    try {
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

  function syncEmbedModalFrame(frame) {
    var height = getModalFrameHeight();
    var width = Math.ceil(frame.getBoundingClientRect().width);
    frame.style.height = height + "px";
    frame.style.minHeight = height + "px";
    postIframeViewport(frame, height, width);
  }

  function attachModalResizeListener(frame) {
    detachModalViewportListeners();
    var update = function () {
      if (frame.dataset.kwiklyModalOpen !== "1") return;
      syncEmbedModalFrame(frame);
    };
    window.addEventListener("resize", update);
    var vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", update);
    }
    modalViewportListeners = { update: update };
  }

  /** Expand iframe to viewport height for the dialog — no host scroll hijacking. */
  function openEmbedModal(frame) {
    frame.dataset.kwiklyModalOpen = "1";
    frame.dataset.kwiklySavedHeight = frame.style.height || "";
    frame.dataset.kwiklySavedMinHeight = frame.style.minHeight || "";

    modalFrame = frame;
    detachModalViewportListeners();
    syncEmbedModalFrame(frame);
    attachModalResizeListener(frame);
  }

  function notifyHostReady(frame) {
    try {
      frame.contentWindow.postMessage({ type: "kwikly-embed-host-ready" }, "*");
    } catch (_err) {
      /* cross-origin guard */
    }
  }

  function closeEmbedModal(frame) {
    detachModalViewportListeners();
    if (modalFrame === frame) {
      modalFrame = null;
    }

    frame.dataset.kwiklyModalOpen = "0";
    frame.style.height = frame.dataset.kwiklySavedHeight || "";
    frame.style.minHeight = frame.dataset.kwiklySavedMinHeight || MIN_HEIGHT + "px";
    delete frame.dataset.kwiklySavedHeight;
    delete frame.dataset.kwiklySavedMinHeight;
    requestHeight(frame);
    [50, 150, 500, 1000].forEach(function (delay) {
      window.setTimeout(function () {
        requestHeight(frame);
      }, delay);
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
    }

    if (data.type === "kwikly-embed-modal-open") {
      openEmbedModal(frame);
    }

    if (data.type === "kwikly-embed-request-viewport") {
      if (frame.dataset.kwiklyModalOpen === "1") {
        syncEmbedModalFrame(frame);
      } else {
        postFullIframeViewport(frame);
      }
    }

    if (data.type === "kwikly-embed-modal-close") {
      closeEmbedModal(frame);
    }

    if (data.type === "kwikly-embed-scroll") {
      if (frame.dataset.kwiklyModalOpen === "1") return;
      var deltaY = typeof data.deltaY === "number" ? data.deltaY : 0;
      var deltaX = typeof data.deltaX === "number" ? data.deltaX : 0;
      if (deltaX || deltaY) {
        window.scrollBy(deltaX, deltaY);
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
