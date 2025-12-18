import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  subtotal: number;
  platformDiscount: number;
  voucherDiscount: number;
  shippingFee: number;
  total: number;
  disabled: boolean;
  onSubmit: () => void;
  selectedVoucherCodes?: string[];
  /**
   * Hiển thị giá gốc ngay cả khi không có discount (case ≥2 variant cùng productId hoặc qty ≥2)
   */
  forceShowOriginal?: boolean;
  /**
   * Giá gốc (đã gồm phí ship) để hiển thị khi forceShowOriginal = true
   */
  originalTotalOverride?: number;
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
  forceShowOriginal = false,
  originalTotalOverride,
}) => {
  const { t } = useLanguage();
  const fmt = (v: number) => {
    // Làm tròn giá trị trước khi format để tránh số thập phân
    const roundedValue = Math.round(v);
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(roundedValue) + 'đ';
  };

  // Tổng trước khi áp dụng mọi loại giảm giá (giống Cart/HomePage)
  const computedOriginalTotal = subtotal + shippingFee;
  const originalTotal = originalTotalOverride ?? computedOriginalTotal;
  const hasAnyDiscount = platformDiscount > 0 || voucherDiscount > 0;
  // Chỉ hiển thị giá gốc gạch ngang khi THỰC SỰ có giảm (platform/voucher),
  // và KHÔNG ở chế độ forceShowOriginal (vì lúc đó đang cố tình hiển thị giá gốc).
  const showOriginal = hasAnyDiscount && !forceShowOriginal;
  const showPlatformDiscount = !forceShowOriginal && platformDiscount > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">{t('checkout.summary.title')}</h3>

      <div className="flex justify-between text-gray-700">
        <span>{t('checkout.summary.subtotal')}</span>
        <span>{fmt(subtotal)}</span>
      </div>

      {showPlatformDiscount && (
        <div className="flex justify-between text-gray-700">
          <span>{t('checkout.summary.platformDiscount')}</span>
          <span className="text-green-600">-{fmt(platformDiscount)}</span>
        </div>
      )}

      {voucherDiscount > 0 && (
        <div className="flex justify-between text-gray-700">
          <span>{t('checkout.summary.voucher')}</span>
          <span className="text-green-600">-{fmt(voucherDiscount)}</span>
        </div>
      )}

      <div className="flex justify-between text-gray-700">
        <span>{t('checkout.summary.shippingFee')}</span>
        <span>{fmt(shippingFee)}</span>
      </div>

      <div className="h-px bg-gray-200" />

      <div className="flex justify-between items-end">
        <div className="text-gray-600">
          <p className="text-sm">{t('checkout.summary.total')}</p>
          {showOriginal && (
            <p className="text-xs text-gray-400 line-through">
              {fmt(originalTotal)}
            </p>
          )}
          {selectedVoucherCodes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {t('checkout.summary.voucherApplied', { codes: selectedVoucherCodes.join(', ') })}
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
        {t('checkout.confirmButton')}
      </button>

      <div className="text-xs text-gray-500 space-y-1">
        <p>{t('checkout.summary.voucherHint')}</p>
        {forceShowOriginal && (
          <p className="text-red-500">
            {t('checkout.summary.notePlatformCampaignLimit') || 'Lưu ý: Khi có ≥2 biến thể cùng sản phẩm hoặc số lượng mỗi biến thể ≥2, giá có thể quay về giá gốc (không áp dụng giảm nền tảng cho toàn bộ).'}
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderSummaryCard;


