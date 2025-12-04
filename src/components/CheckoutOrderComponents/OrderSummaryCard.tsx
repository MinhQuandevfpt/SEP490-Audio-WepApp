import React from 'react';

interface Props {
  subtotal: number;
  platformDiscount: number;
  voucherDiscount: number;
  shippingFee: number;
  total: number;
  disabled: boolean;
  onSubmit: () => void;
  selectedVoucherCodes?: string[];
}

const OrderSummaryCard: React.FC<Props> = ({
  subtotal,
  platformDiscount,
  voucherDiscount,
  shippingFee,
  total,
  disabled,
  onSubmit,
  selectedVoucherCodes = [],
}) => {
  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';

  // Tổng trước khi áp dụng mọi loại giảm giá (giống Cart/HomePage)
  const originalTotal = subtotal + shippingFee;
  const hasAnyDiscount = platformDiscount > 0 || voucherDiscount > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Tóm tắt đơn hàng</h3>

      <div className="flex justify-between text-gray-700">
        <span>Tạm tính</span>
        <span>{fmt(subtotal)}</span>
      </div>

      {platformDiscount > 0 && (
        <div className="flex justify-between text-gray-700">
          <span>Giảm giá nền tảng</span>
          <span className="text-green-600">-{fmt(platformDiscount)}</span>
        </div>
      )}

      {voucherDiscount > 0 && (
        <div className="flex justify-between text-gray-700">
          <span>Voucher</span>
          <span className="text-green-600">-{fmt(voucherDiscount)}</span>
        </div>
      )}

      <div className="flex justify-between text-gray-700">
        <span>Phí vận chuyển</span>
        <span>{fmt(shippingFee)}</span>
      </div>

      <div className="h-px bg-gray-200" />

      <div className="flex justify-between items-end">
        <div className="text-gray-600">
          <p className="text-sm">Tổng cộng</p>
          {hasAnyDiscount && (
            <p className="text-xs text-gray-400 line-through">
              {fmt(originalTotal)}
            </p>
          )}
          {selectedVoucherCodes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Đã áp dụng voucher: {selectedVoucherCodes.join(', ')}
            </p>
          )}
        </div>
        <p className="text-2xl font-bold text-orange-600">
          {fmt(total)}
        </p>
      </div>

      <button
        disabled={disabled}
        onClick={onSubmit}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
      >
        Xác nhận & Thanh toán
      </button>

      <p className="text-xs text-gray-500">
        Bạn có mã giảm giá? Hãy nhập trước khi thanh toán.
      </p>
    </div>
  );
};

export default OrderSummaryCard;


