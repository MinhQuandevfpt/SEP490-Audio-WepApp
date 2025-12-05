import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoucherForm } from '../../../components/StoreOwnerVoucherComponents';
import { VoucherService, type CreateVoucherRequest } from '../../../services/seller/VoucherService';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';

const CreateVoucherPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CreateVoucherRequest) => {
    try {
      setSubmitting(true);
      // Convert datetime-local to ISO if needed
      const payload: CreateVoucherRequest = {
        ...data,
        startTime: data.startTime,
        endTime: data.endTime
      };

      // Log request body
      console.log('📤 [CREATE VOUCHER] Request Body:', JSON.stringify(payload, null, 2));

      const response = await VoucherService.createShopVoucher(payload);

      // Log response
      console.log('📥 [CREATE VOUCHER] Response Status:', response.status);
      console.log('📥 [CREATE VOUCHER] Response Body:', JSON.stringify(response, null, 2));

      showCenterSuccess('Tạo voucher thành công');
      // Redirect back to list
      navigate('/seller/dashboard/marketing/vouchers');
    } catch (e: any) {
      // Log error response if available
      console.error('❌ [CREATE VOUCHER] Error:', e);
      if (e?.response) {
        console.error('❌ [CREATE VOUCHER] Error Status:', e.response.status);
        console.error('❌ [CREATE VOUCHER] Error Response Body:', JSON.stringify(e.response.data, null, 2));
      }
      showCenterError(e?.message || 'Không thể tạo voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tạo voucher</h2>
          <p className="text-sm text-gray-600">Tạo voucher mới và áp dụng cho sản phẩm</p>
        </div>
      </div>

      <VoucherForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
};

export default CreateVoucherPage;


