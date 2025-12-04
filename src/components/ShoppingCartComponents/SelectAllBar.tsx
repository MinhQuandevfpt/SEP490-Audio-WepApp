import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface SelectAllBarProps {
  allSelected: boolean;
  itemCount: number;
  onToggleAll: () => void;
  onDeleteAll?: () => void;
}

const SelectAllBar: React.FC<SelectAllBarProps> = ({
  allSelected,
  itemCount,
  onToggleAll,
  onDeleteAll,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (!onDeleteAll) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (onDeleteAll) {
      onDeleteAll();
    }
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
        <button onClick={onToggleAll} className="flex items-center gap-2 text-gray-700">
          {allSelected ? (
            <CheckSquare className="w-5 h-5 text-orange-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
          <span>Chọn tất cả ({itemCount} sản phẩm)</span>
        </button>
        {onDeleteAll && (
          <button
            onClick={handleDeleteClick}
            className="ml-auto px-3 py-1.5 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xoá toàn bộ giỏ hàng?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xoá tất cả sản phẩm khỏi giỏ hàng? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 text-sm rounded bg-orange-500 text-white hover:bg-orange-600"
              >
                Đồng ý xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SelectAllBar;


