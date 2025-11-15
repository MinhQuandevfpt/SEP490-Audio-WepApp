import React, { useEffect, useState } from 'react';
import { Trash2, Minus, Plus, CheckSquare, Square } from 'lucide-react';
import type { CartItem } from '../../data/shoppingcart';
import { formatCurrency } from '../../data/shoppingcart';
import StoreVoucherPicker from './StoreVoucherPicker';
import type { ShopVoucher } from './VoucherSection';
import type { AppliedStoreVoucher } from './StoreVoucherPicker';
import { ProductVoucherService } from '../../services/customer/ProductVoucherService';

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
  onApplyVoucher?: (storeId: string, voucher: ShopVoucher, discountValue: number) => void;
  onRemoveVoucher?: (storeId: string) => void;
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
  onApplyVoucher,
  onRemoveVoucher,
}) => {
  const [qty, setQty] = useState<number>(it.quantity);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);

  useEffect(() => {
    setQty(it.quantity);
  }, [it.quantity]);

  // Fetch platform vouchers and calculate discounted price
  useEffect(() => {
    const fetchPlatformVoucher = async () => {
      if (!it.productId) return;

      try {
        const response = await ProductVoucherService.getProductVouchers(it.productId, 'ALL', null);
        
        // Find first active platform campaign with active vouchers
        const platformCampaigns = response.data?.vouchers?.platform || [];
        let activePlatformVoucher = null;

        for (const campaign of platformCampaigns) {
          if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
            // Find first active voucher in the campaign
            const activeVoucher = campaign.vouchers.find(
              (v) => v.status === 'ACTIVE'
            );
            if (activeVoucher) {
              activePlatformVoucher = activeVoucher;
              break;
            }
          }
        }

        // Calculate discounted price if platform voucher exists
        if (activePlatformVoucher) {
          const originalPrice = it.price;
          let calculatedDiscount = 0;

          if (activePlatformVoucher.type === 'FIXED') {
            // FIXED: subtract discountValue
            calculatedDiscount = activePlatformVoucher.discountValue || 0;
          } else if (activePlatformVoucher.type === 'PERCENT') {
            // PERCENT: calculate percentage discount
            const percentDiscount = (originalPrice * (activePlatformVoucher.discountPercent || 0)) / 100;
            
            // Check if maxDiscountValue exists and apply limit
            if (activePlatformVoucher.maxDiscountValue !== null && activePlatformVoucher.maxDiscountValue !== undefined) {
              calculatedDiscount = Math.min(percentDiscount, activePlatformVoucher.maxDiscountValue);
            } else {
              calculatedDiscount = percentDiscount;
            }
          }

          const finalPrice = Math.max(0, originalPrice - calculatedDiscount);
          setDiscountedPrice(finalPrice);
        } else {
          setDiscountedPrice(null);
        }
      } catch (error) {
        console.error('Failed to fetch platform vouchers:', error);
        setDiscountedPrice(null);
      }
    };

    fetchPlatformVoucher();
  }, [it.productId, it.price]);

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
              <p className="text-sm text-gray-500 mt-1">Phân loại: {it.variant || 'Mặc định'}</p>
            </div>
            <button onClick={() => onRemove(it.id)} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Show original price with strikethrough if platform voucher discount exists */}
              {discountedPrice !== null && discountedPrice < it.price && (
                <span className="text-sm text-gray-400 line-through">{formatCurrency(it.price)}</span>
              )}
              {/* Show original price with strikethrough if originalPrice prop exists (for other discounts) */}
              {discountedPrice === null && it.originalPrice && (
                <span className="text-sm text-gray-400 line-through">{formatCurrency(it.originalPrice)}</span>
              )}
              {/* Show discounted price if platform voucher exists, otherwise show regular price */}
              <span className="text-lg font-semibold text-orange-600">
                {formatCurrency(discountedPrice !== null && discountedPrice < it.price ? discountedPrice : it.price)}
              </span>
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
            storeName={storeName || ''}
            vouchers={vouchers}
            selectedTotal={selectedTotal}
            appliedVoucher={appliedVoucher}
            onApply={(voucher, discountValue) => onApplyVoucher && onApplyVoucher(storeId, voucher, discountValue)}
            onRemove={() => onRemoveVoucher && onRemoveVoucher(storeId)}
          />
        </div>
      )}
    </div>
  );
};

export default CartItemRow;


