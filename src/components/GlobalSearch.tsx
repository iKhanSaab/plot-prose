/*
FILE PURPOSE:
This file renders the global search dialog for finding boards, chapters, folders, and pins in the active book.

ROLE IN THE APP:
It acts like a command palette for navigation. It converts current book state into searchable results and jumps the user to the selected destination.

USED BY:
- pages/Index.tsx opens this on Ctrl/Cmd+K and from sidebar actions
- BookContext.tsx provides the data and navigation actions used during result selection

EXPORTS:
- GlobalSearch: modal search component for cross-book navigation inside the active project
*/

import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useBook } from '@/contexts/BookContext';
import { Search, Layout, PenTool, MapPin, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  type: 'whiteboard' | 'chapter' | 'pin' | 'folder';
  title: string;
  subtitle?: string;
  onSelect: () => void;
}

export function GlobalSearch({ open, onOpenChange }: Props) {
  const { book, setActiveWhiteboard, setActiveChapter } = useBook();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(''); setSelected(0); }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const r: SearchResult[] = [];

    book.whiteboards.forEach(wb => {
      if (wb.name.toLowerCase().includes(q)) {
        r.push({ id: wb.id, type: 'whiteboard', title: wb.name, subtitle: `${wb.pins.length} pins`, onSelect: () => { setActiveWhiteboard(wb.id); onOpenChange(false); } });
      }
      wb.pins.forEach(pin => {
        if (pin.title.toLowerCase().includes(q) || pin.content.toLowerCase().includes(q)) {
          r.push({ id: pin.id, type: 'pin', title: pin.title, subtitle: `in ${wb.name}`, onSelect: () => { setActiveWhiteboard(wb.id); onOpenChange(false); } });
        }
      });
    });

    book.chapters.forEach(ch => {
      if (ch.title.toLowerCase().includes(q)) {
        r.push({ id: ch.id, type: 'chapter', title: ch.title, onSelect: () => { setActiveChapter(ch.id); onOpenChange(false); } });
      }
      ch.drafts.forEach(d => {
        if (d.content.toLowerCase().includes(q) && !r.find(x => x.id === ch.id)) {
          r.push({ id: ch.id + '-content', type: 'chapter', title: ch.title, subtitle: 'Content match', onSelect: () => { setActiveChapter(ch.id); onOpenChange(false); } });
        }
      });
    });

    book.folders.forEach(f => {
      if (f.name.toLowerCase().includes(q)) {
        r.push({ id: f.id, type: 'folder', title: f.name, subtitle: 'Folder', onSelect: () => {} });
      }
    });

    return r.slice(0, 20);
  }, [query, book, setActiveWhiteboard, setActiveChapter, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { results[selected].onSelect(); }
  };

  const iconMap = {
    whiteboard: <Layout className="h-4 w-4 text-muted-foreground" />,
    chapter: <PenTool className="h-4 w-4 text-muted-foreground" />,
    pin: <MapPin className="h-4 w-4 text-muted-foreground" />,
    folder: <FolderOpen className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search chapters, boards, pins..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            autoFocus
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">Esc</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results found</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={r.onSelect}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors',
                i === selected ? 'bg-sidebar-accent' : 'hover:bg-muted'
              )}
            >
              {iconMap[r.type]}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{r.title}</p>
                {r.subtitle && <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">{r.type}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
