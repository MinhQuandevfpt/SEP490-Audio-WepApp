import React from 'react';
import type { OrderStatus } from '../../types/api';
import { Search } from 'lucide-react';

type AllOrStatus = OrderStatus | 'ALL';

interface Props {
  value: AllOrStatus;
  onChange: (s: AllOrStatus) => void;
  onSearchChange: (v: string) => void;
  search: string;
}

// Simplified status options for tabs (main statuses only)
const mainStatusOptions: { key: AllOrStatus; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xử lý' },
  { key: 'CONFIRMED', label: 'Chờ xác nhận' },
  { key: 'AWAITING_SHIPMENT', label: 'Chờ lấy hàng' },
  { key: 'SHIPPING', label: 'Vận chuyển' },
  // Hoàn thành đơn: sử dụng status DELIVERY_SUCCESS từ backend
  { key: 'DELIVERY_SUCCESS', label: 'Vận chuyển thành công' },
  { key: 'CANCELLED', label: 'Đã hủy' },
  { key: 'RETURN_REQUESTED', label: 'Trả hàng/Hoàn tiền' },
];

const OrderStatusTabs: React.FC<Props> = ({ value, onChange, search, onSearchChange }) => {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Status Tabs - Horizontal */}
      <div className="border-b border-gray-200">
        <div 
          className="flex items-center gap-1 overflow-x-auto px-4 py-0 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE and Edge
          }}
        >
          {mainStatusOptions.map((option) => {
            const isActive = value === option.key;
            return (
              <button
                key={option.key}
                onClick={() => onChange(option.key)}
                className={`
                  relative px-4 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${isActive 
                    ? 'text-[#FF6A00] font-semibold' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
                style={{
                  borderBottom: isActive ? '2px solid #FF6A00' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
            className="w-full border border-gray-300 rounded-lg px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTabs;

