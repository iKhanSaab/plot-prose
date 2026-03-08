import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Library, Book } from '@/types/book';
import { defaultBook } from '@/data/defaultBook';
import { loadLibrary, usePersistLibrary } from '@/hooks/useLocalStorage';

interface LibraryContextType {
  library: Library;
  activeBook: Book;
  addNovel: (title?: string) => void;
  deleteNovel: (id: string) => void;
  renameNovel: (id: string, title: string) => void;
  switchNovel: (id: string) => void;
  duplicateNovel: (id: string) => void;
  updateActiveBook: (book: Book) => void;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

function getInitialLibrary(): Library {
  const saved = loadLibrary();
  if (saved && saved.books?.length > 0) return saved;
  return { books: [defaultBook], activeBookId: defaultBook.id };
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [library, setLibrary] = useState<Library>(getInitialLibrary);

  usePersistLibrary(library);

  const activeBook = useMemo(
    () => library.books.find(b => b.id === library.activeBookId) || library.books[0],
    [library]
  );

  const addNovel = useCallback((title?: string) => {
    const id = `book-${Date.now()}`;
    const draftId = `draft-${Date.now()}`;
    const newBook: Book = {
      id,
      title: title || 'Untitled Novel',
      folders: [],
      whiteboards: [{
        id: `wb-${Date.now()}`,
        name: 'Whiteboard 1',
        pins: [],
      }],
      chapters: [{
        id: `ch-${Date.now()}`,
        title: 'Chapter 1',
        order: 1,
        activeDraftId: draftId,
        drafts: [{ id: draftId, name: 'First Draft', content: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      }],
    };
    setLibrary(prev => ({ books: [...prev.books, newBook], activeBookId: id }));
  }, []);

  const deleteNovel = useCallback((id: string) => {
    setLibrary(prev => {
      const remaining = prev.books.filter(b => b.id !== id);
      if (remaining.length === 0) return prev; // can't delete last
      return {
        books: remaining,
        activeBookId: prev.activeBookId === id ? remaining[0].id : prev.activeBookId,
      };
    });
  }, []);

  const renameNovel = useCallback((id: string, title: string) => {
    setLibrary(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, title } : b),
    }));
  }, []);

  const switchNovel = useCallback((id: string) => {
    setLibrary(prev => ({ ...prev, activeBookId: id }));
  }, []);

  const duplicateNovel = useCallback((id: string) => {
    setLibrary(prev => {
      const book = prev.books.find(b => b.id === id);
      if (!book) return prev;
      const newId = `book-${Date.now()}`;
      const copy: Book = { ...JSON.parse(JSON.stringify(book)), id: newId, title: `${book.title} (Copy)` };
      return { books: [...prev.books, copy], activeBookId: newId };
    });
  }, []);

  const updateActiveBook = useCallback((book: Book) => {
    setLibrary(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === book.id ? book : b),
    }));
  }, []);

  return (
    <LibraryContext.Provider value={{
      library, activeBook, addNovel, deleteNovel, renameNovel, switchNovel, duplicateNovel, updateActiveBook,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
