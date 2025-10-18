import React from 'react';
import RoomPresets from './RoomPresets';
import DimensionControls from './DimensionControls';
import ColorPicker from './ColorPicker';
import RoomInfo from './RoomInfo';
import type { Dimensions, RoomColors, RoomPreset } from './index';

interface RoomDesignSectionProps {
  dimensions: Dimensions;
  colors: RoomColors;
  onDimensionChange: (key: keyof Dimensions, value: number) => void;
  onColorChange: (wallType: keyof RoomColors, color: string) => void;
  onPresetSelect: (preset: RoomPreset) => void;
  onReset: () => void;
}

const RoomDesignSection: React.FC<RoomDesignSectionProps> = ({
  dimensions,
  colors,
  onDimensionChange,
  onColorChange,
  onPresetSelect,
  onReset
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🏠</span>
        <h3 className="text-lg font-semibold text-gray-800">Thiết kế phòng</h3>
      </div>
      
      <div className="space-y-6">
        <RoomPresets onSelectPreset={onPresetSelect} />
        
        <DimensionControls
          dimensions={dimensions}
          onDimensionChange={onDimensionChange}
          onReset={onReset}
        />
        
        <ColorPicker
          colors={colors}
          onColorChange={onColorChange}
        />
        
        <RoomInfo dimensions={dimensions} />
      </div>
    </div>
  );
};

export default RoomDesignSection;
