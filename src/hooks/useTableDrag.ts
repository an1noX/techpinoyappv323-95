
import { useState, useCallback, useEffect } from 'react';

interface DragState {
  columnIndex: number;
  startX: number;
  dragElement: HTMLElement | null;
}

interface UseTableDragProps {
  columns: Array<{ isFixed?: boolean }>;
  onColumnReorder: (draggedIndex: number, targetIndex: number) => void;
}

export const useTableDrag = ({ columns, onColumnReorder }: UseTableDragProps) => {
  const [isDragging, setIsDragging] = useState<DragState | null>(null);

  const startDrag = useCallback((columnIndex: number, startX: number, dragElement: HTMLElement | null) => {
    if (!columns[columnIndex]?.isFixed) {
      setIsDragging({ columnIndex, startX, dragElement });
      console.log('Starting drag for column:', columnIndex);
    }
  }, [columns]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const diff = e.clientX - isDragging.startX;
      if (Math.abs(diff) > 5) {
        document.body.style.cursor = 'grabbing';
      }
    }
  }, [isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const draggedColumnIndex = isDragging.columnIndex;
      const draggedColumn = columns[draggedColumnIndex];
      
      console.log('Ending drag for column:', draggedColumnIndex);
      
      if (!draggedColumn?.isFixed) {
        // Find the table element by looking for it in the document
        const tableElement = document.querySelector('.resizable-table table');
        if (tableElement) {
          const headers = tableElement.querySelectorAll('th');
          let targetIndex = draggedColumnIndex;
          
          for (let i = 0; i < headers.length; i++) {
            const rect = headers[i].getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right) {
              const columnKey = headers[i].getAttribute('data-column-key');
              if (columnKey) {
                // Find the column index based on the column key
                const targetColumnIndex = Array.from(headers).findIndex(header => 
                  header.getAttribute('data-column-key') === columnKey
                );
                if (targetColumnIndex >= 0) {
                  const correspondingColumn = columns[targetColumnIndex];
                  if (correspondingColumn && !correspondingColumn.isFixed) {
                    targetIndex = targetColumnIndex;
                    break;
                  }
                }
              }
            }
          }

          if (targetIndex !== draggedColumnIndex) {
            console.log('Reordering column from', draggedColumnIndex, 'to', targetIndex);
            onColumnReorder(draggedColumnIndex, targetIndex);
          }
        }
      }
      
      document.body.style.cursor = '';
      setIsDragging(null);
    }
  }, [isDragging, columns, onColumnReorder]);

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent) => handleMouseMove(e);
      const handleUp = (e: MouseEvent) => handleMouseUp(e);
      
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging: !!isDragging,
    startDrag
  };
};
