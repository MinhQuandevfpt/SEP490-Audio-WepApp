import React from 'react';
import type { ShippingMethod } from '../../data/checkout';
import { Truck, Timer } from 'lucide-react';

interface Props {
  value: ShippingMethod;
  onChange: (m: ShippingMethod) => void;
  getPrice: (m: ShippingMethod) => number;
}

const labels: Record<ShippingMethod, { title: string; desc: string }> = {
  economy: { title: 'Tiết kiệm', desc: '2-4 ngày' },
  standard: { title: 'Tiêu chuẩn', desc: '1-3 ngày' },
  express: { title: 'Hỏa tốc', desc: 'Trong ngày' },
};

const ShippingMethodSelector: React.FC<Props> = ({ value, onChange, getPrice }) => {
  const methods: ShippingMethod[] = ['economy', 'standard', 'express'];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Truck className="w-5 h-5 text-orange-600" /> Phương thức vận chuyển</h3>
      <div className="space-y-2">
        {methods.map(m => (
          <label key={m} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${value === m ? 'border-orange-400 bg-orange-50' : ''}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="ship" checked={value === m} onChange={() => onChange(m)} />
              <div>
                <p className="text-sm font-medium text-gray-900">{labels[m].title}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1"><Timer className="w-3 h-3" /> {labels[m].desc}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900">{new Intl.NumberFormat('vi-VN').format(getPrice(m))}đ</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ShippingMethodSelector;


