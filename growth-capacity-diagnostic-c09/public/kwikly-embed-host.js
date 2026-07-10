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
  var lastPostedViewportWidth = 0;
  var lastPostedViewportHeight = 0;

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

  /**
   * Bottom edge of fixed/sticky host chrome (e.g. the site navbar) overlaying
   * the top of the viewport — the dialog must start below it.
   */
  function getTopObstruction() {
    var maxBottom = 0;
    var nodes = document.body ? document.body.querySelectorAll("*") : [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      if (style.visibility === "hidden" || style.display === "none") continue;
      var rect = el.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
      if (rect.width < window.innerWidth * 0.5) continue;
      if (rect.top > window.innerHeight * 0.3) continue;
      maxBottom = Math.max(maxBottom, rect.bottom);
    }
    return Math.min(maxBottom, window.innerHeight * 0.4);
  }

  /**
   * Visible slice of the iframe (in iframe coordinates), excluding host
   * chrome. While a dialog is open, the embed pins its overlay/panel to this
   * rect so the close button stays on screen even though the iframe is full
   * content height.
   */
  function postVisibleViewport(frame) {
    try {
      var rect = frame.getBoundingClientRect();
      var vv = window.visualViewport;
      var viewportWidth = vv ? vv.width : window.innerWidth;
      var viewportHeight = vv ? vv.height : window.innerHeight;
      var visibleTop = Math.max(rect.top, getTopObstruction());
      var visibleBottom = Math.min(rect.bottom, viewportHeight);
      var visibleLeft = Math.max(rect.left, 0);
      var visibleRight = Math.min(rect.right, viewportWidth);
      frame.contentWindow.postMessage(
        {
          type: "kwikly-embed-host-viewport",
          viewport: {
            top: Math.max(0, visibleTop - rect.top),
            left: Math.max(0, visibleLeft - rect.left),
            width: Math.max(0, visibleRight - visibleLeft),
            height: Math.max(0, visibleBottom - visibleTop),
          },
        },
        "*",
      );
    } catch (_err) {
      /* cross-origin guard */
    }
  }

  var scrollLocked = false;
  var scrollLockY = 0;
  var lockedFrame = null;

  function onLockedViewportResize() {
    if (lockedFrame) postVisibleViewport(lockedFrame);
  }

  function lockHostScroll(frame) {
    if (scrollLocked) return;
    scrollLocked = true;
    lockedFrame = frame;
    scrollLockY = window.scrollY || window.pageYOffset || 0;
    var body = document.body;
    body.style.position = "fixed";
    body.style.top = -scrollLockY + "px";
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onLockedViewportResize);
    }
    window.addEventListener("resize", onLockedViewportResize);
  }

  function unlockHostScroll() {
    if (!scrollLocked) return;
    scrollLocked = false;
    lockedFrame = null;
    if (window.visualViewport) {
      window.visualViewport.removeEventListener(
        "resize",
        onLockedViewportResize,
      );
    }
    window.removeEventListener("resize", onLockedViewportResize);
    var body = document.body;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
    window.scrollTo(0, scrollLockY);
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

  /**
   * Dialog overlays inside the iframe — do not resize the iframe.
   * Mobile: lock host scroll and report the visible slice so the fullscreen
   * dialog (and its close button) is pinned to what's actually on screen.
   */
  function openEmbedModal(frame, mobile) {
    frame.dataset.kwiklyModalOpen = "1";
    if (mobile) {
      lockHostScroll(frame);
      postVisibleViewport(frame);
    } else {
      postFullIframeViewport(frame);
    }
  }

  function closeEmbedModal(frame) {
    frame.dataset.kwiklyModalOpen = "0";
    unlockHostScroll();
    requestHeight(frame);
    [50, 150, 300, 500, 1000].forEach(function (delay) {
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
      postFullIframeViewport(frame);
    }

    if (data.type === "kwikly-embed-modal-open") {
      openEmbedModal(frame, data.mobile === true);
    }

    if (data.type === "kwikly-embed-request-viewport") {
      if (scrollLocked && lockedFrame === frame) {
        postVisibleViewport(frame);
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
        window.scrollBy({ left: deltaX, top: deltaY, behavior: "auto" });
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
