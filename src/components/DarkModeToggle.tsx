/*
FILE PURPOSE:
This file renders the dark mode toggle button and synchronizes theme preference with localStorage.

ROLE IN THE APP:
It controls the top-level `dark` class on the document, which Tailwind uses to switch theme tokens.

USED BY:
- BookSidebar.tsx renders this in the sidebar footer

EXPORTS:
- DarkModeToggle: button component that toggles between light and dark themes
*/

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

// These keys let the app keep the user's theme preference across reloads.
// LEGACY_THEME_KEY allows old saved preferences to keep working after the app rename.
const THEME_KEY = 'webory-theme';
const LEGACY_THEME_KEY = 'ploton-theme';

// This component reads the current theme preference on first render,
// then keeps the DOM class and localStorage in sync whenever the user toggles it.
export function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const storedTheme = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY);
    return storedTheme === 'dark' ||
      (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-1.5 rounded-md hover:bg-muted transition-colors"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <Sun className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}
