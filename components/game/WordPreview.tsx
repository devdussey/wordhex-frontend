
import React from 'react';

export default function WordPreview({ word, valid, score }:{
  word:string;
  valid:boolean;
  score:number;
}){
  if(!word) return null;
  return (
    <div className={valid ? 'wp-valid' : 'wp-invalid'}>
      <span className="wp-word">{word}</span>
      {valid && <span className="wp-score">+{score}</span>}
    </div>
  );
}
