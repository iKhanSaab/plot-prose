

# Plot-On — Current State & What's Missing

## What You Have Now
- Multi-novel library with switching, rename, delete
- Folders to organize whiteboards and chapters
- Whiteboard with pins, connections, tags, zoom/pan
- Chapter editor with drafts, focus mode, word count
- Dark mode, mobile sidebar drawer, long-press drag-to-folder
- localStorage persistence with migration

---

## What's Missing — Organized by Priority

### 1. Export & Backup
- **Export novel** as JSON / plain text / Markdown — no way to get data out currently
- **Import novel** from JSON backup
- **Export chapter** as .txt / .md / .docx

### 2. Search
- **Global search** across chapters, whiteboards, pins, and folders — currently no way to find anything by name or content
- **Filter pins by tag** on whiteboard

### 3. Chapter Editor Improvements
- **Rich text editing** — currently a plain `<textarea>`, no bold/italic/headings
- **Auto-save indicator** — no visual feedback that work is saved
- **Character count** alongside word count
- **Chapter reordering** — `order` field exists but no drag-to-reorder UI
- **Delete/rename drafts** — can add drafts but can't delete or rename them
- **Compare drafts** side-by-side

### 4. Whiteboard Improvements
- **Pin colors/categories** — pins all look the same, no visual grouping
- **Pin images/attachments** — only text content currently
- **Minimap** — large whiteboards have no overview
- **Touch support for whiteboard** — pan/zoom/drag pins doesn't work on mobile (mouse-only events)
- **Pin resize** — fixed width, no way to make a pin larger
- **Snap to grid** option

### 5. Sidebar & Navigation
- **Reorder folders/chapters/whiteboards** — drag to change order, not just move between folders
- **Nested folders** — only one level deep currently
- **Collapse/expand all folders** shortcut
- **Item count badges** on folders (word count totals)

### 6. Novel-Level Features
- **Novel metadata** — genre, synopsis, target word count, cover image
- **Progress tracking** — word count goals, daily writing stats
- **Timeline/outline view** — a linear view of chapters with summaries
- **Character database** — dedicated character sheets beyond whiteboard pins

### 7. Data & Sync
- **Cloud sync** (Supabase) — everything is localStorage only, one browser, one device
- **Undo/redo** — no history for any action
- **Conflict resolution** if localStorage gets corrupted
- **Auto-backup** to download periodically

### 8. UI/UX Polish
- **Keyboard shortcuts reference** — shortcuts exist (Ctrl+N, Ctrl+Shift+N, Ctrl+Shift+F) but no discoverable help
- **Onboarding/tutorial** for first-time users
- **Empty states** — whiteboard with no pins, novel with no chapters could guide users better
- **Confirmation dialogs** before deleting novels, folders, chapters (currently instant delete)
- **Toast notifications** for actions (created, deleted, moved)
- **Breadcrumbs** showing current location (Novel > Folder > Chapter)

### 9. Collaboration (Advanced)
- **Share novel** as read-only link
- **Comments/annotations** on chapters
- **Version history** with restore

### 10. Writing Tools
- **Distraction-free writing mode** — focus mode exists but could add typewriter scrolling, ambient sounds toggle
- **Writing prompts/AI assist** — generate ideas, suggest continuations
- **Spell check highlights** — browser spellcheck is on but no grammar tools
- **Reading time estimate**
- **Markdown preview** for chapters

---

## Quick Wins (small effort, high impact)
1. Confirmation dialogs before delete
2. Toast notifications for CRUD actions
3. Keyboard shortcuts help modal
4. Auto-save indicator in editor
5. Export novel as JSON

## Biggest Gaps
1. No search at all
2. No export/import
3. No undo/redo
4. No cloud sync (single device only)
5. Plain textarea editor (no formatting)

