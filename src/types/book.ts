// ═══════════════════════════════════════════════════════════════════════════════
// DATA TYPES: book.ts
// ═══════════════════════════════════════════════════════════════════════════════
// This file defines the core data structures for the Plot Prose app.
// These types describe the shape of:
// - Books (novels/writing projects)
// - Chapters and drafts (writing content)
// - Whiteboards and pins (visual planning)
// - Library management (collections of books)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tag System ───────────────────────────────────────────────────────────────
// Tags color the pins on whiteboards for visual organization
export type TagColor = 'rose' | 'sage' | 'amber' | 'lavender';

export interface Tag {
  id: string;        // Unique identifier
  label: string;     // Display text (e.g., "Character", "Plot Point")
  color: TagColor;   // Visual color for the tag
}

// ─── Whiteboard System ─────────────────────────────────────────────────────────
// Whiteboards are visual planning surfaces where you place "pins" (sticky notes)
// and connect them to show relationships between ideas.

export interface Pin {
  id: string;           // Unique identifier for this pin
  x: number;            // X position on the whiteboard canvas
  y: number;            // Y position on the whiteboard canvas
  width?: number;       // Optional custom width for board-style cards
  height?: number;      // Optional custom height for board-style cards
  title: string;        // Brief title shown on the pin
  content: string;      // Longer description content
  imageUrl?: string;    // Optional image for visual reference
  tags: Tag[];          // Categories/labels for organizing pins
  connections: string[]; // IDs of other pins this pin is connected to (relationship lines)
}

export interface WhiteboardSheet {
  id: string;    // Unique identifier
  name: string;  // Display name (e.g., "Plot Development", "Characters")
  pins: Pin[];   // Collection of all pins on this whiteboard
}

// ─── Chapter & Writing System ──────────────────────────────────────────────────
// Chapters contain multiple drafts, allowing writers to track revisions

export interface Draft {
  id: string;        // Unique identifier
  name: string;      // Display name (e.g., "First Draft", "Revision 2")
  content: string;   // The actual written text
  createdAt: string; // ISO timestamp when created
  updatedAt: string; // ISO timestamp when last modified
}

export interface Chapter {
  id: string;              // Unique identifier
  title: string;           // Chapter name/title
  drafts: Draft[];         // Multiple versions of draft content
  activeDraftId: string;   // Which draft is currently being edited
  order: number;           // Position order in the book
}

// ─── Folder System ────────────────────────────────────────────────────────────
// Folders organize chapters and whiteboards hierarchically (like file folders)

export interface Folder {
  id: string;                  // Unique identifier
  name: string;                // Display name
  parentFolderId?: string | null;  // For nested folders (if any)
  whiteboardIds: string[];     // IDs of whiteboards in this folder
  chapterIds: string[];        // IDs of chapters in this folder
  order: number;               // Position order among sibling folders
}

// ─── Book (Main Document) ──────────────────────────────────────────────────────
// A Book is a complete writing project containing chapters, whiteboards, and folders

export interface Book {
  id: string;            // Unique identifier for this book/novel
  title: string;         // Book/novel title
  chapters: Chapter[];   // All chapters in this book
  whiteboards: WhiteboardSheet[]; // All visual planning boards
  folders: Folder[];     // Organizational folder structure
}

export interface Book {
  id: string;
  title: string;
  whiteboards: WhiteboardSheet[];
  chapters: Chapter[];
  folders: Folder[];
}

export interface Library {
  books: Book[];
  activeBookId: string;
}

export type ViewMode = 'whiteboard' | 'chapter';

export interface AppState {
  book: Book;
  activeView: ViewMode;
  activeWhiteboardId: string | null;
  activeChapterId: string | null;
  isEditorFocusMode: boolean;
}
/*
FILE PURPOSE:
This file defines the shared TypeScript data shapes used across the app.

ROLE IN THE APP:
It is the contract for the whole application. Contexts, components, persistence, import/export, and tests all rely on these types to agree on what a book, chapter, draft, folder, and pin look like.

USED BY:
- contexts and components throughout src/
- import/export helpers
- starter/default data factories
- tests that construct sample app state

EXPORTS:
- TypeScript types and interfaces for tags, pins, whiteboards, drafts, chapters, folders, books, libraries, and app view state
*/
