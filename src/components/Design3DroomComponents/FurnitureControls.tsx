import React from 'react';
import { RotateCw, Trash2 } from 'lucide-react';
import FurnitureColorPicker from './FurnitureColorPicker';
import type { Furniture } from './index';

interface FurnitureControlsProps {
  furniture: Furniture;
  onUpdate: (updates: Partial<Furniture>) => void;
  onRemove: () => void;
}

const FurnitureControls: React.FC<FurnitureControlsProps> = ({ furniture, onUpdate, onRemove }) => {
  const rotateStep = Math.PI / 4; // Xoay 45 độ

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

      {/* Keyboard Controls Instructions */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Di chuyển:</div>
        <div className="text-xs text-gray-600 bg-orange-50 p-2 rounded border border-orange-200">
          <div className="font-medium mb-1 text-orange-700">💡 Hướng dẫn sử dụng phím:</div>
          <div className="space-y-0.5">
            <div>• <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">W</kbd> / <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">S</kbd>: Lên / Xuống</div>
            <div>• <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">A</kbd> / <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">D</kbd>: Trái / Phải</div>
            <div>• <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Alt</kbd> + <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">W</kbd>: Vào trong</div>
            <div>• <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Alt</kbd> + <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">S</kbd>: Ra phía trước</div>
          </div>
          <div className="mt-2 pt-2 border-t border-orange-200 text-orange-600">
            ⚠️ Click vào nội thất trong 3D để chọn trước khi di chuyển
          </div>
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
