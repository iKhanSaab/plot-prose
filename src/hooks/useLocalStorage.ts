import { useEffect, useRef, useCallback } from 'react';
import { Book } from '@/types/book';

const STORAGE_KEY = 'ploton-book';
const DEBOUNCE_MS = 500;

export function loadBook(): Book | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Book;
  } catch {
    // corrupted data, ignore
  }
  return null;
}

export function usePersistBook(book: Book) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
      } catch {
        // storage full, ignore
      }
    }, DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [book]);
}
