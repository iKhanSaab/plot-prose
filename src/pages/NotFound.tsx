/*
FILE PURPOSE:
This file renders the fallback 404 page for unknown routes.

ROLE IN THE APP:
It is the final catch-all route in App.tsx and helps diagnose bad or outdated URLs.

USED BY:
- App.tsx renders this for unmatched routes

EXPORTS:
- NotFound: default export for the 404 page
*/

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// This effect logs failed route visits to the console.
// It helps during development when a bad link or route config sends the user to 404.
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
