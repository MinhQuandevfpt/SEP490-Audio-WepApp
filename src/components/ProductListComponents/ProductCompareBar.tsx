import React from 'react';
import type { ComparePreview } from '../../hooks/useProductCompare';
import { X } from 'lucide-react';

interface ProductCompareBarProps {
  selected: ComparePreview[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

export const ProductCompareBar: React.FC<ProductCompareBarProps> = ({
  selected,
  onRemove,
  onClear,
  onCompare,
}) => {
  if (selected.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40">
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              So sánh sản phẩm ({selected.length}/3)
            </p>
            <p className="text-xs text-gray-500">Chỉ hỗ trợ sản phẩm cùng danh mục</p>
          </div>
          <button
            onClick={onClear}
            className="text-sm text-gray-500 hover:text-gray-700"
            type="button"
          >
            Xóa tất cả
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {selected.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 min-w-[160px]"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{item.categoryName}</p>
              </div>
              <button
                onClick={() => onRemove(item.productId)}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={onCompare}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selected.length < 2}
            type="button"
          >
            So sánh ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCompareBar;

