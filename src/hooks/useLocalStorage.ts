/*
FILE PURPOSE:
This file loads and saves the library to browser localStorage.

ROLE IN THE APP:
It is the persistence layer for the local-first experience. LibraryContext calls into this file to restore saved data on startup and debounce writes while the user edits.

USED BY:
- LibraryContext.tsx reads loadLibrary() during initialization
- LibraryContext.tsx calls usePersistLibrary() to save updates

EXPORTS:
- loadLibrary
- usePersistLibrary
- loadBook
- usePersistBook
*/

import { useEffect, useRef } from 'react';
import { Book, Library } from '@/types/book';

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useLocalStorage.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Handles persistence of library data to the browser's localStorage.
// This file includes migration logic to handle old data formats.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Storage Keys ──────────────────────────────────────────────────────────────
// LEGACY_KEY: Old format when app stored a single book (before library feature)
const LEGACY_KEY = 'ploton-book';

// LEGACY_LIBRARY_KEY: Intermediate format before current schema
const LEGACY_LIBRARY_KEY = 'ploton-library';

// LIBRARY_KEY: Current storage key for the library JSON
const LIBRARY_KEY = 'webory-library';

// Debounce time for saves (in milliseconds)
// Prevents saving after every keystroke, batching saves together
const DEBOUNCE_MS = 500;

// ─── Data Migration & Normalization Functions ──────────────────────────────────

/**
 * Normalizes a book by ensuring it has default folder structure.
 * Handles missing folders or incorrect folder formats.
 */
function withFolderDefaults(book: Book): Book {
  return {
    ...book,
    // Ensure folders array exists, and parentFolderId is null (not undefined)
    folders: Array.isArray(book.folders)
      ? book.folders.map((folder) => ({
          ...folder,
          parentFolderId: folder.parentFolderId ?? null,
        }))
      : [],
  };
}

/**
 * Normalizes the entire library by normalizing each book in it.
 */
function normalizeLibrary(library: Library): Library {
  return {
    ...library,
    books: library.books.map(withFolderDefaults),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ──── FUNCTION: loadLibrary ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Load the library from localStorage on app startup.
 * Handles three scenarios:
 * 
 * 1. NEW FORMAT: Find library under LIBRARY_KEY → use it
 * 2. LEGACY FORMAT 1: Find library under LEGACY_LIBRARY_KEY → migrate to new format
 * 3. LEGACY FORMAT 2: Find single book under LEGACY_KEY → wrap in library format
 * 
 * @returns Library from storage, or null if not found or corrupted
 */
export function loadLibrary(): Library | null {
  try {
    // SCENARIO 1: Try new format
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) return normalizeLibrary(JSON.parse(raw) as Library);

    // SCENARIO 2: Try legacy library format
    const legacyLibrary = localStorage.getItem(LEGACY_LIBRARY_KEY);
    if (legacyLibrary) {
      const library = normalizeLibrary(JSON.parse(legacyLibrary) as Library);
      // Upgrade it to new format
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
      return library;
    }

    // SCENARIO 3: Migrate old single-book format to library format
    // (This happened when app added multi-book support)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const book = withFolderDefaults(JSON.parse(legacy) as Book);
      const lib: Library = { books: [book], activeBookId: book.id };
      
      // Save in new format and clean up old keys
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
      localStorage.removeItem(LEGACY_KEY);
      localStorage.removeItem(LEGACY_LIBRARY_KEY);
      return lib;
    }
  } catch {
    // If parsing or reading fails (corrupted data), ignore and return null
    // The app will start with default book instead
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ──── HOOK: usePersistLibrary ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * React hook that automatically saves the library to localStorage.
 * 
 * Features:
 * - Debounced: batches rapid changes together (Ctrl+N or typing won't cause 100 saves)
 * - Runs whenever library changes (dependency on [library])
 * - Clears old timers to avoid double-saves
 * - Catches errors silently (e.g., if localStorage is full)
 * 
 * Usage: usePersistLibrary(library) in the LibraryProvider
 * 
 * @param library The entire library object to persist
 */
export function usePersistLibrary(library: Library) {
  // Store the timeout ID so we can clear it on cleanup or new updates
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Clear any existing timer (we'll set a new one)
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Set a new debounced save
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
      } catch {
        // Storage quota exceeded or other error - ignore silently
        // The app will still work, just won't persist until space is freed
      }
    }, DEBOUNCE_MS);
    
    // Cleanup: clear timer on unmount or next effect
    return () => { 
      if (timerRef.current) clearTimeout(timerRef.current); 
    };
  }, [library]);
}

// ─── Legacy Exports (Kept for backward compatibility) ─────────────────────────
// These are no longer used, but kept to avoid breaking any imports

/**
 * @deprecated Use loadLibrary() instead
 * Kept for backward compatibility
 */
export function loadBook(): Book | null {
  return null;
}

/**
 * @deprecated Use usePersistLibrary() instead
 * Kept for backward compatibility
 */
export function usePersistBook(_book: Book) {}
