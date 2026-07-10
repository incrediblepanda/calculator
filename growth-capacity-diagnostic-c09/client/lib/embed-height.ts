/** Minimum iframe height — keep in sync with public/kwikly-embed-host.js */
export const EMBED_MIN_HEIGHT = 900;

export const EMBED_ROOT_ID = "embed-root";

export type EmbedViewportRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

let modalOpenCount = 0;
let lastPostedHeight = 0;
let hostScriptReady = false;
let hostEmbedViewport: EmbedViewportRect | null = null;
const embedViewportListeners = new Set<() => void>();

export function isHostScriptReady() {
  return hostScriptReady;
}

function markHostScriptReady() {
  if (hostScriptReady) return;
  hostScriptReady = true;
}

export function subscribeEmbedViewport(listener: () => void) {
  embedViewportListeners.add(listener);
  return () => {
    embedViewportListeners.delete(listener);
  };
}

export function getHostEmbedViewport() {
  return hostEmbedViewport;
}

function setHostEmbedViewport(viewport: EmbedViewportRect | null) {
  hostEmbedViewport = viewport;
  embedViewportListeners.forEach((listener) => listener());
}

function isHostEmbedViewport(
  data: unknown,
): data is { type: string; viewport: EmbedViewportRect } {
  if (!data || typeof data !== "object") return false;
  const payload = data as { type?: unknown; viewport?: unknown };
  if (payload.type !== "kwikly-embed-host-viewport") return false;
  const viewport = payload.viewport;
  if (!viewport || typeof viewport !== "object") return false;
  const rect = viewport as Record<string, unknown>;
  return (
    typeof rect.top === "number" &&
    typeof rect.left === "number" &&
    typeof rect.width === "number" &&
    typeof rect.height === "number"
  );
}

function measureContentHeight() {
  const root = document.getElementById(EMBED_ROOT_ID);
  if (root) {
    return Math.max(EMBED_MIN_HEIGHT, Math.ceil(root.offsetHeight));
  }

  return Math.max(
    EMBED_MIN_HEIGHT,
    Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight),
  );
}

function isInVisualViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const vv = window.visualViewport;
  const top = vv?.offsetTop ?? 0;
  const bottom = top + (vv?.height ?? window.innerHeight);
  return rect.top >= top - 8 && rect.bottom <= bottom + 8;
}

/**
 * Scroll the clicked control into view (works cross-origin; no host script needed).
 * Also notifies kwikly-embed-host.js when present for optional iframe resize.
 */
export function scrollEmbedIntoView(scrollAnchor?: Element | null) {
  if (window.parent === window) return;

  const target = scrollAnchor ?? document.documentElement;
  const isMobile = window.innerWidth < 768;
  const block = scrollAnchor && isMobile ? "center" : scrollAnchor && isInVisualViewport(scrollAnchor) ? "nearest" : "center";
  target.scrollIntoView({ block, inline: "nearest" });
}

function restoreEmbedScrollPosition() {
  if (window.parent === window) return;

  window.scrollTo(0, 0);
  document.getElementById(EMBED_ROOT_ID)?.scrollIntoView({
    block: "start",
    inline: "nearest",
  });
}

function isEmbedDocumentScrollable() {
  return document.documentElement.scrollHeight > window.innerHeight + 1;
}

function shouldForwardScrollToHost(deltaY: number) {
  if (modalOpenCount > 0) return false;
  if (!isEmbedDocumentScrollable()) return true;

  const atTop = window.scrollY <= 0;
  const atBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 1;

  if (deltaY < 0 && atTop) return true;
  if (deltaY > 0 && atBottom) return true;
  return false;
}

function forwardScrollToHost(deltaX: number, deltaY: number) {
  window.parent.postMessage(
    { type: "kwikly-embed-scroll", deltaX, deltaY },
    "*",
  );
}

/** Forward wheel/touch to the host page when the embed has nothing to scroll. */
function startEmbedScrollForwarding() {
  if (window.parent === window) return;

  const onWheel = (event: WheelEvent) => {
    if (!shouldForwardScrollToHost(event.deltaY)) return;
    forwardScrollToHost(event.deltaX, event.deltaY);
    event.preventDefault();
  };

  let lastTouchY: number | null = null;

  const onTouchStart = (event: TouchEvent) => {
    lastTouchY = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event: TouchEvent) => {
    const touchY = event.touches[0]?.clientY;
    if (touchY == null || lastTouchY == null) return;

    const deltaY = lastTouchY - touchY;
    lastTouchY = touchY;
    if (Math.abs(deltaY) < 1) return;
    if (!shouldForwardScrollToHost(deltaY)) return;
    forwardScrollToHost(0, deltaY);
  };

  const onTouchEnd = () => {
    lastTouchY = null;
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchEnd);
  };
}

/** Report content height to the host page (no-op when not embedded in an iframe). */
export function postEmbedHeight(force = false) {
  if (window.parent === window) return;
  if (modalOpenCount > 0) return;

  const height = measureContentHeight();

  if (!force && height === lastPostedHeight) return;
  lastPostedHeight = height;

  window.parent.postMessage(
    { type: "kwikly-embed-height", height, minHeight: EMBED_MIN_HEIGHT },
    "*",
  );
}

/** Re-measure after layout changes (e.g. collapsible open/close). */
export function requestEmbedHeightUpdate() {
  if (window.parent === window) return;

  lastPostedHeight = 0;
  postEmbedHeight(true);
  [50, 150, 300, 500, 1000].forEach((delay) => {
    window.setTimeout(() => postEmbedHeight(true), delay);
  });
}

export function setEmbedModalOpen(
  open: boolean,
  scrollAnchor?: Element | null,
) {
  if (window.parent === window) return;

  modalOpenCount = Math.max(0, modalOpenCount + (open ? 1 : -1));

  if (open) {
    scrollEmbedIntoView(scrollAnchor);
    if (hostScriptReady) {
      window.parent.postMessage({ type: "kwikly-embed-modal-open" }, "*");
      window.setTimeout(() => {
        window.parent.postMessage({ type: "kwikly-embed-request-viewport" }, "*");
      }, 0);
    }
    return;
  }

  setHostEmbedViewport(null);
  lastPostedHeight = 0;
  if (hostScriptReady) {
    window.parent.postMessage({ type: "kwikly-embed-modal-close" }, "*");
  }
  requestEmbedHeightUpdate();
  window.setTimeout(restoreEmbedScrollPosition, 0);
  [100, 300].forEach((delay) => {
    window.setTimeout(restoreEmbedScrollPosition, delay);
  });
}

/** Call on embed mount — retries help when the host script loads after the iframe. */
export function startEmbedHeightReporting() {
  if (window.parent === window) return;

  document.documentElement.classList.add("embed-layout");
  document.body.classList.add("embed-layout");

  postEmbedHeight(true);

  const root = document.getElementById(EMBED_ROOT_ID);
  const observer = new ResizeObserver(() => postEmbedHeight());
  if (root) {
    observer.observe(root);
  } else {
    observer.observe(document.documentElement);
    observer.observe(document.body);
  }

  window.addEventListener("load", onLoad);
  window.addEventListener("message", onMessage);
  const stopScrollForwarding = startEmbedScrollForwarding();

  [100, 500, 1500].forEach((delay) => {
    window.setTimeout(() => postEmbedHeight(true), delay);
  });

  function onLoad() {
    postEmbedHeight(true);
  }

  function onMessage(event: MessageEvent) {
    if (event.data === "kwikly-embed-request-height") postEmbedHeight(true);
    if (
      event.data &&
      typeof event.data === "object" &&
      (event.data as { type?: string }).type === "kwikly-embed-host-ready"
    ) {
      markHostScriptReady();
    }
    if (isHostEmbedViewport(event.data)) {
      markHostScriptReady();
      setHostEmbedViewport(event.data.viewport);
    }
  }

  return () => {
    document.documentElement.classList.remove("embed-layout");
    document.body.classList.remove("embed-layout");
    observer.disconnect();
    window.removeEventListener("load", onLoad);
    window.removeEventListener("message", onMessage);
    stopScrollForwarding?.();
  };
}
