let modalOpenCount = 0;
let lastPostedHeight = 0;

function measureContentHeight() {
  return Math.ceil(
    document.documentElement.scrollHeight || document.body.scrollHeight,
  );
}

/** Visible height inside a tall iframe — not the same as window.innerHeight. */
export function getVisibleEmbedHeight() {
  const vv = window.visualViewport;
  return Math.ceil(vv?.height ?? window.innerHeight);
}

export function postEmbedHeight() {
  if (window.parent === window) return;

  const height =
    modalOpenCount > 0 ? getVisibleEmbedHeight() : measureContentHeight();

  if (height === lastPostedHeight) return;
  lastPostedHeight = height;

  window.parent.postMessage({ type: "kwikly-embed-height", height }, "*");
}

export function setEmbedModalOpen(open: boolean) {
  if (window.parent === window) return;

  modalOpenCount = Math.max(0, modalOpenCount + (open ? 1 : -1));
  lastPostedHeight = 0;
  postEmbedHeight();

  if (open) {
    window.parent.postMessage({ type: "kwikly-embed-modal-open" }, "*");
    // Re-measure after layout so visualViewport reflects the visible slice.
    requestAnimationFrame(() => {
      lastPostedHeight = 0;
      postEmbedHeight();
    });
  }
}
