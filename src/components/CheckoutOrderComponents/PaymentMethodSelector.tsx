import React from 'react';
import type { PaymentMethod } from '../../data/checkout';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';

interface Props {
  value: PaymentMethod | null;
  onChange: (m: PaymentMethod) => void;
}

const items: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { key: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: <Banknote className="w-4 h-4" /> },
  { key: 'payos', label: 'PayOS', icon: <Smartphone className="w-4 h-4" /> },
];

const PaymentMethodSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-600" /> Phương thức thanh toán</h3>
      <div className="grid grid-cols-1 gap-2">
        {items.map(i => (
          <label key={i.key} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${value === i.key ? 'border-orange-400 bg-orange-50' : ''}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="pay" checked={value === i.key} onChange={() => onChange(i.key)} />
              <span className="text-sm text-gray-900 flex items-center gap-2">{i.icon} {i.label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;


