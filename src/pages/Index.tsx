import { BookProvider, useBook } from '@/contexts/BookContext';
import { BookSidebar } from '@/components/BookSidebar';
import { WhiteboardView } from '@/components/WhiteboardView';
import { ChapterEditor } from '@/components/ChapterEditor';
import { useEffect } from 'react';

function WorkspaceContent() {
  const { activeView, isEditorFocusMode, toggleFocusMode } = useBook();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorFocusMode) {
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorFocusMode, toggleFocusMode]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {!isEditorFocusMode && <BookSidebar />}
      {activeView === 'whiteboard' ? <WhiteboardView /> : <ChapterEditor />}
    </div>
  );
}

const Index = () => {
  return (
    <BookProvider>
      <WorkspaceContent />
    </BookProvider>
  );
};

export default Index;
