import React from 'react';
import type { OrderStatus } from '../../data/orderHistory';

type AllOrStatus = OrderStatus | 'ALL';

interface Props {
  value: AllOrStatus;
  onChange: (s: AllOrStatus) => void;
  onSearchChange: (v: string) => void;
  search: string;
}

const tabs: { key: AllOrStatus; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

const OrderFilterTabs: React.FC<Props> = ({ value, onChange, search, onSearchChange }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => onChange(t.key)} className={`px-3 py-1.5 rounded-full text-sm border ${value === t.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="w-full md:w-80">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nhập mã đơn hàng"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default OrderFilterTabs;


