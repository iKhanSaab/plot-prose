/*
FILE PURPOSE:
This file handles backup and restore features for books and chapters.

ROLE IN THE APP:
It converts in-memory book data into downloadable files and validates imported files before they enter app state.

USED BY:
- pages/Index.tsx triggers book import/export actions through these helpers
- chapter export actions use the Markdown helper in this file
- tests verify the validation logic here

EXPORTS:
- exportNovelAsJSON
- isValidBookImport
- importNovelFromJSON
- exportChapterAsMarkdown
*/

import { Book, Library } from '@/types/book';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES: exportImport.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Handles import and export of books/chapters.
// Features:
// - Export entire book as JSON for backup/portability
// - Import previously exported JSON files
// - Validate imported data with strict type checking
// - Export individual chapters as Markdown
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ──── FUNCTION: exportNovelAsJSON ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export a book as a JSON file for backup or sharing.
 * 
 * How it works:
 * 1. Convert book object to JSON string (formatted with 2-space indent)
 * 2. Create a Blob (binary data) from that string
 * 3. Create a download link pointing to that blob
 * 4. Trigger a click on the link (browser downloads the file)
 * 5. Clean up the temporary blob URL
 * 
 * @param book The book to export
 */
export function exportNovelAsJSON(book: Book) {
  // Create JSON string with formatting (indented for readability)
  const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary <a> element
  const a = document.createElement('a');
  a.href = url;
  // Filename: replace invalid characters (spaces, special chars) with underscores
  a.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  
  // Trigger download
  a.click();
  
  // Clean up temporary URL
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ──── Data Validation Functions ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// These type-guard functions validate that imported data matches our schema.
// They use runtime checks because JSON files can be manually edited.

/**
 * Check if value is a plain object (not null, not array)
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Check if value is an array of strings
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Check if value is a valid Draft object
 */
function isDraft(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string';
}

/**
 * Check if value is a valid Chapter object
 */
function isChapter(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.activeDraftId === 'string' &&
    typeof value.order === 'number' &&
    Array.isArray(value.drafts) &&
    value.drafts.every(isDraft);
}

/**
 * Check if value is a valid Tag object
 */
function isTag(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.color === 'string';
}

/**
 * Check if value is a valid Pin object
 */
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

/**
 * Check if value is a valid WhiteboardSheet object
 */
function isWhiteboard(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.pins) &&
    value.pins.every(isPin);
}

/**
 * Check if value is a valid Folder object
 */
function isFolder(value: unknown) {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.order === 'number' &&
    (value.parentFolderId === undefined || value.parentFolderId === null || typeof value.parentFolderId === 'string') &&
    isStringArray(value.whiteboardIds) &&
    isStringArray(value.chapterIds);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ──── FUNCTION: isValidBookImport ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Type-guard function that validates an imported book.
 * This ensures the JSON file has the correct structure before importing it.
 * 
 * @param data Parsed JSON data to validate
 * @returns true if data matches Book schema, false otherwise
 */
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

// ═══════════════════════════════════════════════════════════════════════════════
// ──── FUNCTION: importNovelFromJSON ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Import a book from a JSON file.
 * 
 * Steps:
 * 1. Read the file as text
 * 2. Parse JSON
 * 3. Validate structure using isValidBookImport
 * 4. Assign a new ID (so multiple imports of same file get unique IDs)
 * 5. Resolve the Promise with the Book
 * 
 * @param file File selected by user
 * @returns Promise<Book> - resolves with imported book, rejects with error message
 * @throws Error if file is invalid JSON, wrong format, or can't be read
 */
export function importNovelFromJSON(file: File): Promise<Book> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        // Parse JSON from file
        const parsed: unknown = JSON.parse(reader.result as string);
        
        // Validate the structure
        if (!isValidBookImport(parsed)) {
          reject(new Error('Invalid novel file. Expected a full Webory export.'));
          return;
        }
        
        // Generate a new ID so this import is treated as a separate book
        // (even if importing the same file twice)
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
    
    // Read the file as text
    reader.readAsText(file);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ──── FUNCTION: exportChapterAsMarkdown ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export a single chapter as a Markdown file.
 * Useful for sharing just one chapter, or for editing in external Markdown editors.
 * 
 * @param title Chapter title (becomes the H1 heading)
 * @param content Chapter content (becomes the body)
 */
export function exportChapterAsMarkdown(title: string, content: string) {
  // Create Markdown format: # Title\n\nContent
  const md = `# ${title}\n\n${content}`;
  
  // Create blob and download like JSON export
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
