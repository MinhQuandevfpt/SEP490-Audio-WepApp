import React from 'react';
import { Button, Select } from 'antd';
import { RefreshCcw } from 'lucide-react';

interface ReviewFiltersProps {
  loading: boolean;
  pageSize: number;
  onChangePageSize: (size: number) => void;
  onRefresh: () => void;
}

const PAGE_SIZE_OPTIONS = [
  { label: '5 đánh giá', value: 5 },
  { label: '10 đánh giá', value: 10 },
  { label: '20 đánh giá', value: 20 },
];

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  loading,
  pageSize,
  onChangePageSize,
  onRefresh,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Đánh giá của tôi</h3>
        <p className="text-sm text-gray-500">Xem lịch sử đánh giá sản phẩm đã gửi</p>
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={pageSize}
          onChange={onChangePageSize}
          options={PAGE_SIZE_OPTIONS}
          disabled={loading}
          style={{ minWidth: 160 }}
        />
        <Button icon={<RefreshCcw size={16} />} onClick={onRefresh} loading={loading}>
          Làm mới
        </Button>
      </div>
    </div>
  );
};

export default ReviewFilters;

