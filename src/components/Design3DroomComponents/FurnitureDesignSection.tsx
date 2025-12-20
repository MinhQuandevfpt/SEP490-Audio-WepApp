import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import FurnitureControls from './FurnitureControls';
import type { Furniture } from './index';

interface FurnitureDesignSectionProps {
  furniture: Furniture[];
  onAddFurniture: (furniture: Omit<Furniture, 'id'>) => void;
  onRemoveFurniture: (id: string) => void;
  onUpdateFurniture: (id: string, updates: Partial<Furniture>) => void;
  selectedFurnitureId?: string | null;
  onSelectFurniture?: (id: string | null) => void;
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
  onUpdateFurniture,
  selectedFurnitureId,
  onSelectFurniture
}) => {
  const [selectedType, setSelectedType] = useState<string>('table');

  const handleAddFurniture = () => {
    // Tạo màu ngẫu nhiên để tránh trùng màu
    const colors = [
      '#8B4513', '#654321', '#A0522D', '#D2691E', '#CD853F', 
      '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F', '#F5DEB3',
      '#2F4F4F', '#708090', '#696969', '#808080', '#A9A9A9'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newFurniture: Omit<Furniture, 'id'> = {
      name: `${FURNITURE_TYPES.find(t => t.type === selectedType)?.name} ${furniture.length + 1}`,
      type: selectedType as any,
      position: [0, 0.5, 0], // Đặt trên sàn (Y = 0.5 để không bị chìm)
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: randomColor
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {furniture.map((item) => {
              const isSelected = selectedFurnitureId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectFurniture) {
                      // Toggle selection: nếu đã chọn thì deselect, nếu chưa chọn thì select
                      onSelectFurniture(isSelected ? null : item.id);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-orange-50 border-orange-500 shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {FURNITURE_TYPES.find(t => t.type === item.type)?.icon}
                      </span>
                      <span className={`text-sm font-medium ${
                        isSelected ? 'text-orange-800' : 'text-gray-800'
                      }`}>
                        {item.name}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-600 text-white">
                          Đã chọn
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <FurnitureControls
                    furniture={item}
                    onUpdate={(updates) => onUpdateFurniture(item.id, updates)}
                    onRemove={() => {
                      onRemoveFurniture(item.id);
                      // Deselect nếu đang chọn item này
                      if (isSelected && onSelectFurniture) {
                        onSelectFurniture(null);
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

export default FurnitureDesignSection;
