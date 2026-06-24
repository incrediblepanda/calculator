import * as React from "react";

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

/** Tracks the portion of the iframe actually visible on screen (for modal positioning). */
export function useVisualViewport(enabled: boolean) {
  const [viewport, setViewport] = React.useState<VisualViewportRect>(() =>
    enabled ? readVisualViewport() : { top: 0, left: 0, width: 0, height: 0 },
  );

  React.useEffect(() => {
    if (!enabled) return;

    const update = () => setViewport(readVisualViewport());
    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [enabled]);

  return viewport;
}
