import { useRef, useCallback, useState } from 'react';

export interface DragState {
  id: string;
  type: 'whiteboard' | 'chapter';
  x: number;
  y: number;
  label: string;
}

export function useLongPressDrag(
  onDrop: (itemId: string, itemType: 'whiteboard' | 'chapter', targetFolderId: string | null) => void
) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const dragRef = useRef<DragState | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const findFolderAt = useCallback((x: number, y: number): string | null => {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      const folderId = (el as HTMLElement).closest('[data-folder-id]')?.getAttribute('data-folder-id');
      if (folderId) return folderId;
    }
    return null;
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const state = { ...dragRef.current, x: clientX, y: clientY };
    dragRef.current = state;
    setDragging(state);
    setDropTarget(findFolderAt(clientX, clientY));
  }, [findFolderAt]);

  const handleEnd = useCallback(() => {
    clearTimer();
    if (dragRef.current) {
      const { id, type, x, y } = dragRef.current;
      const target = findFolderAt(x, y);
      onDrop(id, type, target);
    }
    dragRef.current = null;
    setDragging(null);
    setDropTarget(null);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
  }, [clearTimer, findFolderAt, onDrop]);

  // Stable refs for event listeners
  const onMouseMove = useCallback((e: MouseEvent) => handleMove(e.clientX, e.clientY), [handleMove]);
  const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);
  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  }, [handleMove]);
  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  const startDrag = useCallback((id: string, type: 'whiteboard' | 'chapter', label: string, x: number, y: number) => {
    dragRef.current = { id, type, x, y, label };
    setDragging({ id, type, x, y, label });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  const bindLongPress = useCallback((id: string, type: 'whiteboard' | 'chapter', label: string) => ({
    onMouseDown: (e: React.MouseEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => startDrag(id, type, label, e.clientX, e.clientY), 500);
    },
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      startPos.current = { x: t.clientX, y: t.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => startDrag(id, type, label, t.clientX, t.clientY), 500);
    },
    onMouseUp: clearTimer,
    onTouchEnd: () => { if (!dragRef.current) clearTimer(); },
    onMouseLeave: () => { if (!dragRef.current) clearTimer(); },
  }), [clearTimer, startDrag]);

  return { dragging, dropTarget, bindLongPress };
}
