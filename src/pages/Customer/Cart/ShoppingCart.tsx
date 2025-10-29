import React, { useEffect, useMemo, useState } from 'react';
import { calcCartSummary, type CartItem as UICartItem, formatCurrency } from '../../../data/shoppingcart';
import Layout from '../../../components/Layout';
import SelectAllBar from '../../../components/ShoppingCartComponents/SelectAllBar';
import CartItemRow from '../../../components/ShoppingCartComponents/CartItemRow';
import ShippingMethodCard from '../../../components/ShoppingCartComponents/ShippingMethodCard';
import VoucherSection from '../../../components/ShoppingCartComponents/VoucherSection';
import SummaryBox from '../../../components/ShoppingCartComponents/SummaryBox';
import { useCart } from '../../../hooks/useCart';
import type { CartItem as ApiCartItem } from '../../../types/cart';

const ShoppingCart: React.FC = () => {
  const { cart, isLoading, error, loadCart } = useCart();
  const [items, setItems] = useState<UICartItem[]>([]);

  // Map API cart items to UI items used by existing components
  const mapApiItemToUI = (apiItem: ApiCartItem): UICartItem => ({
    id: apiItem.cartItemId,
    productId: apiItem.refId,
    name: apiItem.name,
    image: apiItem.image,
    price: apiItem.unitPrice,
    quantity: apiItem.quantity,
    isSelected: true,
  });

  useEffect(() => {
    const init = async () => {
      await loadCart();
    };
    init();
  }, [loadCart]);

  useEffect(() => {
    if (cart?.items) {
      setItems(cart.items.map(mapApiItemToUI));
    } else {
      setItems([]);
    }
  }, [cart]);
  const allSelected = useMemo(() => items.every(i => i.isSelected), [items]);
  const summary = useMemo(() => calcCartSummary(items), [items]);

  // Voucher & Shipping
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    type: 'PERCENT10' | 'FREESHIP';
    amount: number; // calculated discount amount
  } | null>(null);

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'economy'>('standard');
  const availableVouchers = [
    { code: 'GIAM10', label: 'Giảm 10% tối đa 100k', desc: 'Áp dụng cho tổng tiền hàng' },
    { code: 'FREESHIP', label: 'Freeship 30k', desc: 'Giảm phí vận chuyển' },
  ];

  const shippingFee = useMemo(() => {
    if (summary.selectedCount === 0) return 0;
    if (shippingMethod === 'express') return 30000;
    if (shippingMethod === 'economy') return 10000;
    return 15000; // standard
  }, [shippingMethod, summary.selectedCount]);

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.type === 'PERCENT10') {
      // 10% trên tổng tiền hàng đã chọn, tối đa 100k
      return Math.min(Math.round(summary.total * 0.1), 100_000);
    }
    if (appliedVoucher.type === 'FREESHIP') {
      // Giảm tối đa 30k cho phí vận chuyển
      return Math.min(shippingFee, 30_000);
    }
    return 0;
  }, [appliedVoucher, summary.total, shippingFee]);

  const grandTotal = useMemo(() => {
    const total = summary.total + shippingFee - voucherDiscount;
    return Math.max(0, total);
  }, [summary.total, shippingFee, voucherDiscount]);

  const applyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'GIAM10') {
      setAppliedVoucher({ code, type: 'PERCENT10', amount: 0 });
      return;
    }
    if (code === 'FREESHIP') {
      setAppliedVoucher({ code, type: 'FREESHIP', amount: 0 });
      return;
    }
    // invalid -> clear
    setAppliedVoucher(null);
  };

  const clearVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, isSelected: !it.isSelected } : it));
  };

  const toggleAll = () => {
    const next = !allSelected;
    setItems(prev => prev.map(it => ({ ...it, isSelected: next })));
  };

  const inc = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: Math.min((it.quantity + 1), (it.maxQuantity ?? 99)) } : it));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const dec = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng</h1>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-3">Đang tải giỏ hàng...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header controls */}
            <SelectAllBar allSelected={allSelected} itemCount={items.length} onToggleAll={toggleAll} />

            {/* List */}
            {items.map(it => (
              <CartItemRow
                key={it.id}
                item={it}
                onToggle={toggleItem}
                onInc={inc}
                onDec={dec}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Giảm giá</span>
                <span className="text-green-600">-{formatCurrency(summary.discount)}</span>
              </div>
              {/* Shipping method - card style */}
              <div className="pt-2">
                <p className="text-sm font-medium text-gray-800 mb-2">Hình thức giao hàng</p>
                <div className="space-y-2">
                  <ShippingMethodCard method="economy" selected={shippingMethod==='economy'} price={10000} onSelect={setShippingMethod} />
                  <ShippingMethodCard method="standard" selected={shippingMethod==='standard'} price={15000} onSelect={setShippingMethod} />
                  <ShippingMethodCard method="express" selected={shippingMethod==='express'} price={30000} onSelect={setShippingMethod} />
                </div>
              </div>

              {/* Voucher - input or choose */}
              <div className="pt-2">
                <VoucherSection
                  voucherInput={voucherInput}
                  appliedVoucher={appliedVoucher}
                  availableVouchers={availableVouchers}
                  onChangeInput={setVoucherInput}
                  onApply={applyVoucher}
                  onChoose={(code) => { setVoucherInput(code); setAppliedVoucher({ code, type: code as any, amount: 0 }); }}
                  onClear={clearVoucher}
                />
              </div>

              <SummaryBox
                subtotal={summary.subtotal}
                discount={summary.discount}
                shippingFee={shippingFee}
                voucherDiscount={voucherDiscount}
                selectedCount={summary.selectedCount}
                grandTotal={grandTotal}
              />
            </div>
          </aside>
        </div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingCart;

