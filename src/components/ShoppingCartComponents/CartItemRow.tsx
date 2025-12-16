import React, { useEffect, useState } from 'react';
import { Trash2, Minus, Plus, CheckSquare, Square } from 'lucide-react';
import type { CartItem } from '../../data/shoppingcart';
import { formatCurrency } from '../../data/shoppingcart';
import StoreVoucherPicker from './StoreVoucherPicker';
import type { ShopVoucher } from './VoucherSection';
import type { AppliedStoreVoucher } from './StoreVoucherPicker';
import { useLanguage } from '../../contexts/LanguageContext';

interface CartItemRowProps {
  item: CartItem;
  onToggle: (id: string) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onSetQuantity?: (id: string, quantity: number) => void;
  // Voucher props
  storeId?: string;
  storeName?: string;
  vouchers?: ShopVoucher[];
  appliedVoucher?: AppliedStoreVoucher;
  selectedTotal?: number;
  voucherCodeToProductIdMap?: Map<string, string>; // Map<voucherCode, productId> - to check if voucher is used by another product
  productCache?: Map<string, any>; // Product cache to get product names
  onApplyVoucher?: (productId: string, storeId: string, voucher: ShopVoucher, discountValue: number) => void;
  onRemoveVoucher?: (productId: string) => void;
  // Khi true: luôn hiển thị giá gốc (không highlight giảm giá) cho item này
  forceShowOriginalPrice?: boolean;
  // Platform voucher info để hiển thị giá sau giảm
  platformVoucherInfo?: { discount: number; campaignProductId: string; inPlatformCampaign?: boolean };
}

const CartItemRow: React.FC<CartItemRowProps> = ({ 
  item: it, 
  onToggle, 
  onInc, 
  onDec, 
  onRemove, 
  onSetQuantity,
  storeId,
  storeName,
  vouchers = [],
  appliedVoucher,
  selectedTotal = 0,
  voucherCodeToProductIdMap = new Map(),
  productCache = new Map(),
  onApplyVoucher,
  onRemoveVoucher,
  forceShowOriginalPrice = false,
  platformVoucherInfo,
}) => {
  const { t } = useLanguage();
  const [qty, setQty] = useState<number>(it.quantity);
  // Giá hiển thị sẽ lấy trực tiếp từ cart item (đã được backend áp dụng chiến dịch nếu có)

  useEffect(() => {
    setQty(it.quantity);
  }, [it.quantity]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const num = Math.max(1, Math.min(Number(val || '1'), 99));
    setQty(num);
  };

  const commitQty = () => {
    if (!onSetQuantity) return;
    if (qty !== it.quantity) {
      onSetQuantity(it.id, qty);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };
  
  const showVoucherPicker = storeId && storeName && onApplyVoucher && onRemoveVoucher;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex gap-4">
        <button onClick={() => onToggle(it.id)} className="mt-1">
          {it.isSelected ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5 text-gray-400" />}
        </button>
        <img src={it.image} alt={it.name} className="w-20 h-20 rounded object-cover border" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-gray-900 font-medium truncate" title={it.name}>{it.name}</p>
              <p className="text-sm text-gray-500 mt-1">{t('cartItemRow.variant')}: {it.variant || t('cartItemRow.default')}</p>
            </div>
            <button onClick={() => onRemove(it.id)} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {(() => {
                  const original = it.originalPrice ?? it.price;
                  
                  // Tính giá sau giảm nếu có platform voucher
                  let displayPrice = it.price;
                  let hasPlatformDiscount = false;
                  
                  if (platformVoucherInfo && platformVoucherInfo.campaignProductId && platformVoucherInfo.discount > 0) {
                    // Có platform voucher: tính giá sau giảm
                    const discountedPrice = Math.max(0, original - platformVoucherInfo.discount);
                    // Chỉ áp dụng nếu giá hiện tại >= giá gốc (chưa có discount từ backend)
                    if (it.price >= original) {
                      displayPrice = discountedPrice;
                      hasPlatformDiscount = true;
                    }
                  }
                  
                  const hasDiscount =
                    (it.originalPrice !== undefined && it.originalPrice > it.price) || hasPlatformDiscount;

                  // Nếu đang ở chế độ forceShowOriginalPrice, chỉ hiển thị giá gốc (màu cam), không trừ discount
                  if (forceShowOriginalPrice) {
                    return (
                      <span className="text-lg font-semibold text-orange-500">
                        {formatCurrency(original)}
                      </span>
                    );
                  }

                  // Trường hợp có giảm giá: hiển thị giá sau giảm (đỏ) + giá gốc gạch ngang
                  if (hasDiscount) {
                    return (
                      <>
                        <span className="text-lg font-semibold text-red-600">
                          {formatCurrency(displayPrice)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(original)}
                        </span>
                      </>
                    );
                  }

                  // Không có giảm giá: hiển thị giá hiện tại màu cam
                  return (
                    <span className="text-lg font-semibold text-orange-500">
                      {formatCurrency(it.price)}
                    </span>
                  );
                })()}
              </div>
              {/* Campaign remaining message */}
              {it.campaignRemaining !== undefined && it.campaignRemaining > 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  {t('cartItemRow.campaignRemaining', { count: it.campaignRemaining })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => onDec(it.id)} className="px-2 py-1 border rounded hover:bg-gray-50">
                <Minus className="w-4 h-4" />
              </button>
              <input
                value={qty}
                onChange={handleQtyChange}
                onBlur={commitQty}
                onKeyDown={onKeyDown}
                inputMode="numeric"
                className="w-12 text-center border rounded py-1"
              />
              <button onClick={() => onInc(it.id)} className="px-2 py-1 border rounded hover:bg-gray-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Voucher picker inside item card */}
      {showVoucherPicker && storeId && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <StoreVoucherPicker
            productId={it.productId}
            storeName={storeName || ''}
            vouchers={vouchers}
            selectedTotal={selectedTotal}
            appliedVoucher={appliedVoucher}
            voucherCodeToProductIdMap={voucherCodeToProductIdMap}
            productCache={productCache}
            onApply={(voucher, discountValue) => onApplyVoucher && onApplyVoucher(it.productId, storeId, voucher, discountValue)}
            onRemove={() => onRemoveVoucher && onRemoveVoucher(it.productId)}
          />
        </div>
      )}
    </div>
  );
};

export default CartItemRow;


