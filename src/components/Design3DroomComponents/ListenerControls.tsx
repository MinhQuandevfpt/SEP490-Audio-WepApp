import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Trash2, User } from 'lucide-react';
import type { Listener } from './index';

interface ListenerControlsProps {
  listener: Listener;
  onUpdate: (updates: Partial<Listener>) => void;
  onRemove: () => void;
}

const ListenerControls: React.FC<ListenerControlsProps> = ({ listener, onUpdate, onRemove }) => {
  const moveStep = 0.5; // Bước di chuyển 0.5m
  const rotateStep = Math.PI / 4; // Xoay 45 độ

  const moveListener = (axis: 'x' | 'y' | 'z', direction: 1 | -1) => {
    const newPosition = [...listener.position] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] += direction * moveStep;
    
    // Giới hạn di chuyển trong phòng (tùy chỉnh theo kích thước phòng)
    newPosition[axisIndex] = Math.max(-2, Math.min(2, newPosition[axisIndex]));
    
    onUpdate({ position: newPosition });
  };

  const rotateListener = () => {
    const newRotation = [...listener.rotation] as [number, number, number];
    newRotation[1] += rotateStep; // Xoay quanh trục Y
    onUpdate({ rotation: newRotation });
  };

  const toggleActive = () => {
    onUpdate({ isActive: !listener.isActive });
  };

  return (
    <div className="space-y-3">
      {/* Position Display */}
      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        <div className="font-medium mb-1">Vị trí hiện tại:</div>
        <div>X: {listener.position[0].toFixed(1)}m</div>
        <div>Y: {listener.position[1].toFixed(1)}m</div>
        <div>Z: {listener.position[2].toFixed(1)}m</div>
        <div className="mt-1 pt-1 border-t border-gray-300">
          Trạng thái: <span className={listener.isActive ? 'text-green-600' : 'text-gray-500'}>
            {listener.isActive ? 'Hoạt động' : 'Không hoạt động'}
          </span>
        </div>
      </div>

      {/* Movement Controls */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Di chuyển:</div>
        
        {/* X-axis (Left/Right) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 w-8">X:</span>
          <button
            onClick={() => moveListener('x', -1)}
            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            title="Di chuyển trái"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => moveListener('x', 1)}
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
            onClick={() => moveListener('y', -1)}
            className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
            title="Di chuyển xuống"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => moveListener('y', 1)}
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
            onClick={() => moveListener('z', -1)}
            className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            title="Di chuyển ra sau"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => moveListener('z', 1)}
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
            onClick={rotateListener}
            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
            title="Xoay 45°"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            onClick={toggleActive}
            className={`p-1 transition-colors ${
              listener.isActive 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-gray-500 hover:text-gray-600'
            }`}
            title={listener.isActive ? 'Tắt hoạt động' : 'Bật hoạt động'}
          >
            <User className="w-3 h-3" />
          </button>
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

export default ListenerControls;
