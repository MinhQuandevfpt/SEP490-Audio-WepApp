import React from 'react';
import { Trash2, Minus, Plus, CheckSquare, Square } from 'lucide-react';
import type { CartItem } from '../../data/shoppingcart';
import { formatCurrency } from '../../data/shoppingcart';

interface CartItemRowProps {
  item: CartItem;
  onToggle: (id: string) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item: it, onToggle, onInc, onDec, onRemove }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
      <button onClick={() => onToggle(it.id)} className="mt-1">
        {it.isSelected ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5 text-gray-400" />}
      </button>
      <img src={it.image} alt={it.name} className="w-20 h-20 rounded object-cover border" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-gray-900 font-medium truncate" title={it.name}>{it.name}</p>
            <p className="text-sm text-gray-500 mt-1">Phân loại: {it.variant || 'Mặc định'}</p>
            {it.shopName && <p className="text-sm text-gray-500">Cửa hàng: {it.shopName}</p>}
          </div>
          <button onClick={() => onRemove(it.id)} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {it.originalPrice && (
              <span className="text-sm text-gray-400 line-through">{formatCurrency(it.originalPrice)}</span>
            )}
            <span className="text-lg font-semibold text-orange-600">{formatCurrency(it.price)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onDec(it.id)} className="px-2 py-1 border rounded hover:bg-gray-50">
              <Minus className="w-4 h-4" />
            </button>
            <input value={it.quantity} readOnly className="w-12 text-center border rounded py-1" />
            <button onClick={() => onInc(it.id)} className="px-2 py-1 border rounded hover:bg-gray-50">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemRow;


