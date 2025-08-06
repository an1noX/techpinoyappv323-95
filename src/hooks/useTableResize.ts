
import { useState, useCallback, useEffect } from 'react';

interface ResizeState {
  columnIndex: number;
  startX: number;
  startWidth: number;
}

interface UseTableResizeProps {
  onColumnResize: (columnIndex: number, newWidth: number) => void;
}

export const useTableResize = ({ onColumnResize }: UseTableResizeProps) => {
  const [isResizing, setIsResizing] = useState<ResizeState | null>(null);

  const startResize = useCallback((columnIndex: number, startX: number, startWidth: number) => {
    setIsResizing({ columnIndex, startX, startWidth });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const diff = e.clientX - isResizing.startX;
      const newWidth = isResizing.startWidth + diff;
      onColumnResize(isResizing.columnIndex, newWidth);
    }
  }, [isResizing, onColumnResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    isResizing: !!isResizing,
    startResize
  };
};
