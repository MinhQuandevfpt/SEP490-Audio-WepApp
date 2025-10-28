import React from 'react';
import type { StoreVoucher } from '../../services/seller/VoucherService';
import VoucherCard from './VoucherCard';

interface Props {
  vouchers: StoreVoucher[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const VoucherList: React.FC<Props> = ({ vouchers, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto" />
        <p className="mt-2 text-sm text-gray-600">Đang tải voucher...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-3 px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700">Thử lại</button>
        )}
      </div>
    );
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-600">Chưa có voucher nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {vouchers.map(v => (
        <VoucherCard key={v.id} voucher={v} />
      ))}
    </div>
  );
};

export default VoucherList;


