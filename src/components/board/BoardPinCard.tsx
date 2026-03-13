import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, GripVertical, Image, Link as LinkIcon, Tag, X } from 'lucide-react';
import { Pin, TagColor } from '@/types/book';
import { TAG_COLOR_ORDER, TAG_COLOR_STYLES, TAG_COLOR_SWATCHES, Viewport, pinSize } from './useWhiteboardBoard';

interface BoardPinCardProps {
  pin: Pin;
  isSelected: boolean;
  linkingFromPinId: string | null;
  viewport: Viewport;
  updatePin: (pinId: string, updates: Partial<Pin>) => void;
  deletePin: (pinId: string) => void;
  movePin: (pinId: string, x: number, y: number) => void;
  resizePin: (pinId: string, width: number, height: number) => void;
  selectPin: (pinId: string, multi?: boolean) => void;
  startLinking: (pinId: string) => void;
  completeLinking: (pinId: string) => void;
}

export const BoardPinCard: React.FC<BoardPinCardProps> = ({
  pin,
  isSelected,
  linkingFromPinId,
  viewport,
  updatePin,
  deletePin,
  movePin,
  resizePin,
  selectPin,
  startLinking,
  completeLinking,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('amber');
  const dragStart = useRef({ x: 0, y: 0, pinX: 0, pinY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  const size = pinSize(pin);

  const expandToFit = useCallback(() => {
    requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) {
        return;
      }

      const overflow = card.scrollHeight - card.clientHeight;
      if (overflow > 0) {
        resizePin(pin.id, size.width, size.height + Math.ceil(overflow) + 8);
      }
    });
  }, [pin.id, resizePin, size.height, size.width]);

  useEffect(() => {
    if (!showTagMenu) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setShowTagMenu(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [showTagMenu]);

  useLayoutEffect(() => {
    expandToFit();
  }, [expandToFit, pin.content, pin.imageUrl, pin.tags, showTagMenu]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || isEditingTitle) {
      return;
    }

    e.stopPropagation();

    if (linkingFromPinId) {
      completeLinking(pin.id);
      return;
    }

    selectPin(pin.id, e.shiftKey);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, pinX: pin.x, pinY: pin.y };

    const onMoveWindow = (event: MouseEvent) => {
      const dx = (event.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (event.clientY - dragStart.current.y) / viewport.zoom;
      movePin(pin.id, dragStart.current.pinX + dx, dragStart.current.pinY + dy);
    };

    const onUpWindow = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMoveWindow);
      window.removeEventListener('mouseup', onUpWindow);
    };

    window.addEventListener('mousemove', onMoveWindow);
    window.addEventListener('mouseup', onUpWindow);
  }, [completeLinking, isEditingTitle, linkingFromPinId, movePin, pin.id, pin.x, pin.y, selectPin, viewport.zoom]);

  const handleResizeDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };

    const onMoveWindow = (event: MouseEvent) => {
      const dw = (event.clientX - resizeStart.current.x) / viewport.zoom;
      const dh = (event.clientY - resizeStart.current.y) / viewport.zoom;
      resizePin(pin.id, resizeStart.current.w + dw, resizeStart.current.h + dh);
    };

    const onUpWindow = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMoveWindow);
      window.removeEventListener('mouseup', onUpWindow);
    };

    window.addEventListener('mousemove', onMoveWindow);
    window.addEventListener('mouseup', onUpWindow);
  }, [pin.id, resizePin, size.height, size.width, viewport.zoom]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updatePin(pin.id, { imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }, [pin.id, updatePin]);

  const handleCreateTag = useCallback(() => {
    const label = newTagName.trim();
    if (!label) {
      return;
    }

    const existing = pin.tags.find((tag) => tag.label.toLowerCase() === label.toLowerCase());
    if (existing) {
      setNewTagName('');
      return;
    }

    updatePin(pin.id, {
      tags: [...pin.tags, { id: crypto.randomUUID(), label, color: newTagColor }],
    });
    setNewTagName('');
  }, [newTagColor, newTagName, pin.id, pin.tags, updatePin]);

  const handleBodyChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextContent = e.target.value;
    updatePin(pin.id, { content: nextContent });

    requestAnimationFrame(() => {
      const bodyContainer = bodyContainerRef.current;
      if (!bodyContainer) {
        return;
      }

      const overflow = e.target.scrollHeight - bodyContainer.clientHeight;
      if (overflow > 0) {
        resizePin(pin.id, size.width, size.height + Math.ceil(overflow) + 8);
      }
    });
  }, [pin.id, resizePin, size.height, size.width, updatePin]);

  return (
    <div
      ref={cardRef}
      className={`pin-card absolute flex flex-col ${isSelected ? 'selected' : ''}`}
      style={{
        left: pin.x,
        top: pin.y,
        width: size.width,
        height: size.height,
        cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'grab',
        zIndex: isSelected ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-1 overflow-hidden border-b border-border/30 px-2 py-1.5">
        <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
        {isEditingTitle ? (
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent font-display text-sm font-bold text-card-foreground outline-none"
            value={pin.title}
            onBlur={() => setIsEditingTitle(false)}
            onChange={(e) => updatePin(pin.id, { title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
          />
        ) : (
          <span
            className="min-w-0 flex-1 cursor-text truncate font-display text-sm font-bold text-card-foreground"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
          >
            {pin.title}
          </span>
        )}

        <div className="flex flex-shrink-0 items-center gap-0.5">
          <button
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent/20 hover:text-primary"
            title="Link to another pin"
            onClick={(e) => {
              e.stopPropagation();
              startLinking(pin.id);
            }}
          >
            <LinkIcon className="h-3 w-3" />
          </button>
          <button
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent/20 hover:text-primary"
            title="Manage tags"
            onClick={(e) => {
              e.stopPropagation();
              setShowTagMenu((value) => !value);
            }}
          >
            <Tag className="h-3 w-3" />
          </button>
          <button
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent/20 hover:text-primary"
            title="Add image"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Image className="h-3 w-3" />
          </button>
          <button
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
            title="Delete pin"
            onClick={(e) => {
              e.stopPropagation();
              deletePin(pin.id);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {showTagMenu && (
        <div
          ref={tagMenuRef}
          className="space-y-2 border-b border-border/30 px-2 py-2"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1">
            <input
              className="flex-1 rounded bg-card-foreground/5 px-2 py-1 text-xs outline-none"
              placeholder="Create or assign tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            />
            <button className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground" onClick={handleCreateTag}>
              Add
            </button>
          </div>

          <div className="flex gap-1">
            {TAG_COLOR_ORDER.map((color) => (
              <button
                key={color}
                className={`h-4 w-4 rounded-full border transition-transform ${
                  newTagColor === color ? 'scale-110 border-card-foreground' : 'border-transparent'
                }`}
                style={{ backgroundColor: TAG_COLOR_SWATCHES[color] }}
                title={color}
                onClick={() => setNewTagColor(color)}
              />
            ))}
          </div>

          {pin.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {pin.tags.map((tag) => (
                <button
                  key={tag.id}
                  className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TAG_COLOR_STYLES[tag.color]}`}
                  style={{ borderColor: TAG_COLOR_SWATCHES[tag.color] }}
                  onClick={() => updatePin(pin.id, { tags: pin.tags.filter((currentTag) => currentTag.id !== tag.id) })}
                >
                  <Check className="h-2.5 w-2.5" />
                  {tag.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">No tags yet. Create your first one here.</p>
          )}
        </div>
      )}

      {pin.imageUrl && (
        <div className="group/img relative flex-shrink-0 px-2 py-1">
          <img
            src={pin.imageUrl}
            alt="attachment"
            className="max-h-28 w-full rounded bg-card-foreground/5 object-contain"
            loading="lazy"
            onLoad={expandToFit}
          />
          <button
            className="absolute right-3 top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover/img:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              updatePin(pin.id, { imageUrl: undefined });
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div ref={bodyContainerRef} className="min-h-[2rem] flex-1 overflow-hidden px-2 py-1">
        <textarea
          className="h-full w-full resize-none bg-transparent text-xs text-card-foreground outline-none placeholder:text-muted-foreground/50"
          placeholder="Write your notes..."
          value={pin.content}
          onChange={handleBodyChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>

      {pin.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-border/20 px-2 py-1.5">
          {pin.tags.map((tag) => (
            <span
              key={tag.id}
              className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TAG_COLOR_STYLES[tag.color]}`}
              style={{ borderColor: TAG_COLOR_SWATCHES[tag.color] }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize opacity-0 transition-opacity hover:opacity-100"
        onMouseDown={handleResizeDown}
      >
        <svg viewBox="0 0 16 16" className="h-full w-full text-muted-foreground/50">
          <path d="M14 14L8 14L14 8Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};
