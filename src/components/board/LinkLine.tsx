import React from 'react';
import { Link as LinkType, useBoardStore } from '@/store/boardStore';

interface LinkLineProps {
  link: LinkType;
}

export const LinkLine: React.FC<LinkLineProps> = ({ link }) => {
  const pins = useBoardStore((state) => state.pins);
  const deleteLink = useBoardStore((state) => state.deleteLink);

  const source = pins.find((pin) => pin.id === link.sourcePinId);
  const target = pins.find((pin) => pin.id === link.targetPinId);

  if (!source || !target) {
    return null;
  }

  const x1 = source.x + source.width / 2;
  const y1 = source.y + source.height / 2;
  const x2 = target.x + target.width / 2;
  const y2 = target.y + target.height / 2;

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
