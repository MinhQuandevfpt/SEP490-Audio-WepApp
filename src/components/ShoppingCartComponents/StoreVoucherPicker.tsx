import React, { useMemo, useState } from 'react';
// ===== COMMENTED: Icons for voucher picker button (TicketPercent, ChevronDown, ChevronUp) =====
import { X, AlertCircle } from 'lucide-react';
import type { ShopVoucher } from './VoucherSection';
import { showCenterError } from '../../utils/notification';
import { useLanguage } from '../../contexts/LanguageContext';

export interface AppliedStoreVoucher {
  code: string;
  type: 'FIXED' | 'PERCENT';
  discountValue: number;
  storeId: string;
}

interface StoreVoucherPickerProps {
  productId: string; // Product ID to track which product this voucher picker belongs to
  storeName: string;
  vouchers: ShopVoucher[];
  selectedTotal: number;
  appliedVoucher?: AppliedStoreVoucher;
  voucherCodeToProductIdMap?: Map<string, string>; // Map<voucherCode, productId> - to check if voucher is used by another product
  productCache?: Map<string, any>; // Product cache to get product names
  onApply: (voucher: ShopVoucher, discountValue: number) => void;
  onRemove: () => void;
}

const formatVoucherDesc = (voucher: ShopVoucher, t: (key: string, params?: Record<string, string | number>) => string): string => {
  if (voucher.type === 'PERCENT' && voucher.discountPercent) {
    let desc = t('voucherPicker.percentDiscount', { percent: voucher.discountPercent });
    if (voucher.maxDiscountValue) {
      desc += `, ${t('voucherPicker.maxDiscount', { amount: voucher.maxDiscountValue.toLocaleString('vi-VN') })}`;
    }
    if (voucher.minOrderValue) {
      desc += `, ${t('voucherPicker.minOrder', { amount: voucher.minOrderValue.toLocaleString('vi-VN') })}`;
    }
    return desc;
  }
  if (voucher.type === 'FIXED' && voucher.discountValue) {
    let desc = t('voucherPicker.fixedDiscount', { amount: voucher.discountValue.toLocaleString('vi-VN') });
    if (voucher.minOrderValue) {
      desc += `, ${t('voucherPicker.minOrder', { amount: voucher.minOrderValue.toLocaleString('vi-VN') })}`;
    }
    return desc;
  }
  return t('voucherPicker.storeVoucher');
};

const calculateDiscountAmount = (voucher: ShopVoucher, storeTotal: number): number => {
  if (voucher.type === 'FIXED') {
    return voucher.discountValue || 0;
  }
  if (voucher.type === 'PERCENT') {
    const percent = voucher.discountPercent || 0;
    const raw = Math.round((storeTotal * percent) / 100);
    if (voucher.maxDiscountValue && raw > voucher.maxDiscountValue) {
      return voucher.maxDiscountValue;
    }
    return raw;
  }
  return 0;
};

const StoreVoucherPicker: React.FC<StoreVoucherPickerProps> = ({
  productId,
  storeName,
  vouchers,
  selectedTotal,
  appliedVoucher,
  voucherCodeToProductIdMap = new Map(),
  productCache = new Map(),
  onApply,
  onRemove,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const { usableVouchers, unusableVouchers } = useMemo(() => {
    const usable: ShopVoucher[] = [];
    const unusable: Array<{ voucher: ShopVoucher; reason: string }> = [];

    vouchers.forEach(voucher => {
      // Check if voucher is already used by another product
      const usedByProductId = voucherCodeToProductIdMap.get(voucher.code);
      if (usedByProductId && usedByProductId !== productId) {
      const usedByProduct = productCache.get(usedByProductId);
      const usedByProductName = usedByProduct?.name || t('cart.product.other');
      unusable.push({
        voucher,
        reason: t('voucherPicker.usedBy', { productName: usedByProductName }),
      });
      return;
    }

    // Check minOrderValue
    if (voucher.minOrderValue && selectedTotal < voucher.minOrderValue) {
      unusable.push({
        voucher,
        reason: t('voucherPicker.minOrder', { amount: voucher.minOrderValue.toLocaleString('vi-VN') }),
      });
      return;
    }
      usable.push(voucher);
    });

    return { usableVouchers: usable, unusableVouchers: unusable };
  }, [vouchers, selectedTotal, productId, voucherCodeToProductIdMap, productCache, t]);

  const handleApply = (voucher: ShopVoucher) => {
    // Check if voucher is already used by another product
    const usedByProductId = voucherCodeToProductIdMap.get(voucher.code);
    if (usedByProductId && usedByProductId !== productId) {
      const usedByProduct = productCache.get(usedByProductId);
      const usedByProductName = usedByProduct?.name || t('cart.product.other');
      showCenterError(
        t('voucherPicker.alreadyUsed', { code: voucher.code, productName: usedByProductName }),
        t('cart.voucher.title')
      );
      return;
    }

    if (voucher.minOrderValue && selectedTotal < voucher.minOrderValue) {
      showCenterError(
        t('voucherPicker.storeMinOrder', { storeName, amount: voucher.minOrderValue.toLocaleString('vi-VN') }),
        t('cart.voucher.title')
      );
      return;
    }
    const discountValue = calculateDiscountAmount(voucher, selectedTotal);
    onApply(voucher, discountValue);
    setIsOpen(false);
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {/* ===== COMMENTED: Voucher picker button ===== */}
      {/* <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 border border-dashed border-orange-400 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-orange-700">
          <TicketPercent className="w-4 h-4" />
          {appliedVoucher
            ? `Đã chọn voucher: ${appliedVoucher.code}`
            : vouchers.length > 0
              ? 'Chọn voucher của cửa hàng'
              : 'Cửa hàng chưa có voucher khả dụng'}
        </span>
        <div className="flex items-center gap-2">
          {appliedVoucher && (
            <span className="text-sm text-green-600">
              -{appliedVoucher.discountValue.toLocaleString('vi-VN')}đ
            </span>
          )}
          {vouchers.length > 0 && (
            isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button> */}

      {appliedVoucher && (
        <div className="mt-2 flex items-center justify-between bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 rounded">
          <span className="text-xs font-medium">
            {appliedVoucher.code} - {t('voucherPicker.discount')} {appliedVoucher.discountValue.toLocaleString('vi-VN')}đ
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs underline"
          >
            {t('voucherPicker.remove')}
          </button>
        </div>
      )}

      {isOpen && vouchers.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {usableVouchers.map(voucher => {
              const discountAmount = calculateDiscountAmount(voucher, selectedTotal);
              const isApplied = appliedVoucher?.code === voucher.code;
              // Check if voucher is used by another product (should not happen in usable list, but double check)
              const usedByProductId = voucherCodeToProductIdMap.get(voucher.code);
              const isUsedByOther = usedByProductId && usedByProductId !== productId;

              return (
                <button
                  key={voucher.code}
                  type="button"
                  onClick={() => handleApply(voucher)}
                  disabled={isUsedByOther}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    isApplied 
                      ? 'bg-orange-50' 
                      : isUsedByOther
                      ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{voucher.title || voucher.code}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatVoucherDesc(voucher, t)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 font-semibold">
                        -{discountAmount.toLocaleString('vi-VN')}đ
                      </p>
                      {isApplied && (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600 mt-1">
                          {t('voucherPicker.applying')}
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {unusableVouchers.map(({ voucher, reason }) => (
              <div key={voucher.code} className="px-4 py-3 bg-gray-50 opacity-70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{voucher.title || voucher.code}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatVoucherDesc(voucher, t)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-orange-500 font-semibold">
                      -{calculateDiscountAmount(voucher, selectedTotal).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreVoucherPicker;

