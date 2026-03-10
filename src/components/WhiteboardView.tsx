import { useBook } from '@/contexts/BookContext';
import { Pin as PinType, TagColor } from '@/types/book';
import { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Plus, GripVertical, X, Link, Tag, ImagePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagEditor } from './TagEditor';

// ─── Constants ────────────────────────────────────────────────────────────────
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

// Fixed card width — keeps SVG anchors and overlap checks consistent
const PIN_W = 240;
const PIN_H = 160; // estimated card height for overlap detection
const PIN_GAP = 24;

// Minimum pointer travel before a canvas press becomes a pan (not a tap)
const PAN_THRESHOLD = 5;

// SVG is 20 000 × 20 000 placed at (-OFFSET, -OFFSET) so lines never clip
const SVG_OFFSET = 5000;

const TAG_STYLES: Record<TagColor, string> = {
  rose:     'bg-tag-rose text-tag-rose-text',
  sage:     'bg-tag-sage text-tag-sage-text',
  amber:    'bg-tag-amber text-tag-amber-text',
  lavender: 'bg-tag-lavender text-tag-lavender-text',
};

// ─── Smart pin placement ───────────────────────────────────────────────────────
/**
 * Find the nearest grid-aligned slot to `origin` (world-space) that doesn't
 * overlap any existing pin bounding box. Searches outward in a spiral.
 */
function findFreeSlot(
  origin: { x: number; y: number },
  existing: PinType[],
): { x: number; y: number } {
  const stepX = PIN_W + PIN_GAP;
  const stepY = PIN_H + PIN_GAP;

  const overlaps = (cx: number, cy: number) =>
    existing.some(
      p =>
        cx < p.x + PIN_W + PIN_GAP &&
        cx + PIN_W + PIN_GAP > p.x &&
        cy < p.y + PIN_H + PIN_GAP &&
        cy + PIN_H + PIN_GAP > p.y,
    );

  if (!overlaps(origin.x, origin.y)) return origin;

  for (let ring = 1; ring <= 12; ring++) {
    for (let col = -ring; col <= ring; col++) {
      for (let row = -ring; row <= ring; row++) {
        if (Math.abs(col) !== ring && Math.abs(row) !== ring) continue; // perimeter only
        const x = origin.x + col * stepX;
        const y = origin.y + row * stepY;
        if (!overlaps(x, y)) return { x, y };
      }
    }
  }

  return { x: origin.x + stepX * 2, y: origin.y + stepY * 2 };
}

// ─── PinCard ──────────────────────────────────────────────────────────────────
const PinCard = memo(function PinCard({
  pin,
  whiteboardId,
  isSelected,
  isConnecting,
  onSelect,
  onStartConnect,
  onDragStart,
}: {
  pin: PinType;
  whiteboardId: string;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: (id: string) => void;
  onStartConnect: (id: string) => void;
  onDragStart: (id: string, e: React.PointerEvent) => void;
}) {
  const { updatePin, deletePin, updatePinTags } = useBook();
  const [editingField, setEditingField] = useState<'title' | 'content' | null>(null);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [title, setTitle] = useState(pin.title);
  const [content, setContent] = useState(pin.content);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitle(pin.title); }, [pin.title]);
  useEffect(() => { setContent(pin.content); }, [pin.content]);
  useEffect(() => { setEditingField(null); }, [pin.id]);

  const handleSave = useCallback(() => {
    updatePin(whiteboardId, { ...pin, title, content });
    setEditingField(null);
  }, [updatePin, whiteboardId, pin, title, content]);

  const cancelEditing = useCallback(() => {
    setTitle(pin.title);
    setContent(pin.content);
    setEditingField(null);
  }, [pin.title, pin.content]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      updatePin(whiteboardId, { ...pin, imageUrl: reader.result });
      setShowImageInput(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      data-pin-id={pin.id}
      className={cn(
        'absolute bg-pin-bg border rounded-lg shadow-sm select-none',
        'w-[240px]',
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-pin-border hover:shadow-md',
        isConnecting && 'ring-2 ring-connection/40',
      )}
      style={{ left: pin.x, top: pin.y, willChange: 'transform', touchAction: 'none' }}
      onClick={e => { e.stopPropagation(); onSelect(pin.id); }}
      onPointerDown={e => {
        if (editingField) return;
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        onDragStart(pin.id, e);
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-1 p-3 pb-1">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          {editingField === 'title' ? (
            <input
              className="no-drag w-full text-sm font-semibold bg-transparent border-b border-border outline-none font-display"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') cancelEditing();
                e.stopPropagation();
              }}
              onPointerDown={e => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <h3
              className="no-drag text-sm font-semibold font-display truncate cursor-text"
              onPointerDown={e => e.stopPropagation()}
              onDoubleClick={e => {
                e.stopPropagation();
                onSelect(pin.id);
                setEditingField('title');
              }}
            >
              {pin.title}
            </h3>
          )}
        </div>

        <div className="flex gap-0.5 shrink-0 no-drag">
          <button onClick={e => { e.stopPropagation(); setShowTagEditor(v => !v); }}
            className="no-edit p-1 rounded hover:bg-muted transition-colors" title="Edit tags">
            <Tag className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={e => { e.stopPropagation(); setShowImageInput(v => !v); }}
            className="no-edit p-1 rounded hover:bg-muted transition-colors" title="Attach image">
            <ImagePlus className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={e => { e.stopPropagation(); onStartConnect(pin.id); }}
            className="no-edit p-1 rounded hover:bg-muted transition-colors" title="Connect pins">
            <Link className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={e => { e.stopPropagation(); deletePin(whiteboardId, pin.id); }}
            className="no-edit p-1 rounded hover:bg-destructive/10 transition-colors">
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {showTagEditor && (
        <div className="relative px-3 no-drag">
          <TagEditor
            tags={pin.tags}
            onChange={tags => updatePinTags(whiteboardId, pin.id, tags)}
            onClose={() => setShowTagEditor(false)}
          />
        </div>
      )}

      {showImageInput && (
        <div className="px-3 pb-1 no-drag">
          <div className="flex items-center gap-2">
            <input ref={imageInputRef} type="file" accept="image/*"
              className="hidden" onChange={handleImageUpload} />
            <button
              onClick={e => { e.stopPropagation(); imageInputRef.current?.click(); }}
              className="flex-1 text-[10px] border border-border rounded px-2 py-1.5 text-left hover:bg-muted transition-colors"
            >
              {pin.imageUrl ? 'Replace image' : 'Upload image'}
            </button>
            {pin.imageUrl && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  updatePin(whiteboardId, { ...pin, imageUrl: undefined });
                  setShowImageInput(false);
                }}
                className="p-1 rounded hover:bg-destructive/10 transition-colors" title="Remove">
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Upload from device.</p>
        </div>
      )}

      {pin.imageUrl && (
        <div className="px-3 pb-1">
          <img src={pin.imageUrl} alt={pin.title}
            className="w-full h-24 object-cover rounded border border-border"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}

      {/* Content */}
      <div className="px-3 pb-2">
        {editingField === 'content' ? (
          <textarea
            className="no-drag w-full text-xs text-muted-foreground bg-transparent border border-border rounded p-1 outline-none resize-none font-body"
            value={content}
            onChange={e => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) handleSave();
              if (e.key === 'Escape') cancelEditing();
              e.stopPropagation();
            }}
            onPointerDown={e => e.stopPropagation()}
            rows={3}
            autoFocus
          />
        ) : (
          <p
            className="no-drag text-xs text-muted-foreground line-clamp-3 cursor-text"
            onPointerDown={e => e.stopPropagation()}
            onDoubleClick={e => {
              e.stopPropagation();
              onSelect(pin.id);
              setEditingField('content');
            }}
          >
            {pin.content || 'Double-click to edit…'}
          </p>
        )}
      </div>

      {pin.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-3">
          {pin.tags.map(tag => (
            <span key={tag.id}
              className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', TAG_STYLES[tag.color])}>
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── WhiteboardView ───────────────────────────────────────────────────────────
export function WhiteboardView() {
  const { book, activeWhiteboardId, addPin, updatePin, connectPins, disconnectPins } = useBook();
  const whiteboard = book.whiteboards.find(wb => wb.id === activeWhiteboardId);

  const canvasRef    = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);

  const [selectedPin,   setSelectedPin]   = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [displayZoom,   setDisplayZoom]   = useState(100);

  // ── Transform state (refs — no re-render per frame) ───────────────────────
  const zoomRef = useRef(1);
  const panRef  = useRef({ x: 0, y: 0 });
  const rafRef  = useRef(0);

  // ── Pin drag ──────────────────────────────────────────────────────────────
  const dragRef = useRef<{
    pinId:     string;
    offsetX:   number;   // world-space: pointer − pin.x at drag start
    offsetY:   number;
    currentX:  number;   // live world-space pin position during drag
    currentY:  number;
    pointerId: number;
  } | null>(null);

  // ── Canvas pan ────────────────────────────────────────────────────────────
  const panStateRef = useRef<{
    pointerId:    number;
    startClientX: number;
    startClientY: number;
    startPanX:    number;
    startPanY:    number;
    moved:        boolean; // true once pointer exceeds PAN_THRESHOLD
  } | null>(null);

  // ── Space-key pan ─────────────────────────────────────────────────────────
  const spaceHeldRef = useRef(false);

  // ── Multi-touch: pointerId → last known client position ──────────────────
  const touchMapRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  // ── Pinch state ───────────────────────────────────────────────────────────
  const pinchRef = useRef<{
    id1:  number;
    id2:  number;
    dist: number;  // distance between fingers at last frame
    midX: number;  // canvas-local midpoint at last frame
    midY: number;
  } | null>(null);

  // ── Core helpers ──────────────────────────────────────────────────────────

  const applyTransform = useCallback(() => {
    if (!transformRef.current) return;
    transformRef.current.style.transform =
      `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomRef.current})`;
  }, []);

  /**
   * Convert client coords → canvas-element-local coords.
   * Always use this before localToWorld so we aren't mixing coord spaces.
   */
  const clientToLocal = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  /**
   * Canvas-local → world space (accounts for current pan + zoom).
   */
  const localToWorld = useCallback((localX: number, localY: number) => ({
    x: (localX - panRef.current.x) / zoomRef.current,
    y: (localY - panRef.current.y) / zoomRef.current,
  }), []);

  /**
   * Zoom toward a canvas-local focal point.
   * Keeps the world-space point under `localFocusX/Y` stationary on screen.
   */
  const applyZoom = useCallback(
    (nextZoom: number, localFocusX: number, localFocusY: number) => {
      const prev = zoomRef.current;
      nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom));
      if (nextZoom === prev) return;

      const worldX = (localFocusX - panRef.current.x) / prev;
      const worldY = (localFocusY - panRef.current.y) / prev;
      zoomRef.current = nextZoom;
      panRef.current  = {
        x: localFocusX - worldX * nextZoom,
        y: localFocusY - worldY * nextZoom,
      };

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        applyTransform();
        setDisplayZoom(Math.round(nextZoom * 100));
      });
    },
    [applyTransform],
  );

  /**
   * Returns the viewport centre in world space.
   *
   * FIX: Uses canvas element's own offsetWidth/Height — not clientX/Y and not
   * window dimensions — so it is correct at any pan/zoom level.
   */
  const viewportCentreWorld = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    return localToWorld(el.offsetWidth / 2, el.offsetHeight / 2);
  }, [localToWorld]);

  // ── Add pin with smart placement ──────────────────────────────────────────
  const handleAddPin = useCallback(() => {
    if (!whiteboard) return;

    const centre = viewportCentreWorld();

    // Snap to grid so cards align nicely with each other
    const stepX = PIN_W + PIN_GAP;
    const stepY = PIN_H + PIN_GAP;
    const snapped = {
      x: Math.round(centre.x / stepX) * stepX,
      y: Math.round(centre.y / stepY) * stepY,
    };

    const slot = findFreeSlot(snapped, whiteboard.pins);

    addPin(whiteboard.id, {
      id:          `pin-${Date.now()}`,
      x:           slot.x,
      y:           slot.y,
      title:       'New Pin',
      content:     '',
      tags:        [],
      connections: [],
    });
  }, [whiteboard, addPin, viewportCentreWorld]);

  // ── Pin drag start ────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (pinId: string, e: React.PointerEvent) => {
      if (!whiteboard) return;
      // Two or more fingers on screen → treat as pan/pinch, not pin drag
      if (touchMapRef.current.size >= 2) return;

      const pin = whiteboard.pins.find(p => p.id === pinId);
      if (!pin) return;

      e.preventDefault();
      e.stopPropagation();
      // Capture so pointermove/up fire even if pointer leaves the element
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const local = clientToLocal(e.clientX, e.clientY);
      const world = localToWorld(local.x, local.y);

      dragRef.current = {
        pinId,
        offsetX:   world.x - pin.x,
        offsetY:   world.y - pin.y,
        currentX:  pin.x,
        currentY:  pin.y,
        pointerId: e.pointerId,
      };

      touchMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    },
    [whiteboard, clientToLocal, localToWorld],
  );

  // ── Canvas pointer-down ───────────────────────────────────────────────────
  /**
   * Interaction model (Figma / Miro style):
   *
   * Mouse
   *   Left-drag on empty canvas  → pan
   *   Middle-drag                → pan
   *   Left-click (no movement)   → deselect / cancel connect
   *   Space + any drag           → pan (handled in pointermove)
   *
   * Touch
   *   1-finger drag on canvas    → pan
   *   1-finger tap (no movement) → deselect
   *   2-finger drag              → pan (midpoint)
   *   2-finger pinch             → zoom
   *   Finger on pin → drag pin   (handled by PinCard.onPointerDown)
   */
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const isCanvasBg = e.target === e.currentTarget;
      touchMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // ── Second touch arriving: start pinch tracking ──
      if (e.pointerType === 'touch' && touchMapRef.current.size === 2) {
        const ids  = Array.from(touchMapRef.current.keys());
        const p1   = touchMapRef.current.get(ids[0])!;
        const p2   = touchMapRef.current.get(ids[1])!;
        const rect = canvasRef.current!.getBoundingClientRect();
        pinchRef.current = {
          id1:  ids[0],
          id2:  ids[1],
          dist: Math.hypot(p2.x - p1.x, p2.y - p1.y),
          midX: (p1.x + p2.x) / 2 - rect.left,
          midY: (p1.y + p2.y) / 2 - rect.top,
        };
        // Second finger cancels any active single-finger pan or pin drag
        panStateRef.current = null;
        dragRef.current     = null;
        return;
      }

      // Only start a canvas-level pan when touching bare canvas
      if (!isCanvasBg) return;

      // Ignore right-click
      if (e.pointerType === 'mouse' && e.button === 2) return;

      panStateRef.current = {
        pointerId:    e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX:    panRef.current.x,
        startPanY:    panRef.current.y,
        moved:        false,
      };
    },
    [],
  );

  // ── Global pointer move / up ──────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      touchMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // ── Pinch-to-zoom + two-finger pan ──
      const pinch = pinchRef.current;
      if (pinch && touchMapRef.current.size >= 2) {
        const p1 = touchMapRef.current.get(pinch.id1);
        const p2 = touchMapRef.current.get(pinch.id2);
        if (p1 && p2) {
          const rect    = canvasRef.current?.getBoundingClientRect();
          const newDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const newMidX = (p1.x + p2.x) / 2 - (rect?.left ?? 0);
          const newMidY = (p1.y + p2.y) / 2 - (rect?.top  ?? 0);

          // Zoom toward the finger midpoint
          applyZoom(zoomRef.current * (newDist / pinch.dist), newMidX, newMidY);

          // Two-finger pan: shift by midpoint delta
          panRef.current = {
            x: panRef.current.x + (newMidX - pinch.midX),
            y: panRef.current.y + (newMidY - pinch.midY),
          };
          pinchRef.current = { ...pinch, dist: newDist, midX: newMidX, midY: newMidY };

          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(applyTransform);
        }
        return; // don't fall into single-finger logic
      }

      // ── Pin drag ──
      const drag = dragRef.current;
      if (drag && e.pointerId === drag.pointerId) {
        const local = clientToLocal(e.clientX, e.clientY);
        const world = localToWorld(local.x, local.y);
        const newX  = world.x - drag.offsetX;
        const newY  = world.y - drag.offsetY;

        // Move DOM element directly — no React re-render during drag
        const el = canvasRef.current?.querySelector(
          `[data-pin-id="${drag.pinId}"]`,
        ) as HTMLElement | null;
        if (el) { el.style.left = `${newX}px`; el.style.top = `${newY}px`; }

        // Update connection lines in real time
        updateDragLines(canvasRef.current, drag.pinId, newX, newY);

        drag.currentX = newX;
        drag.currentY = newY;
        return;
      }

      // ── Canvas pan ──
      const ps = panStateRef.current;
      if (!ps || e.pointerId !== ps.pointerId) return;

      const dx = e.clientX - ps.startClientX;
      const dy = e.clientY - ps.startClientY;
      if (!ps.moved && Math.hypot(dx, dy) < PAN_THRESHOLD) return;
      ps.moved = true;

      panRef.current = { x: ps.startPanX + dx, y: ps.startPanY + dy };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(applyTransform);
    };

    const onUp = (e: PointerEvent) => {
      touchMapRef.current.delete(e.pointerId);

      // Finger lifting off a pinch
      if (
        pinchRef.current &&
        (e.pointerId === pinchRef.current.id1 || e.pointerId === pinchRef.current.id2)
      ) {
        pinchRef.current    = null;
        panStateRef.current = null;
        return;
      }

      // Persist pin position
      const drag = dragRef.current;
      if (drag && e.pointerId === drag.pointerId && whiteboard) {
        const pin = whiteboard.pins.find(p => p.id === drag.pinId);
        if (pin && (pin.x !== drag.currentX || pin.y !== drag.currentY)) {
          updatePin(whiteboard.id, { ...pin, x: drag.currentX, y: drag.currentY });
        }
        dragRef.current = null;
      }

      // End canvas pan
      const ps = panStateRef.current;
      if (ps && e.pointerId === ps.pointerId) {
        // Tap with no movement → deselect / cancel connect
        if (!ps.moved) {
          setSelectedPin(null);
          setConnectingFrom(null);
        }
        panStateRef.current = null;
        if (canvasRef.current && !spaceHeldRef.current) {
          canvasRef.current.style.cursor = '';
        }
      }
    };

    window.addEventListener('pointermove',  onMove);
    window.addEventListener('pointerup',    onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove',  onMove);
      window.removeEventListener('pointerup',    onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [whiteboard, updatePin, applyTransform, applyZoom, clientToLocal, localToWorld]);

  // ── Scroll / trackpad zoom ────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const local = clientToLocal(e.clientX, e.clientY);
      // deltaMode 0 = pixels (trackpad smooth) | 1 = lines (mouse wheel)
      if (e.deltaMode === 0) {
        applyZoom(zoomRef.current * (1 - e.deltaY * 0.004), local.x, local.y);
      } else {
        applyZoom(zoomRef.current + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), local.x, local.y);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom, clientToLocal]);

  // ── Spacebar pan ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(tag)) {
        e.preventDefault();
        spaceHeldRef.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  // ── Pin select / connect ──────────────────────────────────────────────────
  const handlePinSelect = useCallback(
    (pinId: string) => {
      if (connectingFrom && connectingFrom !== pinId && whiteboard) {
        connectPins(whiteboard.id, connectingFrom, pinId);
        setConnectingFrom(null);
        return;
      }
      setSelectedPin(pinId);
    },
    [connectingFrom, whiteboard, connectPins],
  );

  const handleResetView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current  = { x: 0, y: 0 };
    applyTransform();
    setDisplayZoom(100);
    if (canvasRef.current) canvasRef.current.style.cursor = '';
  }, [applyTransform]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!whiteboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg">
        <p className="text-muted-foreground">Select a whiteboard</p>
      </div>
    );
  }

  // Deduplicated connection lines
  const lines: { from: PinType; to: PinType; key: string }[] = [];
  const seen = new Set<string>();
  whiteboard.pins.forEach(pin =>
    pin.connections.forEach(connId => {
      const pairKey = [pin.id, connId].sort().join('-');
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        const target = whiteboard.pins.find(p => p.id === connId);
        if (target) lines.push({ from: pin, to: target, key: pairKey });
      }
    }),
  );

  return (
    <div className="flex-1 flex flex-col bg-canvas-bg overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
        <div>
          <h2 className="font-display text-lg font-semibold">{whiteboard.name}</h2>
          <p className="text-xs text-muted-foreground">
            {whiteboard.pins.length} pins · {displayZoom}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetView}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded transition-colors"
          >
            Reset view
          </button>
          <button
            onClick={handleAddPin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Pin
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        className="flex-1 relative canvas-grid overflow-hidden"
        style={{ touchAction: 'none' }}
        onPointerDown={handleCanvasPointerDown}
      >
        {/* Empty-board guide */}
        {whiteboard.pins.length === 0 && !connectingFrom && (
          <div className="absolute left-1/2 top-1/2 z-10 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background/95 p-5 shadow-lg backdrop-blur pointer-events-none">
            <p className="text-sm font-semibold">How to use the storyboard</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add pins for scenes, characters, or notes. Drag them freely, then link related pins to map your story flow.
            </p>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <p>1. <span className="font-medium text-foreground">Add Pin</span> — placed automatically in a free slot.</p>
              <p>2. <span className="font-medium text-foreground">Double-click</span> a pin's title or body to edit it.</p>
              <p>3. Use the <span className="font-medium text-foreground">link icon</span> on a pin to connect two pins.</p>
              <p>4. <span className="font-medium text-foreground">Drag</span> empty canvas to pan · <span className="font-medium text-foreground">Scroll / pinch</span> to zoom · <span className="font-medium text-foreground">Space + drag</span> · <span className="font-medium text-foreground">Middle-mouse</span>.</p>
            </div>
          </div>
        )}

        {/* Connect-mode banner */}
        {connectingFrom && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
            Click another pin to connect · Click canvas to cancel
          </div>
        )}

        {/* Hint strip */}
        <div className="absolute bottom-3 right-3 z-10 text-[10px] text-muted-foreground/40 text-right leading-relaxed pointer-events-none">
          Drag canvas to pan · Scroll / pinch to zoom · Space + drag · Middle-mouse
        </div>

        {/* ── Transform layer ── */}
        <div
          ref={transformRef}
          style={{
            transform:       `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomRef.current})`,
            transformOrigin: '0 0',
            position:        'relative',
            willChange:      'transform',
          }}
        >
          {/*
            SVG connection lines.
            20 000 × 20 000 at (-SVG_OFFSET, -SVG_OFFSET) so lines never clip
            no matter how far pins are moved. All coordinates are offset by
            SVG_OFFSET to compensate for the SVG's own position.
          */}
          <svg
            style={{
              position:      'absolute',
              left:          -SVG_OFFSET,
              top:           -SVG_OFFSET,
              width:          SVG_OFFSET * 4,
              height:         SVG_OFFSET * 4,
              pointerEvents: 'none',
              overflow:      'visible',
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6"
                refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--connection-line))" />
              </marker>
            </defs>

            {lines.map(({ from, to, key }) => {
              const half = PIN_W / 2;
              const x1   = from.x + half + SVG_OFFSET;
              const y1   = from.y + 40   + SVG_OFFSET;
              const x2   = to.x   + half + SVG_OFFSET;
              const y2   = to.y   + 40   + SVG_OFFSET;
              const mx   = (x1 + x2) / 2;
              const d    = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;

              return (
                <g key={key} data-conn-from={from.id} data-conn-to={to.id}>
                  <path d={d} className="connection-line" markerEnd="url(#arrowhead)" />
                  {/* Wide invisible hit-target */}
                  <path
                    d={d}
                    stroke="transparent" strokeWidth="14" fill="none"
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={e => {
                      e.stopPropagation();
                      disconnectPins(whiteboard.id, from.id, to.id);
                    }}
                  >
                    <title>Click to disconnect</title>
                  </path>
                </g>
              );
            })}
          </svg>

          {/* Pin cards */}
          {whiteboard.pins.map(pin => (
            <PinCard
              key={pin.id}
              pin={pin}
              whiteboardId={whiteboard.id}
              isSelected={selectedPin    === pin.id}
              isConnecting={connectingFrom === pin.id}
              onSelect={handlePinSelect}
              onStartConnect={setConnectingFrom}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers (module-level, no closure over React state) ──────────────────────

/**
 * Update all SVG connection lines that touch `pinId` during a drag.
 * Called from pointermove — must be fast and allocation-light.
 */
function updateDragLines(
  canvas: HTMLDivElement | null,
  pinId: string,
  newX: number,
  newY: number,
) {
  if (!canvas) return;
  const half   = PIN_W / 2;
  const OFFSET = SVG_OFFSET;

  canvas
    .querySelectorAll(`[data-conn-from="${pinId}"],[data-conn-to="${pinId}"]`)
    .forEach(g => {
      const fromId = g.getAttribute('data-conn-from')!;
      const toId   = g.getAttribute('data-conn-to')!;
      const isFrom = fromId === pinId;

      let fx: number, fy: number, tx: number, ty: number;

      if (isFrom) {
        fx = newX + half; fy = newY + 40;
        const toEl = canvas.querySelector(`[data-pin-id="${toId}"]`) as HTMLElement | null;
        if (!toEl) return;
        tx = parseFloat(toEl.style.left) + half;
        ty = parseFloat(toEl.style.top)  + 40;
      } else {
        tx = newX + half; ty = newY + 40;
        const fromEl = canvas.querySelector(`[data-pin-id="${fromId}"]`) as HTMLElement | null;
        if (!fromEl) return;
        fx = parseFloat(fromEl.style.left) + half;
        fy = parseFloat(fromEl.style.top)  + 40;
      }

      const ax = fx + OFFSET, ay = fy + OFFSET;
      const bx = tx + OFFSET, by = ty + OFFSET;
      const mx = (ax + bx) / 2;
      const d  = `M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
      g.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    });
}