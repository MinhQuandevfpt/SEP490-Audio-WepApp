import React, { useState } from 'react';
import { Plus, Trash2, Move, RotateCw } from 'lucide-react';
import type { Furniture } from './index';

interface FurnitureDesignSectionProps {
  furniture: Furniture[];
  onAddFurniture: (furniture: Omit<Furniture, 'id'>) => void;
  onRemoveFurniture: (id: string) => void;
  onUpdateFurniture: (id: string, updates: Partial<Furniture>) => void;
}

const FURNITURE_TYPES = [
  { type: 'table', name: 'Bàn', icon: '🪑' },
  { type: 'chair', name: 'Ghế', icon: '🪑' },
  { type: 'shelf', name: 'Kệ', icon: '📚' },
  { type: 'cabinet', name: 'Tủ', icon: '🗄️' },
  { type: 'bed', name: 'Giường', icon: '🛏️' }
] as const;

const FurnitureDesignSection: React.FC<FurnitureDesignSectionProps> = ({
  furniture,
  onAddFurniture,
  onRemoveFurniture,
  onUpdateFurniture
}) => {
  const [selectedType, setSelectedType] = useState<string>('table');

  const handleAddFurniture = () => {
    const newFurniture: Omit<Furniture, 'id'> = {
      name: `${FURNITURE_TYPES.find(t => t.type === selectedType)?.name} ${furniture.length + 1}`,
      type: selectedType as any,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#8B4513'
    };
    onAddFurniture(newFurniture);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🪑</span>
        <h3 className="text-lg font-semibold text-gray-800">Thiết kế nội thất</h3>
      </div>

      {/* Add Furniture */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Thêm nội thất</h4>
        
        <div className="grid grid-cols-2 gap-2">
          {FURNITURE_TYPES.map((type) => (
            <button
              key={type.type}
              onClick={() => setSelectedType(type.type)}
              className={`p-3 border-2 rounded-lg transition-all ${
                selectedType === type.type
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="text-center">
                <span className="text-2xl block mb-1">{type.icon}</span>
                <span className="text-xs font-medium">{type.name}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleAddFurniture}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nội thất</span>
        </button>
      </div>

      {/* Furniture List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Nội thất đã thêm</h4>
        
        {furniture.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">🪑</span>
            <p className="text-sm">Chưa có nội thất nào</p>
            <p className="text-xs">Thêm nội thất để bắt đầu thiết kế</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {furniture.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {FURNITURE_TYPES.find(t => t.type === item.type)?.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdateFurniture(item.id, { 
                        position: [Math.random() * 4 - 2, 0, Math.random() * 3 - 1.5] 
                      })}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Di chuyển"
                    >
                      <Move className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onUpdateFurniture(item.id, { 
                        rotation: [0, Math.random() * Math.PI * 2, 0] 
                      })}
                      className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                      title="Xoay"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveFurniture(item.id)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Vị trí: ({item.position[0].toFixed(1)}, {item.position[1].toFixed(1)}, {item.position[2].toFixed(1)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FurnitureDesignSection;
