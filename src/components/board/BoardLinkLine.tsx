import React from 'react';
import { Pin } from '@/types/book';
import { BoardLink, pinSize } from './useWhiteboardBoard';

interface BoardLinkLineProps {
  link: BoardLink;
  pins: Pin[];
  deleteLink: (linkId: string) => void;
}

export const BoardLinkLine: React.FC<BoardLinkLineProps> = ({ link, pins, deleteLink }) => {
  const source = pins.find((pin) => pin.id === link.sourcePinId);
  const target = pins.find((pin) => pin.id === link.targetPinId);

  if (!source || !target) {
    return null;
  }

  const sourceSize = pinSize(source);
  const targetSize = pinSize(target);
  const x1 = source.x + sourceSize.width / 2;
  const y1 = source.y + sourceSize.height / 2;
  const x2 = target.x + targetSize.width / 2;
  const y2 = target.y + targetSize.height / 2;

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--connection-line))"
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.6}
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onClick={() => deleteLink(link.id)}
      />
      <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={4} fill="hsl(var(--connection-line))" opacity={0.7} />
    </g>
  );
};
