

# Add Folders to Organize Whiteboards & Chapters

## What Changes

Currently whiteboards and chapters are flat lists in the sidebar. We'll introduce a **Folder** system so users can group their whiteboards and chapters inside named folders, with ungrouped items still showing at the top level.

## Data Model Changes (`src/types/book.ts`)

Add a new `Folder` interface:
```typescript
interface Folder {
  id: string;
  name: string;
  whiteboardIds: string[];  // references to whiteboard IDs in this folder
  chapterIds: string[];     // references to chapter IDs in this folder
  order: number;
}
```

Update `Book` to include `folders: Folder[]`.

## Context Changes (`src/contexts/BookContext.tsx`)

Add folder CRUD operations:
- `addFolder(name)` — creates a new empty folder
- `renameFolder(folderId, name)`
- `deleteFolder(folderId)` — removes folder but keeps its items (moves them to ungrouped)
- `moveToFolder(folderId, itemId, itemType: 'whiteboard' | 'chapter')` — assigns an item to a folder
- `removeFromFolder(folderId, itemId, itemType)` — ungroups an item

Update `getInitialBook()` to handle missing `folders` field gracefully (backward compat with existing localStorage data).

## Sidebar Changes (`src/components/BookSidebar.tsx`)

Restructure the nav into three collapsible sections:
1. **Folders** — each folder is collapsible, showing its whiteboards and chapters inside
2. **Whiteboards** — only ungrouped whiteboards
3. **Chapters** — only ungrouped chapters

Each folder gets:
- Collapse/expand toggle
- Right-click context menu: Rename, Delete
- "New board" and "New chapter" buttons inside each folder (auto-assigns to that folder)

Items inside folders get a right-click option: "Move to folder >" or "Remove from folder".

A top-level "New folder" button in the sidebar nav.

## Default Data (`src/data/defaultBook.ts`)

Add one default folder (e.g. "Act I") containing the first whiteboard and first chapter, so new users see the feature immediately.

## Migration

In `getInitialBook()`, if loaded book has no `folders` field, default it to `[]` so existing users don't break.

## Files Modified
- `src/types/book.ts` — add Folder type, update Book
- `src/contexts/BookContext.tsx` — add folder operations
- `src/components/BookSidebar.tsx` — render folders section, drag items into folders via context menu
- `src/data/defaultBook.ts` — add sample folder

