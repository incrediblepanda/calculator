import * as React from "react";

export function useIsEmbedded() {
  const [isEmbedded] = React.useState(
    () => typeof window !== "undefined" && window.parent !== window,
  );

  return isEmbedded;
}
