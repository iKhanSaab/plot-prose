# Plot Prose: Code Guide & Learning Path

Welcome! This guide explains the architecture and key concepts of the Plot Prose app. Each file has been annotated with detailed comments to help you learn through reading the code.

## 📚 Application Overview

**Plot Prose** is a web-based writing and planning tool for novelists that combines:
- **Writing Interface**: Chapter editor with multiple draft versions (track revisions)
- **Planning Board**: Visual whiteboard with connected pins (sticky notes) for planning
- **Library System**: Manage multiple books/novels
- **Auto-save**: Everything is saved automatically to localStorage
- **Import/Export**: Back up your work as JSON files

---

## 🏗️ Architecture & Data Flow

### High-Level Flow
```
User Actions (typing, clicking)
    ↓
Components (ChapterEditor, WhiteboardView)
    ↓
BookContext (state management for current book)
    ↓
LibraryContext (state management for all books)
    ↓
localStorage (browser storage for persistence)
```

### Provider Hierarchy (in pages/Index.tsx)
```
LibraryProvider (top level)
  └─ BookProviderBridge
      └─ BookProvider
          └─ WorkspaceContent (actual UI)
```

---

## 📂 File-by-File Breakdown

### 1. **Entry Point & Setup**
- **`src/main.tsx`** - App entry point, service worker registration
- **`src/App.tsx`** - Root component, provider setup, routing
- **`src/pages/Index.tsx`** - Main workspace page, keyboard shortcuts, file import/export

### 2. **Data Layer**
- **`src/types/book.ts`** - TypeScript interfaces for all data structures
  - `Book`, `Chapter`, `Draft`, `WhiteboardSheet`, `Pin`, `Tag`, `Folder`
  
- **`src/contexts/LibraryContext.tsx`** - Manages collection of all books
  - Create/delete/rename/switch/duplicate books
  - Import novels from JSON files
  
- **`src/contexts/BookContext.tsx`** - Manages the current book's state (LARGE FILE)
  - View management (whiteboard vs chapter editor)
  - Pin operations (add/update/delete/connect pins)
  - Draft management (create/edit/delete/rename drafts)
  - Chapter/whiteboard CRUD
  - Folder organization

### 3. **UI Layer - Components**
- **`src/components/ChapterEditor.tsx`** - Writing interface
  - Edit chapter title (double-click)
  - Write/edit draft content (autosave with visual feedback)
  - Switch between multiple drafts
  - View word/character count
  - Focus mode (fullscreen distraction-free writing)
  
- **`src/components/WhiteboardView.tsx`** - Visual planning board
  - Create and drag pins (sticky notes)
  - Edit pin content and tags
  - Connect pins with lines (show relationships)
  - Zoom and pan the canvas
  
- **`src/components/BookSidebar.tsx`** - Navigation sidebar
  - List of chapters and whiteboards
  - Create/delete/rename items
  - Folder-based organization
  
- **`src/components/GlobalSearch.tsx`** - Search across all content
- **`src/components/KeyboardShortcutsModal.tsx`** - Help dialog
- **`src/components/ui/*`** - shadcn/ui component library

### 4. **Utilities & Hooks**
- **`src/hooks/useLocalStorage.ts`** - Browser storage persistence
  - Load library on app startup
  - Auto-save library to localStorage
  - Handle legacy data format migrations
  
- **`src/lib/exportImport.ts`** - Import/Export functionality
  - Export books as JSON files (backup/sharing)
  - Import JSON files back in
  - Validate imported data structure
  - Export chapters as Markdown
  
- **`src/lib/utils.ts`** - Utility functions (cn for class merging)
- **`src/lib/appInfo.ts`** - App metadata (name, version)

### 5. **Data Sources**
- **`src/data/defaultBook.ts`** - Default sample book
- **`src/data/starterBook.ts`** - Starter template for new books

---

## 🔄 Key Concepts & Workflows

### Chapter Editing Workflow
```
User types in textarea
  ↓
handleContentChange() called
  ↓
updateDraftContent() in BookContext
  ↓
Book state updated in LibraryContext
  ↓
usePersistLibrary() hook auto-saves to localStorage
```

### Pin Connection System
```
User clicks to connect two pins
  ↓
connectPins() in BookContext
  ↓
Bidirectional connection added (both pins reference each other)
  ↓
SVG lines draw between pins (WhiteboardView)
```

### Data Persistence
```
App loads → loadLibrary() reads from localStorage
             ↓
             Migrate old formats if needed
             ↓
             Initialize LibraryContext with saved books

User makes changes → BookContext state updates
                     ↓
                     usePersistLibrary debounces saves
                     ↓
                     setTimeout (500ms) writes to localStorage
```

### Import/Export
```
Export: Book object → JSON string → Download as file
Import: File → Read as text → Parse JSON → Validate → Add to library
```

---

## ⌨️ Keyboard Shortcuts (in WorkspaceContent)
- `Ctrl/Cmd + K` - Open search
- `Ctrl/Cmd + E` - Export current book
- `Ctrl/Cmd + N` - Create new chapter
- `Ctrl/Cmd + Shift + N` - Create new whiteboard
- `Ctrl/Cmd + Shift + F` - Toggle focus mode
- `?` - Show keyboard shortcuts help
- `Esc` - Exit focus mode (when in focus mode)

---

## 🧠 Learning Path

### Beginner
1. Read **src/types/book.ts** - Understand data structures (15 min)
2. Read **src/pages/Index.tsx** - See overall app structure (20 min)
3. Read **src/components/ChapterEditor.tsx** - Understand a complete component (20 min)

### Intermediate
4. Read **src/contexts/BookContext.tsx** - Learn state management pattern (30 min)
5. Read **src/hooks/useLocalStorage.ts** - Understand persistence (20 min)
6. Read **src/lib/exportImport.ts** - See data validation patterns (20 min)

### Advanced
7. Read **src/contexts/LibraryContext.tsx** - Multi-book state management (20 min)
8. Read **src/components/WhiteboardView.tsx** - Complex canvas interactions (30 min)
9. Explore **src/components/ui/** - UI component architecture (varies)
10. Read **src/lib/utils.ts** - Utility patterns (10 min)

---

## 🎯 Common Tasks & Where to Find Them

| Task | File(s) |
|------|---------|
| Add a new keyboard shortcut | `src/pages/Index.tsx` → `handleKeyDown` |
| Add a field to chapters | `src/types/book.ts` + `src/contexts/BookContext.tsx` |
| New chapter action | `src/contexts/BookContext.tsx` → `addChapter()` |
| Save book to file | `src/lib/exportImport.ts` → `exportNovelAsJSON()` |
| Change editor appearance | `src/components/ChapterEditor.tsx` |
| Add sidebar item | `src/components/BookSidebar.tsx` |
| Modify storage behavior | `src/hooks/useLocalStorage.ts` |
| Change storage key name | `src/hooks/useLocalStorage.ts` constants |

---

## 🔍 Key Patterns Used

### 1. **Context + Hooks Pattern**
```typescript
// In context file:
const [state, setState] = useState(...)
const action = useCallback((params) => { ... }, [])

// In component:
const { state, action } = useBook()
```

### 2. **Type Guards for Validation**
```typescript
// In exportImport.ts:
function isDraft(value: unknown): value is Draft {
  return isRecord(value) && 
    typeof value.id === 'string' && ...
}
```

### 3. **Immutable State Updates**
```typescript
// Map and filter to create new arrays without mutating
setBook(prev => ({
  ...prev,
  chapters: prev.chapters.map(ch => 
    ch.id === id ? { ...ch, title } : ch
  )
}))
```

### 4. **Debounced Saves**
```typescript
// Delays save to batch changes together
const timerRef = useRef()
useEffect(() => {
  clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => save(), 500)
}, [data])
```

---

## 📖 Comments Throughout Code

Every major file has been annotated with:
- **Section headers** (=== markers) for quick navigation
- **Function descriptions** explaining what and why
- **Inline comments** for complex logic
- **Variable explanations** for state and refs

---

## 🚀 Next Steps

1. **Read the comments** in the files listed above (they're extensive!)
2. **Run the app** and use it while reading code
3. **Trace data flow** - pick an action (create chapter) and find where it happens in code
4. **Make a small change** - try adding a new keyboard shortcut
5. **Explore components** - look at WhiteboardView and BookSidebar

---

## 💡 Tips for Understanding

- **Use your IDE's "Go to Definition"** (F12 in VS Code) to jump between files
- **Use "Find References"** to see where types/functions are used
- **Search for the name** of a feature in the codebase
- **Check the comments** first - they explain the why, not just the what
- **Refer back to types/book.ts** often - it's your data structure reference

Good luck learning! The codebase is well-structured and each file has detailed comments explaining its purpose.
