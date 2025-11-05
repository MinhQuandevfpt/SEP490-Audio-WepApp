import React from 'react';
import { TicketPercent, X, AlertCircle } from 'lucide-react';
import type { CartItem } from '../../data/shoppingcart';
import type { Product } from '../../services/customer/ProductListService';
import { showCenterError } from '../../utils/notification';

export interface ShopVoucher {
  source: 'SHOP';
  shopVoucherId: string;
  shopVoucherProductId: string;
  code: string;
  title: string;
  type: 'FIXED' | 'PERCENT';
  discountValue: number | null;
  discountPercent: number | null;
  maxDiscountValue: number | null;
  minOrderValue: number | null;
  startTime: string;
  endTime: string;
  storeId?: string; // StoreId của product có voucher này
}

interface VoucherSectionProps {
  voucherInput: string;
  appliedVoucher: {
    code: string;
    type: 'FIXED' | 'PERCENT';
    discountValue: number;
    storeId: string;
  } | null;
  availableVouchers: ShopVoucher[];
  items: CartItem[];
  productCache: Map<string, Product>;
  subtotal: number; // Tổng tiền của các sản phẩm đã chọn
  onChangeInput: (v: string) => void;
  onApply: (voucher: ShopVoucher) => void;
  onChoose: (voucher: ShopVoucher) => void;
  onClear: () => void;
}

const VoucherSection: React.FC<VoucherSectionProps> = ({
  voucherInput,
  appliedVoucher,
  availableVouchers,
  items,
  productCache,
  subtotal,
  onChangeInput,
  onApply,
  onChoose,
  onClear,
}) => {
  // Tính tổng tiền của các sản phẩm đã chọn theo storeId
  const calculateStoreTotal = (storeId: string): number => {
    const selectedItems = items.filter(it => it.isSelected);
    let total = 0;

    selectedItems.forEach(item => {
      const product = productCache.get(item.productId);
      if (product && product.storeId === storeId) {
        total += item.price * item.quantity;
      }
    });

    return total;
  };

  // Kiểm tra voucher có thể sử dụng được không
  const isVoucherUsable = (voucher: ShopVoucher): { usable: boolean; reason?: string } => {
    // Nếu không có minOrderValue, cho phép sử dụng
    if (!voucher.minOrderValue || voucher.minOrderValue === 0) {
      return { usable: true };
    }

    // Nếu không có storeId, không thể kiểm tra
    if (!voucher.storeId) {
      return { usable: false, reason: 'Không xác định được cửa hàng' };
    }

    // Tính tổng tiền của các sản phẩm cùng storeId
    const storeTotal = calculateStoreTotal(voucher.storeId);

    // Kiểm tra đạt minOrderValue
    if (storeTotal < voucher.minOrderValue) {
      return {
        usable: false,
        reason: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ. Hiện tại: ${storeTotal.toLocaleString('vi-VN')}đ`,
      };
    }

    return { usable: true };
  };

  // Tính discount amount từ voucher
  const calculateDiscountAmount = (voucher: ShopVoucher, storeTotal: number): number => {
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

  // Xử lý apply voucher từ input
  const handleApply = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      showCenterError('Vui lòng nhập mã voucher', 'Lỗi');
      return;
    }

    const found = availableVouchers.find(v => v.code.toUpperCase() === code);
    if (!found) {
      showCenterError('Mã voucher không hợp lệ hoặc không tồn tại', 'Lỗi');
      return;
    }

    // Kiểm tra voucher có thể sử dụng
    const check = isVoucherUsable(found);
    if (!check.usable) {
      showCenterError(check.reason || 'Voucher không thể sử dụng', 'Lỗi');
      return;
    }

    onApply(found);
  };

  // Xử lý choose voucher từ list
  const handleChoose = (voucher: ShopVoucher) => {
    // Kiểm tra voucher có thể sử dụng
    const check = isVoucherUsable(voucher);
    if (!check.usable) {
      showCenterError(check.reason || 'Voucher không thể sử dụng', 'Lỗi');
      return;
    }

    onChoose(voucher);
  };

  // Format description cho voucher
  const formatVoucherDesc = (voucher: ShopVoucher): string => {
    if (voucher.type === 'PERCENT' && voucher.discountPercent) {
      let desc = `Giảm ${voucher.discountPercent}%`;
      if (voucher.maxDiscountValue) {
        desc += `, tối đa ${voucher.maxDiscountValue.toLocaleString('vi-VN')}đ`;
      }
      if (voucher.minOrderValue) {
        desc += `, đơn tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ`;
      }
      return desc;
    } else if (voucher.type === 'FIXED' && voucher.discountValue) {
      let desc = `Giảm ${voucher.discountValue.toLocaleString('vi-VN')}đ`;
      if (voucher.minOrderValue) {
        desc += `, đơn tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ`;
      }
      return desc;
    }
    return 'Voucher cửa hàng';
  };

  return (
    <div className="pt-2">
      <p className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
        <TicketPercent className="w-4 h-4 text-orange-600" /> Mã giảm giá
      </p>
      <div className="flex gap-2">
        <input
          value={voucherInput}
          onChange={(e) => onChangeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleApply();
            }
          }}
          placeholder="Nhập mã voucher"
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black"
        >
          Áp dụng
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2">
        {availableVouchers.map(voucher => {
          const check = isVoucherUsable(voucher);
          const isApplied = appliedVoucher?.code === voucher.code;
          const storeTotal = voucher.storeId ? calculateStoreTotal(voucher.storeId) : subtotal;
          const discountAmount = calculateDiscountAmount(voucher, storeTotal);

          return (
            <button
              key={voucher.code}
              onClick={() => handleChoose(voucher)}
              disabled={!check.usable}
              className={`w-full text-left border rounded-lg px-3 py-2 flex items-center justify-between ${
                isApplied
                  ? 'border-orange-400 bg-orange-50'
                  : !check.usable
                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  : 'border-dashed border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{voucher.title || voucher.code}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatVoucherDesc(voucher)}</p>
                {!check.usable && check.reason && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {check.reason}
                  </p>
                )}
                {check.usable && (
                  <p className="text-xs text-green-600 mt-1">
                    Giảm: {discountAmount.toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>
              {isApplied && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="text-gray-500 hover:text-gray-700 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {appliedVoucher && (
        <div className="mt-2 flex items-center justify-between bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded">
          <span className="text-sm">
            Đã áp dụng: {appliedVoucher.code} - Giảm {appliedVoucher.discountValue.toLocaleString('vi-VN')}đ
          </span>
          <button onClick={onClear} className="text-sm underline">
            Gỡ
          </button>
        </div>
      )}
    </div>
  );
};

export default VoucherSection;
