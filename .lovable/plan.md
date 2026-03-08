

# Mobile-Optimized Sidebar + Drag-to-Move Items

## Overview
Two main changes: (1) make the sidebar responsive on mobile with a slide-out drawer and touch-friendly sizing, and (2) add long-press drag-and-drop to move items between folders.

## 1. Mobile Sidebar — Slide-out Drawer

**Problem:** The sidebar is a fixed 256px column that eats the entire mobile screen.

**Solution:**
- Use `useIsMobile()` hook in `Index.tsx`
- On mobile: hide sidebar by default, show a hamburger menu button, render sidebar inside a `Sheet` (already installed via `vaul`/radix) that slides from the left
- On desktop: keep current layout
- Add a floating menu button (top-left) on mobile to toggle the sheet
- Increase touch targets: bump sidebar item padding from `py-1.5` to `py-2.5`, increase font sizes slightly on mobile

**Files:** `src/pages/Index.tsx`, `src/components/BookSidebar.tsx`

## 2. Touch-Friendly Item Sizing

- Quick-create buttons: taller on mobile (`h-9` instead of `h-7`)
- Novel picker: larger tap area
- Sidebar items: min-height 44px (Apple HIG touch target)
- Context menu items: larger padding on mobile

## 3. Long-Press Drag to Move Between Folders

**Problem:** Moving items requires right-click > "Move to folder" submenu — impossible on mobile.

**Solution — Long-press to enter drag mode:**
- On `touchstart` / `mousedown` held for 500ms on any sidebar item → enter "dragging" state
- Show a visual indicator (item lifts with shadow, slight scale)
- As user drags over folders, highlight the drop target folder
- On drop (touchend/mouseup over a folder): call `moveToFolder()`
- On drop outside any folder: call `removeFromFolder()` (ungroup)
- Cancel on scroll or if drag didn't move enough

**State in BookSidebar:**
```typescript
const [dragging, setDragging] = useState<{
  id: string;
  type: 'whiteboard' | 'chapter';
  el: HTMLElement;
} | null>(null);
```

**Implementation approach:**
- Each sidebar item gets `onTouchStart`/`onMouseDown` → start a 500ms timer
- On timer fire: set dragging state, attach move/end listeners to document
- Track pointer position, find folder element under pointer via `document.elementFromPoint()`
- Folder elements get a `data-folder-id` attribute for detection
- On drop: if over a folder → `moveToFolder()`, else → `removeFromFolder()`
- Show a floating ghost element following the pointer during drag

## 4. Mobile Context Menu Alternative

Since right-click doesn't exist on mobile, add a `···` (more) button that appears on each item row, which opens the same context menu as a bottom sheet/popover instead of a positioned menu.

**Files:** `src/components/BookSidebar.tsx`

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Mobile layout with Sheet for sidebar, hamburger button |
| `src/components/BookSidebar.tsx` | Long-press drag, touch sizing, mobile more-button, `data-folder-id` attrs |

