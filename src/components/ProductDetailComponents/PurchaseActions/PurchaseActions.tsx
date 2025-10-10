import React from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';

interface PurchaseActionsProps {
  inStock: boolean;
  colors?: Array<{ name: string; hex: string }>;
}

const PurchaseActions: React.FC<PurchaseActionsProps> = ({ inStock, colors }) => {
  const [qty, setQty] = React.useState(1);
  const [color, setColor] = React.useState(colors?.[0]?.name ?? '');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="mb-4">
        <span className="text-sm text-gray-500">Tình trạng</span>
        <div className={`mt-1 font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>{inStock ? 'Còn hàng' : 'Hết hàng'}</div>
      </div>

      {colors && colors.length > 0 && (
        <div className="mb-4">
          <span className="text-sm text-gray-500">Màu sắc</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.name)}
                className={`px-3 py-1 rounded-full border text-sm ${color === c.name ? 'border-orange-500 text-orange-600' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
              >
                <span className="inline-block w-4 h-4 rounded-full mr-2 ring-1 ring-gray-300" style={{ backgroundColor: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <span className="text-sm text-gray-500">Số lượng</span>
        <div className="mt-2 inline-flex items-center border rounded-lg overflow-hidden">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-50">-</button>
          <input value={qty} inputMode="numeric" pattern="[0-9]*" onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-12 text-center outline-none" />
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-50">+</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 border border-orange-500 text-orange-600 py-3 rounded-lg hover:bg-orange-50 transition-colors">
          <ShoppingCart className="w-5 h-5" /> Thêm vào giỏ
        </button>
        <button className="flex items-center justify-center gap-2 text-white py-3 rounded-lg transition-colors" style={{ backgroundColor: '#FF6F00' }}>
          <CreditCard className="w-5 h-5" /> Mua ngay
        </button>
      </div>
    </div>
  );
};

export default PurchaseActions;


