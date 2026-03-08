import { useBook } from '@/contexts/BookContext';
import { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Plus, FileText, ChevronDown, Trash2, Edit2, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportChapterAsMarkdown } from '@/lib/exportImport';

export function ChapterEditor() {
  const {
    book, activeChapterId, isEditorFocusMode, toggleFocusMode,
    updateDraftContent, addDraft, deleteDraft, renameDraft, setActiveDraft, updateChapterTitle,
  } = useBook();

  const chapter = book.chapters.find(ch => ch.id === activeChapterId);
  const activeDraft = chapter?.drafts.find(d => d.id === chapter.activeDraftId);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(chapter?.title || '');
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);
  const [draftNameValue, setDraftNameValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitleValue(chapter?.title || '');
  }, [chapter?.title]);

  useEffect(() => {
    if (isEditorFocusMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditorFocusMode]);

  if (!chapter || !activeDraft) {
    return (
      <div className="flex-1 flex items-center justify-center bg-editor-bg">
        <div className="text-center animate-fade-in">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Select a chapter to start writing</p>
        </div>
      </div>
    );
  }

  const wordCount = activeDraft.content.trim() ? activeDraft.content.trim().split(/\s+/).length : 0;
  const charCount = activeDraft.content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 250));

  const handleContentChange = (content: string) => {
    setSaveStatus('saving');
    updateDraftContent(chapter.id, activeDraft.id, content);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('saved'), 600);
  };

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateChapterTitle(chapter.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDraftRename = (draftId: string) => {
    if (draftNameValue.trim()) {
      renameDraft(chapter.id, draftId, draftNameValue.trim());
    }
    setRenamingDraftId(null);
  };

  return (
    <div className={cn(
      'flex-1 flex flex-col bg-editor-bg transition-all',
      isEditorFocusMode && 'fixed inset-0 z-50'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm transition-opacity',
        isEditorFocusMode && 'opacity-0 hover:opacity-100'
      )}>
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              className="text-lg font-display font-semibold bg-transparent border-b border-primary outline-none w-full max-w-md"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-display font-semibold truncate cursor-text"
              onDoubleClick={() => setIsEditingTitle(true)}
            >
              {chapter.title}
            </h2>
          )}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-xs text-muted-foreground">{wordCount} words</p>
            <span className="text-xs text-muted-foreground">·</span>
            <p className="text-xs text-muted-foreground">{charCount.toLocaleString()} chars</p>
            <span className="text-xs text-muted-foreground">·</span>
            <p className="text-xs text-muted-foreground">~{readingTime} min read</p>
            <span className="text-xs text-muted-foreground">·</span>

            {/* Save status */}
            <span className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              saveStatus === 'saved' ? 'text-muted-foreground' : 'text-primary'
            )}>
              {saveStatus === 'saved' ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3 animate-pulse" />}
              {saveStatus === 'saved' ? 'Saved' : 'Saving...'}
            </span>
            <span className="text-xs text-muted-foreground">·</span>

            {/* Draft selector */}
            <div className="relative">
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {activeDraft.name}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showDrafts && (
                <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg py-1 z-10 min-w-[180px] animate-fade-in">
                  {chapter.drafts.map(d => (
                    <div key={d.id} className="flex items-center group">
                      {renamingDraftId === d.id ? (
                        <input
                          className="flex-1 px-3 py-1.5 text-xs bg-transparent border-b border-primary outline-none"
                          value={draftNameValue}
                          onChange={e => setDraftNameValue(e.target.value)}
                          onBlur={() => handleDraftRename(d.id)}
                          onKeyDown={e => { if (e.key === 'Enter') handleDraftRename(d.id); if (e.key === 'Escape') setRenamingDraftId(null); }}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <button
                          onClick={() => { setActiveDraft(chapter.id, d.id); setShowDrafts(false); }}
                          className={cn(
                            'flex-1 text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors',
                            d.id === activeDraft.id && 'text-primary font-medium'
                          )}
                        >
                          {d.name}
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setDraftNameValue(d.name); setRenamingDraftId(d.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
                      >
                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                      {chapter.drafts.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteDraft(chapter.id, d.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => { addDraft(chapter.id); setShowDrafts(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> New draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggleFocusMode}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title={isEditorFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          {isEditorFocusMode ? (
            <Minimize2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          'mx-auto py-8 px-6 transition-all',
          isEditorFocusMode ? 'max-w-2xl py-16' : 'max-w-3xl'
        )}>
          <textarea
            ref={textareaRef}
            className="chapter-editor w-full min-h-[60vh] bg-transparent resize-none text-foreground placeholder:text-muted-foreground/40"
            value={activeDraft.content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Begin writing your chapter..."
            spellCheck
          />
        </div>
      </div>

      {/* Focus mode escape hint */}
      {isEditorFocusMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/40 animate-fade-in">
          Press Esc or hover top to exit focus mode
        </div>
      )}
    </div>
  );
}
