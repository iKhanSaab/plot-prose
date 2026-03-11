/*
FILE PURPOSE:
This file defines the root App component that wraps the whole UI in routing and shared providers.

ROLE IN THE APP:
It is the top-level React component after main.tsx. It wires together routing, tooltip support, and toast systems.

USED BY:
- main.tsx renders this component
- pages/Index.tsx is the main route rendered from here
- pages/NotFound.tsx handles unmatched routes

EXPORTS:
- App: the root React component for the application
*/

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ═══════════════════════════════════════════════════════════════════════════════
// APP COMPONENT: App.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// This component sets up all the providers (context, routing, UI utilities) that
// wrap the entire application. It's the root of the component tree.
//
// Providers included:
// - QueryClientProvider: Manages async queries (from React Query/TanStack Query)
// - TooltipProvider: Enables tooltip components throughout the app
// - Toaster & Sonner: Toast notification systems for user feedback
// - BrowserRouter: React Router for client-side navigation
// ═══════════════════════════════════════════════════════════════════════════════

const queryClient = new QueryClient();

const App = () => (
  // ─── React Query Provider ────────────────────────────────────────────────────
  // React Query manages server state and caching. It's useful for fetching data
  // but in this app it's more of a foundation for future API integration.
  <QueryClientProvider client={queryClient}>
    {/* ─── Tooltip Provider ────────────────────────────────────────────────────
        Wraps the app to enable <Tooltip> components throughout the UI. */}
    <TooltipProvider>
      {/* ─── Toast Notifications ────────────────────────────────────────────────
          Toaster: Default toast notification system (top-right corner notifications)
          Sonner: Alternative toast system with more styling control */}
      <Toaster />
      <Sonner />
      
      {/* ─── Router Setup ───────────────────────────────────────────────────────
          BrowserRouter enables client-side routing using the History API.
          Routes define which component shows at which path. */}
      <BrowserRouter>
        <Routes>
          {/* Main app page: "/" displays the full writing/planning interface */}
          <Route path="/" element={<Index />} />
          
          {/* Catch-all route: any other path shows a 404 NotFound page */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
