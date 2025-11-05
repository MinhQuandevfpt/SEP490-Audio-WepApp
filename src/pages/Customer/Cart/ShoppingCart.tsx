import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { calcCartSummary, type CartItem as UICartItem } from '../../../data/shoppingcart';
import Layout from '../../../components/Layout';
import CartItemsList from '../../../components/ShoppingCartComponents/CartItemsList';
import CartSummarySidebar from '../../../components/ShoppingCartComponents/CartSummarySidebar';
import { useCart } from '../../../hooks/useCart';
import { useServiceTypeCalculator } from '../../../hooks/useServiceTypeCalculator';
import { useAutoShippingFee } from '../../../hooks/useAutoShippingFee';
import { AddressService } from '../../../services/customer/AddressService';
import { CustomerCartService } from '../../../services/customer/CartService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';
import type { CartItem as ApiCartItem, CheckoutCodRequest, CheckoutPayOSRequest, StoreVoucher, ServiceTypeIds } from '../../../types/cart';
import type { CustomerAddressApiItem } from '../../../types/api';
import { ProductVoucherService } from '../../../services/customer/ProductVoucherService';
import type { PaymentMethod } from '../../../data/checkout';
import type { ShopVoucher } from '../../../components/ShoppingCartComponents/VoucherSection';
import { ProductListService } from '../../../services/customer/ProductListService';

const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isLoading, error, loadCart } = useCart();
  const [items, setItems] = useState<UICartItem[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddressApiItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Use service type calculator hook
  const {
    serviceTypeId,
    setServiceTypeId,
    packageWeight,
    setPackageWeight,
    productCache,
    setProductCache,
  } = useServiceTypeCalculator({ items });

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

  // Load addresses
  const loadAddresses = async () => {
    if (!AddressService.isAuthenticated()) return;
    try {
      setAddressesLoading(true);
      const addrList = await AddressService.getAddresses();
      setAddresses(addrList);
      const defaultAddr = addrList.find(a => a.default) || addrList[0] || null;
      setSelectedAddressId(defaultAddr ? defaultAddr.id : null);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCart();
      await loadAddresses();
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

  // Load vouchers for all products in the cart (unique by refId)
  const [availableVouchers, setAvailableVouchers] = useState<ShopVoucher[]>([]);
  const [, setVouchersLoading] = useState(false);

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        setVouchersLoading(true);
        const productIds = Array.from(new Set((cart?.items || []).map(i => i.refId)));
        if (productIds.length === 0) {
          setAvailableVouchers([]);
          return;
        }

        // Fetch vouchers and product details to get storeId
        const responses = await Promise.all(
          productIds.map(async (pid) => {
            try {
              const [voucherRes, productRes] = await Promise.all([
                ProductVoucherService.getProductVouchers(pid, 'ALL', null).catch(() => null),
                ProductListService.getProductById(pid).catch(() => null),
              ]);
              return { productId: pid, voucherRes, productRes };
            } catch {
              return { productId: pid, voucherRes: null, productRes: null };
            }
          })
        );

        // Extract shop vouchers with storeId
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

        // Dedupe by code (keep first occurrence)
        const deduped = Array.from(
          new Map(shopVouchers.map(v => [v.code, v])).values()
        );
        setAvailableVouchers(deduped);
      } finally {
        setVouchersLoading(false);
      }
    };
    loadVouchers();
  }, [cart?.items]);

  const allSelected = useMemo(() => items.every(i => i.isSelected), [items]);
  const summary = useMemo(() => calcCartSummary(items), [items]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // Voucher
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    type: 'FIXED' | 'PERCENT';
    discountValue: number;
    storeId: string;
  } | null>(null);

  // Shipping fee estimation state
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Auto-calculate shipping fee when items/address change
  useAutoShippingFee({
    items,
    addresses,
    selectedAddressId,
    productCache,
    serviceTypeId,
    onShippingFeeChange: setShippingFee,
    onProductCacheUpdate: setProductCache,
    autoCalculate: true, // Enable auto calculation
  });

  // Store applied voucher code separately to avoid dependency issues
  const appliedVoucherCodeRef = useRef<string | null>(null);
  useEffect(() => {
    appliedVoucherCodeRef.current = appliedVoucher?.code || null;
  }, [appliedVoucher?.code]);

  // Auto-update applied voucher discount when items change
  useEffect(() => {
    const voucherCode = appliedVoucherCodeRef.current;
    if (!voucherCode) return;

    // Recalculate voucher discount when items change
    const selectedItems = items.filter(it => it.isSelected);
    if (selectedItems.length === 0) {
      // Nếu không còn sản phẩm nào được chọn, gỡ voucher
      setAppliedVoucher(null);
      setVoucherInput('');
      return;
    }

    // Find the voucher to get current details
    const voucher = availableVouchers.find(v => v.code === voucherCode);
    if (!voucher) {
      // Voucher không tồn tại trong danh sách, gỡ voucher
      setAppliedVoucher(null);
      setVoucherInput('');
      return;
    }

    // Calculate store total for this voucher
    let storeTotal = 0;
    selectedItems.forEach(item => {
      const product = productCache.get(item.productId);
      if (product && product.storeId === voucher.storeId) {
        storeTotal += item.price * item.quantity;
      }
    });

    // Kiểm tra minOrderValue - nếu không đủ điều kiện, tự động gỡ voucher
    if (voucher.minOrderValue && voucher.minOrderValue > 0) {
      if (storeTotal < voucher.minOrderValue) {
        // Không đủ điều kiện, gỡ voucher và hiển thị thông báo
        setAppliedVoucher(null);
        setVoucherInput('');
        showCenterError(
          `Voucher đã được gỡ vì đơn hàng không đạt tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ. Hiện tại: ${storeTotal.toLocaleString('vi-VN')}đ`,
          'Thông báo'
        );
        return;
      }
    }

    // Calculate new discount value
    let newDiscountValue = 0;
    if (voucher.type === 'FIXED') {
      newDiscountValue = voucher.discountValue || 0;
    } else if (voucher.type === 'PERCENT') {
      const percent = voucher.discountPercent || 0;
      const discount = Math.round((storeTotal * percent) / 100);
      
      // Áp dụng maxDiscountValue nếu có
      if (voucher.maxDiscountValue && discount > voucher.maxDiscountValue) {
        newDiscountValue = voucher.maxDiscountValue;
      } else {
        newDiscountValue = discount;
      }
    }

    // Only update if discount value changed and voucher is still applied
    setAppliedVoucher(prev => {
      if (!prev || prev.code !== voucherCode) return prev;
      if (prev.discountValue === newDiscountValue) return prev;
      
      return {
        ...prev,
        discountValue: newDiscountValue,
      };
    });
  }, [items, productCache, availableVouchers]); // Recalculate when items/productCache/availableVouchers change

  // Calculate voucher discount based on store total (for display)
  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    return appliedVoucher.discountValue;
  }, [appliedVoucher]);

  const grandTotal = useMemo(() => {
    const total = summary.total + shippingFee - voucherDiscount;
    return Math.max(0, total);
  }, [summary.total, shippingFee, voucherDiscount]);

  // Calculate discount amount for a voucher
  const calculateVoucherDiscount = (voucher: ShopVoucher, storeTotal: number): number => {
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

  const handleApplyVoucher = (voucher: ShopVoucher) => {
    // Tính tổng tiền của các sản phẩm cùng storeId
    const selectedItems = items.filter(it => it.isSelected);
    let storeTotal = 0;

    selectedItems.forEach(item => {
      const product = productCache.get(item.productId);
      if (product && product.storeId === voucher.storeId) {
        storeTotal += item.price * item.quantity;
      }
    });

    const discountValue = calculateVoucherDiscount(voucher, storeTotal);

    setAppliedVoucher({
      code: voucher.code,
      type: voucher.type,
      discountValue,
      storeId: voucher.storeId || '',
    });
  };

  const handleChooseVoucher = (voucher: ShopVoucher) => {
    handleApplyVoucher(voucher);
    setVoucherInput(voucher.code);
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

  const applyCartResponseToUI = (respItems: ApiCartItem[]) => {
    setItems(respItems.map(mapApiItemToUI));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = async (cartItemId: string, nextQty: number) => {
    try {
      const clamped = Math.max(1, Math.min(nextQty, 99));
      const resp = await CustomerCartService.updateItemQuantity(cartItemId, clamped);
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[]);
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || 'Không thể cập nhật số lượng. Vui lòng thử lại.';
      showCenterError(msg, 'Lỗi');
    }
  };

  const inc = (id: string) => {
    const current = items.find(it => it.id === id);
    if (!current) return;
    updateQuantity(id, current.quantity + 1);
  };

  const dec = (id: string) => {
    const current = items.find(it => it.id === id);
    if (!current) return;
    updateQuantity(id, current.quantity - 1);
  };

  const removeItem = async (id: string) => {
    try {
      const resp = await CustomerCartService.deleteItems([id]);
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[]);
      showCenterSuccess('Đã xóa sản phẩm khỏi giỏ hàng', 'Thành công');
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || 'Không thể xóa sản phẩm. Vui lòng thử lại.';
      showCenterError(msg, 'Lỗi');
    }
  };

  const handleDeleteAll = async () => {
    if (items.length === 0) return;
    const confirm = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?');
    if (!confirm) return;
    try {
      const resp = await CustomerCartService.deleteCart();
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[]);
      showCenterSuccess('Đã xóa toàn bộ giỏ hàng', 'Thành công');
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || 'Không thể xóa giỏ hàng. Vui lòng thử lại.';
      showCenterError(msg, 'Lỗi');
    }
  };

  // Helper: Tính serviceTypeId cho một store dựa trên tổng weight của items thuộc store đó
  const calculateServiceTypeIdForStore = (storeItems: typeof items): 2 | 5 => {
    let totalWeight = 0;
    
    storeItems.forEach(item => {
      const product = productCache.get(item.productId);
      if (product) {
        const weightKg = product.weight && product.weight > 0 ? product.weight : 0.5;
        totalWeight += weightKg * 1000 * item.quantity; // Convert to grams
      }
    });
    
    // Nếu tổng weight <= 7500g thì serviceTypeId = 2 (hàng nhẹ), ngược lại = 5 (hàng nặng)
    return totalWeight <= 7500 ? 2 : 5;
  };

  // Helper: Xác định các storeId trong selected items và tính serviceTypeId cho mỗi store
  const buildServiceTypeIds = (selectedItems: typeof items): ServiceTypeIds => {
    const storeIds = new Set<string>();
    
    // Lấy tất cả storeId từ selected items
    selectedItems.forEach(item => {
      const product = productCache.get(item.productId);
      if (product && product.storeId) {
        storeIds.add(product.storeId);
      }
    });
    
    // Tính serviceTypeId cho mỗi store
    const serviceTypeIds: ServiceTypeIds = {};
    storeIds.forEach(storeId => {
      const storeItems = selectedItems.filter(item => {
        const product = productCache.get(item.productId);
        return product && product.storeId === storeId;
      });
      serviceTypeIds[storeId] = calculateServiceTypeIdForStore(storeItems);
    });
    
    return serviceTypeIds;
  };

  // Helper: Nhóm voucher theo storeId
  const buildStoreVouchers = (): StoreVoucher[] => {
    if (!appliedVoucher || !appliedVoucher.storeId) {
      return [];
    }
    
    // Nếu có applied voucher, tạo storeVoucher cho store đó
    return [{
      storeId: appliedVoucher.storeId,
      codes: [appliedVoucher.code],
    }];
  };

  // Handle checkout (COD or PayOS)
  const handleCheckout = async () => {
    // Validate
    if (summary.selectedCount === 0) {
      showCenterError('Vui lòng chọn ít nhất một sản phẩm để thanh toán', 'Lỗi');
      return;
    }

    if (!selectedAddressId) {
      showCenterError('Vui lòng chọn địa chỉ nhận hàng', 'Lỗi');
      return;
    }

    if (!paymentMethod) {
      showCenterError('Vui lòng chọn phương thức thanh toán', 'Lỗi');
      return;
    }

    if (paymentMethod !== 'cod' && paymentMethod !== 'payos') {
      showCenterError('Phương thức thanh toán không hợp lệ', 'Lỗi');
      return;
    }

    // Get selected items
    const selectedItems = items.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      showCenterError('Vui lòng chọn sản phẩm cần thanh toán', 'Lỗi');
      return;
    }

    // Get address note
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    const message = selectedAddress?.note || '';

    setIsCheckingOut(true);

    try {
      // Prepare items for both payment methods
      const checkoutItems = selectedItems.map(item => ({
        id: item.productId, // productId
        type: 'PRODUCT' as const,
        quantity: item.quantity,
      }));

      // Build storeVouchers từ appliedVoucher
      const storeVouchers = buildStoreVouchers();

      // Build serviceTypeIds cho từng store
      const serviceTypeIds = buildServiceTypeIds(selectedItems);

      if (paymentMethod === 'cod') {
        // Handle COD checkout
        const checkoutRequest: CheckoutCodRequest = {
          items: checkoutItems,
          addressId: selectedAddressId,
          message: message || undefined,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers: null, // Hiện tại chưa có, set null
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
        };

        console.log('💳 Processing COD checkout:', checkoutRequest);
        const response = await CustomerCartService.checkoutCod(checkoutRequest);

        if (response.status === 200) {
          showCenterSuccess(
            response.message || 'Đặt hàng thành công!',
            'Thành công',
            5000
          );

          // Redirect to home after 5 seconds
          setTimeout(() => {
            navigate('/');
          }, 5000);
        } else {
          showCenterError(
            response.message || 'Đặt hàng thất bại. Vui lòng thử lại.',
            'Lỗi'
          );
        }
      } else if (paymentMethod === 'payos') {
        // Handle PayOS checkout
        const returnUrl = `${window.location.origin}/payment/success`;
        const cancelUrl = `${window.location.origin}/payment/fail`;

        const checkoutRequest: CheckoutPayOSRequest = {
          addressId: selectedAddressId,
          message: message || undefined,
          description: `Đơn hàng từ AudioShop - ${selectedItems.length} sản phẩm`,
          items: checkoutItems,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers: null, // Hiện tại chưa có, set null
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
          returnUrl,
          cancelUrl,
        };

        console.log('💳 Processing PayOS checkout:', checkoutRequest);
        const response = await CustomerCartService.checkoutPayOS(checkoutRequest);

        if (response.status === 200 && response.data?.checkoutUrl) {
          // Redirect to PayOS checkout URL
          window.location.href = response.data.checkoutUrl;
        } else {
          showCenterError(
            response.message || 'Không thể tạo link thanh toán PayOS. Vui lòng thử lại.',
            'Lỗi'
          );
        }
      }
    } catch (error: any) {
      console.error(`❌ Checkout ${paymentMethod?.toUpperCase()} failed:`, error);
      
      // Handle error response
      const errorMessage = error?.message || 
                          error?.data?.message || 
                          CustomerCartService.formatCartError(error) ||
                          'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.';
      
      showCenterError(errorMessage, 'Lỗi đặt hàng');
    } finally {
      setIsCheckingOut(false);
    }
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
            {/* Items List */}
            <CartItemsList
              items={items}
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              addressesLoading={addressesLoading}
              allSelected={allSelected}
              onAddressSelect={setSelectedAddressId}
              onAddressesChange={loadAddresses}
              onToggleAll={toggleAll}
              onDeleteAll={handleDeleteAll}
              onToggleItem={toggleItem}
              onInc={inc}
              onDec={dec}
              onRemove={removeItem}
              onSetQuantity={updateQuantity}
            />

            {/* Summary Sidebar */}
            <CartSummarySidebar
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              voucherInput={voucherInput}
              appliedVoucher={appliedVoucher}
              availableVouchers={availableVouchers}
              onVoucherInputChange={setVoucherInput}
              onApplyVoucher={handleApplyVoucher}
              onChooseVoucher={handleChooseVoucher}
              onClearVoucher={clearVoucher}
              items={items}
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              productCache={productCache}
              onProductCacheUpdate={setProductCache}
              serviceTypeId={serviceTypeId}
              onServiceTypeIdChange={setServiceTypeId}
              packageWeight={packageWeight}
              onPackageWeightChange={setPackageWeight}
              shippingFee={shippingFee}
              onShippingFeeChange={setShippingFee}
              subtotal={summary.subtotal}
              discount={summary.discount}
              voucherDiscount={voucherDiscount}
              selectedCount={summary.selectedCount}
              grandTotal={grandTotal}
              onCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
              disabled={!selectedAddressId || !paymentMethod || (paymentMethod !== 'cod' && paymentMethod !== 'payos')}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingCart;
