/*
FILE PURPOSE:
This file manages all state and mutations for the currently active book.

ROLE IN THE APP:
It is the central editing controller for chapters, drafts, whiteboards, pins, folders, and active view state. Components call into this context whenever the active book changes.

USED BY:
- pages/Index.tsx mounts BookProvider around the workspace
- WhiteboardView.tsx uses it for pin and board actions
- ChapterEditor.tsx and BookSidebar.tsx use it for chapter, folder, and navigation state

EXPORTS:
- BookProvider: wraps descendants with active-book state
- useBook: hook for reading and mutating the active book
*/

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState, Book, Pin, WhiteboardSheet, Chapter, Draft, ViewMode, Tag, Folder } from '@/types/book';

// ═══════════════════════════════════════════════════════════════════════════════
// BOOK CONTEXT: BookContext.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// Manages all state for the currently active book (from LibraryContext).
// This includes:
// - Which view is active (whiteboard vs chapter editor)
// - Which chapter/whiteboard is being edited
// - All editing actions (add pin, update draft, connect pins, etc.)
//
// This is the "controller" for the entire book editing experience.
// It's a large file with many related functions, organized by feature:
// - View management (which view/chapter/whiteboard is active)
// - Pin management (create, update, delete pins on whiteboards)
// - Draft management (writing content in chapters)
// - Connection management (linking pins together)
// - Folder management (organizing chapters and whiteboards)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Type Definition: All available actions ───────────────────────────────────
interface BookContextType extends AppState {
  // View switching
  setActiveView: (view: ViewMode) => void;           // Switch between 'whiteboard' and 'chapter'
  setActiveWhiteboard: (id: string) => void;         // Select which whiteboard to view
  setActiveChapter: (id: string) => void;            // Select which chapter to edit
  toggleFocusMode: () => void;                       // Toggle distraction-free editing mode
  
  // Pin actions (whiteboard objects)
  updatePin: (whiteboardId: string, pin: Pin) => void;      // Modify a pin's data
  addPin: (whiteboardId: string, pin: Pin) => void;         // Create a new pin
  deletePin: (whiteboardId: string, pinId: string) => void; // Remove a pin
  
  // Draft editing (writing content)
  updateDraftContent: (chapterId: string, draftId: string, content: string) => void;
  addDraft: (chapterId: string) => void;                    // Create new version
  deleteDraft: (chapterId: string, draftId: string) => void;
  renameDraft: (chapterId: string, draftId: string, name: string) => void;
  setActiveDraft: (chapterId: string, draftId: string) => void; // Switch which draft is being edited
  
  // Pin connections (relationship lines)
  connectPins: (whiteboardId: string, pinId1: string, pinId2: string) => void;
  disconnectPins: (whiteboardId: string, pinId1: string, pinId2: string) => void;
  
  // Chapter management
  addChapter: (folderId?: string) => void;
  deleteChapter: (chapterId: string) => void;
  updateChapterTitle: (chapterId: string, title: string) => void;
  duplicateChapter: (chapterId: string) => void;
  updateBookTitle: (title: string) => void;
  
  // Whiteboard management
  addWhiteboard: (folderId?: string) => void;
  deleteWhiteboard: (whiteboardId: string) => void;
  renameWhiteboard: (whiteboardId: string, name: string) => void;
  duplicateWhiteboard: (whiteboardId: string) => void;
  
  // Tags (categories for pins)
  updatePinTags: (whiteboardId: string, pinId: string, tags: Tag[]) => void;
  
  // Folder organization
  addFolder: (parentFolderId?: string, name?: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  moveToFolder: (folderId: string, itemId: string, itemType: 'whiteboard' | 'chapter') => void;
  removeFromFolder: (itemId: string, itemType: 'whiteboard' | 'chapter') => void;
}

const BookContext = createContext<BookContextType | null>(null);

interface BookProviderProps {
  book: Book;                    // The book data from LibraryContext
  onBookChange: (book: Book) => void;  // Called when book state changes (propagate to Library)
  children: React.ReactNode;
}

function getNextDraftName(drafts: Draft[]) {
  const usedNumbers = drafts
    .map(draft => {
      const match = draft.name.match(/^Draft\s+(\d+)$/i);
      return match ? Number.parseInt(match[1], 10) : null;
    })
    .filter((value): value is number => value !== null);

  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : drafts.length + 1;
  return `Draft ${nextNumber}`;
}

// ─── Provider Component: BookProvider ──────────────────────────────────────────
export function BookProvider({ book: externalBook, onBookChange, children }: BookProviderProps) {
  // ─── STATE: Internal book data ───────────────────────────────────────────────
  const [book, setBookInternal] = useState<Book>(externalBook);
  
  // ─── STATE: UI state (which things are active) ──────────────────────────────
  const [activeView, setActiveView] = useState<ViewMode>('whiteboard');  // Show whiteboard or chapter
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<string | null>(
    externalBook.whiteboards[0]?.id || null  // Default to first whiteboard
  );
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    externalBook.chapters[0]?.id || null  // Default to first chapter
  );
  const [isEditorFocusMode, setIsEditorFocusMode] = useState(false);  // Distraction-free mode toggle
  
  // ─── REF: Track when user switches to a different book (from LibraryContext) ─
  const previousBookIdRef = React.useRef(externalBook.id);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── SECTION 1: Lifecycle & Synchronization ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Watch for when the book changes from LibraryContext.
   * This happens when:
   * 1. User loads a project in the browser for the first time
   * 2. User switches to a different book in the library
   * 3. Book data is restored from localStorage
   */
  useEffect(() => {
    setBookInternal(externalBook);
    const isNovelSwitch = previousBookIdRef.current !== externalBook.id;

    // Update active whiteboard, but keep current one if it still exists in new book
    setActiveWhiteboardId(prev => {
      if (!isNovelSwitch && prev && externalBook.whiteboards.some(wb => wb.id === prev)) {
        return prev;  // Keep current whiteboard if book didn't switch
      }
      return externalBook.whiteboards[0]?.id || null;  // Otherwise use first
    });

    // Update active chapter, but keep current one if it still exists in new book
    setActiveChapterId(prev => {
      if (!isNovelSwitch && prev && externalBook.chapters.some(ch => ch.id === prev)) {
        return prev;  // Keep current chapter if book didn't switch
      }
      return externalBook.chapters[0]?.id || null;  // Otherwise use first
    });

    // When switching books: reset view and focus mode
    if (isNovelSwitch) {
      setActiveView('whiteboard');
      setIsEditorFocusMode(false);
    }

    previousBookIdRef.current = externalBook.id;
  }, [externalBook]);

  /**
   * Internal setter for book state. This is different from React state:
   * - Updates local state
   * - Calls onBookChange callback to sync back to LibraryContext
   * - LibraryContext saves it to localStorage
   */
  const setBook = useCallback((updater: Book | ((prev: Book) => Book)) => {
    setBookInternal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onBookChange(next);  // Notify parent (LibraryContext)
      return next;
    });
  }, [onBookChange]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── SECTION 2: View Management (UI state) ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Show the whiteboard view and switch to the given whiteboard.
   */
  const setActiveWhiteboard = useCallback((id: string) => {
    setActiveWhiteboardId(id);
    setActiveView('whiteboard');
  }, []);

  /**
   * Show the chapter editor view and switch to the given chapter.
   */
  const setActiveChapter = useCallback((id: string) => {
    setActiveChapterId(id);
    setActiveView('chapter');
  }, []);

  /**
   * Toggle between normal and focus (distraction-free) editing mode.
   * Focus mode hides the sidebar for a cleaner editor experience.
   */
  const toggleFocusMode = useCallback(() => setIsEditorFocusMode(prev => !prev), []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── SECTION 3: Pin Management (Whiteboard notes) ─────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Update an existing pin's data (position, title, content, image, etc).
   * Used when user drags a pin or edits its content.
   */
  const updatePin = useCallback((whiteboardId: string, updatedPin: Pin) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId ? { ...wb, pins: wb.pins.map(p => p.id === updatedPin.id ? updatedPin : p) } : wb
      ),
    }));
  }, [setBook]);

  /**
   * Create a new pin on a whiteboard.
   * Used when user clicks "create pin" on the whiteboard.
   */
  const addPin = useCallback((whiteboardId: string, pin: Pin) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId ? { ...wb, pins: [...wb.pins, pin] } : wb
      ),
    }));
  }, [setBook]);

  /**
   * Delete a pin from the whiteboard.
   * Also removes all connections from other pins to this deleted pin.
   */
  const deletePin = useCallback((whiteboardId: string, pinId: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? { 
              ...wb, 
              pins: wb.pins
                .filter(p => p.id !== pinId)
                // Also clean up connections: remove deleted pin from all other pins' connections
                .map(p => ({ ...p, connections: p.connections.filter(c => c !== pinId) })) 
            }
          : wb
      ),
    }));
  }, [setBook]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── SECTION 4: Draft Management (Multiple versions per chapter) ───────────────
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Update the written content of a draft.
   * This is called as the user types in the chapter editor.
   * Also updates the "updatedAt" timestamp.
   */
  const updateDraftContent = useCallback((chapterId: string, draftId: string, content: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, drafts: ch.drafts.map(d => d.id === draftId ? { ...d, content, updatedAt: new Date().toISOString() } : d) }
          : ch
      ),
    }));
  }, [setBook]);

  /**
   * Create a new draft in a chapter.
   * Useful for tracking revisions (Draft 1, Draft 2, etc).
   * The new draft becomes the active one.
   */
  const addDraft = useCallback((chapterId: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;

        const now = new Date().toISOString();
        const newDraft: Draft = {
          id: `draft-${Date.now()}`,
          name: getNextDraftName(ch.drafts),
          content: '',
          createdAt: now,
          updatedAt: now,
        };

        return { ...ch, drafts: [...ch.drafts, newDraft], activeDraftId: newDraft.id };
      }),
    }));
  }, [setBook]);

  /**
   * Delete a draft from a chapter.
   * Safety check: prevents deleting the last draft (each chapter must have at least one).
   * If the deleted draft was active, switches to the first remaining draft.
   */
  const deleteDraft = useCallback((chapterId: string, draftId: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;
        if (ch.drafts.length <= 1) return ch; // can't delete last draft
        const remaining = ch.drafts.filter(d => d.id !== draftId);
        const newActive = ch.activeDraftId === draftId ? remaining[0].id : ch.activeDraftId;
        return { ...ch, drafts: remaining, activeDraftId: newActive };
      }),
    }));
  }, [setBook]);

  /**
   * Change the name/label of a draft (e.g., "First Draft" -> "Revision A").
   */
  const renameDraft = useCallback((chapterId: string, draftId: string, name: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, drafts: ch.drafts.map(d => d.id === draftId ? { ...d, name } : d) } : ch
      ),
    }));
  }, [setBook]);

  /**
   * Switch which draft is currently being edited in a chapter.
   */
  const setActiveDraft = useCallback((chapterId: string, draftId: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ch.id === chapterId ? { ...ch, activeDraftId: draftId } : ch),
    }));
  }, [setBook]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── SECTION 5: Chapter & Whiteboard Management ────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a new chapter with a default first draft.
   * Optionally add it to a specific folder.
   * Automatically switches to this new chapter.
   *
   * @param folderId Optional folder to add this chapter to
   */
  const addChapter = useCallback((folderId?: string) => {
    const draftId = `draft-${Date.now()}`;
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: `Untitled Chapter`,
      order: book.chapters.length + 1,
      activeDraftId: draftId,
      drafts: [{ id: draftId, name: 'Draft 1', content: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    };
    setBook(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
      // If folder specified, add this chapter to it
      folders: folderId
        ? prev.folders.map(f => f.id === folderId ? { ...f, chapterIds: [...f.chapterIds, newChapter.id] } : f)
        : prev.folders,
    }));
    setActiveChapterId(newChapter.id);
    setActiveView('chapter');
  }, [book.chapters.length, setBook]);

  /**
   * Create a new whiteboard with no pins yet.
   * Optionally add it to a specific folder.
   * Automatically switches to this new whiteboard.
   *
   * @param folderId Optional folder to add this whiteboard to
   */
  const addWhiteboard = useCallback((folderId?: string) => {
    const newWb: WhiteboardSheet = {
      id: `wb-${Date.now()}`,
      name: `Untitled Board`,
      pins: [],
    };
    setBook(prev => ({
      ...prev,
      whiteboards: [...prev.whiteboards, newWb],
      // If folder specified, add this whiteboard to it
      folders: folderId
        ? prev.folders.map(f => f.id === folderId ? { ...f, whiteboardIds: [...f.whiteboardIds, newWb.id] } : f)
        : prev.folders,
    }));
    setActiveWhiteboardId(newWb.id);
    setActiveView('whiteboard');
  }, [setBook]);

  /**
   * Delete a chapter from the book.
   * Safety check: prevents deleting the last chapter.
   * Also removes references from folders and switches active chapter if needed.
   */
  const deleteChapter = useCallback((chapterId: string) => {
    if (book.chapters.length <= 1) return;
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== chapterId),
      // Clean up folder references
      folders: prev.folders.map(f => ({ ...f, chapterIds: f.chapterIds.filter(id => id !== chapterId) })),
    }));
    // If active chapter was deleted, switch to the next chapter
    setActiveChapterId(prev => {
      if (prev !== chapterId) return prev;
      const nextChapter = book.chapters.find(ch => ch.id !== chapterId);
      return nextChapter?.id || prev;
    });
  }, [book.chapters, setBook]);

  /**
   * Delete a whiteboard from the book.
   * Safety check: prevents deleting the last whiteboard.
   * Also removes references from folders and switches active whiteboard if needed.
   */
  const deleteWhiteboard = useCallback((whiteboardId: string) => {
    if (book.whiteboards.length <= 1) return;
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.filter(wb => wb.id !== whiteboardId),
      // Clean up folder references
      folders: prev.folders.map(f => ({ ...f, whiteboardIds: f.whiteboardIds.filter(id => id !== whiteboardId) })),
    }));
    // If active whiteboard was deleted, switch to the next whiteboard
    setActiveWhiteboardId(prev => {
      if (prev !== whiteboardId) return prev;
      const nextWhiteboard = book.whiteboards.find(wb => wb.id !== whiteboardId);
      return nextWhiteboard?.id || prev;
    });
  }, [book.whiteboards, setBook]);

  /**
   * Change the book's title.
   */
  const updateBookTitle = useCallback((title: string) => setBook(prev => ({ ...prev, title })), [setBook]);

  /**
   * Change a chapter's title.
   */
  const updateChapterTitle = useCallback((chapterId: string, title: string) => {
    setBook(prev => ({ ...prev, chapters: prev.chapters.map(ch => ch.id === chapterId ? { ...ch, title } : ch) }));
  }, [setBook]);

  /**
   * Change a whiteboard's name.
   */
  const renameWhiteboard = useCallback((whiteboardId: string, name: string) => {
    setBook(prev => ({ ...prev, whiteboards: prev.whiteboards.map(wb => wb.id === whiteboardId ? { ...wb, name } : wb) }));
  }, [setBook]);

  /**
   * Create an exact copy of a chapter with all its drafts.
   * The copy is appended with " (Copy)" to the title.
   */
  const duplicateChapter = useCallback((chapterId: string) => {
    setBook(prev => {
      const ch = prev.chapters.find(c => c.id === chapterId);
      if (!ch) return prev;
      const newId = `ch-${Date.now()}`;
      const draftId = `draft-${Date.now()}`;
      const newCh: Chapter = {
        ...ch, 
        id: newId, 
        title: `${ch.title} (Copy)`, 
        order: prev.chapters.length + 1,
        activeDraftId: draftId, 
        // Copy all drafts with new IDs
        drafts: ch.drafts.map((d, i) => ({ ...d, id: i === 0 ? draftId : `draft-${Date.now()}-${i}` })),
      };
      return { ...prev, chapters: [...prev.chapters, newCh] };
    });
  }, [setBook]);

  /**
   * Create an exact copy of a whiteboard with all its pins and connections.
   * The copy is appended with " (Copy)" to the name.
   * Note: pins get New IDs but connections are remapped accordingly.
   */
  const duplicateWhiteboard = useCallback((whiteboardId: string) => {
    setBook(prev => {
      const wb = prev.whiteboards.find(w => w.id === whiteboardId);
      if (!wb) return prev;
      const newWb: WhiteboardSheet = {
        ...wb, 
        id: `wb-${Date.now()}`, 
        name: `${wb.name} (Copy)`,
        // Create new pins with new IDs
        pins: wb.pins.map(p => ({ ...p, id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      };
      // Create a map of old pin IDs -> new pin IDs for remapping connections
      const idMap = new Map(wb.pins.map((p, i) => [p.id, newWb.pins[i].id]));
      // Update connections to point to the new pin IDs
      newWb.pins = newWb.pins.map(p => ({ ...p, connections: p.connections.map(c => idMap.get(c) || c) }));
      return { ...prev, whiteboards: [...prev.whiteboards, newWb] };
    });
  }, [setBook]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── SECTION 6: Pin Connections (Relationships between pins) ──────────────────
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a link between two pins (draw a line between them).
   * Connections are bidirectional: if you connect A to B, B is also connected to A.
   */
  const connectPins = useCallback((whiteboardId: string, pinId1: string, pinId2: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? {
              ...wb,
              pins: wb.pins.map(p => {
                // Add pinId2 to pinId1's connections if not already connected
                if (p.id === pinId1 && !p.connections.includes(pinId2)) return { ...p, connections: [...p.connections, pinId2] };
                // Add pinId1 to pinId2's connections if not already connected
                if (p.id === pinId2 && !p.connections.includes(pinId1)) return { ...p, connections: [...p.connections, pinId1] };
                return p;
              }),
            }
          : wb
      ),
    }));
  }, [setBook]);

  /**
   * Remove the link between two pins.
   * This is bidirectional: removes the connection from both pins.
   */
  const disconnectPins = useCallback((whiteboardId: string, pinId1: string, pinId2: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? {
              ...wb,
              pins: wb.pins.map(p => {
                if (p.id === pinId1) return { ...p, connections: p.connections.filter(c => c !== pinId2) };
                if (p.id === pinId2) return { ...p, connections: p.connections.filter(c => c !== pinId1) };
                return p;
              }),
            }
          : wb
      ),
    }));
  }, [setBook]);

  /**
   * Update the tags/categories for a pin.
   */
  const updatePinTags = useCallback((whiteboardId: string, pinId: string, tags: Tag[]) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId ? { ...wb, pins: wb.pins.map(p => p.id === pinId ? { ...p, tags } : p) } : wb
      ),
    }));
  }, [setBook]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── SECTION 7: Folder Management (Organization) ──────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a new folder for organizing chapters and whiteboards.
   * Folders can be nested by specifying a parentFolderId.
   */
  const addFolder = useCallback((parentFolderId?: string, name?: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`, 
      name: name || `Folder ${book.folders.length + 1}`,
      parentFolderId: parentFolderId ?? null,
      whiteboardIds: [], 
      chapterIds: [], 
      order: book.folders.length + 1,
    };
    setBook(prev => ({ ...prev, folders: [...prev.folders, newFolder] }));
  }, [book.folders.length, setBook]);

  /**
   * Change a folder's name.
   */
  const renameFolder = useCallback((folderId: string, name: string) => {
    setBook(prev => ({ ...prev, folders: prev.folders.map(f => f.id === folderId ? { ...f, name } : f) }));
  }, [setBook]);

  /**
   * Delete a folder.
   * If this folder has child (nested) folders, their parentFolderId is updated.
   */
  const deleteFolder = useCallback((folderId: string) => {
    setBook(prev => {
      const folderToDelete = prev.folders.find(f => f.id === folderId);
      if (!folderToDelete) return prev;

      return {
        ...prev,
        // Remove the folder
        folders: prev.folders
          .filter(f => f.id !== folderId)
          // Update any child folders to point to this folder's parent instead
          .map(f => f.parentFolderId === folderId ? { ...f, parentFolderId: folderToDelete.parentFolderId ?? null } : f),
      };
    });
  }, [setBook]);

  /**
   * Move a chapter or whiteboard into a folder.
   * First removes it from any other folder, then adds it to the target folder.
   */
  const moveToFolder = useCallback((folderId: string, itemId: string, itemType: 'whiteboard' | 'chapter') => {
    setBook(prev => ({
      ...prev,
      folders: prev.folders.map(f => {
        // Remove from all folders first
        const cleaned = itemType === 'whiteboard'
          ? { ...f, whiteboardIds: f.whiteboardIds.filter(id => id !== itemId) }
          : { ...f, chapterIds: f.chapterIds.filter(id => id !== itemId) };
        
        // Add to target folder
        if (cleaned.id === folderId) {
          return itemType === 'whiteboard'
            ? { ...cleaned, whiteboardIds: [...cleaned.whiteboardIds, itemId] }
            : { ...cleaned, chapterIds: [...cleaned.chapterIds, itemId] };
        }
        return cleaned;
      }),
    }));
  }, [setBook]);

  /**
   * Remove a chapter or whiteboard from its folder (move to root).
   */
  const removeFromFolder = useCallback((itemId: string, itemType: 'whiteboard' | 'chapter') => {
    setBook(prev => ({
      ...prev,
      folders: prev.folders.map(f =>
        itemType === 'whiteboard'
          ? { ...f, whiteboardIds: f.whiteboardIds.filter(id => id !== itemId) }
          : { ...f, chapterIds: f.chapterIds.filter(id => id !== itemId) }
      ),
    }));
  }, [setBook]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ──── CONTEXT PROVIDER: Expose all actions to consumers ────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  // Return a provider that makes all state and functions available to child components
  // that use the useBook() hook.

  return (
    <BookContext.Provider value={{
      book, activeView, activeWhiteboardId, activeChapterId, isEditorFocusMode,
      setActiveView, setActiveWhiteboard, setActiveChapter, toggleFocusMode,
      updatePin, addPin, deletePin, updateDraftContent,
      addChapter, addWhiteboard, updateBookTitle, updateChapterTitle,
      addDraft, deleteDraft, renameDraft, setActiveDraft, connectPins, disconnectPins,
      deleteChapter, deleteWhiteboard, renameWhiteboard,
      duplicateChapter, duplicateWhiteboard, updatePinTags,
      addFolder, renameFolder, deleteFolder, moveToFolder, removeFromFolder,
    }}>
      {children}
    </BookContext.Provider>
  );
}

// ─── Hook: useBook ────────────────────────────────────────────────────────────────
/**
 * Hook to access the book context from any component.
 * Must be called within a BookProvider-wrapped component.
 * 
 * Usage: const { book, addChapter, updateDraftContent, ... } = useBook();
 */
export function useBook() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBook must be used within BookProvider');
  return ctx;
}
