

# Plot-On — Improvement Plan

After reviewing the full codebase, here are the highest-impact improvements organized by category:

---

## 1. Whiteboard UX Overhaul

**Zoom & Pan canvas** — Currently the whiteboard is a fixed-size div with overflow scroll. Add proper zoom (scroll wheel) and pan (middle-click or space+drag) using CSS transforms. This is critical for a "visual plotting" tool to feel like a real infinite canvas.

**Pin resizing** — Pins are fixed-width. Allow drag-to-resize so users can make important pins larger.

**Tag management on pins** — Currently tags are read-only (set in default data only). Add a small popover on each pin to add/remove/change tag labels and colors.

**Better connection visuals** — Add arrowheads to connection lines, and a small "x" button on hover to disconnect pins without digging into menus.

---

## 2. Chapter Editor Polish

**Rich text formatting** — The editor is a plain `<textarea>`. Replace with a lightweight rich-text editor (e.g. a contentEditable div with basic Markdown shortcuts: `**bold**`, `_italic_`, `# heading`). This is the single biggest UX gap for a writing tool.

**Character & word count bar** — Add a sticky bottom bar showing word count, character count, estimated reading time, and a session timer.

**Auto-save indicator** — Show a subtle "Saved" / "Unsaved changes" badge so writers feel confident their work is preserved.

---

## 3. Sidebar & Navigation

**Drag-to-reorder chapters** — Writers constantly rearrange chapters. Add drag-and-drop reordering in the sidebar.

**Right-click context menus** — On chapters and whiteboards: rename, duplicate, delete. Currently there's no way to delete or rename whiteboards, and no way to delete chapters.

**Search / filter** — Add a quick-filter input at the top of the sidebar to search across chapter titles and pin titles.

---

## 4. Data Persistence

**localStorage save/load** — Currently all state is lost on refresh. Serialize the `book` state to localStorage on every change (debounced) and restore on mount. This is a quick win before adding a real backend.

---

## 5. Visual Polish

**Dark mode toggle** — The dark theme CSS variables are already defined but there's no toggle. Add a sun/moon button in the sidebar footer.

**Empty states** — Improve empty whiteboard and empty chapter states with illustration-style SVGs and clear CTAs.

**Keyboard shortcuts** — Add `Cmd+N` for new chapter, `Cmd+Shift+N` for new whiteboard, `Cmd+F` for focus mode. Show a shortcuts cheat sheet via `?`.

---

## Priority Order (what to build first)

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | localStorage persistence | Without this, every refresh loses work — dealbreaker |
| 2 | Tag management on pins | Core whiteboard feature is half-built |
| 3 | Dark mode toggle | Already styled, just needs a button |
| 4 | Delete/rename whiteboards & chapters | Basic CRUD is incomplete |
| 5 | Zoom & pan on canvas | Essential for the "infinite whiteboard" promise |
| 6 | Rich text editor | Biggest editor upgrade |
| 7 | Drag-to-reorder chapters | High-value polish |
| 8 | Keyboard shortcuts | Power-user delight |

---

## Technical Approach

- **localStorage**: Wrap `setBook` in BookContext to also persist via `localStorage.setItem` (debounced 500ms). Load from localStorage in `useState` initializer.
- **Dark mode**: Use `next-themes` (already installed) or a simple `document.documentElement.classList.toggle('dark')` with a React state + localStorage preference.
- **Zoom/pan**: Apply `transform: scale(zoom) translate(panX, panY)` to the canvas container, track with `onWheel` and mouse events.
- **Tag editing**: Small Popover component on pin cards with color swatches and a text input.
- **Delete/rename**: Add `deleteChapter`, `deleteWhiteboard`, `renameWhiteboard` to BookContext. Surface via context menus or inline edit icons in sidebar.

