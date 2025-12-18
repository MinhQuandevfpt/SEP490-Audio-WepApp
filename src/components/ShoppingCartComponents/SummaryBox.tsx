import React from 'react';
import { formatCurrency } from '../../data/shoppingcart';
import { useLanguage } from '../../contexts/LanguageContext';

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
  // Khi true: ẩn giảm giá nền tảng ở UI tổng cộng (đã xử lý ở level tính toán)
  forceShowOriginal?: boolean;
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
  forceShowOriginal = false,
}) => {
  const { t } = useLanguage();
  const showPlatformDiscount = !forceShowOriginal && discount > 0;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between text-gray-600">
        <span>{t('summaryBox.subtotal')}</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {showPlatformDiscount && (
        <div className="flex justify-between text-gray-600">
          <span>{t('summaryBox.platformDiscount')}</span>
          <span className="text-green-600">-{formatCurrency(discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-gray-600 hidden">
        <span>{t('checkout.summary.shippingFee')}</span>
        <span>{formatCurrency(shippingFee)}</span>
      </div>
      {voucherDiscount > 0 && (
        <div className="flex justify-between text-gray-600">
          <span>{t('summaryBox.voucher')}</span>
          <span className="text-green-600">-{formatCurrency(voucherDiscount)}</span>
        </div>
      )}
      <div className="h-px bg-gray-200" />
      <div className="flex justify-between items-end">
        <div className="text-gray-600">
          <p className="text-sm">{t('summaryBox.total')}</p>
          <p className="text-xs">{t('summaryBox.selectedProducts', { count: selectedCount })}</p>
          {selectedVoucherCodes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {t('summaryBox.appliedVouchers', { codes: selectedVoucherCodes.join(', ') })}
            </p>
          )}
          {forceShowOriginal && (
            <p className="text-xs text-red-500 mt-1">
              {t('summaryBox.notePlatformCampaignLimit')}
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
        {isCheckingOut ? t('summaryBox.processing') : t('summaryBox.buyNow')}
      </button>
    </div>
  );
};

export default SummaryBox;


