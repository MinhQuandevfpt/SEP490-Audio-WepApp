import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface SelectAllBarProps {
  allSelected: boolean;
  itemCount: number;
  onToggleAll: () => void;
}

const SelectAllBar: React.FC<SelectAllBarProps> = ({ allSelected, itemCount, onToggleAll }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
      <button onClick={onToggleAll} className="flex items-center gap-2 text-gray-700">
        {allSelected ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5 text-gray-400" />}
        <span>Chọn tất cả ({itemCount} sản phẩm)</span>
      </button>
    </div>
  );
};

export default SelectAllBar;


