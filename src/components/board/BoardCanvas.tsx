import React, { useCallback, useEffect } from 'react';
import { Pin } from '@/types/book';
import { BoardLink, Viewport } from './useWhiteboardBoard';
import { BoardLinkLine } from './BoardLinkLine';
import { BoardPinCard } from './BoardPinCard';

interface BoardCanvasProps {
  containerRef: React.RefObject<HTMLDivElement>;
  viewport: Viewport;
  setViewport: (viewport: Partial<Viewport>) => void;
  pins: Pin[];
  links: BoardLink[];
  addPin: (x: number, y: number) => void;
  updatePin: (pinId: string, updates: Partial<Pin>) => void;
  movePin: (pinId: string, x: number, y: number) => void;
  resizePin: (pinId: string, width: number, height: number) => void;
  deletePin: (pinId: string) => void;
  deleteLink: (linkId: string) => void;
  selectedPinIds: string[];
  selectPin: (pinId: string, multi?: boolean) => void;
  clearSelection: () => void;
  linkingFromPinId: string | null;
  startLinking: (pinId: string) => void;
  completeLinking: (pinId: string) => void;
  cancelLinking: () => void;
  isPanning: boolean;
  setIsPanning: (value: boolean) => void;
  panStart: { x: number; y: number };
  setPanStart: (value: { x: number; y: number }) => void;
  viewStart: { x: number; y: number };
  setViewStart: (value: { x: number; y: number }) => void;
}

export const BoardCanvas: React.FC<BoardCanvasProps> = ({
  containerRef,
  viewport,
  setViewport,
  pins,
  links,
  addPin,
  updatePin,
  movePin,
  resizePin,
  deletePin,
  deleteLink,
  selectedPinIds,
  selectPin,
  clearSelection,
  linkingFromPinId,
  startLinking,
  completeLinking,
  cancelLinking,
  isPanning,
  setIsPanning,
  panStart,
  setPanStart,
  viewStart,
  setViewStart,
}) => {
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        const rect = containerRef.current!.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const scale = newZoom / viewport.zoom;
        setViewport({
          zoom: newZoom,
          offsetX: cx - (cx - viewport.offsetX) * scale,
          offsetY: cy - (cy - viewport.offsetY) * scale,
        });
      } else {
        setViewport({
          offsetX: viewport.offsetX - e.deltaX,
          offsetY: viewport.offsetY - e.deltaY,
        });
      }
    },
    [containerRef, setViewport, viewport]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.button === 0) {
        const isCanvasClick = e.target === containerRef.current;
        if (e.button === 1 || e.altKey || isCanvasClick) {
          e.preventDefault();
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          setViewStart({ x: viewport.offsetX, y: viewport.offsetY });
          if (isCanvasClick && e.button === 0 && !e.altKey) {
            clearSelection();
            if (linkingFromPinId) cancelLinking();
          }
        }
      }
    },
    [cancelLinking, clearSelection, containerRef, linkingFromPinId, setIsPanning, setPanStart, setViewStart, viewport.offsetX, viewport.offsetY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setViewport({ offsetX: viewStart.x + dx, offsetY: viewStart.y + dy });
      }
    },
    [isPanning, panStart.x, panStart.y, setViewport, viewStart.x, viewStart.y]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, [setIsPanning]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current) return;
      const rect = containerRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.offsetX) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.offsetY) / viewport.zoom;
      addPin(x, y);
    },
    [addPin, containerRef, viewport.offsetX, viewport.offsetY, viewport.zoom]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    el.addEventListener('wheel', prevent, { passive: false });
    return () => el.removeEventListener('wheel', prevent);
  }, [containerRef]);

  return (
    <div
      ref={containerRef}
      className="canvas-grid relative h-full w-full overflow-hidden select-none"
      style={{ cursor: isPanning ? 'grabbing' : linkingFromPinId ? 'crosshair' : 'default' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 1 }}>
        <g transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.zoom})`}>
          {links.map((link) => (
            <BoardLinkLine key={link.id} link={link} pins={pins} deleteLink={deleteLink} />
          ))}
        </g>
      </svg>
      <div
        className="absolute"
        style={{
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          zIndex: 2,
        }}
      >
        {pins.map((pin) => (
          <BoardPinCard
            key={pin.id}
            pin={pin}
            isSelected={selectedPinIds.includes(pin.id)}
            linkingFromPinId={linkingFromPinId}
            viewport={viewport}
            updatePin={updatePin}
            deletePin={deletePin}
            movePin={movePin}
            resizePin={resizePin}
            selectPin={selectPin}
            startLinking={startLinking}
            completeLinking={completeLinking}
          />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-10 rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground opacity-70">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};
