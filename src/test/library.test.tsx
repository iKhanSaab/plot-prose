import { useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LibraryProvider, useLibrary } from '@/contexts/LibraryContext';
import { loadLibrary, usePersistLibrary } from '@/hooks/useLocalStorage';
import type { Library } from '@/types/book';

function LibrarySnapshot() {
  const { activeBook, library, addNovel } = useLibrary();

  useEffect(() => {
    addNovel('Second Book');
  }, [addNovel]);

  return (
    <div>
      <p data-testid="active-title">{activeBook.title}</p>
      <p data-testid="book-count">{library.books.length}</p>
    </div>
  );
}

function PersistProbe({ library }: { library: Library }) {
  usePersistLibrary(library);
  return null;
}

describe('library startup and persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('boots into the starter Webory workspace on first run', () => {
    render(
      <LibraryProvider>
        <LibrarySnapshot />
      </LibraryProvider>
    );

    expect(screen.getByTestId('active-title')).toHaveTextContent('Second Book');
    expect(screen.getByTestId('book-count')).toHaveTextContent('2');
  });

  it('migrates legacy single-book storage to the library shape', () => {
    localStorage.setItem('ploton-book', JSON.stringify({
      id: 'legacy-book',
      title: 'Legacy Draft',
      whiteboards: [],
      chapters: [],
    }));

    const migrated = loadLibrary();

    expect(migrated).toEqual({
      activeBookId: 'legacy-book',
      books: [{
        id: 'legacy-book',
        title: 'Legacy Draft',
        whiteboards: [],
        chapters: [],
        folders: [],
      }],
    });
    expect(localStorage.getItem('ploton-book')).toBeNull();
    expect(localStorage.getItem('webory-library')).not.toBeNull();
  });

  it('persists the active library after the debounce window', async () => {
    const library: Library = {
      activeBookId: 'book-1',
      books: [{
        id: 'book-1',
        title: 'Persisted Book',
        folders: [],
        whiteboards: [],
        chapters: [],
      }],
    };

    render(<PersistProbe library={library} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('webory-library')).toContain('Persisted Book');
  });
});
