# Plot-On Codebase Guide

## What this app is

Plot-On is a local-first React application for novel planning and drafting.

At a product level, it gives the user:

- a library of novels
- a whiteboard view for visual story planning
- a chapter editor for drafting prose
- folders for grouping boards and chapters
- import/export helpers for backups
- keyboard shortcuts, global search, and dark mode

There is no backend in this repo. The app persists everything to browser `localStorage`.

## High-level architecture

The runtime flow is:

1. `src/main.tsx` bootstraps React, loads global CSS, and registers the service worker.
2. `src/App.tsx` wraps the app with shared providers for React Query, tooltips, and toast UI, then mounts the router.
3. `src/pages/Index.tsx` builds the main workspace by nesting `LibraryProvider` and `BookProvider`.
4. UI components read and mutate book state through React context hooks instead of prop-drilling.

The two most important state layers are:

- `LibraryContext`: owns the multi-book library and decides which book is active.
- `BookContext`: owns the currently active book editing session and exposes all book mutation actions.

## Directory structure

### `src/main.tsx`

- React entry point.
- Mounts `<App />`.
- Registers `public/sw.js` on page load for install/offline support.

### `src/App.tsx`

- Creates a single React Query client.
- Mounts global toast systems and tooltip provider.
- Defines routes:
  - `/` -> main app
  - `*` -> not found page

### `src/pages`

#### `src/pages/Index.tsx`

This is the real application shell.

It does three main jobs:

- wires `LibraryProvider` to `BookProvider`
- chooses mobile or desktop workspace layout
- binds global keyboard shortcuts

Important behavior in this file:

- `Ctrl/Cmd + K` opens global search
- `Ctrl/Cmd + E` exports the current novel as JSON
- `Ctrl/Cmd + N` creates a chapter
- `Ctrl/Cmd + Shift + N` creates a whiteboard
- `Ctrl/Cmd + Shift + F` toggles editor focus mode
- `Esc` exits focus mode
- `?` opens the shortcuts modal when the user is not typing in an input

It also handles JSON import through a hidden file input and now correctly passes imported books into `importNovel`.

#### `src/pages/NotFound.tsx`

- Simple fallback route for unknown paths.

### `src/contexts`

#### `src/contexts/LibraryContext.tsx`

This context owns the library of books.

State:

- `library.books`
- `library.activeBookId`

Derived value:

- `activeBook`

Exposed mutations:

- `addNovel`
- `importNovel`
- `deleteNovel`
- `renameNovel`
- `switchNovel`
- `duplicateNovel`
- `updateActiveBook`

Important details:

- the provider initializes from `loadLibrary()`
- if no saved library exists, it falls back to `defaultBook`
- persistence is delegated to `usePersistLibrary`
- duplicating a novel deep-clones the book and assigns a new book id

#### `src/contexts/BookContext.tsx`

This context owns the active book editing session.

State inside the provider:

- `book`
- `activeView`
- `activeWhiteboardId`
- `activeChapterId`
- `isEditorFocusMode`

This provider syncs to a different book whenever `externalBook.id` changes.

Major mutation groups:

- navigation:
  - `setActiveView`
  - `setActiveWhiteboard`
  - `setActiveChapter`
  - `toggleFocusMode`
- whiteboard mutations:
  - `addPin`
  - `updatePin`
  - `deletePin`
  - `connectPins`
  - `disconnectPins`
  - `addWhiteboard`
  - `deleteWhiteboard`
  - `renameWhiteboard`
  - `duplicateWhiteboard`
- chapter and draft mutations:
  - `addChapter`
  - `deleteChapter`
  - `updateChapterTitle`
  - `updateDraftContent`
  - `addDraft`
  - `deleteDraft`
  - `renameDraft`
  - `setActiveDraft`
  - `duplicateChapter`
- organization:
  - `addFolder`
  - `renameFolder`
  - `deleteFolder`
  - `moveToFolder`
  - `removeFromFolder`
- metadata:
  - `updateBookTitle`
  - `updatePinTags`

The provider pushes every book mutation back up through `onBookChange`, which lets `LibraryContext` persist the active book centrally.

### `src/components`

#### `src/components/BookSidebar.tsx`

This is the left navigation system.

It includes:

- novel picker
- quick-create buttons
- search and shortcuts buttons
- folder tree
- chapter and whiteboard lists
- desktop context menus
- mobile bottom-sheet actions
- long-press drag feedback

Important internal pieces:

- `NovelPicker` switches, renames, deletes, and creates novels
- `SidebarContent` renders both desktop and mobile sidebar contents
- `ContextMenu` handles desktop right-click actions
- `MobileMenu` is the mobile fallback for the same action set
- `InlineRename` is reused for in-place renaming
- `DragGhost` shows the current drag target label

Behavior:

- boards and chapters can be moved into folders with long-press drag
- folders can contain both whiteboards and chapters
- destructive actions are confirmed with `ConfirmDialog`

#### `src/components/WhiteboardView.tsx`

This is the story-planning canvas.

It renders:

- a toolbar with board title and zoom state
- a large pannable/zoomable canvas
- SVG connection lines between pins
- draggable pin cards

Important implementation details:

- drag, pan, and zoom use `useRef` to avoid constant React re-renders
- pin position updates are committed to context state only on drag end
- connection lines are updated in the DOM during drag for smoother interaction
- clicking the line hit area disconnects two pins

`PinCard` supports:

- editing title and content
- assigning tags
- attaching or removing an image URL
- starting pin-to-pin linking
- deleting the pin

#### `src/components/ChapterEditor.tsx`

This is the prose editor.

It handles:

- inline chapter title rename
- draft switching
- draft creation
- draft rename/delete
- autosave status indicator
- word count, character count, and estimated reading time
- focus mode for distraction-free editing

Important detail:

- typing updates the active draft in context immediately
- a local timer only controls the visible `Saving...` / `Saved` status text

#### `src/components/GlobalSearch.tsx`

Searches across the active book for:

- whiteboard names
- pin titles
- pin content
- chapter titles
- chapter draft content
- folder names

Selecting a result navigates the user to the relevant board or chapter.

#### `src/components/KeyboardShortcutsModal.tsx`

- Simple dialog listing supported shortcuts.

#### `src/components/TagEditor.tsx`

- Small floating panel for adding and removing pin tags.
- Uses fixed color options from the `TagColor` union.

#### `src/components/DarkModeToggle.tsx`

- Reads the saved theme from `localStorage`
- falls back to system preference if no theme is stored
- toggles the `dark` class on `document.documentElement`

#### `src/components/ConfirmDialog.tsx`

- Shared confirmation dialog used before destructive actions.

#### `src/components/ui`

This folder contains shadcn/ui building blocks and wrappers.

These files are mostly low-level primitives such as:

- buttons
- dialogs
- popovers
- drawers
- tooltips
- toast components
- inputs
- sheets
- alerts

They are support infrastructure rather than product-specific logic.

### `src/hooks`

#### `src/hooks/useLocalStorage.ts`

This is the persistence layer.

`loadLibrary()`:

- reads the current library from `ploton-library`
- migrates legacy single-book data from `ploton-book`
- guards against corrupted JSON with `try/catch`

`usePersistLibrary()`:

- debounces writes by 500ms
- serializes the whole library back into `localStorage`

This is the only durable storage mechanism in the current codebase.

#### `src/hooks/useLongPressDrag.ts`

Provides long-press drag behavior used in the sidebar.

It:

- waits 500ms before starting a drag
- supports mouse and touch input
- tracks the current pointer position
- finds a folder target under the pointer with `document.elementsFromPoint`
- calls `onDrop` with either a folder id or `null`

#### `src/hooks/use-mobile.tsx`

- Detects smaller viewport conditions to switch layout behavior.

#### `src/hooks/use-toast.ts`

- Local toast state/store used by the shadcn toast UI.

### `src/lib`

#### `src/lib/exportImport.ts`

Contains file export/import utilities.

`exportNovelAsJSON(book)`:

- serializes the current book as formatted JSON
- creates a Blob
- downloads it as `<book-title>.json`

`importNovelFromJSON(file)`:

- reads a selected JSON file
- parses it
- checks a minimal shape
- assigns a fresh book id to avoid collisions

`exportChapterAsMarkdown(title, content)`:

- serializes a chapter into markdown
- downloads it as `<chapter-title>.md`

#### `src/lib/utils.ts`

- exports `cn()`, the standard `clsx` + `tailwind-merge` class helper.

### `src/data`

#### `src/data/defaultBook.ts`

- seed content used when the user has no saved library yet
- includes example folders, whiteboards, pins, and chapters

### `src/types`

#### `src/types/book.ts`

Defines the application data model.

Core types:

- `Tag`
- `Pin`
- `WhiteboardSheet`
- `Draft`
- `Chapter`
- `Folder`
- `Book`
- `Library`
- `ViewMode`
- `AppState`

These types drive both context state and component props.

### `src/test`

- `setup.ts` configures the test environment
- `example.test.ts` is the current minimal test placeholder

## Styling system

### `src/index.css`

This file defines the visual design system.

It contains:

- Google font imports
- CSS custom properties for light mode and dark mode
- semantic color tokens for background, sidebar, canvas, editor, pins, and tags
- scrollbar styling
- whiteboard grid background
- editor typography
- animation utilities

### `tailwind.config.ts`

Maps CSS variables into Tailwind theme tokens so components can use semantic classes like:

- `bg-background`
- `text-foreground`
- `bg-sidebar`
- `bg-canvas-bg`
- `text-tag-rose-text`

It also defines:

- display/body font families
- radius scale
- accordion animation helpers

## Public files

### `public/site.webmanifest`

- makes the app installable in supporting browsers
- defines app name, colors, display mode, and icon

### `public/sw.js`

- basic service worker
- caches a small app shell
- serves `index.html` as a fallback for navigation when offline
- caches same-origin GET requests opportunistically

### `public/privacy.html`

- a deployable privacy-policy page
- currently includes a placeholder contact section that should be replaced before real submission

### `public/weboryLogo.svg`

- app icon used by the manifest and metadata

## Data flow summary

The main data flow is:

1. The app loads a library from `localStorage`.
2. `LibraryContext` exposes the active book.
3. `BookProvider` copies that active book into local provider state.
4. UI components call context mutation methods.
5. Book changes are pushed back up through `updateActiveBook`.
6. `usePersistLibrary` writes the updated library back to `localStorage`.

That means there is one persistent source of truth in storage, but editing is done through a focused per-book context.

## Current strengths

- clear separation between library-level state and active-book state
- no backend dependency
- fast local interactions
- good feature coverage for planning plus drafting
- responsive mobile and desktop layouts

## Current limitations

- no cloud sync or account system
- no collaboration
- no encryption for local data
- browser storage is the only persistence path unless the user exports files
- native app-store binaries are not included in this repo
- import validation is shape-based and not schema-based
- test coverage is still very thin

## What to review next if you want to keep hardening it

- add stronger JSON schema validation for imports
- add regression tests for library/book mutations
- add end-to-end tests for whiteboard drag and chapter editing
- add a native wrapper if you want actual App Store / Play Store / desktop installers
- replace the privacy policy contact placeholder with your production support info
