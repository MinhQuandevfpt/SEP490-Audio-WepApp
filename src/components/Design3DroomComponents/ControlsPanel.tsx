import React from 'react';
import DimensionControls from './DimensionControls';
import RoomInfo from './RoomInfo';
import Instructions from './Instructions';

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

interface ControlsPanelProps {
  isOpen: boolean;
  dimensions: Dimensions;
  onDimensionChange: (key: keyof Dimensions, value: number) => void;
  onReset: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  isOpen,
  dimensions,
  onDimensionChange,
  onReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white shadow-lg border-r border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        <DimensionControls
          dimensions={dimensions}
          onDimensionChange={onDimensionChange}
          onReset={onReset}
        />
        
        <RoomInfo dimensions={dimensions} />
        
        <Instructions />
      </div>
    </div>
  );
};

export default ControlsPanel;
