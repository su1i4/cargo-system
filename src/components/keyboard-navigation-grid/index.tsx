import React, { memo } from 'react';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

interface KeyboardNavigationGridProps {
  children: React.ReactNode;
  rowCount: number;
  colCount: number;
  onFocusChange?: (position: { row: number; col: number }) => void;
  focusableSelector?: string;
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const KeyboardNavigationGrid = memo(({
  children,
  rowCount,
  colCount,
  onFocusChange,
  focusableSelector,
  enabled = true,
  className,
  style,
}: KeyboardNavigationGridProps) => {
  const { gridRef } = useKeyboardNavigation({
    rowCount,
    colCount,
    onFocusChange,
    focusableSelector,
    enabled,
  });

  return (
    <div
      ref={gridRef}
      className={className}
      style={{
        outline: 'none',
        ...style,
      }}
      tabIndex={-1}
    >
      {children}
    </div>
  );
});

KeyboardNavigationGrid.displayName = 'KeyboardNavigationGrid';