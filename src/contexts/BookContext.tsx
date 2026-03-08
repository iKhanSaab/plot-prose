import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState, Book, Pin, WhiteboardSheet, Chapter, Draft, ViewMode, Tag, Folder } from '@/types/book';

interface BookContextType extends AppState {
  setActiveView: (view: ViewMode) => void;
  setActiveWhiteboard: (id: string) => void;
  setActiveChapter: (id: string) => void;
  toggleFocusMode: () => void;
  updatePin: (whiteboardId: string, pin: Pin) => void;
  addPin: (whiteboardId: string, pin: Pin) => void;
  deletePin: (whiteboardId: string, pinId: string) => void;
  updateDraftContent: (chapterId: string, draftId: string, content: string) => void;
  addChapter: (folderId?: string) => void;
  addWhiteboard: (folderId?: string) => void;
  updateBookTitle: (title: string) => void;
  updateChapterTitle: (chapterId: string, title: string) => void;
  addDraft: (chapterId: string) => void;
  setActiveDraft: (chapterId: string, draftId: string) => void;
  connectPins: (whiteboardId: string, pinId1: string, pinId2: string) => void;
  disconnectPins: (whiteboardId: string, pinId1: string, pinId2: string) => void;
  deleteChapter: (chapterId: string) => void;
  deleteWhiteboard: (whiteboardId: string) => void;
  renameWhiteboard: (whiteboardId: string, name: string) => void;
  duplicateChapter: (chapterId: string) => void;
  duplicateWhiteboard: (whiteboardId: string) => void;
  updatePinTags: (whiteboardId: string, pinId: string, tags: Tag[]) => void;
  addFolder: (name?: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  moveToFolder: (folderId: string, itemId: string, itemType: 'whiteboard' | 'chapter') => void;
  removeFromFolder: (itemId: string, itemType: 'whiteboard' | 'chapter') => void;
}

const BookContext = createContext<BookContextType | null>(null);

interface BookProviderProps {
  book: Book;
  onBookChange: (book: Book) => void;
  children: React.ReactNode;
}

export function BookProvider({ book: externalBook, onBookChange, children }: BookProviderProps) {
  const [book, setBookInternal] = useState<Book>(externalBook);
  const [activeView, setActiveView] = useState<ViewMode>('whiteboard');
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<string | null>(
    externalBook.whiteboards[0]?.id || null
  );
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    externalBook.chapters[0]?.id || null
  );
  const [isEditorFocusMode, setIsEditorFocusMode] = useState(false);

  // Sync when switching novels
  useEffect(() => {
    setBookInternal(externalBook);
    setActiveWhiteboardId(externalBook.whiteboards[0]?.id || null);
    setActiveChapterId(externalBook.chapters[0]?.id || null);
    setActiveView('whiteboard');
    setIsEditorFocusMode(false);
  }, [externalBook.id]);

  const setBook = useCallback((updater: Book | ((prev: Book) => Book)) => {
    setBookInternal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onBookChange(next);
      return next;
    });
  }, [onBookChange]);

  const setActiveWhiteboard = useCallback((id: string) => {
    setActiveWhiteboardId(id);
    setActiveView('whiteboard');
  }, []);

  const setActiveChapter = useCallback((id: string) => {
    setActiveChapterId(id);
    setActiveView('chapter');
  }, []);

  const toggleFocusMode = useCallback(() => setIsEditorFocusMode(prev => !prev), []);

  const updatePin = useCallback((whiteboardId: string, updatedPin: Pin) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId ? { ...wb, pins: wb.pins.map(p => p.id === updatedPin.id ? updatedPin : p) } : wb
      ),
    }));
  }, [setBook]);

  const addPin = useCallback((whiteboardId: string, pin: Pin) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId ? { ...wb, pins: [...wb.pins, pin] } : wb
      ),
    }));
  }, [setBook]);

  const deletePin = useCallback((whiteboardId: string, pinId: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? { ...wb, pins: wb.pins.filter(p => p.id !== pinId).map(p => ({ ...p, connections: p.connections.filter(c => c !== pinId) })) }
          : wb
      ),
    }));
  }, [setBook]);

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

  const addChapter = useCallback((folderId?: string) => {
    const draftId = `draft-${Date.now()}`;
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: `Untitled Chapter`,
      order: book.chapters.length + 1,
      activeDraftId: draftId,
      drafts: [{ id: draftId, name: 'First Draft', content: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    };
    setBook(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
      folders: folderId
        ? prev.folders.map(f => f.id === folderId ? { ...f, chapterIds: [...f.chapterIds, newChapter.id] } : f)
        : prev.folders,
    }));
    setActiveChapterId(newChapter.id);
    setActiveView('chapter');
  }, [book.chapters.length, setBook]);

  const addWhiteboard = useCallback((folderId?: string) => {
    const newWb: WhiteboardSheet = {
      id: `wb-${Date.now()}`,
      name: `Untitled Board`,
      pins: [],
    };
    setBook(prev => ({
      ...prev,
      whiteboards: [...prev.whiteboards, newWb],
      folders: folderId
        ? prev.folders.map(f => f.id === folderId ? { ...f, whiteboardIds: [...f.whiteboardIds, newWb.id] } : f)
        : prev.folders,
    }));
    setActiveWhiteboardId(newWb.id);
    setActiveView('whiteboard');
  }, [setBook]);

  const updateBookTitle = useCallback((title: string) => setBook(prev => ({ ...prev, title })), [setBook]);

  const updateChapterTitle = useCallback((chapterId: string, title: string) => {
    setBook(prev => ({ ...prev, chapters: prev.chapters.map(ch => ch.id === chapterId ? { ...ch, title } : ch) }));
  }, [setBook]);

  const addDraft = useCallback((chapterId: string) => {
    const newDraft: Draft = {
      id: `draft-${Date.now()}`, name: `Draft ${Date.now() % 1000}`, content: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, drafts: [...ch.drafts, newDraft], activeDraftId: newDraft.id } : ch
      ),
    }));
  }, [setBook]);

  const setActiveDraft = useCallback((chapterId: string, draftId: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ch.id === chapterId ? { ...ch, activeDraftId: draftId } : ch),
    }));
  }, [setBook]);

  const connectPins = useCallback((whiteboardId: string, pinId1: string, pinId2: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? {
              ...wb,
              pins: wb.pins.map(p => {
                if (p.id === pinId1 && !p.connections.includes(pinId2)) return { ...p, connections: [...p.connections, pinId2] };
                if (p.id === pinId2 && !p.connections.includes(pinId1)) return { ...p, connections: [...p.connections, pinId1] };
                return p;
              }),
            }
          : wb
      ),
    }));
  }, [setBook]);

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

  const deleteChapter = useCallback((chapterId: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== chapterId),
      folders: prev.folders.map(f => ({ ...f, chapterIds: f.chapterIds.filter(id => id !== chapterId) })),
    }));
    setActiveChapterId(prev => prev === chapterId ? null : prev);
  }, [setBook]);

  const deleteWhiteboard = useCallback((whiteboardId: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.filter(wb => wb.id !== whiteboardId),
      folders: prev.folders.map(f => ({ ...f, whiteboardIds: f.whiteboardIds.filter(id => id !== whiteboardId) })),
    }));
    setActiveWhiteboardId(prev => prev === whiteboardId ? null : prev);
  }, [setBook]);

  const renameWhiteboard = useCallback((whiteboardId: string, name: string) => {
    setBook(prev => ({ ...prev, whiteboards: prev.whiteboards.map(wb => wb.id === whiteboardId ? { ...wb, name } : wb) }));
  }, [setBook]);

  const duplicateChapter = useCallback((chapterId: string) => {
    setBook(prev => {
      const ch = prev.chapters.find(c => c.id === chapterId);
      if (!ch) return prev;
      const newId = `ch-${Date.now()}`;
      const draftId = `draft-${Date.now()}`;
      const newCh: Chapter = {
        ...ch, id: newId, title: `${ch.title} (Copy)`, order: prev.chapters.length + 1,
        activeDraftId: draftId, drafts: ch.drafts.map((d, i) => ({ ...d, id: i === 0 ? draftId : `draft-${Date.now()}-${i}` })),
      };
      return { ...prev, chapters: [...prev.chapters, newCh] };
    });
  }, [setBook]);

  const duplicateWhiteboard = useCallback((whiteboardId: string) => {
    setBook(prev => {
      const wb = prev.whiteboards.find(w => w.id === whiteboardId);
      if (!wb) return prev;
      const newWb: WhiteboardSheet = {
        ...wb, id: `wb-${Date.now()}`, name: `${wb.name} (Copy)`,
        pins: wb.pins.map(p => ({ ...p, id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      };
      const idMap = new Map(wb.pins.map((p, i) => [p.id, newWb.pins[i].id]));
      newWb.pins = newWb.pins.map(p => ({ ...p, connections: p.connections.map(c => idMap.get(c) || c) }));
      return { ...prev, whiteboards: [...prev.whiteboards, newWb] };
    });
  }, [setBook]);

  const updatePinTags = useCallback((whiteboardId: string, pinId: string, tags: Tag[]) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId ? { ...wb, pins: wb.pins.map(p => p.id === pinId ? { ...p, tags } : p) } : wb
      ),
    }));
  }, [setBook]);

  const addFolder = useCallback((name?: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`, name: name || `Folder ${book.folders.length + 1}`,
      whiteboardIds: [], chapterIds: [], order: book.folders.length + 1,
    };
    setBook(prev => ({ ...prev, folders: [...prev.folders, newFolder] }));
  }, [book.folders.length, setBook]);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setBook(prev => ({ ...prev, folders: prev.folders.map(f => f.id === folderId ? { ...f, name } : f) }));
  }, [setBook]);

  const deleteFolder = useCallback((folderId: string) => {
    setBook(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== folderId) }));
  }, [setBook]);

  const moveToFolder = useCallback((folderId: string, itemId: string, itemType: 'whiteboard' | 'chapter') => {
    setBook(prev => ({
      ...prev,
      folders: prev.folders.map(f => {
        const cleaned = itemType === 'whiteboard'
          ? { ...f, whiteboardIds: f.whiteboardIds.filter(id => id !== itemId) }
          : { ...f, chapterIds: f.chapterIds.filter(id => id !== itemId) };
        if (cleaned.id === folderId) {
          return itemType === 'whiteboard'
            ? { ...cleaned, whiteboardIds: [...cleaned.whiteboardIds, itemId] }
            : { ...cleaned, chapterIds: [...cleaned.chapterIds, itemId] };
        }
        return cleaned;
      }),
    }));
  }, [setBook]);

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

  return (
    <BookContext.Provider value={{
      book, activeView, activeWhiteboardId, activeChapterId, isEditorFocusMode,
      setActiveView, setActiveWhiteboard, setActiveChapter, toggleFocusMode,
      updatePin, addPin, deletePin, updateDraftContent,
      addChapter, addWhiteboard, updateBookTitle, updateChapterTitle,
      addDraft, setActiveDraft, connectPins, disconnectPins,
      deleteChapter, deleteWhiteboard, renameWhiteboard,
      duplicateChapter, duplicateWhiteboard, updatePinTags,
      addFolder, renameFolder, deleteFolder, moveToFolder, removeFromFolder,
    }}>
      {children}
    </BookContext.Provider>
  );
}

export function useBook() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBook must be used within BookProvider');
  return ctx;
}
