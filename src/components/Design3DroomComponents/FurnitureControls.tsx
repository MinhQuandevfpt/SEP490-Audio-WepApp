import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Trash2 } from 'lucide-react';
import FurnitureColorPicker from './FurnitureColorPicker';
import type { Furniture } from './index';

interface FurnitureControlsProps {
  furniture: Furniture;
  onUpdate: (updates: Partial<Furniture>) => void;
  onRemove: () => void;
}

const FurnitureControls: React.FC<FurnitureControlsProps> = ({ furniture, onUpdate, onRemove }) => {
  const moveStep = 0.5; // Bước di chuyển 0.5m
  const rotateStep = Math.PI / 4; // Xoay 45 độ

  const moveFurniture = (axis: 'x' | 'y' | 'z', direction: 1 | -1) => {
    const newPosition = [...furniture.position] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] += direction * moveStep;
    
    // Giới hạn di chuyển trong phòng (tùy chỉnh theo kích thước phòng)
    newPosition[axisIndex] = Math.max(-2, Math.min(2, newPosition[axisIndex]));
    
    onUpdate({ position: newPosition });
  };

  const rotateFurniture = () => {
    const newRotation = [...furniture.rotation] as [number, number, number];
    newRotation[1] += rotateStep; // Xoay quanh trục Y
    onUpdate({ rotation: newRotation });
  };

  return (
    <div className="space-y-3">
      {/* Position Display */}
      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        <div className="font-medium mb-1">Vị trí hiện tại:</div>
        <div>X: {furniture.position[0].toFixed(1)}m</div>
        <div>Y: {furniture.position[1].toFixed(1)}m</div>
        <div>Z: {furniture.position[2].toFixed(1)}m</div>
      </div>

      {/* Movement Controls */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Di chuyển:</div>
        
        {/* X-axis (Left/Right) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 w-8">X:</span>
          <button
            onClick={() => moveFurniture('x', -1)}
            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            title="Di chuyển trái"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => moveFurniture('x', 1)}
            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            title="Di chuyển phải"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Y-axis (Up/Down) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 w-8">Y:</span>
          <button
            onClick={() => moveFurniture('y', -1)}
            className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
            title="Di chuyển xuống"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => moveFurniture('y', 1)}
            className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
            title="Di chuyển lên"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>

        {/* Z-axis (Forward/Backward) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 w-8">Z:</span>
          <button
            onClick={() => moveFurniture('z', -1)}
            className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            title="Di chuyển ra sau"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => moveFurniture('z', 1)}
            className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            title="Di chuyển ra trước"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={rotateFurniture}
            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
            title="Xoay 45°"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <FurnitureColorPicker
            currentColor={furniture.color}
            onColorChange={(color) => onUpdate({ color })}
          />
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
          title="Xóa"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default FurnitureControls;
