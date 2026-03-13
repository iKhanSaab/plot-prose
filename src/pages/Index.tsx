/*
FILE PURPOSE:
This file assembles the main workspace page of the app.

ROLE IN THE APP:
It bridges the library-level state to the current book, chooses mobile vs desktop layout, and coordinates the primary editor/whiteboard experience.

USED BY:
- App.tsx renders this at the "/" route
- It composes BookSidebar, WhiteboardView, ChapterEditor, search, import/export, and modal helpers

EXPORTS:
- Index: the main routed page component
*/

import { LibraryProvider, useLibrary } from '@/contexts/LibraryContext';
import { BookProvider, useBook } from '@/contexts/BookContext';
import { BookSidebar, SidebarContent } from '@/components/BookSidebar';
import { WhiteboardView } from '@/components/WhiteboardView';
import { ChapterEditor } from '@/components/ChapterEditor';
import { GlobalSearch } from '@/components/GlobalSearch';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { exportNovelAsJSON, importNovelFromJSON } from '@/lib/exportImport';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { APP_ICON_PATH, APP_NAME } from '@/lib/appInfo';

function WorkspaceContent() {
  const { activeView, isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard, book } = useBook();
  const { importNovel } = useLibrary();
  const isMobile = useIsMobile();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isEditorFocusMode) {
      toggleFocusMode();
      return;
    }

    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
      return;
    }

    if (mod && e.key === 'e' && !e.shiftKey) {
      e.preventDefault();
      exportNovelAsJSON(book);
      toast({ title: 'Novel exported' });
      return;
    }

    if (
      e.key === '?' &&
      !mod &&
      !(e.target instanceof HTMLInputElement) &&
      !(e.target instanceof HTMLTextAreaElement)
    ) {
      setShortcutsOpen(true);
      return;
    }

    if (mod && e.key === 'n' && !e.shiftKey) {
      e.preventDefault();
      addChapter();
    }

    if (mod && e.key === 'N' && e.shiftKey) {
      e.preventDefault();
      addWhiteboard();
    }

    if (mod && e.key === 'f' && e.shiftKey) {
      e.preventDefault();
      toggleFocusMode();
    }
  }, [isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard, book]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const imported = await importNovelFromJSON(file);
      importNovel(imported);
      toast({ title: 'Novel imported', description: imported.title });
    } catch (err) {
      const description = err instanceof Error ? err.message : 'Unknown import error';
      toast({ title: 'Import failed', description, variant: 'destructive' });
    }

    e.target.value = '';
  };

  const openSearch = () => setSearchOpen(true);
  const openShortcuts = () => setShortcutsOpen(true);
  const openImport = () => importRef.current?.click();

  const exportNovel = () => {
    exportNovelAsJSON(book);
    toast({ title: 'Novel exported', description: 'Keep the JSON file somewhere safe for backup.' });
  };

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden">
        {!isEditorFocusMode && (
          <header className="flex h-12 shrink-0 items-center border-b border-border bg-sidebar px-2">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <img src={APP_ICON_PATH} alt="" className="ml-1 h-7 w-7 shrink-0 object-contain" />
            <span className="ml-2 truncate text-sm font-semibold text-foreground">{APP_NAME}</span>
          </header>
        )}

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-[320px] bg-sidebar p-0">
            <SidebarContent
              onItemSelect={() => setMobileOpen(false)}
              onOpenSearch={() => {
                setMobileOpen(false);
                openSearch();
              }}
              onOpenShortcuts={() => {
                setMobileOpen(false);
                openShortcuts();
              }}
              onImportNovel={() => {
                setMobileOpen(false);
                openImport();
              }}
              onExportNovel={() => {
                setMobileOpen(false);
                exportNovel();
              }}
            />
          </SheetContent>
        </Sheet>

        <div className="flex-1 overflow-hidden">
          {activeView === 'whiteboard' ? <WhiteboardView /> : <ChapterEditor />}
        </div>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {!isEditorFocusMode && (
        <BookSidebar
          onOpenSearch={openSearch}
          onOpenShortcuts={openShortcuts}
          onImportNovel={openImport}
          onExportNovel={exportNovel}
        />
      )}

      {activeView === 'whiteboard' ? <WhiteboardView /> : <ChapterEditor />}

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  );
}

function BookProviderBridge({ children }: { children: React.ReactNode }) {
  const { activeBook, updateActiveBook } = useLibrary();
  return <BookProvider book={activeBook} onBookChange={updateActiveBook}>{children}</BookProvider>;
}

const Index = () => (
  <LibraryProvider>
    <BookProviderBridge>
      <WorkspaceContent />
    </BookProviderBridge>
  </LibraryProvider>
);

export default Index;
