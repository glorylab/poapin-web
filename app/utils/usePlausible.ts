import { useEffect } from "react";
import { useLocation } from "@remix-run/react";

declare global {
  interface Window {
    plausible?: (event: string, opts?: Record<string, unknown>) => void;
  }
}

export function usePlausiblePageview() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window.plausible === "function") {
      window.plausible("pageview", {
        // keep Plausible’s default URL format
        u: pathname + search,
      });
    }
  }, [pathname, search]);
}
