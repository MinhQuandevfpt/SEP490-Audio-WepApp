import React, { useState, useCallback } from 'react';
import { SellerPayoutDashboardv2 } from '../../../components/StorePayoutVersion2Components';

const StorePayoutV2: React.FC = () => {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(e.target.value);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
  };

  const handleReset = useCallback(() => {
    setFrom('');
    setTo('');
  }, []);

  // Convert datetime-local to ISO string
  const fromISO = from ? new Date(from).toISOString() : undefined;
  const toISO = to ? new Date(to).toISOString() : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Chi trả cho cửa hàng
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Xem tổng quan và chi tiết các khoản chi trả từ nền tảng
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Lọc theo khoảng thời gian
          </h3>
          {(from || to) && (
            <button
              onClick={handleReset}
              className="text-xs text-orange-600 hover:text-orange-700"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-600">
              Từ ngày 
            </label>
            <input
              type="datetime-local"
              value={from}
              onChange={handleFromChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">
              Đến ngày 
            </label>
            <input
              type="datetime-local"
              value={to}
              onChange={handleToChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          💡 Nếu không chọn khoảng thời gian, hệ thống sẽ tự động chọn khoảng mặc định
        </div>
      </div>

      {/* Dashboard Component */}
      <SellerPayoutDashboardv2 from={fromISO} to={toISO} />
    </div>
  );
};

export default StorePayoutV2;

