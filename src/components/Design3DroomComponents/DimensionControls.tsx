import React from 'react';
import { RotateCcw } from 'lucide-react';

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

interface DimensionControlsProps {
  dimensions: Dimensions;
  onDimensionChange: (key: keyof Dimensions, value: number) => void;
  onReset: () => void;
}

const DimensionControls: React.FC<DimensionControlsProps> = ({
  dimensions,
  onDimensionChange,
  onReset
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Kích thước phòng
      </h2>
      
      <div className="space-y-4">
        {/* Chiều dài */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chiều dài (m)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={dimensions.length}
              onChange={(e) => onDimensionChange('length', parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="number"
              min="1"
              max="20"
              step="0.1"
              value={dimensions.length}
              onChange={(e) => onDimensionChange('length', parseFloat(e.target.value) || 1)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Chiều rộng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chiều rộng (m)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={dimensions.width}
              onChange={(e) => onDimensionChange('width', parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="number"
              min="1"
              max="20"
              step="0.1"
              value={dimensions.width}
              onChange={(e) => onDimensionChange('width', parseFloat(e.target.value) || 1)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Chiều cao */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chiều cao (m)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={dimensions.height}
              onChange={(e) => onDimensionChange('height', parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="number"
              min="1"
              max="20"
              step="0.1"
              value={dimensions.height}
              onChange={(e) => onDimensionChange('height', parseFloat(e.target.value) || 1)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Đặt lại mặc định
      </button>
    </div>
  );
};

export default DimensionControls;
