import React from 'react';
import DimensionControls from './DimensionControls';
import RoomInfo from './RoomInfo';
import Instructions from './Instructions';
import RoomPresets from './RoomPresets';
import ColorPicker from './ColorPicker';
import type { Dimensions, RoomColors, RoomPreset } from './index';

interface ControlsPanelProps {
  dimensions: Dimensions;
  colors: RoomColors;
  onDimensionChange: (key: keyof Dimensions, value: number) => void;
  onColorChange: (wallType: keyof RoomColors, color: string) => void;
  onPresetSelect: (preset: RoomPreset) => void;
  onReset: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  dimensions,
  colors,
  onDimensionChange,
  onColorChange,
  onPresetSelect,
  onReset
}) => {

  try {

  return (
    <div className="w-80 bg-white shadow-lg border-r border-gray-200 p-6 overflow-y-auto">
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
        
        <Instructions />
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error rendering ControlsPanel:', error);
    return (
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 p-6">
        <div className="text-red-600">Lỗi khi tải panel điều khiển</div>
      </div>
    );
  }
};

export default ControlsPanel;
