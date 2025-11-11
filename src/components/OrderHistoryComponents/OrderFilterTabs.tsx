import React from 'react';
import type { OrderStatus } from '../../types/api';
import { Search, ChevronDown, Filter } from 'lucide-react';

type AllOrStatus = OrderStatus | 'ALL';

interface Props {
  value: AllOrStatus;
  onChange: (s: AllOrStatus) => void;
  onSearchChange: (v: string) => void;
  search: string;
}

const statusOptions: { key: AllOrStatus; label: string }[] = [
  { key: 'ALL', label: 'Tất cả đơn hàng' },
  { key: 'UNPAID', label: 'Chờ thanh toán' },
  { key: 'PENDING', label: 'Chờ xử lý' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'AWAITING_SHIPMENT', label: 'Chờ lấy hàng' },
  { key: 'READY_FOR_PICKUP', label: 'Kho đang chuẩn bị' },
  { key: 'READY_FOR_DELIVERY', label: 'Chờ giao hàng' },
  { key: 'SHIPPING', label: 'Đang giao hàng' },
  { key: 'OUT_FOR_DELIVERY', label: 'Đang giao hàng' },
  { key: 'DELIVERED_WAITING_CONFIRM', label: 'Chờ xác nhận giao hàng' },
  { key: 'DELIVERY_SUCCESS', label: 'Giao hàng thành công' },
  { key: 'DELIVERY_DENIED', label: 'Giao hàng thất bại' },
  { key: 'COMPLETED', label: 'Đã giao hàng' },
  { key: 'CANCELLED', label: 'Đã hủy' },
  { key: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng' },
  { key: 'RETURNED', label: 'Đã trả hàng' },
];

const OrderFilterTabs: React.FC<Props> = ({ value, onChange, search, onSearchChange }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Status Filter Dropdown */}
        <div className="w-full md:w-auto">
          <label className="text-xs text-gray-500 mb-1.5 block">Lọc theo trạng thái</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={value}
              onChange={(e) => onChange(e.target.value as AllOrStatus)}
              className="w-full md:w-64 appearance-none bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer transition-colors"
            >
              {statusOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-80">
          <label className="text-xs text-gray-500 mb-1.5 block">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo mã đơn hàng..."
              className="w-full border border-gray-300 rounded-lg px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilterTabs;


