import React from 'react';
import { COLORS } from '../constants';

// --- Rotating Platter ---
interface PlatterProps {
  cx: number;
  cy: number;
  r: number;
  rotation: number;
  color: string;
  isPlaying: boolean;
}

export const Platter: React.FC<PlatterProps> = ({ cx, cy, r, rotation, color, isPlaying }) => {
  return (
    <g transform={`rotate(${rotation} ${cx} ${cy})`}>
      {/* Base Platter */}
      <circle cx={cx} cy={cy} r={r} fill="#0f172a" stroke="#334155" strokeWidth="4" />
      
      {/* Vinyl Grooves (Multiple circles) */}
      {[0.9, 0.8, 0.7, 0.6, 0.5].map((scale, i) => (
        <circle key={i} cx={cx} cy={cy} r={r * scale} fill="none" stroke="#1e293b" strokeWidth="1" />
      ))}

      {/* Label */}
      <circle cx={cx} cy={cy} r={r * 0.35} fill={color} opacity="0.8" />
      <circle cx={cx} cy={cy} r={r * 0.05} fill="#000" />

      {/* Glossy Reflection (Static, outside group? No, keep inside to spin highlights or keep static?) 
          Real records spin, highlights usually static relative to light. 
          Let's add a marker to see rotation clearly. 
      */}
      <rect x={cx - 4} y={cy - r} width={8} height={r * 0.3} fill="#fff" opacity="0.8" />
      
      {/* Strobe dots on edge */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const dotX = cx + Math.sin(angle) * (r - 8);
        const dotY = cy - Math.cos(angle) * (r - 8);
        return <circle key={i} cx={dotX} cy={dotY} r={2} fill="#475569" />;
      })}
    </g>
  );
};

// --- Waveform Visualization ---
interface WaveformProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isPlaying: boolean;
  speed: number;
}

export const Waveform: React.FC<WaveformProps> = ({ x, y, width, height, color, isPlaying, speed }) => {
  // Simulate moving waveform with a simple pattern offset
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      if (isPlaying) {
        setOffset((prev) => (prev + 2 * speed) % 40); // 40 is pattern width
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, speed]);

  // Generate a fake waveform path
  const points = [];
  const segments = width / 5; 
  for (let i = 0; i <= segments; i++) {
    const px = i * 5;
    // Perlin noise or random look
    const py = (Math.sin(i * 0.5) * Math.cos(i * 1.2) * (height * 0.4)); 
    points.push(`${px},${height/2 + py}`);
  }
  const pathD = `M 0,${height/2} L ${points.join(' ')} L ${width},${height/2}`;

  return (
    <g transform={`translate(${x}, ${y})`} clipPath={`url(#clip-${x}-${y})`}>
      <defs>
        <clipPath id={`clip-${x}-${y}`}>
          <rect x="0" y="0" width={width} height={height} rx="4" />
        </clipPath>
      </defs>
      <rect width={width} height={height} fill="#0f172a" rx="4" stroke="#334155" />
      
      <g transform={`translate(${-offset}, 0)`}>
        {/* Draw twice to loop seamlessly */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
        <path d={pathD} transform={`translate(${width}, 0)`} fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
      </g>
      
      {/* Playhead */}
      <line x1={width/2} y1={0} x2={width/2} y2={height} stroke="#ef4444" strokeWidth="2" />
    </g>
  );
};
