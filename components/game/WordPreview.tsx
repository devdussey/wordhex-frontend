"use client";
import React from 'react';

interface WordPreviewProps {
  word: string;
  valid: boolean;
  score: number;
}

export default function WordPreview({ word, valid, score }: WordPreviewProps) {
  if (!word) return null;

  const stateClass = valid ? 'wp-valid' : 'wp-invalid';
  return (
    <div className={stateClass}>
      <span className="wp-word">{word.toUpperCase()}</span>
      {valid ? (
        <span className="wp-score">+{score} pts</span>
      ) : (
        <span className="wp-score">Not in dictionary</span>
      )}
    </div>
  );
}
