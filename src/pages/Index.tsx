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

function WorkspaceContent() {
  const { activeView, isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard, book } = useBook();
  const { importNovel } = useLibrary();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isEditorFocusMode) { toggleFocusMode(); return; }
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'k') { e.preventDefault(); setSearchOpen(true); return; }
    if (mod && e.key === 'e' && !e.shiftKey) { e.preventDefault(); exportNovelAsJSON(book); toast({ title: 'Novel exported' }); return; }
    if (e.key === '?' && !mod && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) { setShortcutsOpen(true); return; }
    if (mod && e.key === 'n' && !e.shiftKey) { e.preventDefault(); addChapter(); }
    if (mod && e.key === 'N' && e.shiftKey) { e.preventDefault(); addWhiteboard(); }
    if (mod && e.key === 'f' && e.shiftKey) { e.preventDefault(); toggleFocusMode(); }
  }, [isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard, book]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importNovelFromJSON(file);
      importNovel(imported);
      toast({ title: 'Novel imported', description: imported.title });
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    }
    e.target.value = '';
  };

  const openSearch = () => setSearchOpen(true);
  const openShortcuts = () => setShortcutsOpen(true);

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {!isEditorFocusMode && (
          <header className="flex items-center h-12 px-2 border-b border-border bg-sidebar shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-2 text-sm font-semibold text-foreground truncate">Plot-On</span>
          </header>
        )}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 bg-sidebar">
            <SidebarContent onItemSelect={() => setMobileOpen(false)} onOpenSearch={() => { setMobileOpen(false); openSearch(); }} onOpenShortcuts={() => { setMobileOpen(false); openShortcuts(); }} />
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
      {!isEditorFocusMode && <BookSidebar onOpenSearch={openSearch} onOpenShortcuts={openShortcuts} />}
      {activeView === 'whiteboard' ? <WhiteboardView /> : <ChapterEditor />}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
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
