import { BoardCanvas } from '@/components/board/BoardCanvas';
import { BoardToolbar } from '@/components/board/BoardToolbar';
import { useWhiteboardBoard } from '@/components/board/useWhiteboardBoard';

export function WhiteboardView() {
  const board = useWhiteboardBoard();

  if (!board.whiteboard) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas">
        <p className="text-muted-foreground">Select a whiteboard</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-canvas">
      <BoardToolbar
        viewport={board.viewport}
        setViewport={board.setViewport}
        addPin={() => {
          const cx = (window.innerWidth / 2 - board.viewport.offsetX) / board.viewport.zoom;
          const cy = (window.innerHeight / 2 - board.viewport.offsetY) / board.viewport.zoom;
          board.addPin(cx - 110, cy - 80);
        }}
        selectedPinIds={board.selectedPinIds}
        boardName={board.boardName}
        setBoardName={board.setBoardName}
        deleteSelectedPins={board.deleteSelectedPins}
        linkingFromPinId={board.linkingFromPinId}
        cancelLinking={board.cancelLinking}
      />

      <BoardCanvas
        containerRef={board.containerRef}
        viewport={board.viewport}
        setViewport={board.setViewport}
        pins={board.pins}
        links={board.links}
        addPin={board.addPin}
        updatePin={board.updatePin}
        movePin={board.movePin}
        resizePin={board.resizePin}
        deletePin={(pinId) => board.deletePin(pinId)}
        deleteLink={board.deleteLink}
        selectedPinIds={board.selectedPinIds}
        selectPin={board.selectPin}
        clearSelection={board.clearSelection}
        linkingFromPinId={board.linkingFromPinId}
        startLinking={board.startLinking}
        completeLinking={board.completeLinking}
        cancelLinking={board.cancelLinking}
        isPanning={board.isPanning}
        setIsPanning={board.setIsPanning}
        panStart={board.panStart}
        setPanStart={board.setPanStart}
        viewStart={board.viewStart}
        setViewStart={board.setViewStart}
      />
    </div>
  );
}
