/*
FILE PURPOSE:
This file renders the inline tag editor used inside whiteboard pins.

ROLE IN THE APP:
It manages temporary input state for creating and removing tags, then reports the updated tag list back to the parent pin component.

USED BY:
- WhiteboardView.tsx renders this inside each pin card when tag editing is open

EXPORTS:
- TagEditor: inline popover-style tag editing component
*/

import { Tag, TagColor } from '@/types/book';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// This constant defines the set of tag colors supported by the app.
// Keeping it in one place ensures the UI and stored data stay aligned.
const COLORS: { value: TagColor; label: string; style: string }[] = [
  { value: 'rose', label: 'Rose', style: 'bg-tag-rose text-tag-rose-text' },
  { value: 'sage', label: 'Sage', style: 'bg-tag-sage text-tag-sage-text' },
  { value: 'amber', label: 'Amber', style: 'bg-tag-amber text-tag-amber-text' },
  { value: 'lavender', label: 'Lavender', style: 'bg-tag-lavender text-tag-lavender-text' },
];

interface TagEditorProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  onClose: () => void;
}

// Data flow:
// 1. User types a label and chooses a color here.
// 2. TagEditor builds the new tag object locally.
// 3. onChange sends the updated tag array back to the parent pin.
// 4. WhiteboardView persists that update through BookContext.
export function TagEditor({ tags, onChange, onClose }: TagEditorProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState<TagColor>('amber');

  const addTag = () => {
    if (!newLabel.trim()) return;
    const tag: Tag = {
      id: `tag-${Date.now()}`,
      label: newLabel.trim(),
      color: newColor,
    };
    onChange([...tags, tag]);
    setNewLabel('');
  };

  const removeTag = (id: string) => {
    onChange(tags.filter(t => t.id !== id));
  };

  return (
    <div
      className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-3 z-20 min-w-[220px] animate-fade-in no-drag"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">Tags</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted">
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => {
            const colorStyle = COLORS.find(c => c.value === tag.color)?.style || COLORS[0].style;
            return (
              <span
                key={tag.id}
                className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1', colorStyle)}
              >
                {tag.label}
                <button onClick={() => removeTag(tag.id)} className="hover:opacity-70">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Add new tag */}
      <div className="space-y-2">
        <input
          className="w-full text-xs bg-muted border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="Tag label..."
        />
        <div className="flex items-center gap-1.5">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setNewColor(c.value)}
              className={cn(
                'h-5 w-5 rounded-full border-2 transition-all',
                c.style,
                newColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
              )}
              title={c.label}
            />
          ))}
          <button
            onClick={addTag}
            disabled={!newLabel.trim()}
            className="ml-auto flex items-center gap-1 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-40"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

