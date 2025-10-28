import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const predefinedColors = [
    '#8B4513', // Brown (default)
    '#654321', // Dark brown
    '#A0522D', // Sienna
    '#D2691E', // Chocolate
    '#CD853F', // Peru
    '#DEB887', // Burlywood
    '#F4A460', // Sandy brown
    '#D2B48C', // Tan
    '#BC8F8F', // Rosy brown
    '#F5DEB3', // Wheat
    '#2F4F4F', // Dark slate gray
    '#708090', // Slate gray
    '#696969', // Dim gray
    '#808080', // Gray
    '#A9A9A9', // Dark gray
    '#C0C0C0', // Silver
    '#DCDCDC', // Gainsboro
    '#F5F5F5', // White smoke
    '#000000', // Black
    '#FFFFFF'  // White
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 p-1 text-gray-500 hover:text-blue-600 transition-colors"
        title="Thay đổi màu"
      >
        <Palette className="w-3 h-3" />
        <div 
          className="w-4 h-4 rounded border border-gray-300"
          style={{ backgroundColor: currentColor }}
        />
      </button>

      {isOpen && (
        <div className="absolute top-8 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
          <div className="text-xs font-medium text-gray-700 mb-2">Chọn màu:</div>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {predefinedColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                  currentColor === color 
                    ? 'border-gray-800 scale-110' 
                    : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          
          {/* Custom color input */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Màu tùy chỉnh:</div>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
