import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppState, Book, Pin, WhiteboardSheet, Chapter, Draft, ViewMode, Tag } from '@/types/book';
import { defaultBook } from '@/data/defaultBook';

interface BookContextType extends AppState {
  setActiveView: (view: ViewMode) => void;
  setActiveWhiteboard: (id: string) => void;
  setActiveChapter: (id: string) => void;
  toggleFocusMode: () => void;
  updatePin: (whiteboardId: string, pin: Pin) => void;
  addPin: (whiteboardId: string, pin: Pin) => void;
  deletePin: (whiteboardId: string, pinId: string) => void;
  updateDraftContent: (chapterId: string, draftId: string, content: string) => void;
  addChapter: () => void;
  addWhiteboard: () => void;
  updateBookTitle: (title: string) => void;
  updateChapterTitle: (chapterId: string, title: string) => void;
  addDraft: (chapterId: string) => void;
  setActiveDraft: (chapterId: string, draftId: string) => void;
  connectPins: (whiteboardId: string, pinId1: string, pinId2: string) => void;
  disconnectPins: (whiteboardId: string, pinId1: string, pinId2: string) => void;
}

const BookContext = createContext<BookContextType | null>(null);

export function BookProvider({ children }: { children: React.ReactNode }) {
  const [book, setBook] = useState<Book>(defaultBook);
  const [activeView, setActiveView] = useState<ViewMode>('whiteboard');
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<string | null>(defaultBook.whiteboards[0]?.id || null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(defaultBook.chapters[0]?.id || null);
  const [isEditorFocusMode, setIsEditorFocusMode] = useState(false);

  const setActiveWhiteboard = useCallback((id: string) => {
    setActiveWhiteboardId(id);
    setActiveView('whiteboard');
  }, []);

  const setActiveChapter = useCallback((id: string) => {
    setActiveChapterId(id);
    setActiveView('chapter');
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsEditorFocusMode(prev => !prev);
  }, []);

  const updatePin = useCallback((whiteboardId: string, updatedPin: Pin) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? { ...wb, pins: wb.pins.map(p => p.id === updatedPin.id ? updatedPin : p) }
          : wb
      ),
    }));
  }, []);

  const addPin = useCallback((whiteboardId: string, pin: Pin) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId ? { ...wb, pins: [...wb.pins, pin] } : wb
      ),
    }));
  }, []);

  const deletePin = useCallback((whiteboardId: string, pinId: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? {
              ...wb,
              pins: wb.pins
                .filter(p => p.id !== pinId)
                .map(p => ({ ...p, connections: p.connections.filter(c => c !== pinId) })),
            }
          : wb
      ),
    }));
  }, []);

  const updateDraftContent = useCallback((chapterId: string, draftId: string, content: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId
          ? {
              ...ch,
              drafts: ch.drafts.map(d =>
                d.id === draftId ? { ...d, content, updatedAt: new Date().toISOString() } : d
              ),
            }
          : ch
      ),
    }));
  }, []);

  const addChapter = useCallback(() => {
    const newOrder = book.chapters.length + 1;
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: `Chapter ${newOrder}: Untitled`,
      order: newOrder,
      activeDraftId: `draft-${Date.now()}`,
      drafts: [{
        id: `draft-${Date.now()}`,
        name: 'First Draft',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
    };
    setBook(prev => ({ ...prev, chapters: [...prev.chapters, newChapter] }));
    setActiveChapterId(newChapter.id);
    setActiveView('chapter');
  }, [book.chapters.length]);

  const addWhiteboard = useCallback(() => {
    const newWb: WhiteboardSheet = {
      id: `wb-${Date.now()}`,
      name: `Whiteboard ${book.whiteboards.length + 1}`,
      pins: [],
    };
    setBook(prev => ({ ...prev, whiteboards: [...prev.whiteboards, newWb] }));
    setActiveWhiteboardId(newWb.id);
    setActiveView('whiteboard');
  }, [book.whiteboards.length]);

  const updateBookTitle = useCallback((title: string) => {
    setBook(prev => ({ ...prev, title }));
  }, []);

  const updateChapterTitle = useCallback((chapterId: string, title: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ch.id === chapterId ? { ...ch, title } : ch),
    }));
  }, []);

  const addDraft = useCallback((chapterId: string) => {
    const newDraft: Draft = {
      id: `draft-${Date.now()}`,
      name: `Draft ${Date.now() % 1000}`,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, drafts: [...ch.drafts, newDraft], activeDraftId: newDraft.id }
          : ch
      ),
    }));
  }, []);

  const setActiveDraft = useCallback((chapterId: string, draftId: string) => {
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, activeDraftId: draftId } : ch
      ),
    }));
  }, []);

  const connectPins = useCallback((whiteboardId: string, pinId1: string, pinId2: string) => {
    setBook(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === whiteboardId
          ? {
              ...wb,
              pins: wb.pins.map(p => {
                if (p.id === pinId1 && !p.connections.includes(pinId2)) {
                  return { ...p, connections: [...p.connections, pinId2] };
                }
                if (p.id === pinId2 && !p.connections.includes(pinId1)) {
                  return { ...p, connections: [...p.connections, pinId1] };
                }
                return p;
              }),
            }
          : wb
      ),
    }));
  }, []);

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
  }, []);

  return (
    <BookContext.Provider value={{
      book, activeView, activeWhiteboardId, activeChapterId, isEditorFocusMode,
      setActiveView, setActiveWhiteboard, setActiveChapter, toggleFocusMode,
      updatePin, addPin, deletePin, updateDraftContent,
      addChapter, addWhiteboard, updateBookTitle, updateChapterTitle,
      addDraft, setActiveDraft, connectPins, disconnectPins,
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
