import React from 'react';

interface TradeDeficitTooltipProps {
  x: number;
  y: number;
  content: React.ReactNode;
}

const TradeDeficitTooltip: React.FC<TradeDeficitTooltipProps> = ({ x, y, content }) => {
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 1000,
        pointerEvents: 'none',
        left: `${x + 12}px`,
        top: `${y - 12}px`,
        transition: 'transform 0.1s ease-out',
        transform: 'translate(0, -100%)',
      }}
      className="bg-white shadow-lg rounded-lg border border-gray-200"
    >
      {content}
    </div>
  );
};

export default TradeDeficitTooltip; 