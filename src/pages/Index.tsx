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

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: Index.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// Main application page. Orchestrates:
// 1. LibraryProvider - manages all books
// 2. BookProvider - manages current book's state
// 3. WorkspaceContent - displays the editor with sidebar and main view
// 4. Keyboard shortcuts - global keyboard controls
// 5. Import/Export - file upload/download functionality
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WorkspaceContent: The actual workspace UI
 * Displays either the whiteboard or chapter editor based on activeView
 * Handles:
 * - Keyboard shortcuts (Ctrl/Cmd + K for search, + N for new chapter, etc.)
 * - Import/Export files
 * - Mobile vs desktop layouts
 */
function WorkspaceContent() {
  // ─── Get current state from contexts ───────────────────────────────────────
  const { activeView, isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard, book } = useBook();
  const { importNovel } = useLibrary();
  const isMobile = useIsMobile();
  
  // ─── UI state: are modals open? ────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);        // Mobile sidebar drawer
  const [searchOpen, setSearchOpen] = useState(false);        // Search modal
  const [shortcutsOpen, setShortcutsOpen] = useState(false);  // Keyboard shortcuts help
  const importRef = useRef<HTMLInputElement>(null);          // Hidden file input for imports

  // ═══════════════════════════════════════════════════════════════════════════
  // ──── Keyboard Shortcuts Handler ───────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * Global keyboard shortcuts:
   * - Escape:       Exit focus mode (if in focus mode)
   * - Ctrl/Cmd + K: Open global search
   * - Ctrl/Cmd + E: Export novel as JSON
   * - ?:            Show keyboard shortcuts help
   * - Ctrl/Cmd + N: Create new chapter
   * - Ctrl/Cmd + Shift + N: Create new whiteboard
   * - Ctrl/Cmd + Shift + F: Toggle focus mode
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Exit focus mode on Escape
    if (e.key === 'Escape' && isEditorFocusMode) { 
      toggleFocusMode(); 
      return; 
    }
    
    const mod = e.metaKey || e.ctrlKey;  // Cmd on Mac, Ctrl on Windows/Linux
    
    // Search: Ctrl/Cmd + K
    if (mod && e.key === 'k') { 
      e.preventDefault(); 
      setSearchOpen(true); 
      return; 
    }
    
    // Export: Ctrl/Cmd + E
    if (mod && e.key === 'e' && !e.shiftKey) { 
      e.preventDefault(); 
      exportNovelAsJSON(book); 
      toast({ title: 'Novel exported' }); 
      return; 
    }
    
    // Help: ?
    // (but not if user is typing in an input or textarea)
    if (e.key === '?' && !mod && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) { 
      setShortcutsOpen(true); 
      return; 
    }
    
    // New Chapter: Ctrl/Cmd + N
    if (mod && e.key === 'n' && !e.shiftKey) { 
      e.preventDefault(); 
      addChapter(); 
    }
    
    // New Whiteboard: Ctrl/Cmd + Shift + N
    if (mod && e.key === 'N' && e.shiftKey) { 
      e.preventDefault(); 
      addWhiteboard(); 
    }
    
    // Focus Mode: Ctrl/Cmd + Shift + F
    if (mod && e.key === 'f' && e.shiftKey) { 
      e.preventDefault(); 
      toggleFocusMode(); 
    }
  }, [isEditorFocusMode, toggleFocusMode, addChapter, addWhiteboard, book]);

  // Attach and detach the keyboard listener on mount/unmount
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ──── File Import Handler ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * Handle importing a novel from a JSON export file.
   * 1. User opens file picker
   * 2. Select a .json file
   * 3. Parse it using importNovelFromJSON
   * 4. Add to library via importNovel()
   * 5. Show success/error toast
   */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const imported = await importNovelFromJSON(file);
      importNovel(imported);
      toast({ title: 'Novel imported', description: imported.title });
    } catch (err) {
      const description = err instanceof Error ? err.message : 'Unknown import error';
      toast({ title: 'Import failed', description, variant: 'destructive' });
    }
    
    // Clear the file input so the same file can be imported again if needed
    e.target.value = '';
  };

  // Helper functions to open modals
  const openSearch = () => setSearchOpen(true);
  const openShortcuts = () => setShortcutsOpen(true);
  const openImport = () => importRef.current?.click();
  
  const exportNovel = () => {
    exportNovelAsJSON(book);
    toast({ title: 'Novel exported', description: 'Keep the JSON file somewhere safe for backup.' });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ──── Mobile Layout ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // On mobile: sidebar is a sheet/drawer that slides out from the left
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Mobile header with menu button */}
        {!isEditorFocusMode && (
          <header className="flex items-center h-12 px-2 border-b border-border bg-sidebar shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <img src={APP_ICON_PATH} alt="" className="ml-1 h-7 w-7 shrink-0 object-contain" />
            <span className="ml-2 text-sm font-semibold text-foreground truncate">{APP_NAME}</span>
          </header>
        )}
        
        {/* Sidebar as a mobile sheet (drawer) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 bg-sidebar">
            <SidebarContent
              onItemSelect={() => setMobileOpen(false)}
              onOpenSearch={() => { setMobileOpen(false); openSearch(); }}
              onOpenShortcuts={() => { setMobileOpen(false); openShortcuts(); }}
              onImportNovel={() => { setMobileOpen(false); openImport(); }}
              onExportNovel={() => { setMobileOpen(false); exportNovel(); }}
            />
          </SheetContent>
        </Sheet>
        
        {/* Main content: either whiteboard or chapter editor */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'whiteboard' ? <WhiteboardView /> : <ChapterEditor />}
        </div>
        
        {/* Modals and hidden file input */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ──── Desktop Layout ───────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // On desktop: sidebar is always visible on the left
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar (left): navigation and book management */}
      {!isEditorFocusMode && (
        <BookSidebar
          onOpenSearch={openSearch}
          onOpenShortcuts={openShortcuts}
          onImportNovel={openImport}
          onExportNovel={exportNovel}
        />
      )}
      
      {/* Main content area (right): either whiteboard or chapter editor */}
      {activeView === 'whiteboard' ? <WhiteboardView /> : <ChapterEditor />}
      
      {/* Modals and hidden file input */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ──── Provider Bridge: Connect LibraryContext to BookContext ─────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * This component bridges the gap between LibraryContext (all books) and BookContext (current book).
 * It grabs the activeBook from LibraryContext and passes it to BookProvider,
 * so BookContext always stays in sync with which book the user has selected.
 */
function BookProviderBridge({ children }: { children: React.ReactNode }) {
  const { activeBook, updateActiveBook } = useLibrary();
  return (
    <BookProvider book={activeBook} onBookChange={updateActiveBook}>
      {children}
    </BookProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ──── Root Index Page: Set up Provider Hierarchy ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Provider hierarchy:
 * 1. LibraryProvider: Manages all books in the library
 * 2. BookProviderBridge: Connects library to current book
 * 3. BookProvider: Manages state of the currently active book
 * 4. WorkspaceContent: The actual UI that uses the contexts
 */
const Index = () => (
  <LibraryProvider>
    <BookProviderBridge>
      <WorkspaceContent />
    </BookProviderBridge>
  </LibraryProvider>
);

export default Index;
