import React, { useState } from 'react';
import type { ShippingMethod } from '../../data/checkout';
import { ChevronDown, Truck, Timer } from 'lucide-react';

interface Props {
  value: ShippingMethod | null;
  onChange: (m: ShippingMethod) => void;
  getPrice: (m: ShippingMethod) => number;
}

const labels: Record<ShippingMethod, { title: string; desc: string }> = {
  economy: { title: 'Tiết kiệm', desc: '2-4 ngày' },
  standard: { title: 'Tiêu chuẩn', desc: '1-3 ngày' },
  express: { title: 'Hỏa tốc', desc: 'Trong ngày' },
};

const ShippingMethodDropdown: React.FC<Props> = ({ value, onChange, getPrice }) => {
  const [open, setOpen] = useState(false);
  const methods: ShippingMethod[] = ['economy', 'standard', 'express'];
  const currentText = value ? `${labels[value].title} • ${new Intl.NumberFormat('vi-VN').format(getPrice(value))}đ` : '---chưa chọn phương thức vận chuyển---';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><Truck className="w-5 h-5 text-orange-600" /> Phương thức vận chuyển</h3>
      <div className="relative">
        <button onClick={() => setOpen(o => !o)} className="w-full border rounded-lg px-3 py-2 flex items-center justify-between text-sm">
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{currentText}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        {open && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow">
            {methods.map(m => (
              <button key={m} onClick={() => { onChange(m); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-900">{labels[m].title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Timer className="w-3 h-3" /> {labels[m].desc}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-900">{new Intl.NumberFormat('vi-VN').format(getPrice(m))}đ</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingMethodDropdown;


