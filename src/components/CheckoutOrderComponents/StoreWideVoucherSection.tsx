import React from 'react';
import { TicketPercent, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { StoreVoucher } from '../../services/seller/VoucherService';
import { useLanguage } from '../../contexts/LanguageContext';

export interface AppliedStoreWideVoucher {
  storeId: string;
  code: string;
  voucherId: string;
  discountValue: number;
  type: 'FIXED' | 'PERCENT';
}

interface StoreWideVoucherSectionProps {
  storeId: string;
  storeName: string;
  vouchers: StoreVoucher[];
  appliedVoucher: AppliedStoreWideVoucher | null;
  storeTotal: number; // Tổng tiền của store sau platform discount
  onApply: (voucher: StoreVoucher) => void;
  onRemove: () => void;
}

const StoreWideVoucherSection: React.FC<StoreWideVoucherSectionProps> = ({
  storeId: _storeId,
  storeName,
  vouchers,
  appliedVoucher,
  storeTotal,
  onApply,
  onRemove,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Kiểm tra voucher có thể sử dụng được không
  const isVoucherUsable = (voucher: StoreVoucher): { usable: boolean; reason?: string } => {
    // Kiểm tra thời gian
    const now = new Date();
    const startTime = new Date(voucher.startTime);
    const endTime = new Date(voucher.endTime);

    if (now < startTime) {
      return { usable: false, reason: t('storeWideVoucher.errors.notStarted') };
    }

    if (now > endTime) {
      return { usable: false, reason: t('storeWideVoucher.errors.expired') };
    }

    // Kiểm tra minOrderValue
    if (voucher.minOrderValue && voucher.minOrderValue > 0) {
      if (storeTotal < voucher.minOrderValue) {
        return {
          usable: false,
          reason: t('storeWideVoucher.errors.minOrder', { 
            min: voucher.minOrderValue.toLocaleString('vi-VN'), 
            current: storeTotal.toLocaleString('vi-VN') 
          }),
        };
      }
    }

    return { usable: true };
  };

  // Tính discount amount từ voucher
  const calculateDiscountAmount = (voucher: StoreVoucher): number => {
    if (voucher.type === 'FIXED') {
      return voucher.discountValue || 0;
    } else if (voucher.type === 'PERCENT') {
      const percent = voucher.discountPercent || 0;
      const discount = Math.round((storeTotal * percent) / 100);
      
      // Áp dụng maxDiscountValue nếu có
      if (voucher.maxDiscountValue && discount > voucher.maxDiscountValue) {
        return voucher.maxDiscountValue;
      }
      
      return discount;
    }
    return 0;
  };

  // Format description cho voucher
  const formatVoucherDesc = (voucher: StoreVoucher): string => {
    if (voucher.type === 'PERCENT' && voucher.discountPercent) {
      let desc = t('voucherPicker.percentDiscount', { percent: voucher.discountPercent });
      if (voucher.maxDiscountValue) {
        desc += `, ${t('voucherPicker.maxDiscount', { amount: voucher.maxDiscountValue.toLocaleString('vi-VN') })}`;
      }
      if (voucher.minOrderValue) {
        desc += `, ${t('voucherPicker.minOrder', { amount: voucher.minOrderValue.toLocaleString('vi-VN') })}`;
      }
      return desc;
    } else if (voucher.type === 'FIXED' && voucher.discountValue) {
      let desc = t('voucherPicker.fixedDiscount', { amount: voucher.discountValue.toLocaleString('vi-VN') });
      if (voucher.minOrderValue) {
        desc += `, ${t('voucherPicker.minOrder', { amount: voucher.minOrderValue.toLocaleString('vi-VN') })}`;
      }
      return desc;
    }
    return t('storeWideVoucher.storeWideVoucher');
  };

  const handleApply = (voucher: StoreVoucher) => {
    const check = isVoucherUsable(voucher);
    if (!check.usable) {
      return;
    }
    onApply(voucher);
  };

  if (vouchers.length === 0 && !appliedVoucher) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TicketPercent className="w-4 h-4 text-orange-600" />
          <p className="text-sm font-medium text-gray-800">
            {t('storeWideVoucher.titleWithStore', { storeName })}
          </p>
        </div>
        {vouchers.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <span>{t('storeWideVoucher.collapse')}</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{t('storeWideVoucher.viewVouchers', { count: vouchers.length })}</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {appliedVoucher && (
        <div className="mb-3 flex items-center justify-between bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg">
          <div className="flex-1">
            <span className="text-sm font-medium">
              {t('storeWideVoucher.appliedWithCode', { code: appliedVoucher.code })}
            </span>
            <span className="text-sm ml-2">
              - {t('storeWideVoucher.discount')} {appliedVoucher.discountValue.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <button
            onClick={onRemove}
            className="text-sm text-orange-700 hover:text-orange-900 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isExpanded && vouchers.length > 0 && (
        <div className="space-y-2">
          {vouchers.map(voucher => {
            const check = isVoucherUsable(voucher);
            const isApplied = appliedVoucher?.code === voucher.code;
            const discountAmount = calculateDiscountAmount(voucher);

            return (
              <button
                key={voucher.id}
                onClick={() => handleApply(voucher)}
                disabled={!check.usable || isApplied}
                className={`w-full text-left border rounded-lg px-3 py-2 flex items-center justify-between transition-colors ${
                  isApplied
                    ? 'border-orange-400 bg-orange-50 cursor-default'
                    : !check.usable
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {voucher.title || voucher.code}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatVoucherDesc(voucher)}</p>
                  {voucher.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {voucher.description}
                    </p>
                  )}
                  {!check.usable && check.reason && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {check.reason}
                    </p>
                  )}
                  {check.usable && !isApplied && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      {t('voucherSection.discount')}: {discountAmount.toLocaleString('vi-VN')}đ
                    </p>
                  )}
                </div>
                {isApplied && (
                  <div className="ml-2 flex items-center gap-2">
                    <span className="text-xs text-orange-600 font-medium">{t('storeWideVoucher.selected')}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoreWideVoucherSection;

