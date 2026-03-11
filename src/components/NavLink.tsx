/*
FILE PURPOSE:
This file provides a small compatibility wrapper around React Router's NavLink.

ROLE IN THE APP:
It lets the codebase use active and pending class names in a cleaner, reusable way.

USED BY:
- navigation components that want active-state styling

EXPORTS:
- NavLink: wrapped router link with merged class handling
*/

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

// This wrapper translates RouterNavLink's function-based className API
// into a more ergonomic prop shape for the rest of the app.
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
