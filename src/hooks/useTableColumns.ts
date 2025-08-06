
import { useState, useMemo, useEffect } from 'react';

interface Column {
  key: string;
  title: string;
  width: number;
  minWidth: number;
  order: number;
  isFixed?: boolean;
}

interface UseTableColumnsProps {
  initialColumns: Array<{
    key: string;
    title: string;
    defaultWidth?: number;
    minWidth?: number;
    isFixed?: boolean;
  }>;
  onColumnOrderChange?: (newOrder: string[]) => void;
  visibleColumnKeys?: string[];
}

export const useTableColumns = ({ initialColumns, onColumnOrderChange, visibleColumnKeys }: UseTableColumnsProps) => {
  const [columns, setColumns] = useState<Column[]>(() => {
    const totalWidth = 1200;
    const flexibleColumns = initialColumns.filter(col => !col.isFixed);
    const fixedWidth = initialColumns
      .filter(col => col.isFixed)
      .reduce((sum, col) => sum + (col.defaultWidth || 200), 0);
    
    const availableWidth = totalWidth - fixedWidth;
    const defaultFlexWidth = Math.max(150, availableWidth / flexibleColumns.length);
    
    return initialColumns.map((col, index) => ({
      key: col.key,
      title: col.title,
      width: col.isFixed ? (col.defaultWidth || 200) : (col.defaultWidth || defaultFlexWidth),
      minWidth: col.minWidth || (col.isFixed ? 150 : 120),
      order: index,
      isFixed: col.isFixed || false
    }));
  });

  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Auto-fit columns when visible columns change
  useEffect(() => {
    if (visibleColumnKeys) {
      setColumns(prev => {
        const totalWidth = 1200;
        const visibleColumns = prev.filter(col => visibleColumnKeys.includes(col.key));
        const fixedColumns = visibleColumns.filter(col => col.isFixed);
        const flexibleColumns = visibleColumns.filter(col => !col.isFixed);
        
        if (flexibleColumns.length === 0) return prev;
        
        const fixedWidth = fixedColumns.reduce((sum, col) => sum + col.width, 0);
        const availableWidth = totalWidth - fixedWidth;
        const averageFlexWidth = Math.max(120, availableWidth / flexibleColumns.length);
        
        return prev.map(col => {
          if (col.isFixed || !visibleColumnKeys.includes(col.key)) {
            return col;
          }
          
          const newWidth = Math.max(col.minWidth, averageFlexWidth);
          return { ...col, width: newWidth };
        });
      });
    }
  }, [visibleColumnKeys]);

  const sortedColumns = useMemo(() => {
    return columns.sort((a, b) => a.order - b.order);
  }, [columns]);

  const updateColumnWidth = (columnIndex: number, newWidth: number) => {
    setColumns(prev => prev.map((col, index) => 
      index === columnIndex 
        ? { ...col, width: Math.max(col.minWidth, newWidth) }
        : col
    ));
  };

  const reorderColumns = (draggedColumnIndex: number, targetIndex: number) => {
    const draggedColumn = columns[draggedColumnIndex];
    
    if (!draggedColumn.isFixed && targetIndex !== draggedColumnIndex) {
      setColumns(prev => {
        const newColumns = [...prev];
        const [movedColumn] = newColumns.splice(draggedColumnIndex, 1);
        newColumns.splice(targetIndex, 0, movedColumn);
        
        const updatedColumns = newColumns.map((col, index) => ({
          ...col,
          order: index
        }));
        
        onColumnOrderChange?.(updatedColumns.map(col => col.key));
        
        return updatedColumns;
      });
    }
  };

  const handleColumnOrderChange = (newOrder: string[]) => {
    setColumnOrder(newOrder);
  };

  return {
    columns,
    sortedColumns,
    columnOrder,
    updateColumnWidth,
    reorderColumns,
    handleColumnOrderChange
  };
};
