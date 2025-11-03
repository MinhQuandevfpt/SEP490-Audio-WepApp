import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CheckoutAddress, CheckoutCartItem, PaymentMethod, ShippingMethod } from '../data/checkout';
import { calcCheckoutSummary } from '../data/checkout';
import { CheckoutService } from '../services/customer/CheckoutService';

export const useCheckout = () => {
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [items, setItems] = useState<CheckoutCartItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CheckoutService.loadCheckout();
      setAddresses(data.addresses);
      setItems(data.items);
      const defaultAddr = data.addresses.find(a => a.isDefault) || data.addresses[0] || null;
      setSelectedAddressId(defaultAddr ? defaultAddr.id : null);
      setShippingFee(0);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải dữ liệu checkout');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Re-estimate shipping when method changes
  useEffect(() => {
    (async () => {
      if (shippingMethod) {
        const fee = await CheckoutService.estimateShipping(shippingMethod);
        setShippingFee(fee);
      } else {
        setShippingFee(0);
      }
    })();
  }, [shippingMethod]);

  const summary = useMemo(() => calcCheckoutSummary(items, shippingFee), [items, shippingFee]);

  const inc = (id: string) => setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: it.quantity + 1 } : it));
  const dec = (id: string) => setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!selectedAddressId) errs.push('Vui lòng chọn hoặc nhập địa chỉ giao hàng.');
    if (!paymentMethod) errs.push('Vui lòng chọn phương thức thanh toán.');
    if (!shippingMethod) errs.push('Vui lòng chọn phương thức vận chuyển.');
    if (items.length === 0) errs.push('Giỏ hàng trống.');
    return errs;
  };

  const submit = async (): Promise<{ orderId: string; total: number } | null> => {
    const errs = validate();
    if (errs.length) {
      setError(errs.join(' '));
      return null;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await CheckoutService.submitOrder({
        addressId: selectedAddressId!,
        paymentMethod: paymentMethod!,
        shippingMethod: shippingMethod!,
      });
      return res;
    } catch (e: any) {
      setError(e?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // data
    addresses,
    items,
    selectedAddressId,
    shippingMethod,
    paymentMethod,
    shippingFee,
    summary,
    // states
    isLoading,
    isSubmitting,
    error,
    // actions
    setSelectedAddressId,
    setShippingMethod,
    setPaymentMethod,
    inc,
    dec,
    removeItem,
    submit,
  };
};

export default useCheckout;


