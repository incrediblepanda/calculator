let modalOpenCount = 0;
let lastPostedHeight = 0;

function measureContentHeight() {
  return Math.ceil(
    document.documentElement.scrollHeight || document.body.scrollHeight,
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

export function postEmbedHeight() {
  if (window.parent === window) return;
  if (modalOpenCount > 0) return;

  const height = measureContentHeight();

  if (height === lastPostedHeight) return;
  lastPostedHeight = height;

  window.parent.postMessage({ type: "kwikly-embed-height", height }, "*");
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
  requestAnimationFrame(() => postEmbedHeight());
}

/** Call on embed mount — retries help when the host script loads after the iframe. */
export function startEmbedHeightReporting() {
  if (window.parent === window) return;

  postEmbedHeight();

  const observer = new ResizeObserver(postEmbedHeight);
  observer.observe(document.documentElement);

  window.addEventListener("load", postEmbedHeight);

  const onMessage = (event: MessageEvent) => {
    if (event.data === "kwikly-embed-request-height") postEmbedHeight();
  };
  window.addEventListener("message", onMessage);

  [100, 500, 1500].forEach((delay) => {
    window.setTimeout(postEmbedHeight, delay);
  });

  return () => {
    observer.disconnect();
    window.removeEventListener("load", postEmbedHeight);
    window.removeEventListener("message", onMessage);
  };
}
