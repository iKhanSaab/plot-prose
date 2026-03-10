import { useBook } from '@/contexts/BookContext';
import { Pin as PinType, TagColor } from '@/types/book';
import { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Plus, GripVertical, X, Link, Tag, ImagePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagEditor } from './TagEditor';

const TAG_STYLES: Record<TagColor, string> = {
  rose: 'bg-tag-rose text-tag-rose-text',
  sage: 'bg-tag-sage text-tag-sage-text',
  amber: 'bg-tag-amber text-tag-amber-text',
  lavender: 'bg-tag-lavender text-tag-lavender-text',
};

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
  onDragStart: (id: string, e: React.MouseEvent) => void;
}) {
  const { updatePin, deletePin, updatePinTags } = useBook();
  const [isEditing, setIsEditing] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [title, setTitle] = useState(pin.title);
  const [content, setContent] = useState(pin.content);
  const [imageUrl, setImageUrl] = useState(pin.imageUrl || '');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTitle(pin.title); }, [pin.title]);
  useEffect(() => { setContent(pin.content); }, [pin.content]);
  useEffect(() => { setImageUrl(pin.imageUrl || ''); }, [pin.imageUrl]);

  const handleSave = () => {
    updatePin(whiteboardId, { ...pin, title, content });
    setIsEditing(false);
  };

  return (
    <div
      ref={cardRef}
      data-pin-id={pin.id}
      className={cn(
        'absolute bg-pin-bg border rounded-lg shadow-sm transition-shadow cursor-grab active:cursor-grabbing',
        'min-w-[200px] max-w-[280px]',
        isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-pin-border hover:shadow-md',
        isConnecting && 'ring-2 ring-connection/40'
      )}
      style={{ left: pin.x, top: pin.y, willChange: 'transform' }}
      onClick={(e) => { e.stopPropagation(); onSelect(pin.id); }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        onDragStart(pin.id, e);
      }}
    >
      <div className="flex items-start gap-1 p-3 pb-1">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              className="no-drag w-full text-sm font-semibold bg-transparent border-b border-border outline-none font-display"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          ) : (
            <h3
              className="text-sm font-semibold font-display truncate cursor-text"
              onDoubleClick={() => setIsEditing(true)}
            >
              {pin.title}
            </h3>
          )}
        </div>
        <div className="flex gap-0.5 shrink-0 no-drag">
          <button
            onClick={(e) => { e.stopPropagation(); setShowTagEditor(!showTagEditor); }}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Edit tags"
          >
            <Tag className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowImageInput(!showImageInput); }}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Attach image"
          >
            <ImagePlus className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onStartConnect(pin.id); }}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Connect to another pin"
          >
            <Link className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deletePin(whiteboardId, pin.id); }}
            className="p-1 rounded hover:bg-destructive/10 transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {showTagEditor && (
        <div className="relative px-3">
          <TagEditor
            tags={pin.tags}
            onChange={(tags) => updatePinTags(whiteboardId, pin.id, tags)}
            onClose={() => setShowTagEditor(false)}
          />
        </div>
      )}

      {showImageInput && (
        <div className="px-3 pb-1 no-drag">
          <div className="flex items-center gap-1">
            <input
              className="flex-1 text-[10px] bg-transparent border border-border rounded px-1.5 py-1 outline-none placeholder:text-muted-foreground/50"
              placeholder="Paste image URL..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  updatePin(whiteboardId, { ...pin, imageUrl: imageUrl.trim() || undefined });
                  setShowImageInput(false);
                }
              }}
            />
            {pin.imageUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageUrl('');
                  updatePin(whiteboardId, { ...pin, imageUrl: undefined });
                  setShowImageInput(false);
                }}
                className="p-0.5 rounded hover:bg-destructive/10 transition-colors"
                title="Remove image"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        </div>
      )}

      {pin.imageUrl && (
        <div className="px-3 pb-1">
          <img
            src={pin.imageUrl}
            alt={pin.title}
            className="w-full h-24 object-cover rounded border border-border"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="px-3 pb-2">
        {isEditing ? (
          <textarea
            className="no-drag w-full text-xs text-muted-foreground bg-transparent border border-border rounded p-1 outline-none resize-none font-body"
            value={content}
            onChange={e => setContent(e.target.value)}
            onBlur={handleSave}
            rows={3}
          />
        ) : (
          <p
            className="text-xs text-muted-foreground line-clamp-3 cursor-text"
            onDoubleClick={() => setIsEditing(true)}
          >
            {pin.content || 'Double-click to edit...'}
          </p>
        )}
      </div>

      {pin.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-3">
          {pin.tags.map(tag => (
            <span
              key={tag.id}
              className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', TAG_STYLES[tag.color])}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export function WhiteboardView() {
  const { book, activeWhiteboardId, addPin, updatePin, connectPins, disconnectPins } = useBook();
  const whiteboard = book.whiteboards.find(wb => wb.id === activeWhiteboardId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const dragRef = useRef<{ pinId: string; offsetX: number; offsetY: number; startX: number; startY: number } | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const rafRef = useRef<number>(0);

  const [displayZoom, setDisplayZoom] = useState(100);

  const applyTransform = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomRef.current})`;
    }
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (connectingFrom) {
      setConnectingFrom(null);
      return;
    }
    setSelectedPin(null);
  }, [connectingFrom]);

  const handleAddPin = useCallback(() => {
    if (!whiteboard) return;
    const newPin: PinType = {
      id: `pin-${Date.now()}`,
      x: (-panRef.current.x + 300) / zoomRef.current + Math.random() * 200,
      y: (-panRef.current.y + 200) / zoomRef.current + Math.random() * 150,
      title: 'New Pin',
      content: '',
      tags: [],
      connections: [],
    };
    addPin(whiteboard.id, newPin);
  }, [whiteboard, addPin]);

  const handleDragStart = useCallback((pinId: string, e: React.MouseEvent) => {
    if (!whiteboard || isPanningRef.current) return;
    const pin = whiteboard.pins.find(p => p.id === pinId);
    if (!pin) return;
    dragRef.current = {
      pinId,
      offsetX: e.clientX / zoomRef.current - pin.x,
      offsetY: e.clientY / zoomRef.current - pin.y,
      startX: pin.x,
      startY: pin.y,
    };
  }, [whiteboard]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current) {
        panRef.current = {
          x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
          y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
        };
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(applyTransform);
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      const newX = Math.max(0, e.clientX / zoomRef.current - drag.offsetX);
      const newY = Math.max(0, e.clientY / zoomRef.current - drag.offsetY);

      const el = canvas.querySelector(`[data-pin-id="${drag.pinId}"]`) as HTMLElement;
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }

      const svgLines = canvas.querySelectorAll(`[data-conn-from="${drag.pinId}"], [data-conn-to="${drag.pinId}"]`);
      svgLines.forEach(line => {
        const fromId = line.getAttribute('data-conn-from')!;
        const toId = line.getAttribute('data-conn-to')!;
        const isFrom = fromId === drag.pinId;

        let fx: number;
        let fy: number;
        let tx: number;
        let ty: number;

        if (isFrom) {
          fx = newX + 100;
          fy = newY + 40;
          const toEl = canvas.querySelector(`[data-pin-id="${toId}"]`) as HTMLElement;
          if (!toEl) return;
          tx = parseFloat(toEl.style.left) + 100;
          ty = parseFloat(toEl.style.top) + 40;
        } else {
          tx = newX + 100;
          ty = newY + 40;
          const fromEl = canvas.querySelector(`[data-pin-id="${fromId}"]`) as HTMLElement;
          if (!fromEl) return;
          fx = parseFloat(fromEl.style.left) + 100;
          fy = parseFloat(fromEl.style.top) + 40;
        }

        const mx = (fx + tx) / 2;
        const d = `M ${fx} ${fy} C ${mx} ${fy}, ${mx} ${ty}, ${tx} ${ty}`;
        const paths = line.querySelectorAll('path');
        paths.forEach(p => p.setAttribute('d', d));
      });

      drag.startX = newX;
      drag.startY = newY;
    };

    const handleMouseUp = () => {
      const drag = dragRef.current;
      if (drag && whiteboard) {
        const pin = whiteboard.pins.find(p => p.id === drag.pinId);
        if (pin && (pin.x !== drag.startX || pin.y !== drag.startY)) {
          updatePin(whiteboard.id, { ...pin, x: drag.startX, y: drag.startY });
        }
      }
      dragRef.current = null;
      if (isPanningRef.current) {
        isPanningRef.current = false;
        canvas.style.cursor = '';
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [whiteboard, updatePin, applyTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomRef.current = Math.min(3, Math.max(0.25, zoomRef.current + delta));
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        applyTransform();
        setDisplayZoom(Math.round(zoomRef.current * 100));
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [applyTransform]);

  const handleMiddleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      isPanningRef.current = true;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: panRef.current.x, panY: panRef.current.y };
    }
  }, []);

  const handlePinSelect = useCallback((pinId: string) => {
    if (connectingFrom && connectingFrom !== pinId && whiteboard) {
      connectPins(whiteboard.id, connectingFrom, pinId);
      setConnectingFrom(null);
      return;
    }
    setSelectedPin(pinId);
  }, [connectingFrom, whiteboard, connectPins]);

  const handleStartConnect = useCallback((pinId: string) => {
    setConnectingFrom(pinId);
  }, []);

  const handleResetView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    applyTransform();
    setDisplayZoom(100);
  }, [applyTransform]);

  if (!whiteboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg">
        <p className="text-muted-foreground">Select a whiteboard</p>
      </div>
    );
  }

  const lines: { from: PinType; to: PinType; key: string }[] = [];
  const seen = new Set<string>();
  whiteboard.pins.forEach(pin => {
    pin.connections.forEach(connId => {
      const pairKey = [pin.id, connId].sort().join('-');
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        const target = whiteboard.pins.find(p => p.id === connId);
        if (target) lines.push({ from: pin, to: target, key: pairKey });
      }
    });
  });

  return (
    <div className="flex-1 flex flex-col bg-canvas-bg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
        <div>
          <h2 className="font-display text-lg font-semibold">{whiteboard.name}</h2>
          <p className="text-xs text-muted-foreground">{whiteboard.pins.length} pins - {displayZoom}%</p>
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

      <div
        ref={canvasRef}
        className="flex-1 relative canvas-grid overflow-hidden"
        onClick={handleCanvasClick}
        onMouseDown={handleMiddleMouseDown}
      >
        {connectingFrom && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg animate-fade-in">
            Click another pin to connect - Click canvas to cancel
          </div>
        )}

        <div className="absolute bottom-3 right-3 z-10 text-[10px] text-muted-foreground/50">
          Scroll to zoom - Alt+drag to pan
        </div>

        <div
          ref={transformRef}
          style={{
            transform: `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomRef.current})`,
            transformOrigin: '0 0',
            position: 'relative',
            minWidth: '3000px',
            minHeight: '2000px',
            willChange: 'transform',
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '3000px', minHeight: '2000px' }}>
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--connection-line))" />
              </marker>
            </defs>
            {lines.map(({ from, to, key }) => {
              const x1 = from.x + 100;
              const y1 = from.y + 40;
              const x2 = to.x + 100;
              const y2 = to.y + 40;
              const mx = (x1 + x2) / 2;
              const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
              return (
                <g key={key} data-conn-from={from.id} data-conn-to={to.id}>
                  <path
                    d={d}
                    className="connection-line"
                    markerEnd="url(#arrowhead)"
                  />
                  <path
                    d={d}
                    stroke="transparent"
                    strokeWidth="12"
                    fill="none"
                    className="cursor-pointer pointer-events-auto"
                    onClick={(e) => {
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

          {whiteboard.pins.map(pin => (
            <PinCard
              key={pin.id}
              pin={pin}
              whiteboardId={whiteboard.id}
              isSelected={selectedPin === pin.id}
              isConnecting={connectingFrom === pin.id}
              onSelect={handlePinSelect}
              onStartConnect={handleStartConnect}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
