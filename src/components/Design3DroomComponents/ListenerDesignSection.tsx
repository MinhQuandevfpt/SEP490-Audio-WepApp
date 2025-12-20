import React from 'react';
import { Plus } from 'lucide-react';
import ListenerControls from './ListenerControls';
import type { Listener } from './index';

interface ListenerDesignSectionProps {
  listeners: Listener[];
  onAddListener: (listener: Omit<Listener, 'id'>) => void;
  onRemoveListener: (id: string) => void;
  onUpdateListener: (id: string, updates: Partial<Listener>) => void;
  selectedListenerId?: string | null;
  onSelectListener?: (id: string | null) => void;
}

const ListenerDesignSection: React.FC<ListenerDesignSectionProps> = ({
  listeners,
  onAddListener,
  onRemoveListener,
  onUpdateListener,
  selectedListenerId,
  onSelectListener
}) => {
  const handleAddListener = () => {
    // Chỉ cho phép thêm 1 người nghe duy nhất
    if (listeners.length >= 1) {
      return;
    }
    
    const newListener: Omit<Listener, 'id'> = {
      name: 'Người nghe',
      position: [0, 0.9, 0], // Đặt trên sàn (Y = 0.9 để người đứng trên sàn)
      rotation: [0, 0, 0],
      isActive: true
    };
    onAddListener(newListener);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">👥</span>
        <h3 className="text-lg font-semibold text-gray-800">Vị trí người nghe</h3>
      </div>

      {/* Add Listener */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Thêm người nghe</h4>
        
        <button
          onClick={handleAddListener}
          disabled={listeners.length >= 1}
          className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors ${
            listeners.length >= 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>
            {listeners.length >= 1 ? 'Đã có người nghe' : 'Thêm người nghe'}
          </span>
        </button>
        
        {listeners.length >= 1 && (
          <div className="text-xs text-gray-500 text-center">
            Chỉ có thể thêm 1 người nghe để tránh bug hệ thống
          </div>
        )}
      </div>

      {/* Listener List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Danh sách người nghe</h4>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <span className="text-lg">👤</span>
            <span>{listeners.length}/1 người</span>
          </div>
        </div>
        
        {listeners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">👤</span>
            <p className="text-sm">Chưa có người nghe</p>
            <p className="text-xs">Thêm 1 người nghe để thiết kế vị trí nghe tối ưu</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {listeners.map((listener) => {
              const isSelected = selectedListenerId === listener.id;
              return (
                <div
                  key={listener.id}
                  onClick={() => {
                    if (onSelectListener) {
                      // Toggle selection: nếu đã chọn thì deselect, nếu chưa chọn thì select
                      onSelectListener(isSelected ? null : listener.id);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-green-50 border-green-500 shadow-md'
                      : listener.isActive
                      ? 'bg-green-50 border-green-200 hover:border-green-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg ${
                        isSelected || listener.isActive ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        👤
                      </span>
                      <span className={`text-sm font-medium ${
                        isSelected ? 'text-green-800' : listener.isActive ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {listener.name}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                          Đã chọn
                        </span>
                      )}
                      {!isSelected && listener.isActive && (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  
                  <ListenerControls
                    listener={listener}
                    onUpdate={(updates) => onUpdateListener(listener.id, updates)}
                    onRemove={() => {
                      onRemoveListener(listener.id);
                      // Deselect nếu đang chọn listener này
                      if (isSelected && onSelectListener) {
                        onSelectListener(null);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListenerDesignSection;
