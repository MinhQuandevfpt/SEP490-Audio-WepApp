import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoucherService, type CreateShopWideVoucherRequest } from '../../../services/seller/VoucherService';
import ShopWideVoucherForm from '../../../components/StoreOwnerVoucherComponents/ShopWideVoucherForm';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

const ShopWideVoucherPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CreateShopWideVoucherRequest) => {
    try {
      setSubmitting(true);
      const response = await VoucherService.createShopWideVoucher(data);
      
      if (response.status === 201 || response.status === 200) {
        showCenterSuccess('Voucher toàn shop đã được tạo thành công!', 'Thành công');
        // Navigate back to vouchers list after 1.5 seconds
        setTimeout(() => {
          navigate('/seller/dashboard/shop-wide-voucher');
        }, 1500);
      } else {
        showCenterError(response.message || 'Không thể tạo voucher', 'Lỗi');
      }
    } catch (error: any) {
      console.error('Error creating shop-wide voucher:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tạo voucher. Vui lòng thử lại.';
      showCenterError(errorMessage, 'Lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tạo voucher toàn shop</h2>
          <p className="text-sm text-gray-600">Tạo voucher áp dụng cho toàn bộ cửa hàng, không giới hạn số lượng</p>
        </div>
        <button
          onClick={() => navigate('/seller/dashboard/shop-wide-voucher')}
          className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
        >
          Quay lại
        </button>
      </div>

      <ShopWideVoucherForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
};

export default ShopWideVoucherPage;

