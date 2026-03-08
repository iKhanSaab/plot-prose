import { useBook } from '@/contexts/BookContext';
import {
  BookOpen, Layout, FileText, Plus, ChevronDown, ChevronRight, PenTool,
  MoreHorizontal, Trash2, Copy, Edit2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DarkModeToggle } from './DarkModeToggle';

function ContextMenu({
  x, y, items, onClose,
}: {
  x: number; y: number;
  items: { label: string; icon: React.ReactNode; onClick: () => void; destructive?: boolean }[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
      className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[140px] animate-fade-in"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted transition-colors',
            item.destructive && 'text-destructive hover:bg-destructive/10'
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function BookSidebar() {
  const {
    book, activeView, activeWhiteboardId, activeChapterId,
    setActiveWhiteboard, setActiveChapter, addWhiteboard, addChapter,
    deleteChapter, deleteWhiteboard, renameWhiteboard,
    duplicateChapter, duplicateWhiteboard, updateChapterTitle,
  } = useBook();

  const [wbOpen, setWbOpen] = useState(true);
  const [chOpen, setChOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: any[] } | null>(null);
  const [renamingWb, setRenamingWb] = useState<string | null>(null);
  const [renamingCh, setRenamingCh] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleWbContextMenu = (e: React.MouseEvent, wbId: string) => {
    e.preventDefault();
    const wb = book.whiteboards.find(w => w.id === wbId);
    if (!wb) return;
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Rename', icon: <Edit2 className="h-3 w-3" />, onClick: () => { setRenamingWb(wbId); setRenameValue(wb.name); } },
        { label: 'Duplicate', icon: <Copy className="h-3 w-3" />, onClick: () => duplicateWhiteboard(wbId) },
        { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: () => deleteWhiteboard(wbId), destructive: true },
      ],
    });
  };

  const handleChContextMenu = (e: React.MouseEvent, chId: string) => {
    e.preventDefault();
    const ch = book.chapters.find(c => c.id === chId);
    if (!ch) return;
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Rename', icon: <Edit2 className="h-3 w-3" />, onClick: () => { setRenamingCh(chId); setRenameValue(ch.title); } },
        { label: 'Duplicate', icon: <Copy className="h-3 w-3" />, onClick: () => duplicateChapter(chId) },
        { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: () => deleteChapter(chId), destructive: true },
      ],
    });
  };

  const saveWbRename = () => {
    if (renamingWb && renameValue.trim()) renameWhiteboard(renamingWb, renameValue.trim());
    setRenamingWb(null);
  };

  const saveChRename = () => {
    if (renamingCh && renameValue.trim()) updateChapterTitle(renamingCh, renameValue.trim());
    setRenamingCh(null);
  };

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
            {book.whiteboards.length} boards · {book.chapters.length} chapters
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Whiteboards section */}
          <button
            onClick={() => setWbOpen(!wbOpen)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            {wbOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Layout className="h-3.5 w-3.5" />
            <span>Whiteboards</span>
          </button>
          {wbOpen && (
            <div className="ml-4 space-y-0.5">
              {book.whiteboards.map(wb => (
                <button
                  key={wb.id}
                  onClick={() => setActiveWhiteboard(wb.id)}
                  onContextMenu={e => handleWbContextMenu(e, wb.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-all',
                    activeView === 'whiteboard' && activeWhiteboardId === wb.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {renamingWb === wb.id ? (
                    <input
                      className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={saveWbRename}
                      onKeyDown={e => e.key === 'Enter' && saveWbRename()}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate">{wb.name}</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{wb.pins.length}</span>
                </button>
              ))}
              <button
                onClick={addWhiteboard}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New board</span>
              </button>
            </div>
          )}

          {/* Chapters section */}
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
              {book.chapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  onContextMenu={e => handleChContextMenu(e, ch.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-all text-left',
                    activeView === 'chapter' && activeChapterId === ch.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <PenTool className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {renamingCh === ch.id ? (
                    <input
                      className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={saveChRename}
                      onKeyDown={e => e.key === 'Enter' && saveChRename()}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate">{ch.title}</span>
                  )}
                </button>
              ))}
              <button
                onClick={addChapter}
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
