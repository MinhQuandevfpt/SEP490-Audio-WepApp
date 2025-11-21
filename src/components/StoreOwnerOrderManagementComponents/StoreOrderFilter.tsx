import React from 'react';
import { Filter, Search, ChevronDown } from 'lucide-react';
import type { StoreOrderStatus } from '../../types/seller';

interface Props {
  status: StoreOrderStatus | 'ALL';
  onStatusChange: (status: StoreOrderStatus | 'ALL') => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const STATUS_OPTIONS: Array<{ value: StoreOrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'AWAITING_SHIPMENT', label: 'Chờ lấy hàng' },
  { value: 'SHIPPING', label: 'Đang giao hàng' },
  { value: 'COMPLETED', label: 'Đã giao hàng' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng' },
  { value: 'RETURNED', label: 'Đã trả hàng' },
];

const StoreOrderFilter: React.FC<Props> = ({
  status,
  onStatusChange,
  search,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Status Filter Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 whitespace-nowrap">
          <Filter className="w-4 h-4" />
          Lọc theo trạng thái:
        </label>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as StoreOrderStatus | 'ALL')}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer min-w-[180px]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nhập mã đơn hàng (VD: HD211125) hoặc tên/SĐT khách hàng"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default StoreOrderFilter;

