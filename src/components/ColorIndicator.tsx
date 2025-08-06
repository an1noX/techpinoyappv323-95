
import React from 'react';

interface ColorIndicatorProps {
  color?: string;
  size?: 'sm' | 'md';
}

const ColorIndicator: React.FC<ColorIndicatorProps> = ({ 
  color, 
  size = 'sm' 
}) => {
  if (!color) return null;

  const colorClasses = {
    cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-500',
    magenta: 'bg-fuchsia-500',
    black: 'bg-black',
  };

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  const bgClass = colorClasses[color as keyof typeof colorClasses] || 'bg-gray-300';

  return (
    <div 
      className={`${sizeClasses[size]} ${bgClass} rounded border border-gray-300 inline-block`}
      title={`Color: ${color}`}
    />
  );
};

export default ColorIndicator;
