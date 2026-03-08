import { LibraryProvider, useLibrary } from '@/contexts/LibraryContext';
import { BookProvider, useBook } from '@/contexts/BookContext';
import { BookSidebar } from '@/components/BookSidebar';
import { WhiteboardView } from '@/components/WhiteboardView';
import { ChapterEditor } from '@/components/ChapterEditor';
import { useEffect, useCallback } from 'react';

function WorkspaceContent() {
  const { activeView, isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard } = useBook();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isEditorFocusMode) { toggleFocusMode(); return; }
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'n' && !e.shiftKey) { e.preventDefault(); addChapter(); }
    if (mod && e.key === 'N' && e.shiftKey) { e.preventDefault(); addWhiteboard(); }
    if (mod && e.key === 'f' && e.shiftKey) { e.preventDefault(); toggleFocusMode(); }
  }, [isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {!isEditorFocusMode && <BookSidebar />}
      {activeView === 'whiteboard' ? <WhiteboardView /> : <ChapterEditor />}
    </div>
  );
}

function BookProviderBridge({ children }: { children: React.ReactNode }) {
  const { activeBook, updateActiveBook } = useLibrary();
  return (
    <BookProvider book={activeBook} onBookChange={updateActiveBook}>
      {children}
    </BookProvider>
  );
}

const Index = () => (
  <LibraryProvider>
    <BookProviderBridge>
      <WorkspaceContent />
    </BookProviderBridge>
  </LibraryProvider>
);

export default Index;
