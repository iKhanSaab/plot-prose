/*
FILE PURPOSE:
This file creates starter book data for new novels and legacy migrations.

ROLE IN THE APP:
It is the factory for building a correctly shaped Book object with initial whiteboard and chapter content.

USED BY:
- LibraryContext.tsx uses createStarterBook when creating novels
- defaultBook.ts uses it to define the app's initial fallback book
- migration code uses isLegacyDemoBook to detect old seeded demo content

EXPORTS:
- createStarterBook
- isLegacyDemoBook
*/

import { Book } from '@/types/book';

function timestamp() {
  return new Date().toISOString();
}

export function createStarterBook(overrides?: Partial<Book>): Book {
  const now = timestamp();
  const bookId = overrides?.id || `book-${Date.now()}`;
  const whiteboardId = `wb-${Date.now()}-starter`;
  const chapterId = `ch-${Date.now()}-starter`;
  const draftId = `draft-${Date.now()}-starter`;

  return {
    id: bookId,
    title: 'Untitled Novel',
    folders: [],
    whiteboards: [
      {
        id: whiteboardId,
        name: 'Storyboard',
        pins: [],
      },
    ],
    chapters: [
      {
        id: chapterId,
        title: 'Chapter 1',
        order: 1,
        activeDraftId: draftId,
        drafts: [
          {
            id: draftId,
            name: 'Draft 1',
            content: '',
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function isLegacyDemoBook(book: Book) {
  return (
    book.id === 'book-1' &&
    book.title === 'My Novel' &&
    book.whiteboards.some((whiteboard) => whiteboard.name === 'Plot Structure') &&
    book.chapters.some((chapter) => chapter.title === 'Chapter 1: The Beginning')
  );
}
