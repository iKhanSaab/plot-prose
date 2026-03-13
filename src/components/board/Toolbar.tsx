import React from 'react';
import { Plus, RotateCcw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';

export const Toolbar: React.FC = () => {
  const {
    viewport,
    setViewport,
    addPin,
    selectedPinIds,
    boardName,
    setBoardName,
    deletePin,
    linkingFromPinId,
    cancelLinking,
  } = useBoardStore();

  const handleAddPin = () => {
    const cx = (window.innerWidth / 2 - viewport.offsetX) / viewport.zoom;
    const cy = (window.innerHeight / 2 - viewport.offsetY) / viewport.zoom;
    addPin(cx - 110, cy - 80);
  };

  return (
    <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
      <input
        className="w-64 rounded-lg border border-border bg-secondary px-3 py-2 font-display text-lg font-bold text-secondary-foreground outline-none transition-colors focus:border-primary"
        value={boardName}
        onChange={(e) => setBoardName(e.target.value)}
      />

      <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
        <button
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          onClick={handleAddPin}
        >
          <Plus className="h-4 w-4" />
          Pin
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          className="rounded-md p-1.5 text-secondary-foreground transition-colors hover:bg-muted"
          title="Zoom out"
          onClick={() => setViewport({ zoom: Math.max(0.1, viewport.zoom * 0.8) })}
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          className="rounded-md p-1.5 text-secondary-foreground transition-colors hover:bg-muted"
          title="Zoom in"
          onClick={() => setViewport({ zoom: Math.min(3, viewport.zoom * 1.2) })}
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          className="rounded-md p-1.5 text-secondary-foreground transition-colors hover:bg-muted"
          title="Reset view"
          onClick={() => setViewport({ offsetX: 0, offsetY: 0, zoom: 1 })}
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {selectedPinIds.length > 0 && (
          <>
            <div className="mx-1 h-6 w-px bg-border" />
            <button
              className="rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/20"
              title="Delete selected"
              onClick={() => selectedPinIds.forEach((id) => deletePin(id))}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {linkingFromPinId && (
        <div className="animate-pulse rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
          Click another pin to create a link...
          <button className="ml-2 underline" onClick={() => cancelLinking()}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
