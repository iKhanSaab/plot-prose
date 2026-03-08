import { useBook } from '@/contexts/BookContext';
import {
  BookOpen, Layout, FileText, Plus, ChevronDown, ChevronRight, PenTool,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function BookSidebar() {
  const {
    book, activeView, activeWhiteboardId, activeChapterId,
    setActiveWhiteboard, setActiveChapter, addWhiteboard, addChapter,
  } = useBook();

  const [wbOpen, setWbOpen] = useState(true);
  const [chOpen, setChOpen] = useState(true);

  return (
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
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-all',
                  activeView === 'whiteboard' && activeWhiteboardId === wb.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <span className="truncate">{wb.name}</span>
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
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-1.5 text-sm rounded-md transition-all text-left',
                  activeView === 'chapter' && activeChapterId === ch.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <PenTool className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{ch.title}</span>
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
          <div>
            <p className="text-xs font-medium text-foreground">Plot-On</p>
            <p className="text-[10px] text-muted-foreground">Write. Map. Create.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
