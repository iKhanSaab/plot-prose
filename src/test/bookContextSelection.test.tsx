import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookProvider, useBook } from '@/contexts/BookContext';
import type { Book } from '@/types/book';

const baseBook: Book = {
  id: 'book-1',
  title: 'Selection Test',
  folders: [],
  whiteboards: [
    { id: 'wb-1', name: 'Board One', pins: [] },
    { id: 'wb-2', name: 'Board Two', pins: [] },
  ],
  chapters: [
    {
      id: 'ch-1',
      title: 'Chapter One',
      order: 1,
      activeDraftId: 'draft-1',
      drafts: [
        {
          id: 'draft-1',
          name: 'Draft One',
          content: '',
          createdAt: '2026-03-11T00:00:00.000Z',
          updatedAt: '2026-03-11T00:00:00.000Z',
        },
      ],
    },
  ],
};

function SelectionProbe() {
  const {
    book,
    activeView,
    activeWhiteboardId,
    activeChapterId,
    addWhiteboard,
    addChapter,
    deleteWhiteboard,
    setActiveWhiteboard,
  } = useBook();

  return (
    <div>
      <button onClick={() => addWhiteboard()}>Add board</button>
      <button onClick={() => addChapter()}>Add chapter</button>
      <button onClick={() => setActiveWhiteboard('wb-2')}>Select board two</button>
      <button onClick={() => deleteWhiteboard('wb-2')}>Delete board two</button>
      <div data-testid="active-view">{activeView}</div>
      <div data-testid="active-board">{activeWhiteboardId ?? 'none'}</div>
      <div data-testid="active-chapter">{activeChapterId ?? 'none'}</div>
      <div data-testid="board-count">{book.whiteboards.length}</div>
      <div data-testid="chapter-count">{book.chapters.length}</div>
      <div data-testid="book-state">{JSON.stringify(book)}</div>
    </div>
  );
}

function BookProviderHarness({ initialBook }: { initialBook: Book }) {
  const [book, setBook] = React.useState(initialBook);
  return (
    <BookProvider book={book} onBookChange={setBook}>
      <SelectionProbe />
    </BookProvider>
  );
}

describe('BookProvider selection sync', () => {
  it('keeps a newly created board active after the parent book prop updates', async () => {
    render(<BookProviderHarness initialBook={baseBook} />);

    fireEvent.click(screen.getByText('Add board'));

    await waitFor(() => {
      expect(screen.getByTestId('board-count')).toHaveTextContent('3');
      const state = JSON.parse(screen.getByTestId('book-state').textContent ?? '{}') as Book;
      expect(screen.getByTestId('active-board').textContent).toBe(state.whiteboards[2].id);
    });
  });

  it('keeps a newly created chapter active after the parent book prop updates', async () => {
    render(<BookProviderHarness initialBook={baseBook} />);

    fireEvent.click(screen.getByText('Add chapter'));

    await waitFor(() => {
      expect(screen.getByTestId('chapter-count')).toHaveTextContent('2');
      const state = JSON.parse(screen.getByTestId('book-state').textContent ?? '{}') as Book;
      expect(screen.getByTestId('active-chapter').textContent).toBe(state.chapters[1].id);
    });
  });

  it('falls back to another valid board when the active board is deleted', async () => {
    render(<BookProviderHarness initialBook={baseBook} />);

    fireEvent.click(screen.getByText('Select board two'));
    expect(screen.getByTestId('active-board')).toHaveTextContent('wb-2');

    fireEvent.click(screen.getByText('Delete board two'));

    await waitFor(() => {
      expect(screen.getByTestId('active-board')).toHaveTextContent('wb-1');
      expect(screen.getByTestId('board-count')).toHaveTextContent('1');
    });
  });

  it('resets selection to the new novel defaults when the novel id changes', async () => {
    function NovelSwitchHarness() {
      const [book, setBook] = React.useState(baseBook);

      return (
        <>
          <button
            onClick={() =>
              setBook({
                id: 'book-2',
                title: 'Second Novel',
                folders: [],
                whiteboards: [{ id: 'wb-9', name: 'Fresh Board', pins: [] }],
                chapters: [{
                  id: 'ch-9',
                  title: 'Fresh Chapter',
                  order: 1,
                  activeDraftId: 'draft-9',
                  drafts: [{
                    id: 'draft-9',
                    name: 'Draft 9',
                    content: '',
                    createdAt: '2026-03-11T00:00:00.000Z',
                    updatedAt: '2026-03-11T00:00:00.000Z',
                  }],
                }],
              })
            }
          >
            Switch novel
          </button>
          <BookProvider book={book} onBookChange={setBook}>
            <SelectionProbe />
          </BookProvider>
        </>
      );
    }

    render(<NovelSwitchHarness />);

    fireEvent.click(screen.getByText('Select board two'));
    expect(screen.getByTestId('active-board')).toHaveTextContent('wb-2');

    fireEvent.click(screen.getByText('Switch novel'));

    await waitFor(() => {
      expect(screen.getByTestId('active-board')).toHaveTextContent('wb-9');
      expect(screen.getByTestId('active-chapter')).toHaveTextContent('ch-9');
      expect(screen.getByTestId('active-view')).toHaveTextContent('whiteboard');
    });
  });
});
