/*
FILE PURPOSE:
This file manages the library of novels saved in the app.

ROLE IN THE APP:
It sits above BookContext and decides which book is active. It is the source of truth for the full collection of books stored in localStorage.

USED BY:
- pages/Index.tsx uses LibraryProvider at the top of the workspace tree
- BookContext.tsx receives the currently active book from this context
- sidebar and import/export flows call the actions exposed here

EXPORTS:
- LibraryProvider: wraps the app with library state
- useLibrary: hook for reading and mutating library state
*/

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Library, Book } from '@/types/book';
import { defaultBook } from '@/data/defaultBook';
import { loadLibrary, usePersistLibrary } from '@/hooks/useLocalStorage';
import { createStarterBook, isLegacyDemoBook } from '@/data/starterBook';

// ═══════════════════════════════════════════════════════════════════════════════
// LIBRARY CONTEXT: LibraryContext.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// Manages the collection of all books/novels. This is the top level of state.
// Each book can have multiple chapters, whiteboards, and folders.
//
// Key responsibilities:
// - Managing the library of all books
// - Switching between books (which one is "active")
// - Creating, deleting, renaming, and duplicating books
// - Persisting the library to localStorage
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Context Type Definition ──────────────────────────────────────────────────
interface LibraryContextType {
  library: Library;                          // All books and which one is active
  activeBook: Book;                          // The currently selected book
  addNovel: (title?: string) => void;        // Create a new book
  importNovel: (book: Book) => void;         // Add an imported book
  deleteNovel: (id: string) => void;         // Remove a book from library
  renameNovel: (id: string, title: string) => void;  // Change book title
  switchNovel: (id: string) => void;         // Switch to a different book
  duplicateNovel: (id: string) => void;      // Create a copy of a book
  updateActiveBook: (book: Book) => void;    // Update the currently active book
}

const LibraryContext = createContext<LibraryContextType | null>(null);

// ─── Initialization Logic ──────────────────────────────────────────────────────
/**
 * Load the library from localStorage, handling legacy data format migrations.
 * This runs the first time the app loads to restore saved books.
 * 
 * Migration path:
 * 1. Try to load from new format (LIBRARY_KEY)
 * 2. If not found, check for legacy library format (LEGACY_LIBRARY_KEY)
 * 3. If not found, check for single legacy book format (LEGACY_KEY)
 * 4. If nothing found, start with default book
 */
function getInitialLibrary(): Library {
  const saved = loadLibrary();
  
  // New format found - use it
  if (saved && saved.books?.length > 0) {
    // Check if this is an old demo book that needs updating
    const shouldMigrateDemo =
      saved.books.length === 1 &&
      saved.activeBookId === saved.books[0].id &&
      isLegacyDemoBook(saved.books[0]);

    if (shouldMigrateDemo) {
      // Upgrade the old demo book to the new starter book format
      const starterBook = createStarterBook({ id: saved.books[0].id });
      return { books: [starterBook], activeBookId: starterBook.id };
    }

    return saved;
  }
  
  // Nothing found - start with a default book
  return { books: [defaultBook], activeBookId: defaultBook.id };
}

// ─── Library Provider Component ────────────────────────────────────────────────
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  // State: the entire library (all books and active book ID)
  const [library, setLibrary] = useState<Library>(getInitialLibrary);

  // Automatically save library to localStorage whenever it changes
  usePersistLibrary(library);

  // Compute which book is currently active (memoized for performance)
  // If active book was deleted, fall back to first book
  const activeBook = useMemo(
    () => library.books.find(b => b.id === library.activeBookId) || library.books[0],
    [library]
  );

  // ─── Actions: creating & adding books ──────────────────────────────────────

  /**
   * Create a new book with starter content and make it active.
   * @param title Optional title; defaults to "Untitled Novel"
   */
  const addNovel = useCallback((title?: string) => {
    const id = `book-${Date.now()}`;
    const newBook: Book = createStarterBook({
      id,
      title: title || 'Untitled Novel',
    });
    setLibrary(prev => ({ books: [...prev.books, newBook], activeBookId: id }));
  }, []);

  /**
   * Add an imported book to the library and make it active.
   * Used when user imports a saved .json file.
   */
  const importNovel = useCallback((book: Book) => {
    setLibrary(prev => ({
      books: [...prev.books, book],
      activeBookId: book.id,
    }));
  }, []);

  // ─── Actions: modifying books ────────────────────────────────────────────────

  /**
   * Delete a book from the library.
   * Safety check: prevents deleting the last book (must always have at least one).
   */
  const deleteNovel = useCallback((id: string) => {
    setLibrary(prev => {
      const remaining = prev.books.filter(b => b.id !== id);
      if (remaining.length === 0) return prev; // can't delete last book
      return {
        books: remaining,
        // If deleted book was active, switch to first remaining book
        activeBookId: prev.activeBookId === id ? remaining[0].id : prev.activeBookId,
      };
    });
  }, []);

  /**
   * Rename a book's title.
   */
  const renameNovel = useCallback((id: string, title: string) => {
    setLibrary(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, title } : b),
    }));
  }, []);

  /**
   * Switch the active book (change which one is being edited).
   */
  const switchNovel = useCallback((id: string) => {
    setLibrary(prev => ({ ...prev, activeBookId: id }));
  }, []);

  /**
   * Create a full copy of a book with all its chapters, whiteboards, and folders.
   * The copy is immediately made active and appended with " (Copy)" to the title.
   */
  const duplicateNovel = useCallback((id: string) => {
    setLibrary(prev => {
      const book = prev.books.find(b => b.id === id);
      if (!book) return prev;
      
      const newId = `book-${Date.now()}`;
      // Deep clone the book so changes to the copy don't affect the original
      const copy: Book = { 
        ...JSON.parse(JSON.stringify(book)), 
        id: newId, 
        title: `${book.title} (Copy)` 
      };
      
      return { books: [...prev.books, copy], activeBookId: newId };
    });
  }, []);

  // ─── Actions: book synchronization ────────────────────────────────────────────

  /**
   * Update the data for the currently active book.
   * Called when content in the book changes (chapters modified, pins added, etc).
   * This is typically called by the BookContext provider.
   */
  const updateActiveBook = useCallback((book: Book) => {
    setLibrary(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === book.id ? book : b),
    }));
  }, []);

  return (
    <LibraryContext.Provider value={{
      library, activeBook, addNovel, importNovel, deleteNovel, renameNovel, switchNovel, duplicateNovel, updateActiveBook,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

// ─── Hook: useLibrary ──────────────────────────────────────────────────────────
/**
 * Hook to access library context anywhere in the app.
 * Must be called within a LibraryProvider-wrapped component.
 */
export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
