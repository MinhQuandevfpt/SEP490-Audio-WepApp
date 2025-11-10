import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AddressForm, PaymentMethodDropdown, CartItemList, OrderSummaryCard } from '.';
import { useServiceTypeCalculator } from '../../hooks/useServiceTypeCalculator';
import { useAutoShippingFee } from '../../hooks/useAutoShippingFee';
import { AddressService } from '../../services/customer/AddressService';
import { CustomerCartService } from '../../services/customer/CartService';
import { ProductVoucherService } from '../../services/customer/ProductVoucherService';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
import { showCenterError, showCenterSuccess } from '../../utils/notification';
import type { CustomerAddressApiItem } from '../../types/api';
import type { CartItem as ApiCartItem, CheckoutCodRequest, CheckoutPayOSRequest, StoreVoucher, ServiceTypeIds } from '../../types/cart';
import type { CartItem } from '../../data/shoppingcart';
import type { CheckoutAddress, CheckoutCartItem, PaymentMethod } from '../../data/checkout';
import type { ShopVoucher } from '../ShoppingCartComponents/VoucherSection';
import type { AppliedStoreVoucher } from '../ShoppingCartComponents/StoreVoucherPicker';
import { Home, ChevronRight } from 'lucide-react';

const CHECKOUT_SESSION_KEY = 'checkout:payload:v1';

interface CheckoutSessionPayload {
  selectedCartItemIds: string[];
  storeVouchers: Record<string, AppliedStoreVoucher>;
  selectedAddressId?: string | null;
  createdAt?: number;
}

const mapApiItemToCartItem = (apiItem: ApiCartItem): CartItem => ({
  id: apiItem.cartItemId,
  productId: apiItem.refId,
  name: apiItem.name,
  image: apiItem.image,
  price: apiItem.unitPrice,
  quantity: apiItem.quantity,
  isSelected: true,
});

const mapAddressToCheckoutAddress = (addr: CustomerAddressApiItem): CheckoutAddress => ({
  id: addr.id,
  fullName: addr.receiverName,
  phone: addr.phoneNumber,
  street: addr.addressLine || addr.street,
  district: addr.district,
  city: addr.province,
  isDefault: addr.default,
});

const calculateStoreTotal = (
  items: CartItem[],
  storeId: string,
  productCache: Map<string, Product>
): number => {
  return items.reduce((sum, item) => {
    const product = productCache.get(item.productId);
    if (!product || product.storeId !== storeId) return sum;
    return sum + item.price * item.quantity;
  }, 0);
};

const calculateVoucherDiscountAmount = (voucher: ShopVoucher, storeTotal: number): number => {
  if (voucher.type === 'FIXED') {
    return voucher.discountValue || 0;
  }
  if (voucher.type === 'PERCENT') {
    const percent = voucher.discountPercent || 0;
    const discount = Math.round((storeTotal * percent) / 100);
    if (voucher.maxDiscountValue && discount > voucher.maxDiscountValue) {
      return voucher.maxDiscountValue;
    }
    return discount;
  }
  return 0;
};

const buildStoreVouchers = (applied: Record<string, AppliedStoreVoucher>): StoreVoucher[] => {
  return Object.values(applied).map(voucher => ({
    storeId: voucher.storeId,
    codes: [voucher.code],
  }));
};

const calculateServiceTypeIdForStore = (
  items: CartItem[],
  storeId: string,
  productCache: Map<string, Product>
): 2 | 5 => {
  let totalWeight = 0;
  items.forEach(item => {
    const product = productCache.get(item.productId);
    if (product && product.storeId === storeId) {
      const weightKg = product.weight && product.weight > 0 ? product.weight : 0.5;
      totalWeight += weightKg * 1000 * item.quantity;
    }
  });
  return totalWeight <= 7500 ? 2 : 5;
};

const buildServiceTypeIds = (items: CartItem[], productCache: Map<string, Product>): ServiceTypeIds => {
  const result: ServiceTypeIds = {};
  const storeIds = new Set<string>();
  items.forEach(item => {
    const product = productCache.get(item.productId);
    if (product?.storeId) {
      storeIds.add(product.storeId);
    }
  });
  storeIds.forEach(storeId => {
    result[storeId] = calculateServiceTypeIdForStore(items, storeId, productCache);
  });
  return result;
};

const CheckoutOrderContainer: React.FC = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<CustomerAddressApiItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCartItemIds, setSelectedCartItemIds] = useState<string[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<ShopVoucher[]>([]);
  const [appliedStoreVouchers, setAppliedStoreVouchers] = useState<Record<string, AppliedStoreVoucher>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const shippingItems = useMemo(
    () => cartItems.map(item => ({ ...item, isSelected: true })),
    [cartItems]
  );

  const { serviceTypeId, productCache, setProductCache } = useServiceTypeCalculator({
    items: shippingItems,
  });

  useAutoShippingFee({
    items: shippingItems,
    addresses,
    selectedAddressId,
    productCache,
    serviceTypeId,
    onShippingFeeChange: setShippingFee,
    onProductCacheUpdate: setProductCache,
    autoCalculate: shippingItems.length > 0 && !!selectedAddressId,
  });

  const checkoutAddresses = useMemo<CheckoutAddress[]>(() => {
    return addresses.map(mapAddressToCheckoutAddress);
  }, [addresses]);

  const checkoutCartItems = useMemo<CheckoutCartItem[]>(() => {
    return cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      quantity: item.quantity,
    }));
  }, [cartItems]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const voucherDiscount = useMemo(() => {
    return Object.values(appliedStoreVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
    }, [appliedStoreVouchers]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + shippingFee - voucherDiscount);
  }, [subtotal, shippingFee, voucherDiscount]);

  useEffect(() => {
    const init = async () => {
      const payloadRaw = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
      if (!payloadRaw) {
        showCenterError('Không tìm thấy thông tin giỏ hàng. Vui lòng chọn sản phẩm trước khi thanh toán.', 'Thông báo');
        window.location.href = '/cart';
        return;
      }

      let payload: CheckoutSessionPayload;
      try {
        payload = JSON.parse(payloadRaw) as CheckoutSessionPayload;
      } catch {
        showCenterError('Thông tin giỏ hàng không hợp lệ. Vui lòng chọn lại sản phẩm.', 'Thông báo');
        window.location.href = '/cart';
        return;
      }

      if (!payload.selectedCartItemIds || payload.selectedCartItemIds.length === 0) {
        showCenterError('Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm trước khi thanh toán.', 'Thông báo');
        window.location.href = '/cart';
        return;
      }

      setAppliedStoreVouchers(payload.storeVouchers || {});
      setSelectedCartItemIds(payload.selectedCartItemIds);

      try {
        setIsLoading(true);
        setError(null);

        const [addressList, cartResponse] = await Promise.all([
          AddressService.getAddresses(),
          CustomerCartService.getCart(),
        ]);

        setAddresses(addressList);

        const defaultAddress =
          payload.selectedAddressId ||
          addressList.find(addr => addr.default)?.id ||
          addressList[0]?.id ||
          null;
        setSelectedAddressId(defaultAddress);

        const selectedCartItems = cartResponse.items.filter(item =>
          payload.selectedCartItemIds.includes(item.cartItemId)
        );

        if (selectedCartItems.length === 0) {
          showCenterError('Không tìm thấy sản phẩm đã chọn. Vui lòng kiểm tra lại giỏ hàng.', 'Thông báo');
          window.location.href = '/cart';
          return;
        }

        setCartItems(selectedCartItems.map(mapApiItemToCartItem));
      } catch (err: any) {
        setError(err?.message || 'Không thể tải dữ liệu thanh toán. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        const productIds = Array.from(new Set(cartItems.map(item => item.productId)));
        if (productIds.length === 0) {
          setAvailableVouchers([]);
          return;
        }

        const responses = await Promise.all(
          productIds.map(async pid => {
            try {
              const [voucherRes, productRes] = await Promise.all([
                ProductVoucherService.getProductVouchers(pid, 'ALL', null).catch(() => null),
                ProductListService.getProductById(pid).catch(() => null),
              ]);
              return { voucherRes, productRes };
            } catch {
              return { voucherRes: null, productRes: null };
            }
          })
        );

        const shopVouchers: ShopVoucher[] = [];
        responses.forEach(({ voucherRes, productRes }) => {
          if (voucherRes && productRes) {
            const storeId = productRes.data?.storeId;
            const vouchers = voucherRes.data?.vouchers?.shop || [];
            vouchers.forEach((v: any) => {
              shopVouchers.push({
                ...v,
                storeId: storeId || undefined,
              });
            });
          }
        });

        const deduped = Array.from(new Map(shopVouchers.map(v => [v.code, v])).values());
        setAvailableVouchers(deduped);
      } catch {
        setAvailableVouchers([]);
      }
    };

    loadVouchers();
  }, [cartItems]);

  useEffect(() => {
    const messages: string[] = [];

    setAppliedStoreVouchers(prev => {
      if (Object.keys(prev).length === 0) return prev;
      let changed = false;
      const next: Record<string, AppliedStoreVoucher> = {};

      Object.entries(prev).forEach(([storeId, applied]) => {
        const voucher = availableVouchers.find(v => v.code === applied.code);
        const storeTotal = calculateStoreTotal(cartItems, storeId, productCache);

        if (!voucher || storeTotal <= 0) {
          changed = true;
          return;
        }

        if (voucher.minOrderValue && storeTotal < voucher.minOrderValue) {
          changed = true;
          messages.push(
            `Voucher ${applied.code} đã được gỡ vì đơn hàng không đạt tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ.`
          );
          return;
        }

        const discountValue = calculateVoucherDiscountAmount(voucher, storeTotal);
        next[storeId] = {
          ...applied,
          discountValue,
        };
        if (discountValue !== applied.discountValue) {
          changed = true;
        }
      });

      if (!changed && Object.keys(next).length === Object.keys(prev).length) {
        return prev;
      }

      return next;
    });

    messages.forEach(msg => showCenterError(msg, 'Voucher'));
  }, [cartItems, productCache, availableVouchers]);

  const applyCartResponseToUI = (respItems: ApiCartItem[]) => {
    const nextItems = respItems
      .filter(item => selectedCartItemIds.includes(item.cartItemId))
      .map(mapApiItemToCartItem);
    setCartItems(nextItems);
  };

  const updateQuantity = async (cartItemId: string, nextQty: number) => {
    try {
      const clamped = Math.max(1, Math.min(nextQty, 99));
      const resp = await CustomerCartService.updateItemQuantity(cartItemId, clamped);
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[]);
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || 'Không thể cập nhật số lượng. Vui lòng thử lại.';
      setError(msg);
    }
  };

  const inc = (id: string) => {
    const current = cartItems.find(it => it.id === id);
    if (!current) return;
    updateQuantity(id, current.quantity + 1);
  };

  const dec = (id: string) => {
    const current = cartItems.find(it => it.id === id);
    if (!current) return;
    updateQuantity(id, current.quantity - 1);
  };

  const removeItem = async (id: string) => {
    try {
      const resp = await CustomerCartService.deleteItems([id]);
      const remainingIds = selectedCartItemIds.filter(itemId => itemId !== id);
      setSelectedCartItemIds(remainingIds);
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[]);
      showCenterSuccess('Đã xóa sản phẩm khỏi đơn hàng', 'Thành công');
      if (remainingIds.length === 0) {
        showCenterError('Giỏ hàng rỗng, quay lại để chọn sản phẩm.', 'Thông báo');
        window.location.href = '/cart';
      }
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || 'Không thể xóa sản phẩm. Vui lòng thử lại.';
      setError(msg);
    }
  };

  // Shipping selection removed: API provides shipping fee directly

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      setError('Giỏ hàng của bạn đang trống.');
      return;
    }
    if (!selectedAddressId) {
      setError('Vui lòng chọn địa chỉ nhận hàng.');
      return;
    }
    if (!paymentMethod) {
      setError('Vui lòng chọn phương thức thanh toán.');
      return;
    }

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    const message = selectedAddress?.note || '';
    const checkoutItemsPayload = cartItems.map(item => ({
      id: item.productId,
      type: 'PRODUCT' as const,
      quantity: item.quantity,
    }));

    const storeVouchers = buildStoreVouchers(appliedStoreVouchers);
    const serviceTypeIds = buildServiceTypeIds(cartItems, productCache);

    setIsSubmitting(true);
    setError(null);

    try {
      if (paymentMethod === 'cod') {
        const request: CheckoutCodRequest = {
          items: checkoutItemsPayload,
          addressId: selectedAddressId,
          message: message || undefined,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers: null,
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
        };
        const response = await CustomerCartService.checkoutCod(request);
        if (response.status === 200) {
          sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
          showCenterSuccess(response.message || 'Đặt hàng thành công!', 'Thành công', 4000);
          setCartItems([]);
          // Redirect to orders page similar to old flow
          navigate('/orders', { replace: true });
        } else {
          setError(response.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
        }
      } else if (paymentMethod === 'payos') {
        const returnUrl = `${window.location.origin}/payment/success`;
        const cancelUrl = `${window.location.origin}/payment/fail`;
        const request: CheckoutPayOSRequest = {
          addressId: selectedAddressId,
          message: message || undefined,
          description: `Đơn hàng từ AudioShop - ${cartItems.length} sản phẩm`,
          items: checkoutItemsPayload,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers: null,
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
          returnUrl,
          cancelUrl,
        };
        const response = await CustomerCartService.checkoutPayOS(request);
        if (response.status === 200 && response.data?.checkoutUrl) {
          sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
          window.location.href = response.data.checkoutUrl;
          return;
        }
        setError(response.message || 'Không thể tạo liên kết thanh toán PayOS. Vui lòng thử lại.');
      } else {
        setError('Phương thức thanh toán không hợp lệ.');
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.data?.message ||
        CustomerCartService.formatCartError(err) ||
        'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-5">
            <div className="flex items-center gap-2 px-6 py-4 text-sm text-gray-600 border-b border-gray-100">
              <Home className="w-4 h-4" />
              <span>Giỏ hàng</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">Thanh toán</span>
              <ChevronRight className="w-4 h-4" />
              <span>Xác nhận</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-3">Đang tải dữ liệu thanh toán...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-base font-semibold text-gray-900">Địa chỉ nhận hàng</p>
                  </div>
                  <div className="px-6 py-4">
                    <AddressForm
                      addresses={checkoutAddresses}
                      selectedAddressId={selectedAddressId}
                      onSelect={setSelectedAddressId}
                    />
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-base font-semibold text-gray-900">Sản phẩm</p>
                  </div>
                  <div className="px-6 py-4">
                    <CartItemList items={checkoutCartItems} onInc={inc} onDec={dec} onRemove={removeItem} />
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  {/* Shipping selection hidden: shipping fee is pre-calculated by API */}
                </section>
              </div>

              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 space-y-5">
                  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-base font-semibold text-gray-900">Phương thức thanh toán</p>
                    </div>
                    <div className="px-5 py-4">
                      <PaymentMethodDropdown value={paymentMethod} onChange={setPaymentMethod} />
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-base font-semibold text-gray-900">Đơn hàng</p>
                      {error && (
                        <span className="text-xs text-red-500 font-medium">
                          {error}
                        </span>
                      )}
                    </div>
                    <div className="px-5 py-4">
                      <OrderSummaryCard
                        subtotal={subtotal}
                        discount={voucherDiscount}
                        shippingFee={shippingFee}
                        total={total}
                        disabled={
                          isSubmitting ||
                          !selectedAddressId ||
                          !paymentMethod ||
                          cartItems.length === 0
                        }
                        onSubmit={handleSubmit}
                      />
                      {isSubmitting && (
                        <p className="text-xs text-gray-500 text-center mt-3">Đang gửi đơn hàng...</p>
                      )}
                    </div>
                  </section>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutOrderContainer;

