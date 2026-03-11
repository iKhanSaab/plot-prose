/*
FILE PURPOSE:
This file boots the React application in the browser and registers the service worker.

ROLE IN THE APP:
It is the browser entry point. It connects the HTML shell in index.html to the React component tree.

USED BY:
- index.html loads this file through Vite
- App.tsx is rendered from here
- sw.js is registered from here after the page loads

EXPORTS:
- This file exports nothing. It performs startup side effects.
*/

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY POINT: main.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// This file is the app's entry point. It:
// 1. Creates a React root at the #root HTML element
// 2. Renders the main App component (which sets up routing & providers)
// 3. Registers a service worker for offline caching capability

createRoot(document.getElementById("root")!).render(<App />);

// ─── Service Worker Registration ──────────────────────────────────────────────
// Register a service worker (sw.js) to enable offline functionality.
// This allows users to access cached content when the network is unavailable.
// The try-catch pattern means the app still works fine if service worker fails.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal: the app should still run without offline caching.
    });
  });
}
