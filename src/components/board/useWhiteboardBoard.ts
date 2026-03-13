import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBook } from '@/contexts/BookContext';
import { Pin as BookPin, TagColor } from '@/types/book';

export type Viewport = {
  offsetX: number;
  offsetY: number;
  zoom: number;
};

export type BoardLink = {
  id: string;
  sourcePinId: string;
  targetPinId: string;
};

export const TAG_COLOR_ORDER: TagColor[] = ['rose', 'amber', 'sage', 'lavender'];

export const TAG_COLOR_STYLES: Record<TagColor, string> = {
  rose: 'bg-tag-rose text-tag-rose-text',
  amber: 'bg-tag-amber text-tag-amber-text',
  sage: 'bg-tag-sage text-tag-sage-text',
  lavender: 'bg-tag-lavender text-tag-lavender-text',
};

export const TAG_COLOR_SWATCHES: Record<TagColor, string> = {
  rose: 'hsl(var(--tag-rose))',
  amber: 'hsl(var(--tag-amber))',
  sage: 'hsl(var(--tag-sage))',
  lavender: 'hsl(var(--tag-lavender))',
};

export function clampZoom(zoom: number) {
  return Math.max(0.1, Math.min(3, zoom));
}

export function pinSize(pin: BookPin) {
  return {
    width: Math.max(160, Math.min(640, pin.width ?? 220)),
    height: Math.max(120, Math.min(480, pin.height ?? 160)),
  };
}

function makePin(x: number, y: number): BookPin {
  return {
    id: crypto.randomUUID(),
    title: 'New Pin',
    content: '',
    x,
    y,
    width: 220,
    height: 160,
    imageUrl: undefined,
    tags: [],
    connections: [],
  };
}

export function useWhiteboardBoard() {
  const { book, activeWhiteboardId, addPin, updatePin, connectPins, disconnectPins, renameWhiteboard, deletePin } =
    useBook();
  const whiteboard = useMemo(
    () => book.whiteboards.find((item) => item.id === activeWhiteboardId) ?? null,
    [activeWhiteboardId, book.whiteboards]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewportState] = useState<Viewport>({ offsetX: 0, offsetY: 0, zoom: 1 });
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);
  const [linkingFromPinId, setLinkingFromPinId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewStart, setViewStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setSelectedPinIds([]);
    setLinkingFromPinId(null);
    setViewportState({ offsetX: 0, offsetY: 0, zoom: 1 });
  }, [activeWhiteboardId]);

  const links = useMemo<BoardLink[]>(() => {
    if (!whiteboard) {
      return [];
    }

    const seen = new Set<string>();
    return whiteboard.pins.flatMap((pin) =>
      pin.connections.flatMap((targetPinId) => {
        const key = [pin.id, targetPinId].sort().join(':');
        if (seen.has(key)) {
          return [];
        }

        seen.add(key);
        return [{ id: key, sourcePinId: pin.id, targetPinId }];
      })
    );
  }, [whiteboard]);

  const setViewport = useCallback((next: Partial<Viewport>) => {
    setViewportState((current) => ({ ...current, ...next }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPinIds([]);
  }, []);

  const cancelLinking = useCallback(() => {
    setLinkingFromPinId(null);
  }, []);

  const addBoardPin = useCallback((x: number, y: number) => {
    if (!whiteboard) {
      return;
    }

    const pin = makePin(x, y);
    addPin(whiteboard.id, pin);
    setSelectedPinIds([pin.id]);
  }, [addPin, whiteboard]);

  const deleteSelectedPins = useCallback(() => {
    if (!whiteboard) {
      return;
    }

    selectedPinIds.forEach((id) => deletePin(whiteboard.id, id));
    setSelectedPinIds([]);
  }, [deletePin, selectedPinIds, whiteboard]);

  const selectPin = useCallback((pinId: string, multi = false) => {
    setSelectedPinIds((current) => {
      if (!multi) {
        return [pinId];
      }

      return current.includes(pinId) ? current.filter((id) => id !== pinId) : [...current, pinId];
    });
  }, []);

  const updateBoardPin = useCallback((pinId: string, updates: Partial<BookPin>) => {
    if (!whiteboard) {
      return;
    }

    const currentPin = whiteboard.pins.find((pin) => pin.id === pinId);
    if (!currentPin) {
      return;
    }

    updatePin(whiteboard.id, { ...currentPin, ...updates });
  }, [updatePin, whiteboard]);

  const movePin = useCallback((pinId: string, x: number, y: number) => {
    updateBoardPin(pinId, { x, y });
  }, [updateBoardPin]);

  const resizePin = useCallback((pinId: string, width: number, height: number) => {
    updateBoardPin(pinId, {
      width: Math.max(160, Math.min(640, width)),
      height: Math.max(120, Math.min(480, height)),
    });
  }, [updateBoardPin]);

  const completeLinking = useCallback((targetPinId: string) => {
    if (!whiteboard || !linkingFromPinId) {
      return;
    }

    if (linkingFromPinId === targetPinId) {
      setLinkingFromPinId(null);
      return;
    }

    const sourcePin = whiteboard.pins.find((pin) => pin.id === linkingFromPinId);
    if (!sourcePin?.connections.includes(targetPinId)) {
      connectPins(whiteboard.id, linkingFromPinId, targetPinId);
    }

    setLinkingFromPinId(null);
  }, [connectPins, linkingFromPinId, whiteboard]);

  const deleteLink = useCallback((linkId: string) => {
    if (!whiteboard) {
      return;
    }

    const [sourcePinId, targetPinId] = linkId.split(':');
    disconnectPins(whiteboard.id, sourcePinId, targetPinId);
  }, [disconnectPins, whiteboard]);

  const startLinking = useCallback((pinId: string) => {
    setLinkingFromPinId(pinId);
  }, []);

  const setBoardName = useCallback((name: string) => {
    if (!whiteboard) {
      return;
    }

    renameWhiteboard(whiteboard.id, name);
  }, [renameWhiteboard, whiteboard]);

  return {
    whiteboard,
    containerRef,
    viewport,
    setViewport,
    pins: whiteboard?.pins ?? [],
    links,
    selectedPinIds,
    selectPin,
    clearSelection,
    linkingFromPinId,
    startLinking,
    completeLinking,
    cancelLinking,
    addPin: addBoardPin,
    updatePin: updateBoardPin,
    movePin,
    resizePin,
    deletePin: (pinId: string) => whiteboard && deletePin(whiteboard.id, pinId),
    deleteLink,
    boardName: whiteboard?.name ?? '',
    setBoardName,
    deleteSelectedPins,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    viewStart,
    setViewStart,
  };
}
