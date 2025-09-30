import { useCallback, useEffect, useRef, useState } from 'react';

interface Position {
  row: number;
  col: number;
}

interface UseKeyboardNavigationProps {
  rowCount: number;
  colCount: number;
  onFocusChange?: (position: Position) => void;
  focusableSelector?: string;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  rowCount,
  colCount,
  onFocusChange,
  focusableSelector = 'input, select, button',
  enabled = true,
}: UseKeyboardNavigationProps) => {
  const [currentPosition, setCurrentPosition] = useState<Position>({ row: 0, col: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const lastInteractionType = useRef<'keyboard' | 'mouse'>('keyboard');

  const getFocusableElements = useCallback(() => {
    if (!gridRef.current) return [];
    return Array.from(gridRef.current.querySelectorAll(focusableSelector));
  }, [focusableSelector]);

  const getElementAtPosition = useCallback(
    (position: Position) => {
      const elements = getFocusableElements();
      const index = position.row * colCount + position.col;
      return elements[index] as HTMLElement | undefined;
    },
    [colCount, getFocusableElements]
  );

  const moveFocus = useCallback(
    (newPosition: Position) => {
      const clampedPosition = {
        row: Math.max(0, Math.min(newPosition.row, rowCount - 1)),
        col: Math.max(0, Math.min(newPosition.col, colCount - 1)),
      };

      const element = getElementAtPosition(clampedPosition);
      if (element) {
        element.focus();
        setCurrentPosition(clampedPosition);
        onFocusChange?.(clampedPosition);
      }
    },
    [rowCount, colCount, getElementAtPosition, onFocusChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const moveMap: Record<string, (pos: Position) => Position> = {
        ArrowUp: (pos) => ({ ...pos, row: pos.row - 1 }),
        ArrowDown: (pos) => ({ ...pos, row: pos.row + 1 }),
        ArrowLeft: (pos) => ({ ...pos, col: pos.col - 1 }),
        ArrowRight: (pos) => ({ ...pos, col: pos.col + 1 }),
        Tab: (pos) => ({
          row: pos.col === colCount - 1 ? pos.row + 1 : pos.row,
          col: pos.col === colCount - 1 ? 0 : pos.col + 1,
        }),
      };

      const move = moveMap[event.key];
      if (move) {
        event.preventDefault();
        lastInteractionType.current = 'keyboard';
        moveFocus(move(currentPosition));
      }
    },
    [enabled, colCount, currentPosition, moveFocus]
  );

  const handleMouseInteraction = useCallback(() => {
    lastInteractionType.current = 'mouse';
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const grid = gridRef.current;
    if (!grid) return;

    grid.addEventListener('keydown', handleKeyDown);
    grid.addEventListener('mousedown', handleMouseInteraction);
    grid.addEventListener('touchstart', handleMouseInteraction);

    return () => {
      grid.removeEventListener('keydown', handleKeyDown);
      grid.removeEventListener('mousedown', handleMouseInteraction);
      grid.removeEventListener('touchstart', handleMouseInteraction);
    };
  }, [enabled, handleKeyDown, handleMouseInteraction]);

  return {
    gridRef,
    currentPosition,
    setCurrentPosition,
    lastInteractionType: lastInteractionType.current,
  };
}; 