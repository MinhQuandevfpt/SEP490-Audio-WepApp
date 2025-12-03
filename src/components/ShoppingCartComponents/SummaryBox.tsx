import React from 'react';
import { formatCurrency } from '../../data/shoppingcart';

interface SummaryBoxProps {
  subtotal: number;
  discount: number;
  shippingFee: number;
  voucherDiscount: number;
  selectedCount: number;
  grandTotal: number;
  onCheckout?: () => void;
  isCheckingOut?: boolean;
  disabled?: boolean;
  selectedVoucherCodes?: string[];
}

const SummaryBox: React.FC<SummaryBoxProps> = ({ 
  subtotal, 
  discount, 
  shippingFee, 
  voucherDiscount, 
  selectedCount, 
  grandTotal,
  onCheckout,
  isCheckingOut = false,
  disabled = false,
  selectedVoucherCodes = [],
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between text-gray-600">
        <span>Tạm tính</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-gray-600">
          <span>Giảm giá nền tảng</span>
          <span className="text-green-600">-{formatCurrency(discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-gray-600 hidden">
        <span>Phí vận chuyển</span>
        <span>{formatCurrency(shippingFee)}</span>
      </div>
      {voucherDiscount > 0 && (
        <div className="flex justify-between text-gray-600">
          <span>Voucher</span>
          <span className="text-green-600">-{formatCurrency(voucherDiscount)}</span>
        </div>
      )}
      <div className="h-px bg-gray-200" />
      <div className="flex justify-between items-end">
        <div className="text-gray-600">
          <p className="text-sm">Tổng cộng</p>
          <p className="text-xs">(Đã chọn {selectedCount} sản phẩm)</p>
          {selectedVoucherCodes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Đã áp dụng voucher: {selectedVoucherCodes.join(', ')}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(grandTotal)}</p>
        </div>
      </div>
      <button 
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" 
        disabled={disabled || selectedCount === 0 || isCheckingOut}
        onClick={onCheckout}
      >
        {isCheckingOut ? 'Đang xử lý...' : 'Mua hàng'}
      </button>
    </div>
  );
};

export default SummaryBox;


