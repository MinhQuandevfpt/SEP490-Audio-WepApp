import React from 'react';
import { RotateCw, Trash2, User } from 'lucide-react';
import type { Listener } from './index';

interface ListenerControlsProps {
  listener: Listener;
  onUpdate: (updates: Partial<Listener>) => void;
  onRemove: () => void;
}

const ListenerControls: React.FC<ListenerControlsProps> = ({ listener, onUpdate, onRemove }) => {
  const rotateStep = Math.PI / 4; // Xoay 45 độ

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
            ⚠️ Click vào listener trong 3D để chọn trước khi di chuyển
          </div>
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
