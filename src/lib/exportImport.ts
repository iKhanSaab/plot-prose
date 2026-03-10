import { Book, Library } from '@/types/book';

export function exportNovelAsJSON(book: Book) {
  const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isDraft(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string';
}

function isChapter(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.activeDraftId === 'string' &&
    typeof value.order === 'number' &&
    Array.isArray(value.drafts) &&
    value.drafts.every(isDraft);
}

function isTag(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.color === 'string';
}

function isPin(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    (value.imageUrl === undefined || typeof value.imageUrl === 'string') &&
    Array.isArray(value.tags) &&
    value.tags.every(isTag) &&
    isStringArray(value.connections);
}

function isWhiteboard(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.pins) &&
    value.pins.every(isPin);
}

function isFolder(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.order === 'number' &&
    (value.parentFolderId === undefined || value.parentFolderId === null || typeof value.parentFolderId === 'string') &&
    isStringArray(value.whiteboardIds) &&
    isStringArray(value.chapterIds);
}

export function isValidBookImport(data: unknown): data is Book {
  return isRecord(data) &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    Array.isArray(data.whiteboards) &&
    data.whiteboards.every(isWhiteboard) &&
    Array.isArray(data.chapters) &&
    data.chapters.every(isChapter) &&
    Array.isArray(data.folders) &&
    data.folders.every(isFolder);
}

export function importNovelFromJSON(file: File): Promise<Book> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string);
        if (!isValidBookImport(parsed)) {
          reject(new Error('Invalid novel file. Expected a full Webory export.'));
          return;
        }
        const data: Book = {
          ...parsed,
          id: `book-${Date.now()}`,
        };
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function exportChapterAsMarkdown(title: string, content: string) {
  const md = `# ${title}\n\n${content}`;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
