

# Multi-Novel Support + Sidebar Redesign

## Overview
Transform the app from single-novel to **multi-novel**, add a top action bar with quick-create buttons, and clean up the sidebar layout.

## Changes

### 1. Data Model (`src/types/book.ts`)
- Add a `Library` type: `{ books: Book[], activeBookId: string }`
- Keep existing `Book` type unchanged

### 2. Storage & Context
**New `src/contexts/LibraryContext.tsx`** — wraps BookProvider:
- Stores array of books in localStorage under `ploton-library`
- `addNovel(title)`, `deleteNovel(id)`, `renameNovel(id, title)`, `switchNovel(id)`, `duplicateNovel(id)`
- Passes the active book down to `BookProvider`

**Update `src/hooks/useLocalStorage.ts`**:
- Add `loadLibrary()` / `usePersistLibrary()` alongside existing book functions
- Migration: if old `ploton-book` key exists but no `ploton-library`, wrap existing book into a library automatically

**Update `src/contexts/BookContext.tsx`**:
- Accept `book` and `onBookChange` as props from LibraryContext instead of managing its own top-level state

### 3. Sidebar Redesign (`src/components/BookSidebar.tsx`)

**Top section — Novel selector + quick actions:**
```
┌─────────────────────────┐
│ ▾ My Novel         [⚙]  │  ← dropdown to switch/create novels
├─────────────────────────┤
│ [+ Board] [+ Chapter] [+ Folder] │  ← quick-create bar
├─────────────────────────┤
│ 📁 Act I              3 │  ← folders (collapsible)
│   ├ 🗺 Plot Structure    │
│   ├ 📝 Chapter 1        │
│   └ 📝 Chapter 2        │
│ 📁 Act II             1 │
│   └ 📝 Chapter 3        │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 🗺 Characters (ungrouped)│  ← ungrouped items below
├─────────────────────────┤
│ Plot-On · 🌙            │  ← footer
└─────────────────────────┘
```

Key changes:
- **Novel dropdown** at the top using a Popover — shows all novels, "New Novel" button, rename/delete options
- **Quick-create bar** with 3 buttons: `+ Board`, `+ Chapter`, `+ Folder` — always visible at top
- **Flat list** instead of separate "Folders" / "Whiteboards" / "Chapters" collapsible sections — folders show first, then ungrouped items in a single list (simpler, less nesting)
- All items are right-click renameable as before

### 4. Page Updates (`src/pages/Index.tsx`)
- Wrap with `LibraryProvider` > `BookProvider`

### 5. Migration
- On first load, check for `ploton-book` in localStorage → wrap it into `ploton-library` with one book entry → delete old key

## Files to Create/Edit
| File | Action |
|------|--------|
| `src/types/book.ts` | Add `Library` type |
| `src/contexts/LibraryContext.tsx` | **New** — multi-novel state |
| `src/contexts/BookContext.tsx` | Refactor to accept book from parent |
| `src/hooks/useLocalStorage.ts` | Add library persistence + migration |
| `src/components/BookSidebar.tsx` | Redesign with novel picker + quick-create bar |
| `src/pages/Index.tsx` | Wrap with LibraryProvider |

