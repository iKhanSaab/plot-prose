import { ImagePlus, Link2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Pin, TagColor } from '@/types/book';

const TAG_STYLES: Record<TagColor, string> = {
  rose: 'bg-tag-rose text-tag-rose-text',
  sage: 'bg-tag-sage text-tag-sage-text',
  amber: 'bg-tag-amber text-tag-amber-text',
  lavender: 'bg-tag-lavender text-tag-lavender-text',
};

interface PinLayerProps {
  pins: Pin[];
  selectedPinId: string | null;
  connectingFromId: string | null;
  onSelectPin: (pinId: string) => void;
  onStartDrag: (pinId: string, event: React.PointerEvent<HTMLElement>) => void;
  onDoubleClickPin?: (pinId: string) => void;
  onDeletePin?: (pinId: string) => void;
}

export function PinLayer({
  pins,
  selectedPinId,
  connectingFromId,
  onSelectPin,
  onStartDrag,
  onDoubleClickPin,
  onDeletePin,
}: PinLayerProps) {
  return (
    <>
      {pins.map((pin) => {
        const isSelected = selectedPinId === pin.id;
        const isConnecting = connectingFromId === pin.id;

        return (
          <article
            key={pin.id}
            data-testid={`pin-card-${pin.id}`}
            className={cn(
              'absolute w-64 p-4 rounded-xl border-2 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200',
              'select-none cursor-grab active:cursor-grabbing',
              'hover:shadow-md touch-none',
              isSelected 
                ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300',
              isConnecting && 'border-amber-500 ring-2 ring-amber-400/40 shadow-lg animate-pulse',
            )}
            style={{
              left: pin.x,
              top: pin.y,
              touchAction: 'pinch-zoom',
            }}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest('[data-no-drag="true"]')) {
                return;
              }
              onStartDrag(pin.id, event);
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              if (onDoubleClickPin) {
                onDoubleClickPin(pin.id);
              }
            }}
          >
            {/* Header with icon */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="truncate font-semibold text-sm text-slate-900 dark:text-white flex-1">
                {pin.title || 'Untitled'}
              </h3>
              {isSelected && onDeletePin && (
                <button 
                  data-no-drag="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePin(pin.id);
                  }}
                  className="min-h-8 min-w-8 p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors active:scale-95"
                  title="Delete (Del)"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>

            {/* Image if exists */}
            {pin.imageUrl ? (
              <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={pin.imageUrl}
                  alt={pin.title}
                  className="w-full h-auto max-h-32 object-cover"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : null}

            {/* Content preview */}
            {pin.content && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
                {pin.content}
              </p>
            )}

            {/* Tags */}
            {pin.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {pin.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TAG_STYLES[tag.color])}
                  >
                    {tag.label}
                  </span>
                ))}
                {pin.tags.length > 3 ? (
                  <span className="text-xs text-slate-500">+{pin.tags.length - 3}</span>
                ) : null}
              </div>
            )}

            {/* Footer with connection count */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Link2 className="w-3 h-3" />
                <span>{pin.connections.length}</span>
              </div>
              {pin.imageUrl && (
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <ImagePlus className="w-3 h-3" />
                  <span>image</span>
                </div>
              )}
            </div>

            {/* Context hint for selected pin */}
            {isSelected && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                {isConnecting ? 'Click another pin to connect' : 'Double-click to edit • Del to remove'}
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
