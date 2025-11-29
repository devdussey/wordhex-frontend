import { useCallback, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface DragPath {
  start: (point: Point) => void;
  move: (point: Point) => void;
  end: () => void;
}

export function useDragPath(setPath: React.Dispatch<React.SetStateAction<Point[]>>): DragPath {
  const isDragging = useRef(false);

  const isAdjacent = (a: Point, b: Point): boolean => {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx <= 1 && dy <= 1 && (dx + dy > 0);
  };

  const start = useCallback((point: Point) => {
    isDragging.current = true;
    setPath([point]);
  }, [setPath]);

  const move = useCallback((point: Point) => {
    if (!isDragging.current) return;

    setPath(prev => {
      // Don't add if already in path (no revisiting tiles)
      if (prev.some(p => p.x === point.x && p.y === point.y)) {
        // Check if backtracking to previous tile
        if (prev.length >= 2) {
          const secondLast = prev[prev.length - 2];
          if (secondLast.x === point.x && secondLast.y === point.y) {
            // Remove the last tile (backtrack)
            return prev.slice(0, -1);
          }
        }
        return prev;
      }

      // Only add if adjacent to last tile
      const last = prev[prev.length - 1];
      if (last && isAdjacent(last, point)) {
        return [...prev, point];
      }

      return prev;
    });
  }, [setPath]);

  const end = useCallback(() => {
    isDragging.current = false;
  }, []);

  return { start, move, end };
}