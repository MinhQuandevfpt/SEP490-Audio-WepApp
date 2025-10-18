import React, { useState } from 'react';
import { Plus, Trash2, Move, User, Users } from 'lucide-react';
import type { Listener } from './index';

interface ListenerDesignSectionProps {
  listeners: Listener[];
  onAddListener: (listener: Omit<Listener, 'id'>) => void;
  onRemoveListener: (id: string) => void;
  onUpdateListener: (id: string, updates: Partial<Listener>) => void;
}

const ListenerDesignSection: React.FC<ListenerDesignSectionProps> = ({
  listeners,
  onAddListener,
  onRemoveListener,
  onUpdateListener
}) => {
  const [newListenerName, setNewListenerName] = useState<string>('');

  const handleAddListener = () => {
    const name = newListenerName.trim() || `Người nghe ${listeners.length + 1}`;
    const newListener: Omit<Listener, 'id'> = {
      name,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      isActive: true
    };
    onAddListener(newListener);
    setNewListenerName('');
  };

  const toggleActive = (listenerId: string, isActive: boolean) => {
    onUpdateListener(listenerId, { isActive: !isActive });
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
        
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Tên người nghe</label>
          <input
            type="text"
            value={newListenerName}
            onChange={(e) => setNewListenerName(e.target.value)}
            placeholder="Nhập tên người nghe..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleAddListener}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm người nghe</span>
        </button>
      </div>

      {/* Listener List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Danh sách người nghe</h4>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>{listeners.length} người</span>
          </div>
        </div>
        
        {listeners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">👥</span>
            <p className="text-sm">Chưa có người nghe nào</p>
            <p className="text-xs">Thêm người nghe để thiết kế vị trí nghe tối ưu</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {listeners.map((listener) => (
              <div
                key={listener.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  listener.isActive
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className={`w-4 h-4 ${
                      listener.isActive ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      listener.isActive ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {listener.name}
                    </span>
                    {listener.isActive && (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleActive(listener.id, listener.isActive)}
                      className={`p-1 transition-colors ${
                        listener.isActive 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title={listener.isActive ? 'Tắt' : 'Bật'}
                    >
                      <User className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onUpdateListener(listener.id, { 
                        position: [Math.random() * 4 - 2, 0, Math.random() * 3 - 1.5] 
                      })}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Di chuyển"
                    >
                      <Move className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveListener(listener.id)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Vị trí: ({listener.position[0].toFixed(1)}, {listener.position[1].toFixed(1)}, {listener.position[2].toFixed(1)})
                </div>
                
                {listener.isActive && (
                  <div className="mt-2 text-xs text-green-600">
                    ✓ Đang hoạt động - Có thể nghe thử âm thanh
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {listeners.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Thao tác nhanh</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                listeners.forEach(listener => {
                  onUpdateListener(listener.id, { isActive: true });
                });
              }}
              className="p-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Bật tất cả
            </button>
            <button
              onClick={() => {
                listeners.forEach(listener => {
                  onUpdateListener(listener.id, { isActive: false });
                });
              }}
              className="p-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Tắt tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListenerDesignSection;
