import { useEffect, useRef } from 'react';
import { Book, Library } from '@/types/book';

const LEGACY_KEY = 'ploton-book';
const LEGACY_LIBRARY_KEY = 'ploton-library';
const LIBRARY_KEY = 'webory-library';
const DEBOUNCE_MS = 500;

function withFolderDefaults(book: Book): Book {
  return {
    ...book,
    folders: Array.isArray(book.folders) ? book.folders : [],
  };
}

function normalizeLibrary(library: Library): Library {
  return {
    ...library,
    books: library.books.map(withFolderDefaults),
  };
}

export function loadLibrary(): Library | null {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) return normalizeLibrary(JSON.parse(raw) as Library);

    const legacyLibrary = localStorage.getItem(LEGACY_LIBRARY_KEY);
    if (legacyLibrary) {
      const library = normalizeLibrary(JSON.parse(legacyLibrary) as Library);
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
      return library;
    }

    // Migration: wrap legacy single book into library
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const book = withFolderDefaults(JSON.parse(legacy) as Book);
      const lib: Library = { books: [book], activeBookId: book.id };
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
      localStorage.removeItem(LEGACY_KEY);
      localStorage.removeItem(LEGACY_LIBRARY_KEY);
      return lib;
    }
  } catch {
    // corrupted data, ignore
  }
  return null;
}

export function usePersistLibrary(library: Library) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
      } catch {
        // storage full, ignore
      }
    }, DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [library]);
}

// Keep legacy exports for backward compat (unused now)
export function loadBook(): Book | null {
  return null;
}
export function usePersistBook(_book: Book) {}
