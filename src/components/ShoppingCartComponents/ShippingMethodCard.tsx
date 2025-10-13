import React from 'react';
import { Truck, Timer } from 'lucide-react';
import { formatCurrency } from '../../data/shoppingcart';

interface ShippingMethodCardProps {
  method: 'economy' | 'standard' | 'express';
  selected: boolean;
  price: number;
  onSelect: (m: 'economy' | 'standard' | 'express') => void;
}

const labels = {
  economy: { title: 'Tiết kiệm', desc: '2-4 ngày', price: 10000 },
  standard: { title: 'Tiêu chuẩn', desc: '1-3 ngày', price: 15000 },
  express: { title: 'Hỏa tốc', desc: 'Trong ngày', price: 30000 },
};

const ShippingMethodCard: React.FC<ShippingMethodCardProps> = ({ method, selected, price, onSelect }) => {
  const data = labels[method];
  return (
    <button
      onClick={() => onSelect(method)}
      className={`w-full text-left border rounded-lg p-3 flex items-center justify-between transition ${selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
    >
      <div className="flex items-center gap-3">
        <Truck className={`w-5 h-5 ${selected ? 'text-orange-600' : 'text-gray-400'}`} />
        <div>
          <p className="text-sm font-medium text-gray-800">{data.title}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Timer className="w-3 h-3" /> {data.desc}
          </p>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-900">{formatCurrency(price)}</span>
    </button>
  );
};

export default ShippingMethodCard;


