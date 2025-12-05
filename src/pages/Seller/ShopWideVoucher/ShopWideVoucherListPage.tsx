import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoucherService, type StoreVoucher } from '../../../services/seller/VoucherService';
import { VoucherList } from '../../../components/StoreOwnerVoucherComponents';
import { Plus } from 'lucide-react';

const ShopWideVoucherListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<StoreVoucher[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await VoucherService.getFilteredShopVouchers('ACTIVE', 'ALL_SHOP_VOUCHER');
      setVouchers(res.data || []);
    } catch (e: any) {
      console.error('Error loading shop-wide vouchers:', e);
      setError(e?.message || 'Không thể tải danh sách voucher toàn shop.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voucher toàn shop</h2>
          <p className="text-sm text-gray-600">Danh sách voucher toàn cửa hàng đang hoạt động</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
          >
            Tải lại
          </button>
          <button
            onClick={() => navigate('/seller/dashboard/shop-wide-voucher/create')}
            className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo voucher toàn shop
          </button>
        </div>
      </div>

      <VoucherList vouchers={vouchers} loading={loading} error={error} onRetry={load} />
    </div>
  );
};

export default ShopWideVoucherListPage;

