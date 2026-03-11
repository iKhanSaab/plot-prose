/*
FILE PURPOSE:
This file renders the chapter writing interface, including draft switching and text editing.

ROLE IN THE APP:
It is the prose-writing side of the workspace. It reads the active chapter from BookContext and writes user edits back into draft state.

USED BY:
- pages/Index.tsx renders this when the active view is "chapter"
- BookContext.tsx supplies the current chapter and all chapter mutation actions

EXPORTS:
- ChapterEditor: the main chapter editing component
*/

import { useBook } from '@/contexts/BookContext';
import { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Plus, FileText, ChevronDown, Trash2, Edit2, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ChapterEditor
// ═══════════════════════════════════════════════════════════════════════════════
// Main writing interface for editing chapters.
// Features:
// - Edit chapter title (double-click to edit)
// - Write/edit the current draft of a chapter
// - Switch between multiple drafts of the same chapter
// - Create, rename, and delete drafts
// - Autosave with visual feedback (saving indicator)
// - Focus mode (fullscreen, distraction-free writing)
// - Word/character count
// ═══════════════════════════════════════════════════════════════════════════════

export function ChapterEditor() {
  // ─── Get state and actions from BookContext ────────────────────────────────
  const {
    book, activeChapterId, isEditorFocusMode, toggleFocusMode,
    updateDraftContent, addDraft, deleteDraft, renameDraft, setActiveDraft, updateChapterTitle,
  } = useBook();

  // ─── Find the current chapter and its active draft ─────────────────────────
  const chapter = book.chapters.find(ch => ch.id === activeChapterId);
  const activeDraft = chapter?.drafts.find(d => d.id === chapter.activeDraftId);
  
  // ─── UI State ──────────────────────────────────────────────────────────────
  const [showDrafts, setShowDrafts] = useState(false);           // Is draft menu open?
  const [isEditingTitle, setIsEditingTitle] = useState(false);   // Is user editing chapter title?
  const [titleValue, setTitleValue] = useState(chapter?.title || ''); // Temp title input value
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);  // Which draft is being renamed?
  const [draftNameValue, setDraftNameValue] = useState('');      // Temp draft name input
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved'); // Visual save indicator
  
  // ─── Refs: Direct access to DOM elements ───────────────────────────────────
  const textareaRef = useRef<HTMLTextAreaElement>(null);        // The main text editor
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Debounce timer for save indicator

  // ─── Sync title when chapter changes ───────────────────────────────────────
  useEffect(() => {
    setTitleValue(chapter?.title || '');
  }, [chapter?.title]);

  // ─── Auto-focus textarea when entering focus mode ──────────────────────────
  useEffect(() => {
    if (isEditorFocusMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditorFocusMode]);

  // ─── Empty State: No chapter selected ──────────────────────────────────────
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

  // ─── Calculate stats from current draft ────────────────────────────────────
  // Word count: splits content by whitespace
  // Char count: total characters including spaces
  const wordCount = activeDraft.content.trim() ? activeDraft.content.trim().split(/\s+/).length : 0;
  const charCount = activeDraft.content.length;
  const isEmptyDraft = activeDraft.content.trim().length === 0;

  // ─── Handler: Update draft content as user types ───────────────────────────
  /**
   * 1. Mark as "saving" and update the draft content
   * 2. Clear previous save timer
   * 3. Set a 600ms timer to mark as "saved" (creates visual feedback)
   * This gives the user feedback that their work is being saved
   */
  const handleContentChange = (content: string) => {
    setSaveStatus('saving');
    updateDraftContent(chapter.id, activeDraft.id, content);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('saved'), 600);
  };

  // ─── Handler: Save new chapter title ───────────────────────────────────────
  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateChapterTitle(chapter.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  // ─── Handler: Save new draft name ──────────────────────────────────────────
  const handleDraftRename = (draftId: string) => {
    if (draftNameValue.trim()) {
      renameDraft(chapter.id, draftId, draftNameValue.trim());
    }
    setRenamingDraftId(null);
  };

  return (
    <div className={cn(
      'flex-1 flex flex-col bg-editor-bg transition-all',
      isEditorFocusMode && 'fixed inset-0 z-50'  // Focus mode: fullscreen overlay
    )}>
      {/* ═══════════════════════════════════════════════════════════════════════
          TOP BAR: Title, Stats, Draft Selector, Focus Mode Toggle
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        'flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm transition-opacity',
        isEditorFocusMode && 'opacity-0 hover:opacity-100'  // Hide in focus mode, show on hover
      )}>
        <div className="flex-1 min-w-0">
          {/* ─── Chapter Title Editor & Stats ───────────────────────────────────*/}
          {isEditingTitle ? (
            // Title input mode: shows when user double-clicks title
            <input
              className="text-lg font-display font-semibold bg-transparent border-b border-primary outline-none w-full max-w-md"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}  // Save when input loses focus
              onKeyDown={e => e.key === 'Enter' && handleTitleSave()}  // Or press Enter
              autoFocus
            />
          ) : (
            // Title display mode: double-click to edit
            <h2
              className="text-lg font-display font-semibold truncate cursor-text"
              onDoubleClick={() => setIsEditingTitle(true)}
            >
              {chapter.title}
            </h2>
          )}
          
          {/* ─── Stats & Draft Selector ───────────────────────────────────────*/}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {/* Word and character count */}
            <p className="text-xs text-muted-foreground">{wordCount} words</p>
            <span className="text-xs text-muted-foreground">-</span>
            <p className="text-xs text-muted-foreground">{charCount.toLocaleString()} chars</p>
            <span className="text-xs text-muted-foreground">-</span>

            {/* Save status indicator (teal when saved, blue pulse when saving) */}
            <span className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              saveStatus === 'saved' ? 'text-muted-foreground' : 'text-primary'
            )}>
              {saveStatus === 'saved' ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3 animate-pulse" />}
              {saveStatus === 'saved' ? 'Saved' : 'Saving...'}
            </span>
            <span className="text-xs text-muted-foreground">-</span>

            {/* ─── Draft Selector Dropdown ──────────────────────────────────────*/}
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
                  {/* List all drafts of this chapter */}
                  {chapter.drafts.map(d => (
                    <div key={d.id} className="flex items-center group">
                      {renamingDraftId === d.id ? (
                        // Draft rename input
                        <input
                          className="flex-1 px-3 py-1.5 text-xs bg-transparent border-b border-primary outline-none"
                          value={draftNameValue}
                          onChange={e => setDraftNameValue(e.target.value)}
                          onBlur={() => handleDraftRename(d.id)}
                          onKeyDown={e => { 
                            if (e.key === 'Enter') handleDraftRename(d.id); 
                            if (e.key === 'Escape') setRenamingDraftId(null); 
                          }}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        // Draft selector button
                        <button
                          onClick={() => { 
                            setActiveDraft(chapter.id, d.id); 
                            setShowDrafts(false); 
                          }}
                          className={cn(
                            'flex-1 text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors',
                            d.id === activeDraft.id && 'text-primary font-medium'  // Highlight current draft
                          )}
                        >
                          {d.name}
                        </button>
                      )}
                      
                      {/* Edit draft name button (shows on hover) */}
                      <button
                        onClick={e => { 
                          e.stopPropagation(); 
                          setDraftNameValue(d.name); 
                          setRenamingDraftId(d.id); 
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
                      >
                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                      
                      {/* Delete draft button (only if more than 1 draft exists) */}
                      {chapter.drafts.length > 1 && (
                        <button
                          onClick={e => { 
                            e.stopPropagation(); 
                            deleteDraft(chapter.id, d.id); 
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Divider and "New Draft" button */}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => { 
                        addDraft(chapter.id); 
                        setShowDrafts(false); 
                      }}
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

        {/* ─── Focus Mode Toggle Button ──────────────────────────────────────*/}
        <button
          onClick={toggleFocusMode}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title={isEditorFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
        >
          {isEditorFocusMode ? (
            // In focus mode: show minimize icon to exit
            <Minimize2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            // Normal mode: show maximize icon to enter focus mode
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT: Text Editor & Feedback 
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          'mx-auto py-8 px-6 transition-all',
          isEditorFocusMode ? 'max-w-2xl py-16' : 'max-w-3xl'  // Wider in focus mode
        )}>
          {/* ─── Onboarding/Help Text (shown in empty draft) ────────────────── */}
          {isEmptyDraft && (
            <div className="mb-6 rounded-xl border border-border bg-background/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">How to use the editor</p>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                <p>1. Rename the chapter by double-clicking the title above.</p>
                <p>2. Draft in the editor and let autosave handle the rest.</p>
                <p>3. Open the draft menu to create alternate versions.</p>
                <p>4. Use <span className="font-medium text-foreground">Ctrl/Cmd + Shift + F</span> for focus mode.</p>
              </div>
            </div>
          )}
          
          {/* ─── Main Writing Textarea ───────────────────────────────────────── */}
          <textarea
            ref={textareaRef}
            className="chapter-editor w-full min-h-[60vh] bg-transparent resize-none text-foreground placeholder:text-muted-foreground/40"
            value={activeDraft.content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Start drafting this chapter..."
            spellCheck  // Enable browser spell-check
          />
        </div>
      </div>

      {/* ─── Focus Mode Help Text ────────────────────────────────────────────-- */}
      {isEditorFocusMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/40 animate-fade-in">
          Press Esc or hover top to exit focus mode
        </div>
      )}
    </div>
  );
}
