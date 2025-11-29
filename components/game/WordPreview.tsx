"use client";
import React from 'react';

interface WordPreviewProps {
  word: string;
  valid: boolean;
  score: number;
}

export default function WordPreview({ word, valid, score }: WordPreviewProps) {
  if (!word) return null;

  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: '20px',
        padding: '15px 30px',
        borderRadius: '12px',
        background: valid
          ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 200, 100, 0.1))'
          : 'linear-gradient(135deg, rgba(143, 77, 255, 0.2), rgba(100, 50, 200, 0.1))',
        border: valid ? '2px solid #00ff88' : '2px solid #8f4dff',
        boxShadow: valid
          ? '0 0 20px rgba(0, 255, 136, 0.3)'
          : '0 0 20px rgba(143, 77, 255, 0.3)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          fontSize: '32px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          color: valid ? '#00ff88' : '#8f4dff',
          textShadow: valid
            ? '0 0 10px rgba(0, 255, 136, 0.8)'
            : '0 0 10px rgba(143, 77, 255, 0.8)',
        }}
      >
        {word.toUpperCase()}
      </div>
      {valid && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '18px',
            color: '#00ff88',
            fontWeight: '600',
          }}
        >
          +{score} points
        </div>
      )}
    </div>
  );
}