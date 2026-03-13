import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { LinkLine } from './LinkLine';
import { PinCard } from './PinCard';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewport, setViewport, pins, links, addPin, clearSelection, linkingFromPinId, cancelLinking } =
    useBoardStore();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewStart, setViewStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    useBoardStore.getState().load();
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * delta));
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
    [setViewport, viewport]
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
            if (linkingFromPinId) {
              cancelLinking();
            }
          }
        }
      }
    },
    [cancelLinking, clearSelection, linkingFromPinId, viewport.offsetX, viewport.offsetY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) {
        return;
      }

      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setViewport({ offsetX: viewStart.x + dx, offsetY: viewStart.y + dy });
    },
    [isPanning, panStart.x, panStart.y, setViewport, viewStart.x, viewStart.y]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current) {
        return;
      }

      const rect = containerRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.offsetX) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.offsetY) / viewport.zoom;
      addPin(x, y);
    },
    [addPin, viewport.offsetX, viewport.offsetY, viewport.zoom]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const prevent = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    element.addEventListener('wheel', prevent, { passive: false });
    return () => element.removeEventListener('wheel', prevent);
  }, []);

  return (
    <div
      ref={containerRef}
      className="canvas-grid relative h-full w-full select-none overflow-hidden"
      style={{ cursor: isPanning ? 'grabbing' : linkingFromPinId ? 'crosshair' : 'default' }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 1 }}>
        <g transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.zoom})`}>
          {links.map((link) => (
            <LinkLine key={link.id} link={link} />
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
          <PinCard key={pin.id} pin={pin} />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-10 rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground opacity-70">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};
