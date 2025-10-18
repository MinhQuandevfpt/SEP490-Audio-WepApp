import React from 'react';
import { Home, Bed, ChefHat } from 'lucide-react';
import type { RoomPreset } from './index';

interface RoomPresetsProps {
  onSelectPreset: (preset: RoomPreset) => void;
}

const RoomPresets: React.FC<RoomPresetsProps> = ({ onSelectPreset }) => {
  const presets: RoomPreset[] = [
    {
      id: 'living-room',
      name: 'Phòng khách',
      dimensions: { length: 4.8, width: 4.2, height: 3.0 },
      colors: {
        floor: '#8B4513',
        ceiling: '#F5F5DC',
        leftWall: '#D2B48C',
        rightWall: '#D2B48C',
        backWall: '#D2B48C'
      },
      description: 'Phòng khách tiêu chuẩn với diện tích ~20m²'
    },
    {
      id: 'bedroom',
      name: 'Phòng ngủ',
      dimensions: { length: 4.0, width: 3.5, height: 2.9 },
      colors: {
        floor: '#8B4513',
        ceiling: '#F5F5DC',
        leftWall: '#E6E6FA',
        rightWall: '#E6E6FA',
        backWall: '#E6E6FA'
      },
      description: 'Phòng ngủ tiêu chuẩn với diện tích ~14m²'
    },
    {
      id: 'kitchen',
      name: 'Phòng ăn / Bếp',
      dimensions: { length: 3.5, width: 3.0, height: 2.8 },
      colors: {
        floor: '#8B4513',
        ceiling: '#F5F5DC',
        leftWall: '#FFF8DC',
        rightWall: '#FFF8DC',
        backWall: '#FFF8DC'
      },
      description: 'Phòng ăn/bếp tiêu chuẩn với diện tích ~10.5m²'
    }
  ];

  const getIcon = (presetId: string) => {
    switch (presetId) {
      case 'living-room':
        return <Home className="w-5 h-5" />;
      case 'bedroom':
        return <Bed className="w-5 h-5" />;
      case 'kitchen':
        return <ChefHat className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Loại phòng tiêu chuẩn</h3>
      <div className="space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                {getIcon(preset.id)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{preset.name}</h4>
                <p className="text-sm text-gray-600">{preset.description}</p>
                <div className="flex space-x-4 mt-1">
                  <span className="text-xs text-gray-500">
                    {preset.dimensions.length}m × {preset.dimensions.width}m × {preset.dimensions.height}m
                  </span>
                  <span className="text-xs text-orange-600 font-medium">
                    {(preset.dimensions.length * preset.dimensions.width).toFixed(1)}m²
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomPresets;
