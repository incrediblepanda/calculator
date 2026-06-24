let modalOpenCount = 0;
let lastPostedHeight = 0;

function measureContentHeight() {
  return Math.ceil(
    document.documentElement.scrollHeight || document.body.scrollHeight,
  );
}

/** Scroll the host page so the top of the embed is visible before showing a modal. */
export function scrollEmbedIntoView() {
  if (window.parent === window) return;
  document.documentElement.scrollIntoView({ block: "start", inline: "nearest" });
  window.parent.postMessage({ type: "kwikly-embed-modal-open" }, "*");
}

export function getVisibleEmbedHeight() {
  return Math.ceil(window.innerHeight);
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
    scrollEmbedIntoView();
    requestAnimationFrame(() => {
      lastPostedHeight = 0;
      postEmbedHeight();
    });
  }
}
