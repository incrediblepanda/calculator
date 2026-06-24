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

/** Visible slice of the iframe when the host page has scrolled. */
export function useVisualViewport(active: boolean) {
  const [rect, setRect] = React.useState<VisualViewportRect>(readVisualViewport);

  React.useEffect(() => {
    if (!active) return;

    const update = () => setRect(readVisualViewport());
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
  }, [active]);

  return rect;
}
