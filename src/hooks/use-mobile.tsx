/*
FILE PURPOSE:
This hook reports whether the viewport is currently in the app's mobile breakpoint.

ROLE IN THE APP:
It lets components switch between mobile and desktop layouts or interactions without duplicating media query logic everywhere.

USED BY:
- pages/Index.tsx chooses mobile drawer vs desktop sidebar
- Whiteboard and sidebar components adjust interaction behavior from this hook

EXPORTS:
- useIsMobile: hook that returns true below the mobile breakpoint
*/

import * as React from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useIsMobile
// ═══════════════════════════════════════════════════════════════════════════════
// Detects if the viewport is mobile-sized (< 768px width, the Tailwind md breakpoint).
//
// RETURNS:
// Boolean indicating if the current viewport is considered "mobile"
//
// USAGE:
// Used to conditionally render mobile vs desktop UI:
// - Mobile: Sidebar as a drawer/sheet
// - Desktop: Sidebar always visible
//
// HOW IT WORKS:
// 1. Uses window.matchMedia to listen for breakpoint changes
// 2. Checks current window size on mount
// 3. Updates state when window is resized across the breakpoint
// 4. Returns false initially (avoiding hydration mismatch) then updates
// ═══════════════════════════════════════════════════════════════════════════════

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
