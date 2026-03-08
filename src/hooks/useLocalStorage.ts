import { useEffect, useRef } from 'react';
import { Book, Library } from '@/types/book';

const LEGACY_KEY = 'ploton-book';
const LIBRARY_KEY = 'ploton-library';
const DEBOUNCE_MS = 500;

export function loadLibrary(): Library | null {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) return JSON.parse(raw) as Library;

    // Migration: wrap legacy single book into library
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const book = JSON.parse(legacy) as Book;
      if (!book.folders) (book as any).folders = [];
      const lib: Library = { books: [book], activeBookId: book.id };
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
      localStorage.removeItem(LEGACY_KEY);
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
