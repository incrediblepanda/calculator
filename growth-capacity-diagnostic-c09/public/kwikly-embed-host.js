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

  function getTopObstruction() {
    var maxBottom = 0;
    var nodes = document.body ? document.body.querySelectorAll("*") : [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      var rect = el.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
      if (rect.width < window.innerWidth * 0.5) continue;
      maxBottom = Math.max(maxBottom, rect.bottom);
    }
    return maxBottom;
  }

  function getHostVisibleFrame(frame) {
    var rect = frame.getBoundingClientRect();
    var vv = window.visualViewport;
    var vTop = vv ? vv.offsetTop : 0;
    var vLeft = vv ? vv.offsetLeft : 0;
    var vHeight = vv ? vv.height : window.innerHeight;
    var vWidth = vv ? vv.width : window.innerWidth;
    var vBottom = vTop + vHeight;
    var vRight = vLeft + vWidth;

    var top = Math.max(rect.top, vTop);
    var left = Math.max(rect.left, vLeft);
    var bottom = Math.min(rect.bottom, vBottom);
    var right = Math.min(rect.right, vRight);

    return {
      top: Math.max(0, top - rect.top),
      left: Math.max(0, left - rect.left),
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
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

  function scrollFrameIntoHostViewport(frame) {
    var rect = frame.getBoundingClientRect();
    var vv = window.visualViewport;
    var obstruction = getTopObstruction();
    var targetTop = Math.max(vv ? vv.offsetTop : 0, obstruction);
    var delta = rect.top - targetTop;
    if (Math.abs(delta) > 1) {
      window.scrollBy(0, delta);
    }
  }

  function syncModalFrame(frame) {
    var visible = getHostVisibleFrame(frame);
    var targetHeight = Math.max(MODAL_MIN_HEIGHT, Math.ceil(visible.height));
    frame.style.height = targetHeight + "px";
    frame.style.minHeight = targetHeight + "px";
    postFullIframeViewport(frame);
  }

  function detachModalViewportListeners() {
    if (!modalViewportListeners) return;
    var update = modalViewportListeners.update;
    window.removeEventListener("scroll", update, true);
    window.removeEventListener("resize", update);
    var vv = window.visualViewport;
    if (vv) {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    }
    modalViewportListeners = null;
  }

  function attachModalViewportListeners(frame) {
    detachModalViewportListeners();
    var update = function () {
      scrollFrameIntoHostViewport(frame);
      syncModalFrame(frame);
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    var vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    modalViewportListeners = { update: update };
    update();
  }

  function getMobileModalFrameHeight() {
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

  /** Mobile fullscreen dialog — expand iframe to viewport height without hijacking host scroll. */
  function openMobileEmbedModal(frame) {
    frame.dataset.kwiklyModalOpen = "1";
    frame.dataset.kwiklyModalMobile = "1";
    frame.dataset.kwiklySavedHeight = frame.style.height || "";
    frame.dataset.kwiklySavedMinHeight = frame.style.minHeight || "";

    modalFrame = frame;
    detachModalViewportListeners();

    var height = getMobileModalFrameHeight();
    var width = Math.ceil(frame.getBoundingClientRect().width);
    frame.style.height = height + "px";
    frame.style.minHeight = height + "px";
    postIframeViewport(frame, height, width);
  }

  function syncMobileModalFrame(frame) {
    var height = getMobileModalFrameHeight();
    var width = Math.ceil(frame.getBoundingClientRect().width);
    frame.style.height = height + "px";
    frame.style.minHeight = height + "px";
    postIframeViewport(frame, height, width);
  }

  function openEmbedModal(frame) {
    frame.dataset.kwiklyModalOpen = "1";
    frame.dataset.kwiklyModalMobile = "0";
    frame.dataset.kwiklySavedHeight = frame.style.height || "";
    frame.dataset.kwiklySavedMinHeight = frame.style.minHeight || "";

    scrollFrameIntoHostViewport(frame);
    frame.scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: "auto",
    });

    modalFrame = frame;
    syncModalFrame(frame);
    attachModalViewportListeners(frame);

    requestAnimationFrame(function () {
      scrollFrameIntoHostViewport(frame);
      syncModalFrame(frame);
    });
  }

  function notifyHostReady(frame) {
    try {
      frame.contentWindow.postMessage({ type: "kwikly-embed-host-ready" }, "*");
    } catch (_err) {
      /* cross-origin guard */
    }
  }

  function closeEmbedModal(frame) {
    if (modalFrame === frame) {
      detachModalViewportListeners();
      modalFrame = null;
    }

    frame.dataset.kwiklyModalOpen = "0";
    frame.dataset.kwiklyModalMobile = "0";
    frame.style.minHeight = MIN_HEIGHT + "px";
    frame.style.height = "";
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
      if (data.mobile) {
        openMobileEmbedModal(frame);
      } else {
        openEmbedModal(frame);
      }
    }

    if (data.type === "kwikly-embed-request-viewport") {
      if (frame.dataset.kwiklyModalOpen === "1") {
        if (frame.dataset.kwiklyModalMobile === "1") {
          syncMobileModalFrame(frame);
        } else {
          syncModalFrame(frame);
        }
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
