import React from 'react';

interface WireProps {
  d: string; // Path data
  signalStrength: number; // 0 to 1, determines opacity/glow
  color: string;
  isFlowing: boolean;
}

export const Wire: React.FC<WireProps> = ({ d, signalStrength, color, isFlowing }) => {
  // If signal is very weak, dim it significantly
  const opacity = 0.2 + (signalStrength * 0.8);
  
  return (
    <g>
      {/* Base Dark Wire */}
      <path d={d} fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Active Signal Wire */}
      <path 
        d={d} 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        strokeOpacity={opacity}
        className={isFlowing && signalStrength > 0.05 ? "animate-pulse-flow" : ""}
        strokeDasharray={isFlowing ? "10, 5" : "none"}
      />
      
      {/* Flow Animation Style injection (inline for simplicity in SVG) */}
      <style>
        {`
          @keyframes flow {
            to { stroke-dashoffset: -15; }
          }
          .animate-pulse-flow {
            animation: flow 0.5s linear infinite;
          }
        `}
      </style>
    </g>
  );
};
