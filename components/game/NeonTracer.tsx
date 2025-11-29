import React from 'react';

export default function NeonTracer({ path, tileSize, tileGap, gridSize }:{
  path:{x:number,y:number}[];
  tileSize:number;
  tileGap:number;
  gridSize:number;
}){
  if (!path.length) return null;

  const step = tileSize + tileGap;
  const boardSpan = tileSize * gridSize + tileGap * (gridSize - 1);

  const points = path
    .map(p => {
      const cx = p.x * step + tileSize / 2;
      const cy = p.y * step + tileSize / 2;
      return `${cx},${cy}`;
    })
    .join(' ');

  return (
    <svg
      className="neon-tracer"
      viewBox={`0 0 ${boardSpan} ${boardSpan}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <polyline className="neon-line" points={points} fill="none" />
    </svg>
  );
}
