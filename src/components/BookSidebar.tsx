import { useBook } from '@/contexts/BookContext';
import {
  BookOpen, Layout, FileText, Plus, ChevronDown, ChevronRight, PenTool,
  Trash2, Copy, Edit2, FolderOpen, FolderPlus, ArrowRightFromLine,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DarkModeToggle } from './DarkModeToggle';

/* ─── Context Menu ─── */
function ContextMenu({
  x, y, items, onClose,
}: {
  x: number; y: number;
  items: { label: string; icon: React.ReactNode; onClick: () => void; destructive?: boolean; children?: { label: string; onClick: () => void }[] }[];
  onClose: () => void;
}) {
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
    <div
      ref={ref}
      className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[160px] animate-fade-in"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <div key={i} className="relative"
          onMouseEnter={() => item.children && setSubOpen(i)}
          onMouseLeave={() => setSubOpen(null)}
        >
          <button
            onClick={() => { if (!item.children) { item.onClick(); onClose(); } }}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted transition-colors',
              item.destructive && 'text-destructive hover:bg-destructive/10'
            )}
          >
            {item.icon}
            {item.label}
            {item.children && <ChevronRight className="ml-auto h-3 w-3" />}
          </button>
          {item.children && subOpen === i && (
            <div className="absolute left-full top-0 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[140px]">
              {item.children.map((sub, j) => (
                <button
                  key={j}
                  onClick={() => { sub.onClick(); onClose(); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
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

/* ─── Inline rename input ─── */
function InlineRename({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <input
      className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => { if (v.trim()) onSave(v.trim()); else onCancel(); }}
      onKeyDown={e => { if (e.key === 'Enter' && v.trim()) onSave(v.trim()); if (e.key === 'Escape') onCancel(); }}
      autoFocus
      onClick={e => e.stopPropagation()}
    />
  );
}

/* ─── Main Sidebar ─── */
export function BookSidebar() {
  const {
    book, activeView, activeWhiteboardId, activeChapterId,
    setActiveWhiteboard, setActiveChapter, addWhiteboard, addChapter,
    deleteChapter, deleteWhiteboard, renameWhiteboard,
    duplicateChapter, duplicateWhiteboard, updateChapterTitle,
    addFolder, renameFolder, deleteFolder, moveToFolder, removeFromFolder,
  } = useBook();

  const [foldersOpen, setFoldersOpen] = useState(true);
  const [wbOpen, setWbOpen] = useState(true);
  const [chOpen, setChOpen] = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set(book.folders.map(f => f.id)));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: any[] } | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; type: 'wb' | 'ch' | 'folder' } | null>(null);

  // Compute which items are inside any folder
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

  // ─── Context menu builders ───
  const moveToFolderSubmenu = (itemId: string, itemType: 'whiteboard' | 'chapter') =>
    book.folders.length > 0
      ? [{
          label: 'Move to folder', icon: <ArrowRightFromLine className="h-3 w-3" />, onClick: () => {},
          children: book.folders.map(f => ({ label: f.name, onClick: () => moveToFolder(f.id, itemId, itemType) })),
        }]
      : [];

  const wbContextItems = (wbId: string, inFolder: boolean) => {
    const wb = book.whiteboards.find(w => w.id === wbId);
    if (!wb) return [];
    return [
      { label: 'Rename', icon: <Edit2 className="h-3 w-3" />, onClick: () => setRenaming({ id: wbId, type: 'wb' }) },
      { label: 'Duplicate', icon: <Copy className="h-3 w-3" />, onClick: () => duplicateWhiteboard(wbId) },
      ...moveToFolderSubmenu(wbId, 'whiteboard'),
      ...(inFolder ? [{ label: 'Remove from folder', icon: <ArrowRightFromLine className="h-3 w-3" />, onClick: () => removeFromFolder(wbId, 'whiteboard') }] : []),
      { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: () => deleteWhiteboard(wbId), destructive: true },
    ];
  };

  const chContextItems = (chId: string, inFolder: boolean) => {
    const ch = book.chapters.find(c => c.id === chId);
    if (!ch) return [];
    return [
      { label: 'Rename', icon: <Edit2 className="h-3 w-3" />, onClick: () => setRenaming({ id: chId, type: 'ch' }) },
      { label: 'Duplicate', icon: <Copy className="h-3 w-3" />, onClick: () => duplicateChapter(chId) },
      ...moveToFolderSubmenu(chId, 'chapter'),
      ...(inFolder ? [{ label: 'Remove from folder', icon: <ArrowRightFromLine className="h-3 w-3" />, onClick: () => removeFromFolder(chId, 'chapter') }] : []),
      { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: () => deleteChapter(chId), destructive: true },
    ];
  };

  const folderContextItems = (folderId: string) => [
    { label: 'Rename', icon: <Edit2 className="h-3 w-3" />, onClick: () => setRenaming({ id: folderId, type: 'folder' }) },
    { label: 'Delete folder', icon: <Trash2 className="h-3 w-3" />, onClick: () => deleteFolder(folderId), destructive: true },
  ];

  const handleContextMenu = (e: React.MouseEvent, items: any[]) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  // ─── Renderers ───
  const renderWbItem = (wb: typeof book.whiteboards[0], inFolder: boolean) => (
    <button
      key={wb.id}
      onClick={() => setActiveWhiteboard(wb.id)}
      onContextMenu={e => handleContextMenu(e, wbContextItems(wb.id, inFolder))}
      className={cn(
        'flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-all',
        activeView === 'whiteboard' && activeWhiteboardId === wb.id
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
    >
      <Layout className="h-3 w-3 shrink-0 text-muted-foreground" />
      {renaming?.id === wb.id && renaming.type === 'wb' ? (
        <InlineRename value={wb.name} onSave={v => { renameWhiteboard(wb.id, v); setRenaming(null); }} onCancel={() => setRenaming(null)} />
      ) : (
        <span className="truncate">{wb.name}</span>
      )}
      <span className="ml-auto text-xs text-muted-foreground">{wb.pins.length}</span>
    </button>
  );

  const renderChItem = (ch: typeof book.chapters[0], inFolder: boolean) => (
    <button
      key={ch.id}
      onClick={() => setActiveChapter(ch.id)}
      onContextMenu={e => handleContextMenu(e, chContextItems(ch.id, inFolder))}
      className={cn(
        'flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-all text-left',
        activeView === 'chapter' && activeChapterId === ch.id
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
    >
      <PenTool className="h-3 w-3 shrink-0 text-muted-foreground" />
      {renaming?.id === ch.id && renaming.type === 'ch' ? (
        <InlineRename value={ch.title} onSave={v => { updateChapterTitle(ch.id, v); setRenaming(null); }} onCancel={() => setRenaming(null)} />
      ) : (
        <span className="truncate">{ch.title}</span>
      )}
    </button>
  );

  return (
    <>
      <aside className="w-64 min-w-[16rem] border-r border-border bg-sidebar flex flex-col h-screen">
        {/* Book header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-sidebar-foreground truncate">
              {book.title}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-body">
            {book.folders.length} folders · {book.whiteboards.length} boards · {book.chapters.length} chapters
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">

          {/* ─── Folders section ─── */}
          <button
            onClick={() => setFoldersOpen(!foldersOpen)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            {foldersOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Folders</span>
          </button>
          {foldersOpen && (
            <div className="ml-2 space-y-0.5">
              {book.folders.map(folder => {
                const isOpen = openFolders.has(folder.id);
                const folderWbs = book.whiteboards.filter(wb => folder.whiteboardIds.includes(wb.id));
                const folderChs = book.chapters.filter(ch => folder.chapterIds.includes(ch.id));
                return (
                  <div key={folder.id}>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      onContextMenu={e => handleContextMenu(e, folderContextItems(folder.id))}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground"
                    >
                      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <FolderOpen className="h-3.5 w-3.5 text-primary/70" />
                      {renaming?.id === folder.id && renaming.type === 'folder' ? (
                        <InlineRename value={folder.name} onSave={v => { renameFolder(folder.id, v); setRenaming(null); }} onCancel={() => setRenaming(null)} />
                      ) : (
                        <span className="truncate font-medium">{folder.name}</span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{folderWbs.length + folderChs.length}</span>
                    </button>
                    {isOpen && (
                      <div className="ml-5 space-y-0.5 mt-0.5">
                        {folderWbs.map(wb => renderWbItem(wb, true))}
                        {folderChs.map(ch => renderChItem(ch, true))}
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => addWhiteboard(folder.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Board
                          </button>
                          <button
                            onClick={() => addChapter(folder.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Chapter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => addFolder()}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>New folder</span>
              </button>
            </div>
          )}

          {/* ─── Ungrouped Whiteboards ─── */}
          <button
            onClick={() => setWbOpen(!wbOpen)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors mt-2"
          >
            {wbOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Layout className="h-3.5 w-3.5" />
            <span>Whiteboards</span>
          </button>
          {wbOpen && (
            <div className="ml-4 space-y-0.5">
              {ungroupedWbs.map(wb => renderWbItem(wb, false))}
              <button
                onClick={() => addWhiteboard()}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New board</span>
              </button>
            </div>
          )}

          {/* ─── Ungrouped Chapters ─── */}
          <button
            onClick={() => setChOpen(!chOpen)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors mt-2"
          >
            {chOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <FileText className="h-3.5 w-3.5" />
            <span>Chapters</span>
          </button>
          {chOpen && (
            <div className="ml-4 space-y-0.5">
              {ungroupedChs.map(ch => renderChItem(ch, false))}
              <button
                onClick={() => addChapter()}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New chapter</span>
              </button>
            </div>
          )}
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
      </aside>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
