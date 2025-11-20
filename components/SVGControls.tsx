import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../constants';

// --- Knob Component ---
interface KnobProps {
  x: number;
  y: number;
  r: number;
  value: number; // 0 to 1
  onChange: (val: number) => void;
  label: string;
  color?: string;
}

export const Knob: React.FC<KnobProps> = ({ x, y, r, value, onChange, label, color = COLORS.knob }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startVal = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.clientY;
    // Sensitivity: 200px drag for full rotation
    let newVal = startVal.current + deltaY / 200;
    newVal = Math.max(0, Math.min(1, newVal));
    onChange(newVal);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  // Visual calculation
  // 0 = -135deg, 1 = +135deg
  const angle = -135 + value * 270;
  const radian = (angle * Math.PI) / 180;
  const indicatorX = x + Math.sin(radian) * (r * 0.6);
  const indicatorY = y - Math.cos(radian) * (r * 0.6);

  // Value arc
  const startAngle = -135 * (Math.PI / 180);
  const endAngle = angle * (Math.PI / 180);
  // SVG arc path logic simplified for circle segments is complex, using simple line for pointer mostly
  
  return (
    <g className="cursor-ns-resize"
       onPointerDown={handlePointerDown}
       onPointerMove={handlePointerMove}
       onPointerUp={handlePointerUp}
    >
      {/* Label */}
      <text x={x} y={y - r - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600" style={{ userSelect: 'none' }}>
        {label}
      </text>
      
      {/* Base Circle */}
      <circle cx={x} cy={y} r={r} fill="#1e293b" stroke={color} strokeWidth="2" />
      
      {/* Active Value Arc Indicator (Background ring) */}
      <path
        d={`M ${x + Math.sin(-135 * Math.PI/180) * r} ${y - Math.cos(-135 * Math.PI/180) * r} A ${r} ${r} 0 1 1 ${x + Math.sin(135 * Math.PI/180) * r} ${y - Math.cos(135 * Math.PI/180) * r}`}
        fill="none"
        stroke="#334155"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Indicator Dot/Line */}
      <line x1={x} y1={y} x2={indicatorX} y2={indicatorY} stroke={isDragging ? COLORS.knobActive : color} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
};

// --- Vertical Fader Component ---
interface FaderProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number; // 0 to 1
  onChange: (val: number) => void;
  label: string;
  color?: string;
}

export const Fader: React.FC<FaderProps> = ({ x, y, width, height, value, onChange, label, color = COLORS.knob }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleHeight = 30;
  const trackHeight = height - handleHeight;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    updateValue(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateValue(e.clientY);
  };

  const updateValue = (clientY: number) => {
    // Need to convert clientY to SVG local Y. 
    // This is tricky in pure SVG without refs/matrix transform.
    // We will approximate using relative movement from a stored start point or simplify:
    // Since we are inside an SVG, let's use the delta approach again for robustness, 
    // OR assume the user clicks on the handle.
    // Better approach for simple implementation:
    // We can't easily get precise SVG coords without a ref to the SVG root and getScreenCTM.
    // We will use delta for drag.
  };

  // Re-implementing with simple delta logic for robustness without matrix math
  const startY = useRef(0);
  const startVal = useRef(0);

  const onDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY.current;
    // Moving down (positive delta) decreases value if 0 is at bottom? 
    // Standard mixer: Up is 100% volume.
    // Screen Y increases downwards.
    // So moving mouse DOWN (positive delta) should DECREASE value.
    const pxRange = trackHeight;
    const valDelta = deltaY / pxRange;
    let newVal = startVal.current - valDelta;
    newVal = Math.max(0, Math.min(1, newVal));
    onChange(newVal);
  };

  const onUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  // Render coords
  // Value 1 = Top (y), Value 0 = Bottom (y + trackHeight)
  const handleY = y + trackHeight - (value * trackHeight);

  return (
    <g className="cursor-pointer">
       <text x={x + width/2} y={y - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600" style={{ userSelect: 'none' }}>
        {label}
      </text>
      {/* Track Slot */}
      <rect x={x + width/2 - 2} y={y} width={4} height={height} rx={2} fill="#0f172a" stroke="#334155" />
      
      {/* Handle */}
      <rect 
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        x={x} 
        y={handleY} 
        width={width} 
        height={handleHeight} 
        rx={2} 
        fill="#1e293b" 
        stroke={isDragging ? COLORS.knobActive : color} 
        strokeWidth="2"
      />
      {/* Handle Line */}
      <line x1={x + 2} y1={handleY + handleHeight/2} x2={x + width - 2} y2={handleY + handleHeight/2} stroke={isDragging ? COLORS.knobActive : color} strokeWidth="2" pointerEvents="none" />
    </g>
  );
};


// --- Crossfader Component (Horizontal) ---
interface CrossfaderProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number; // -1 to 1
  onChange: (val: number) => void;
}

export const Crossfader: React.FC<CrossfaderProps> = ({ x, y, width, height, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleWidth = 30;
  const trackWidth = width - handleWidth;
  const startX = useRef(0);
  const startVal = useRef(0);

  const onDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startVal.current = value;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX.current;
    const valDelta = (deltaX / trackWidth) * 2; // range is 2 (-1 to 1)
    let newVal = startVal.current + valDelta;
    newVal = Math.max(-1, Math.min(1, newVal));
    onChange(newVal);
  };

  const onUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  // Value -1 -> Left (x), Value 1 -> Right (x + trackWidth)
  // Normalized 0 to 1: (value + 1) / 2
  const normalized = (value + 1) / 2;
  const handleX = x + (normalized * trackWidth);

  return (
    <g className="cursor-ew-resize">
       <text x={x + width/2} y={y + height + 15} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600" style={{ userSelect: 'none' }}>
        CROSSFADER
      </text>
      {/* Track */}
      <rect x={x} y={y + height/2 - 2} width={width} height={4} rx={2} fill="#0f172a" stroke="#334155" />
      
      {/* Handle */}
      <rect 
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        x={handleX} 
        y={y} 
        width={handleWidth} 
        height={height} 
        rx={2} 
        fill="#1e293b" 
        stroke={isDragging ? COLORS.knobActive : '#cbd5e1'} 
        strokeWidth="2"
      />
      <line x1={handleX + handleWidth/2} y1={y+4} x2={handleX + handleWidth/2} y2={y + height-4} stroke="#cbd5e1" strokeWidth="2" pointerEvents="none" />
    </g>
  );
};
