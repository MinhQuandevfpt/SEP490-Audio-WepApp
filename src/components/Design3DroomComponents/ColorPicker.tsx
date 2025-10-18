import React from 'react';
import { Palette } from 'lucide-react';
import type { RoomColors } from './index';

interface ColorPickerProps {
  colors: RoomColors;
  onColorChange: (wallType: keyof RoomColors, color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ colors, onColorChange }) => {
  const wallTypes = [
    { key: 'floor' as keyof RoomColors, label: 'Sàn nhà', icon: '🏠' },
    { key: 'ceiling' as keyof RoomColors, label: 'Trần nhà', icon: '☁️' },
    { key: 'leftWall' as keyof RoomColors, label: 'Tường trái', icon: '🧱' },
    { key: 'rightWall' as keyof RoomColors, label: 'Tường phải', icon: '🧱' },
    { key: 'backWall' as keyof RoomColors, label: 'Tường sau', icon: '🧱' }
  ];

  const predefinedColors = [
    '#8B4513', '#D2B48C', '#F5F5DC', '#E6E6FA', '#FFF8DC',
    '#F0F8FF', '#F5FFFA', '#FFFACD', '#FFE4E1', '#F0FFFF',
    '#E0FFFF', '#F0E68C', '#DDA0DD', '#98FB98', '#F0E68C',
    '#FFB6C1', '#D3D3D3', '#A9A9A9', '#696969', '#2F4F4F'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Palette className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">Tô màu phòng</h3>
      </div>
      
      <div className="space-y-3">
        {wallTypes.map((wall) => (
          <div key={wall.key} className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{wall.icon}</span>
              <label className="text-sm font-medium text-gray-700">{wall.label}</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={colors[wall.key]}
                onChange={(e) => onColorChange(wall.key, e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colors[wall.key]}
                onChange={(e) => onColorChange(wall.key, e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Màu sắc có sẵn</h4>
        <div className="grid grid-cols-5 gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color}
              onClick={() => {
                // Áp dụng màu cho tất cả các tường
                wallTypes.forEach(wall => {
                  onColorChange(wall.key, color);
                });
              }}
              className="w-8 h-8 rounded border border-gray-300 hover:border-orange-500 transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
