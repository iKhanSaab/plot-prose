import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Check, GripVertical, Image, Link as LinkIcon, Tag, X } from 'lucide-react';
import { Pin, useBoardStore } from '@/store/boardStore';

interface PinCardProps {
  pin: Pin;
}

const TAG_COLORS = ['red', 'yellow', 'green', 'blue'] as const;

export const PinCard: React.FC<PinCardProps> = ({ pin }) => {
  const {
    selectedPinIds,
    selectPin,
    updatePin,
    deletePin,
    movePin,
    resizePin,
    linkingFromPinId,
    startLinking,
    completeLinking,
    tags,
    assignTag,
    unassignTag,
    addTag,
    setAttachment,
    removeAttachment,
    viewport,
  } = useBoardStore();

  const isSelected = selectedPinIds.includes(pin.id);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<(typeof TAG_COLORS)[number]>('blue');
  const dragStart = useRef({ x: 0, y: 0, pinX: 0, pinY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);

  const pinTags = tags.filter((tag) => pin.tagIds.includes(tag.id));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || isEditing) {
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

      const onMove = (event: MouseEvent) => {
        const dx = (event.clientX - dragStart.current.x) / viewport.zoom;
        const dy = (event.clientY - dragStart.current.y) / viewport.zoom;
        movePin(pin.id, dragStart.current.pinX + dx, dragStart.current.pinY + dy);
      };

      const onUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [completeLinking, isEditing, linkingFromPinId, movePin, pin.id, pin.x, pin.y, selectPin, viewport.zoom]
  );

  const handleResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      resizeStart.current = { x: e.clientX, y: e.clientY, w: pin.width, h: pin.height };

      const onMove = (event: MouseEvent) => {
        const dw = (event.clientX - resizeStart.current.x) / viewport.zoom;
        const dh = (event.clientY - resizeStart.current.y) / viewport.zoom;
        resizePin(pin.id, resizeStart.current.w + dw, resizeStart.current.h + dh);
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [pin.height, pin.id, pin.width, resizePin, viewport.zoom]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAttachment(pin.id, reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [pin.id, setAttachment]
  );

  const handleCreateTag = useCallback(() => {
    const name = newTagName.trim();
    if (!name) {
      return;
    }

    const existingTag = tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      assignTag(pin.id, existingTag.id);
    } else {
      addTag(name, newTagColor);
      const createdTag = useBoardStore.getState().tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
      if (createdTag) {
        assignTag(pin.id, createdTag.id);
      }
    }

    setNewTagName('');
  }, [addTag, assignTag, newTagColor, newTagName, pin.id, tags]);

  const expandToFitContent = useCallback(() => {
    requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) {
        return;
      }

      const overflow = card.scrollHeight - card.clientHeight;
      if (overflow > 0) {
        resizePin(pin.id, pin.width, pin.height + Math.ceil(overflow) + 8);
      }
    });
  }, [pin.height, pin.id, pin.width, resizePin]);

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updatePin(pin.id, { body: e.target.value });

      requestAnimationFrame(() => {
        const bodyContainer = bodyContainerRef.current;
        if (!bodyContainer) {
          return;
        }

        const overflow = e.target.scrollHeight - bodyContainer.clientHeight;
        if (overflow > 0) {
          resizePin(pin.id, pin.width, pin.height + Math.ceil(overflow) + 8);
        }
      });
    },
    [pin.height, pin.id, pin.width, resizePin, updatePin]
  );

  useLayoutEffect(() => {
    expandToFitContent();
  }, [expandToFitContent, pin.attachmentUrl, pin.body, pin.tagIds, showTagMenu]);

  return (
    <div
      ref={cardRef}
      className={`pin-card absolute flex flex-col ${isSelected ? 'selected' : ''}`}
      style={{
        left: pin.x,
        top: pin.y,
        width: pin.width,
        height: pin.height,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-1 overflow-hidden border-b border-border/30 px-2 py-1.5">
        <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
        {isEditing ? (
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent font-display text-sm font-bold text-card-foreground outline-none"
            value={pin.title}
            onBlur={() => setIsEditing(false)}
            onChange={(e) => updatePin(pin.id, { title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
          />
        ) : (
          <span
            className="min-w-0 flex-1 cursor-text truncate font-display text-sm font-bold text-card-foreground"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
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
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                className={`h-4 w-4 rounded-full border transition-transform ${
                  newTagColor === color ? 'scale-110 border-card-foreground' : 'border-transparent'
                }`}
                style={{ backgroundColor: `hsl(var(--tag-${color}))` }}
                title={`Use ${color} tag color`}
                onClick={() => setNewTagColor(color)}
              />
            ))}
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => {
                const assigned = pin.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-opacity"
                    style={{
                      backgroundColor: `hsl(var(--tag-${tag.color}))`,
                      color: 'white',
                      opacity: assigned ? 1 : 0.45,
                    }}
                    onClick={() => (assigned ? unassignTag(pin.id, tag.id) : assignTag(pin.id, tag.id))}
                  >
                    {assigned && <Check className="h-2.5 w-2.5" />}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">No tags yet. Create your first one here.</p>
          )}
        </div>
      )}

      {pin.attachmentUrl && (
        <div className="group/img relative flex-shrink-0 px-2 py-1">
          <img
            src={pin.attachmentUrl}
            alt="attachment"
            className="max-h-28 w-full rounded bg-card-foreground/5 object-contain"
            loading="lazy"
            onLoad={expandToFitContent}
          />
          <button
            className="absolute right-3 top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover/img:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              removeAttachment(pin.id);
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
          value={pin.body}
          onChange={handleBodyChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>

      {pinTags.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-border/20 px-2 py-1.5">
          {pinTags.map((tag) => (
            <span
              key={tag.id}
              className="cursor-pointer rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `hsl(var(--tag-${tag.color}))`, color: 'white' }}
              title="Click to remove tag"
              onClick={(e) => {
                e.stopPropagation();
                unassignTag(pin.id, tag.id);
              }}
            >
              {tag.name}
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
