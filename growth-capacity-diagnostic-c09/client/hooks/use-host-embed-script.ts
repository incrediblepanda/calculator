import * as React from "react";

import {
  getHostEmbedViewport,
  subscribeEmbedViewport,
} from "@/lib/embed-height";

/** True once kwikly-embed-host.js has posted a viewport rect (modal resize active). */
export function useHostEmbedScriptActive(active: boolean) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }

    const sync = () => {
      const viewport = getHostEmbedViewport();
      if (viewport && viewport.width > 0 && viewport.height > 0) {
        setReady(true);
      }
    };

    sync();
    const unsubscribe = subscribeEmbedViewport(sync);
    const timer = window.setTimeout(sync, 250);

    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [active]);

  return ready;
}
