import React from 'react';

interface ColorSelectorProps {
  selectedColor?: string;
  selectedColors?: string[];
  onColorChange: (color: string | string[]) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  multiSelect?: boolean;
}

const colors = [
  { name: 'Cyan', value: 'cyan', bgClass: 'bg-cyan-500' },
  { name: 'Yellow', value: 'yellow', bgClass: 'bg-yellow-500' },
  { name: 'Magenta', value: 'magenta', bgClass: 'bg-fuchsia-500' },
  { name: 'Black', value: 'black', bgClass: 'bg-black' },
];

const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedColor,
  selectedColors,
  onColorChange,
  size = 'md',
  showLabel = true,
  multiSelect = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const boxSize = sizeClasses[size];

  const handleClick = (colorValue: string) => {
    if (multiSelect) {
      const arr = selectedColors || [];
      if (arr.includes(colorValue)) {
        onColorChange(arr.filter(c => c !== colorValue));
      } else {
        onColorChange([...arr, colorValue]);
      }
    } else {
      onColorChange(colorValue);
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700">
          Color Variation
        </label>
      )}
      <div className="flex space-x-2">
        {colors.map((color) => {
          const isSelected = multiSelect
            ? (selectedColors || []).includes(color.value)
            : selectedColor === color.value;
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => handleClick(color.value)}
              className={`
                ${boxSize} ${color.bgClass} rounded border-2 transition-all duration-200 hover:scale-110
                ${isSelected
                  ? 'border-gray-800 ring-2 ring-gray-300'
                  : 'border-gray-300 hover:border-gray-400'}
              `}
              title={color.name}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorSelector;
