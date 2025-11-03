import React from 'react';
import type { CheckoutCartItem } from '../../data/checkout';
import { Minus, Plus, Trash2, Box } from 'lucide-react';

interface Props {
  items: CheckoutCartItem[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
}

const CartItemList: React.FC<Props> = ({ items, onInc, onDec, onRemove }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Box className="w-5 h-5 text-orange-600" /> Sản phẩm</h3>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.id} className="flex gap-4 p-3 border rounded-lg">
            <img src={it.image} alt={it.name} className="w-16 h-16 rounded object-cover border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={it.name}>{it.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => onDec(it.id)} className="px-2 py-1 border rounded hover:bg-gray-50"><Minus className="w-4 h-4" /></button>
                  <input readOnly value={it.quantity} className="w-12 text-center border rounded py-1" />
                  <button onClick={() => onInc(it.id)} className="px-2 py-1 border rounded hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-3">
                  {it.originalPrice && <span className="text-xs text-gray-400 line-through">{new Intl.NumberFormat('vi-VN').format(it.originalPrice)}đ</span>}
                  <span className="text-sm font-semibold text-orange-600">{new Intl.NumberFormat('vi-VN').format(it.price * it.quantity)}đ</span>
                  <button onClick={() => onRemove(it.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-500">Giỏ hàng trống.</p>
        )}
      </div>
      <p className="text-xs text-gray-500">Bạn có thể chỉnh sửa số lượng hoặc xóa sản phẩm.</p>
    </div>
  );
};

export default CartItemList;


