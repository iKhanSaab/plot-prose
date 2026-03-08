import { useBook } from '@/contexts/BookContext';
import { useLibrary } from '@/contexts/LibraryContext';
import {
  Layout, FileText, Plus, ChevronDown, ChevronRight, PenTool,
  Trash2, Copy, Edit2, FolderOpen, FolderPlus, ArrowRightFromLine,
  BookOpen, Check, MoreHorizontal, Search, Keyboard, Download,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DarkModeToggle } from './DarkModeToggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLongPressDrag, DragState } from '@/hooks/useLongPressDrag';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from '@/hooks/use-toast';

/* ─── Types ─── */
type ContextMenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  children?: { label: string; onClick: () => void }[];
};

/* ─── Context Menu (desktop right-click) ─── */
function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: ContextMenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [subOpen, setSubOpen] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-[60] min-w-[160px] animate-fade-in" style={{ left: x, top: y }}>
      {items.map((item, i) => (
        <div key={i} className="relative" onMouseEnter={() => item.children && setSubOpen(i)} onMouseLeave={() => setSubOpen(null)}>
          <button
            onClick={() => { if (!item.children) { item.onClick(); onClose(); } }}
            className={cn('flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors', item.destructive && 'text-destructive hover:bg-destructive/10')}
          >
            {item.icon}
            {item.label}
            {item.children && <ChevronRight className="ml-auto h-3 w-3" />}
          </button>
          {item.children && subOpen === i && (
            <div className="absolute left-full top-0 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[140px]">
              {item.children.map((sub, j) => (
                <button key={j} onClick={() => { sub.onClick(); onClose(); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors">
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Mobile Bottom Menu ─── */
function MobileMenu({ items, onClose }: { items: ContextMenuItem[]; onClose: () => void }) {
  useEffect(() => {
    const handler = () => onClose();
    // Close on back/outside tap after a frame
    const t = setTimeout(() => document.addEventListener('touchstart', handler, { once: true }), 100);
    return () => { clearTimeout(t); document.removeEventListener('touchstart', handler); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-popover border-t border-border rounded-t-xl w-full max-w-md p-2 pb-6 animate-slide-in-from-bottom" onClick={e => e.stopPropagation()}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3 text-sm rounded-lg hover:bg-muted transition-colors',
              item.destructive && 'text-destructive'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Inline rename input ─── */
function InlineRename({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <input
      className="flex-1 bg-transparent border-b border-primary outline-none text-sm min-h-[28px]"
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => { if (v.trim()) onSave(v.trim()); else onCancel(); }}
      onKeyDown={e => { if (e.key === 'Enter' && v.trim()) onSave(v.trim()); if (e.key === 'Escape') onCancel(); }}
      autoFocus
      onClick={e => e.stopPropagation()}
    />
  );
}

/* ─── Drag Ghost ─── */
function DragGhost({ drag }: { drag: DragState }) {
  return (
    <div
      className="fixed z-[70] pointer-events-none px-3 py-1.5 bg-primary/90 text-primary-foreground text-xs rounded-md shadow-lg font-medium"
      style={{ left: drag.x + 12, top: drag.y - 12 }}
    >
      {drag.label}
    </div>
  );
}

/* ─── Novel Picker ─── */
function NovelPicker() {
  const { library, activeBook, addNovel, switchNovel, renameNovel, deleteNovel } = useLibrary();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          'flex items-center gap-2 w-full px-3 hover:bg-sidebar-accent/50 transition-colors rounded-md',
          isMobile ? 'py-3' : 'py-2.5'
        )}>
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="font-display text-sm font-semibold text-sidebar-foreground truncate flex-1 text-left">
            {activeBook.title}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-1" align="start" sideOffset={4}>
        <div className="space-y-0.5">
          {library.books.map(b => (
            <div key={b.id} className="group flex items-center">
              {renamingId === b.id ? (
                <div className="flex-1 px-2 py-1">
                  <InlineRename value={b.title} onSave={v => { renameNovel(b.id, v); setRenamingId(null); }} onCancel={() => setRenamingId(null)} />
                </div>
              ) : (
                <button
                  onClick={() => { switchNovel(b.id); setOpen(false); }}
                  className={cn(
                    'flex items-center gap-2 flex-1 px-2 py-2 text-sm rounded-sm transition-colors',
                    b.id === activeBook.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-muted'
                  )}
                >
                  {b.id === activeBook.id && <Check className="h-3 w-3 text-primary" />}
                  <span className="truncate">{b.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{b.chapters.length}ch</span>
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); setRenamingId(b.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded transition-all">
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </button>
              {library.books.length > 1 && (
                <button onClick={e => { e.stopPropagation(); deleteNovel(b.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-all">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-1 pt-1">
          <button onClick={() => { addNovel(); setOpen(false); }} className="flex items-center gap-2 w-full px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Novel
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─── Sidebar Content (shared between desktop & mobile) ─── */
export function SidebarContent({ onItemSelect, onOpenSearch, onOpenShortcuts }: { onItemSelect?: () => void; onOpenSearch?: () => void; onOpenShortcuts?: () => void }) {
  const {
    book, activeView, activeWhiteboardId, activeChapterId,
    setActiveWhiteboard, setActiveChapter, addWhiteboard, addChapter,
    deleteChapter, deleteWhiteboard, renameWhiteboard,
    duplicateChapter, duplicateWhiteboard, updateChapterTitle,
    addFolder, renameFolder, deleteFolder, moveToFolder, removeFromFolder,
  } = useBook();

  const isMobile = useIsMobile();
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set(book.folders.map(f => f.id)));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [mobileMenu, setMobileMenu] = useState<ContextMenuItem[] | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; type: 'wb' | 'ch' | 'folder' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  const handleDrop = useCallback((itemId: string, itemType: 'whiteboard' | 'chapter', targetFolderId: string | null) => {
    if (targetFolderId) {
      moveToFolder(targetFolderId, itemId, itemType);
    } else {
      removeFromFolder(itemId, itemType);
    }
  }, [moveToFolder, removeFromFolder]);

  const { dragging, dropTarget, bindLongPress } = useLongPressDrag(handleDrop);

  const folderItemIds = useMemo(() => {
    const wbIds = new Set<string>();
    const chIds = new Set<string>();
    book.folders.forEach(f => {
      f.whiteboardIds.forEach(id => wbIds.add(id));
      f.chapterIds.forEach(id => chIds.add(id));
    });
    return { wbIds, chIds };
  }, [book.folders]);

  const ungroupedWbs = book.whiteboards.filter(wb => !folderItemIds.wbIds.has(wb.id));
  const ungroupedChs = book.chapters.filter(ch => !folderItemIds.chIds.has(ch.id));

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const showMenu = (items: ContextMenuItem[], e?: React.MouseEvent) => {
    if (isMobile) {
      // Flatten children for mobile (no submenus)
      const flat = items.flatMap(item =>
        item.children ? item.children.map(sub => ({ label: sub.label, icon: item.icon, onClick: sub.onClick })) : [item]
      );
      setMobileMenu(flat);
    } else if (e) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, items });
    }
  };

  const moveToFolderSubmenu = (itemId: string, itemType: 'whiteboard' | 'chapter') =>
    book.folders.length > 0
      ? [{ label: 'Move to folder', icon: <ArrowRightFromLine className="h-3 w-3" />, onClick: () => {}, children: book.folders.map(f => ({ label: f.name, onClick: () => moveToFolder(f.id, itemId, itemType) })) }]
      : [];

  const confirmDelete = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ title, description, onConfirm });
  };

  const wbContextItems = (wbId: string, inFolder: boolean): ContextMenuItem[] => {
    const wb = book.whiteboards.find(w => w.id === wbId);
    return [
      { label: 'Rename', icon: <Edit2 className="h-3.5 w-3.5" />, onClick: () => setRenaming({ id: wbId, type: 'wb' }) },
      { label: 'Duplicate', icon: <Copy className="h-3.5 w-3.5" />, onClick: () => { duplicateWhiteboard(wbId); toast({ title: 'Board duplicated' }); } },
      ...moveToFolderSubmenu(wbId, 'whiteboard'),
      ...(inFolder ? [{ label: 'Remove from folder', icon: <ArrowRightFromLine className="h-3.5 w-3.5" />, onClick: () => removeFromFolder(wbId, 'whiteboard') }] : []),
      { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => confirmDelete('Delete board?', `"${wb?.name}" and all its pins will be permanently deleted.`, () => { deleteWhiteboard(wbId); toast({ title: 'Board deleted' }); }), destructive: true },
    ];
  };

  const chContextItems = (chId: string, inFolder: boolean): ContextMenuItem[] => {
    const ch = book.chapters.find(c => c.id === chId);
    return [
      { label: 'Rename', icon: <Edit2 className="h-3.5 w-3.5" />, onClick: () => setRenaming({ id: chId, type: 'ch' }) },
      { label: 'Duplicate', icon: <Copy className="h-3.5 w-3.5" />, onClick: () => { duplicateChapter(chId); toast({ title: 'Chapter duplicated' }); } },
      ...moveToFolderSubmenu(chId, 'chapter'),
      ...(inFolder ? [{ label: 'Remove from folder', icon: <ArrowRightFromLine className="h-3.5 w-3.5" />, onClick: () => removeFromFolder(chId, 'chapter') }] : []),
      { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => confirmDelete('Delete chapter?', `"${ch?.title}" and all its drafts will be permanently deleted.`, () => { deleteChapter(chId); toast({ title: 'Chapter deleted' }); }), destructive: true },
    ];
  };

  const folderContextItems = (folderId: string): ContextMenuItem[] => {
    const f = book.folders.find(fo => fo.id === folderId);
    return [
      { label: 'Rename', icon: <Edit2 className="h-3.5 w-3.5" />, onClick: () => setRenaming({ id: folderId, type: 'folder' }) },
      { label: 'New board inside', icon: <Layout className="h-3.5 w-3.5" />, onClick: () => { addWhiteboard(folderId); toast({ title: 'Board created' }); } },
      { label: 'New chapter inside', icon: <FileText className="h-3.5 w-3.5" />, onClick: () => { addChapter(folderId); toast({ title: 'Chapter created' }); } },
      { label: 'Delete folder', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => confirmDelete('Delete folder?', `"${f?.name}" will be deleted. Items inside will be ungrouped, not deleted.`, () => { deleteFolder(folderId); toast({ title: 'Folder deleted' }); }), destructive: true },
    ];
  };

  const renderWbItem = (wb: typeof book.whiteboards[0], inFolder: boolean) => {
    const isActive = activeView === 'whiteboard' && activeWhiteboardId === wb.id;
    const dragHandlers = bindLongPress(wb.id, 'whiteboard', wb.name);
    return (
      <div key={wb.id} className="flex items-center group" {...dragHandlers}>
        <button
          onClick={() => { setActiveWhiteboard(wb.id); onItemSelect?.(); }}
          onContextMenu={e => showMenu(wbContextItems(wb.id, inFolder), e)}
          className={cn(
            'flex items-center gap-2 flex-1 min-h-[44px] px-2.5 py-2 text-sm rounded-md transition-all',
            isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
            dragging?.id === wb.id && 'opacity-50 scale-95'
          )}
        >
          <Layout className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {renaming?.id === wb.id && renaming.type === 'wb' ? (
            <InlineRename value={wb.name} onSave={v => { renameWhiteboard(wb.id, v); setRenaming(null); }} onCancel={() => setRenaming(null)} />
          ) : (
            <span className="truncate">{wb.name}</span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground">{wb.pins.length}</span>
        </button>
        {isMobile && (
          <button onClick={() => showMenu(wbContextItems(wb.id, inFolder))} className="p-2 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const renderChItem = (ch: typeof book.chapters[0], inFolder: boolean) => {
    const isActive = activeView === 'chapter' && activeChapterId === ch.id;
    const dragHandlers = bindLongPress(ch.id, 'chapter', ch.title);
    return (
      <div key={ch.id} className="flex items-center group" {...dragHandlers}>
        <button
          onClick={() => { setActiveChapter(ch.id); onItemSelect?.(); }}
          onContextMenu={e => showMenu(chContextItems(ch.id, inFolder), e)}
          className={cn(
            'flex items-center gap-2 flex-1 min-h-[44px] px-2.5 py-2 text-sm rounded-md transition-all text-left',
            isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
            dragging?.id === ch.id && 'opacity-50 scale-95'
          )}
        >
          <PenTool className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {renaming?.id === ch.id && renaming.type === 'ch' ? (
            <InlineRename value={ch.title} onSave={v => { updateChapterTitle(ch.id, v); setRenaming(null); }} onCancel={() => setRenaming(null)} />
          ) : (
            <span className="truncate">{ch.title}</span>
          )}
        </button>
        {isMobile && (
          <button onClick={() => showMenu(chContextItems(ch.id, inFolder))} className="p-2 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Novel picker */}
        <div className="px-2 pt-2">
          <NovelPicker />
        </div>

        {/* Quick-create bar */}
        <div className="flex gap-1 px-3 py-2 border-b border-border">
          <Button variant="ghost" size="sm" className={cn('flex-1 text-xs gap-1', isMobile ? 'h-9' : 'h-7')} onClick={() => addWhiteboard()}>
            <Layout className="h-3.5 w-3.5" /> Board
          </Button>
          <Button variant="ghost" size="sm" className={cn('flex-1 text-xs gap-1', isMobile ? 'h-9' : 'h-7')} onClick={() => addChapter()}>
            <FileText className="h-3.5 w-3.5" /> Chapter
          </Button>
          <Button variant="ghost" size="sm" className={cn('flex-1 text-xs gap-1', isMobile ? 'h-9' : 'h-7')} onClick={() => addFolder()}>
            <FolderPlus className="h-3.5 w-3.5" /> Folder
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Folders */}
          {book.folders.map(folder => {
            const isOpen = openFolders.has(folder.id);
            const folderWbs = book.whiteboards.filter(wb => folder.whiteboardIds.includes(wb.id));
            const folderChs = book.chapters.filter(ch => folder.chapterIds.includes(ch.id));
            const count = folderWbs.length + folderChs.length;
            const isDropTarget = dropTarget === folder.id;
            return (
              <div key={folder.id} data-folder-id={folder.id}>
                <button
                  onClick={() => toggleFolder(folder.id)}
                  onContextMenu={e => showMenu(folderContextItems(folder.id), e)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 min-h-[44px] py-2 text-sm rounded-md hover:bg-sidebar-accent/50 transition-all text-sidebar-foreground',
                    isDropTarget && 'ring-2 ring-primary bg-primary/10'
                  )}
                >
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <FolderOpen className="h-4 w-4 text-primary/70" />
                  {renaming?.id === folder.id && renaming.type === 'folder' ? (
                    <InlineRename value={folder.name} onSave={v => { renameFolder(folder.id, v); setRenaming(null); }} onCancel={() => setRenaming(null)} />
                  ) : (
                    <span className="truncate font-medium">{folder.name}</span>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground">{count}</span>
                  {isMobile && (
                    <button onClick={e => { e.stopPropagation(); showMenu(folderContextItems(folder.id)); }} className="p-1 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  )}
                </button>
                {isOpen && (
                  <div className="ml-5 space-y-0.5 mt-0.5">
                    {folderWbs.map(wb => renderWbItem(wb, true))}
                    {folderChs.map(ch => renderChItem(ch, true))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped items */}
          {ungroupedWbs.map(wb => renderWbItem(wb, false))}
          {ungroupedChs.map(ch => renderChItem(ch, false))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <PenTool className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Plot-On</p>
              <p className="text-[10px] text-muted-foreground">Write. Map. Create.</p>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </div>

      {/* Desktop context menu */}
      {contextMenu && !isMobile && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
      )}

      {/* Mobile bottom menu */}
      {mobileMenu && (
        <MobileMenu items={mobileMenu} onClose={() => setMobileMenu(null)} />
      )}

      {/* Drag ghost */}
      {dragging && <DragGhost drag={dragging} />}
    </>
  );
}

/* ─── Main Export — wraps content in aside for desktop ─── */
export function BookSidebar() {
  return (
    <aside className="w-64 min-w-[16rem] border-r border-border bg-sidebar flex flex-col h-screen">
      <SidebarContent />
    </aside>
  );
}
