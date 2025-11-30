import React from 'react';
import type { CheckoutCartItem } from '../../data/checkout';
import { Trash2, Store } from 'lucide-react';
import StoreWideVoucherSection, { type AppliedStoreWideVoucher } from './StoreWideVoucherSection';
import type { StoreVoucher } from '../../services/seller/VoucherService';

export interface StoreGroup {
  storeId: string;
  storeName: string;
  items: CheckoutCartItem[];
}

interface Props {
  groups: StoreGroup[];
  onRemove: (id: string) => void;
  storeWideVouchers?: Record<string, StoreVoucher[]>; // Record<storeId, vouchers[]>
  appliedStoreWideVouchers?: Record<string, AppliedStoreWideVoucher>; // Record<storeId, AppliedStoreWideVoucher>
  storeTotals?: Record<string, number>; // Record<storeId, total>
  onApplyStoreWideVoucher?: (storeId: string, voucher: StoreVoucher) => void;
  onRemoveStoreWideVoucher?: (storeId: string) => void;
}

const CartItemList: React.FC<Props> = ({ 
  groups, 
  onRemove,
  storeWideVouchers = {},
  appliedStoreWideVouchers = {},
  storeTotals = {},
  onApplyStoreWideVoucher,
  onRemoveStoreWideVoucher,
}) => {
  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
        Giỏ hàng trống.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map(group => {
        const storeVouchers = storeWideVouchers[group.storeId] || [];
        const appliedVoucher = appliedStoreWideVouchers[group.storeId] || null;
        const storeTotal = storeTotals[group.storeId] || 0;

        return (
          <div key={group.storeId} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <Store className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{group.storeName}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {group.items.map(item => (
                <div key={item.id} className="flex gap-4 px-6 py-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-700">
                        <span className="font-medium text-gray-900">Số lượng:</span>
                        <span>{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {new Intl.NumberFormat('vi-VN').format(item.originalPrice)}đ
                          </span>
                        )}
                        <span className="text-base font-semibold text-orange-600">
                          {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                        </span>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Store-wide voucher section */}
            {onApplyStoreWideVoucher && onRemoveStoreWideVoucher && (
              <div className="px-6 py-4">
                <StoreWideVoucherSection
                  storeId={group.storeId}
                  storeName={group.storeName}
                  vouchers={storeVouchers}
                  appliedVoucher={appliedVoucher}
                  storeTotal={storeTotal}
                  onApply={(voucher) => onApplyStoreWideVoucher(group.storeId, voucher)}
                  onRemove={() => onRemoveStoreWideVoucher(group.storeId)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CartItemList;

