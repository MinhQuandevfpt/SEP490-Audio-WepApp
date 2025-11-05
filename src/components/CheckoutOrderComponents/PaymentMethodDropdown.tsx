import React, { useState } from 'react';
import type { PaymentMethod } from '../../data/checkout';
import { ChevronDown, Banknote, Smartphone } from 'lucide-react';

interface Props {
  value: PaymentMethod | null;
  onChange: (m: PaymentMethod) => void;
  disabled?: boolean;
}

const items: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { key: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: <Banknote className="w-4 h-4" /> },
  { key: 'payos', label: 'PayOS', icon: <Smartphone className="w-4 h-4" /> },
];

const PaymentMethodDropdown: React.FC<Props> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const current = items.find(i => i.key === value);
  const text = current ? current.label : '---chưa chọn phương thức thanh toán---';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
      <h3 className="text-lg font-semibold text-gray-900">Chọn hình thức thanh toán</h3>
      <div className="relative">
        <button onClick={() => !disabled && setOpen(o => !o)} disabled={!!disabled} className={`w-full border rounded-lg px-3 py-2 flex items-center justify-between text-sm ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} aria-expanded={open} aria-haspopup="listbox">
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{text}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        {open && !disabled && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow">
            {items.map(i => (
              <button key={i.key} onClick={() => { onChange(i.key); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" role="option" aria-selected={value === i.key}>
                {i.icon}
                <span className="text-sm text-gray-900">{i.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodDropdown;


