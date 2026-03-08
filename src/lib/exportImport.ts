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

export function importNovelFromJSON(file: File): Promise<Book> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.id || !data.title || !Array.isArray(data.chapters)) {
          reject(new Error('Invalid novel file'));
          return;
        }
        // Assign new ID to avoid conflicts
        data.id = `book-${Date.now()}`;
        resolve(data as Book);
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
