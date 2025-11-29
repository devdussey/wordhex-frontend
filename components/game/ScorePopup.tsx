
import React from 'react';

export default function ScorePopup({ score, x, y }:{
  score:number;
  x:number;
  y:number;
}){
  if(!score) return null;
  return (
    <div
      className="score-popup"
      style={{ left:x, top:y }}
    >
      +{score}
    </div>
  );
}
