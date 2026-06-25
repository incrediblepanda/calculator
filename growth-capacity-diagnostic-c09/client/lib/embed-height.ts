/** Minimum iframe height — keep in sync with public/kwikly-embed-host.js */
export const EMBED_MIN_HEIGHT = 900;

export const EMBED_ROOT_ID = "embed-root";

let modalOpenCount = 0;
let lastPostedHeight = 0;

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
  const block =
    scrollAnchor && isInVisualViewport(scrollAnchor) ? "nearest" : "center";
  target.scrollIntoView({ block, inline: "nearest" });

  // Optional — ignored when the host page has no listener
  window.parent.postMessage({ type: "kwikly-embed-modal-open" }, "*");
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
  [50, 150, 300].forEach((delay) => {
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
    return;
  }

  lastPostedHeight = 0;
  window.parent.postMessage({ type: "kwikly-embed-modal-close" }, "*");
  requestEmbedHeightUpdate();
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

  [100, 500, 1500].forEach((delay) => {
    window.setTimeout(() => postEmbedHeight(true), delay);
  });

  function onLoad() {
    postEmbedHeight(true);
  }

  function onMessage(event: MessageEvent) {
    if (event.data === "kwikly-embed-request-height") postEmbedHeight(true);
  }

  return () => {
    document.documentElement.classList.remove("embed-layout");
    document.body.classList.remove("embed-layout");
    observer.disconnect();
    window.removeEventListener("load", onLoad);
    window.removeEventListener("message", onMessage);
  };
}
