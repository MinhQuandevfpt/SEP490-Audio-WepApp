import React from 'react';
import { Filter, Search, ChevronDown, Calendar } from 'lucide-react';
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { StoreOrderStatus } from '../../types/seller';

const { RangePicker } = DatePicker;

interface Props {
  status: StoreOrderStatus | 'ALL';
  onStatusChange: (status: StoreOrderStatus | 'ALL') => void;
  search: string;
  onSearchChange: (search: string) => void;
  fromDate?: string;
  toDate?: string;
  onDateRangeChange?: (fromDate: string | undefined, toDate: string | undefined) => void;
}

const STATUS_OPTIONS: Array<{ value: StoreOrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'AWAITING_SHIPMENT', label: 'Chờ lấy hàng' },
  { value: 'GHN_CREATED', label: 'Đã chuyển nhượng GHN' },
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
  fromDate,
  toDate,
  onDateRangeChange,
}) => {
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (onDateRangeChange) {
      if (dates && dates[0] && dates[1]) {
        onDateRangeChange(
          dates[0].format('YYYY-MM-DD'),
          dates[1].format('YYYY-MM-DD')
        );
      } else {
        onDateRangeChange(undefined, undefined);
      }
    }
  };

  const dateRangeValue = fromDate && toDate 
    ? [dayjs(fromDate), dayjs(toDate)] as [Dayjs, Dayjs]
    : null;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row: Status Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
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

      {/* Second Row: Date Range Picker */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          Khoảng thời gian:
        </label>
        <RangePicker
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          className="w-full sm:w-auto"
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </div>
    </div>
  );
};

export default StoreOrderFilter;

