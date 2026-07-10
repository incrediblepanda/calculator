import * as React from "react";

import {
  getHostEmbedViewport,
  subscribeEmbedViewport,
} from "@/lib/embed-height";

export type VisualViewportRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function readVisualViewport(): VisualViewportRect {
  const vv = window.visualViewport;
  return {
    top: vv?.offsetTop ?? 0,
    left: vv?.offsetLeft ?? 0,
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  };
}

/**
 * Visible area for embed dialogs. Prefers the host-page intersection rect
 * (from kwikly-embed-host.js) because iframe visualViewport ignores host scroll.
 */
export function useVisualViewport(active: boolean) {
  const [fallback, setFallback] = React.useState<VisualViewportRect>(
    readVisualViewport,
  );
  const [, bumpHostViewport] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    if (!active) return;
    return subscribeEmbedViewport(bumpHostViewport);
  }, [active]);

  React.useEffect(() => {
    if (!active) return;

    const update = () => setFallback(readVisualViewport());
    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    window.addEventListener("resize", update);

    return () => {
      vv?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  if (!active) return fallback;

  const host = getHostEmbedViewport();
  if (host && host.width > 0 && host.height > 0) {
    return host;
  }

  return fallback;
}
