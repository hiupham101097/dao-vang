import React from 'react';
import { FloatingPopupItem } from '../game/types';

interface FloatingPopupsProps {
  popups: FloatingPopupItem[];
}

export const FloatingPopups: React.FC<FloatingPopupsProps> = ({ popups }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {popups.map((p) => (
        <div
          key={p.id}
          className="floating-popup font-display font-extrabold text-xl sm:text-3xl px-3 py-1 rounded-xl absolute whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            color: p.color,
          }}
        >
          {p.text}
        </div>
      ))}
    </div>
  );
};

