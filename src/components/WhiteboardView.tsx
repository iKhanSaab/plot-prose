import { useBook } from '@/contexts/BookContext';
import { Pin as PinType, TagColor } from '@/types/book';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, GripVertical, X, Link, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAG_STYLES: Record<TagColor, string> = {
  rose: 'bg-tag-rose text-tag-rose-text',
  sage: 'bg-tag-sage text-tag-sage-text',
  amber: 'bg-tag-amber text-tag-amber-text',
  lavender: 'bg-tag-lavender text-tag-lavender-text',
};

function PinCard({
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
  const { updatePin, deletePin } = useBook();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(pin.title);
  const [content, setContent] = useState(pin.content);

  const handleSave = () => {
    updatePin(whiteboardId, { ...pin, title, content });
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'absolute bg-pin-bg border rounded-lg shadow-sm transition-shadow animate-scale-in cursor-grab active:cursor-grabbing',
        'min-w-[200px] max-w-[280px]',
        isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-pin-border hover:shadow-md',
        isConnecting && 'ring-2 ring-connection/40'
      )}
      style={{ left: pin.x, top: pin.y }}
      onClick={(e) => { e.stopPropagation(); onSelect(pin.id); }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        onDragStart(pin.id, e);
      }}
    >
      {/* Header */}
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

      {/* Content */}
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

      {/* Tags */}
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
}

export function WhiteboardView() {
  const { book, activeWhiteboardId, addPin } = useBook();
  const whiteboard = book.whiteboards.find(wb => wb.id === activeWhiteboardId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ pinId: string; offsetX: number; offsetY: number } | null>(null);
  const { updatePin, connectPins } = useBook();

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (connectingFrom) {
      setConnectingFrom(null);
      return;
    }
    setSelectedPin(null);
  };

  const handleAddPin = () => {
    if (!whiteboard) return;
    const newPin: PinType = {
      id: `pin-${Date.now()}`,
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      title: 'New Pin',
      content: '',
      tags: [],
      connections: [],
    };
    addPin(whiteboard.id, newPin);
  };

  const handleDragStart = useCallback((pinId: string, e: React.MouseEvent) => {
    if (!whiteboard) return;
    const pin = whiteboard.pins.find(p => p.id === pinId);
    if (!pin) return;
    setDragState({ pinId, offsetX: e.clientX - pin.x, offsetY: e.clientY - pin.y });
  }, [whiteboard]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || !whiteboard) return;
    const newX = Math.max(0, e.clientX - dragState.offsetX);
    const newY = Math.max(0, e.clientY - dragState.offsetY);
    const pin = whiteboard.pins.find(p => p.id === dragState.pinId);
    if (pin) {
      updatePin(whiteboard.id, { ...pin, x: newX, y: newY });
    }
  }, [dragState, whiteboard, updatePin]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handlePinSelect = (pinId: string) => {
    if (connectingFrom && connectingFrom !== pinId && whiteboard) {
      connectPins(whiteboard.id, connectingFrom, pinId);
      setConnectingFrom(null);
      return;
    }
    setSelectedPin(pinId);
  };

  const handleStartConnect = (pinId: string) => {
    setConnectingFrom(pinId);
  };

  if (!whiteboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg">
        <p className="text-muted-foreground">Select a whiteboard</p>
      </div>
    );
  }

  // Build unique connection lines
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
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
        <div>
          <h2 className="font-display text-lg font-semibold">{whiteboard.name}</h2>
          <p className="text-xs text-muted-foreground">{whiteboard.pins.length} pins</p>
        </div>
        <button
          onClick={handleAddPin}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Pin
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative canvas-grid overflow-auto"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Connection lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '2000px', minHeight: '1500px' }}>
          {lines.map(({ from, to, key }) => {
            const x1 = from.x + 100;
            const y1 = from.y + 40;
            const x2 = to.x + 100;
            const y2 = to.y + 40;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={key}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                className="connection-line"
              />
            );
          })}
        </svg>

        {/* Connecting indicator */}
        {connectingFrom && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg animate-fade-in">
            Click another pin to connect · Click canvas to cancel
          </div>
        )}

        {/* Pins */}
        <div style={{ minWidth: '2000px', minHeight: '1500px', position: 'relative' }}>
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
