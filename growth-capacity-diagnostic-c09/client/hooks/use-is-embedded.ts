import { useLocation } from "react-router-dom";

function isEmbedPath(pathname: string) {
  return pathname === "/embed" || pathname.startsWith("/embed/");
}

/** True on the /embed route or when loaded inside a host-page iframe. */
export function useIsEmbedded() {
  const { pathname } = useLocation();

  if (isEmbedPath(pathname)) return true;

  return typeof window !== "undefined" && window.parent !== window;
}
