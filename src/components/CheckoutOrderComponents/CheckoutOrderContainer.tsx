import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AddressForm, PaymentMethodDropdown, CartItemList, OrderSummaryCard } from '.';
import type { StoreGroup } from './CartItemList';
import { useServiceTypeCalculator } from '../../hooks/useServiceTypeCalculator';
import { useAutoShippingFee } from '../../hooks/useAutoShippingFee';
import { AddressService } from '../../services/customer/AddressService';
import { CustomerCartService } from '../../services/customer/CartService';
import { ProductVoucherService } from '../../services/customer/ProductVoucherService';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
import { showCenterError, showCenterSuccess } from '../../utils/notification';
import type { CustomerAddressApiItem } from '../../types/api';
import type { CartItem as ApiCartItem, CheckoutCodRequest, CheckoutPayOSRequest, StoreVoucher, ServiceTypeIds, PlatformVoucher } from '../../types/cart';
import type { CartItem } from '../../data/shoppingcart';
import type { CheckoutCartItem, PaymentMethod } from '../../data/checkout';
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

const calculateStoreTotal = (
  items: CartItem[],
  storeId: string,
  productCache: Map<string, Product>,
  platformVoucherDiscounts: Record<string, { discount: number; campaignProductId: string }> = {}
): number => {
  return items.reduce((sum, item) => {
    const product = productCache.get(item.productId);
    if (!product || product.storeId !== storeId) return sum;
    // Use price after platform discount
    const platformVoucherInfo = platformVoucherDiscounts[item.productId];
    const platformDiscount = platformVoucherInfo?.discount || 0;
    const itemPriceAfterDiscount = item.price - platformDiscount;
    const finalPrice = Math.max(0, itemPriceAfterDiscount);
    return sum + finalPrice * item.quantity;
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
  const result = Object.values(applied).map(voucher => ({
    storeId: voucher.storeId,
    codes: [voucher.code],
  }));
  console.log('🏪 [BUILD STORE VOUCHERS] Input:', applied, 'Output:', result);
  return result;
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
  // Platform voucher info: Record<productId, { discount: number; campaignProductId: string }>
  const [platformVoucherDiscounts, setPlatformVoucherDiscounts] = useState<Record<string, { discount: number; campaignProductId: string }>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [storeMetadata, setStoreMetadata] = useState<Record<string, { storeName: string }>>({});

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

  const groupedCartItems = useMemo<StoreGroup[]>(() => {
    if (checkoutCartItems.length === 0) return [];
    const groups = new Map<string, StoreGroup>();

    checkoutCartItems.forEach(item => {
      const product = productCache.get(item.productId);
      const productStoreId = product?.storeId;
      const storeId = productStoreId || `unknown-${item.productId}`;
      const storeName =
        product?.storeName ||
        (productStoreId ? storeMetadata[productStoreId]?.storeName : undefined) ||
        'Cửa hàng chưa xác định';

      if (!groups.has(storeId)) {
        groups.set(storeId, {
          storeId,
          storeName,
          items: [],
        });
      }

      groups.get(storeId)!.items.push(item);
    });

    return Array.from(groups.values());
  }, [checkoutCartItems, productCache, storeMetadata]);

  // Calculate subtotal after platform voucher discounts
  const subtotalAfterPlatformDiscount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const platformVoucherInfo = platformVoucherDiscounts[item.productId];
      const platformDiscount = platformVoucherInfo?.discount || 0;
      const itemPriceAfterDiscount = item.price - platformDiscount;
      const finalPrice = Math.max(0, itemPriceAfterDiscount);
      return sum + finalPrice * item.quantity;
    }, 0);
  }, [cartItems, platformVoucherDiscounts]);

  // Calculate total platform voucher discount amount
  const totalPlatformDiscount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const platformVoucherInfo = platformVoucherDiscounts[item.productId];
      const platformDiscount = platformVoucherInfo?.discount || 0;
      return sum + platformDiscount * item.quantity;
    }, 0);
  }, [cartItems, platformVoucherDiscounts]);

  // Build platform vouchers array for checkout request
  const buildPlatformVouchers = useCallback((): PlatformVoucher[] => {
    const platformVouchersMap = new Map<string, number>();
    
    console.log('🎁 [BUILD PLATFORM VOUCHERS] Starting build...');
    console.log('  - Cart Items:', cartItems);
    console.log('  - Platform Voucher Discounts:', platformVoucherDiscounts);
    
    cartItems.forEach(item => {
      const platformVoucherInfo = platformVoucherDiscounts[item.productId];
      console.log(`  - Processing item ${item.productId}:`, {
        item,
        platformVoucherInfo,
        hasDiscount: platformVoucherInfo && platformVoucherInfo.discount > 0
      });
      
      if (platformVoucherInfo && platformVoucherInfo.discount > 0) {
        const { campaignProductId } = platformVoucherInfo;
        const currentQuantity = platformVouchersMap.get(campaignProductId) || 0;
        platformVouchersMap.set(campaignProductId, currentQuantity + item.quantity);
        console.log(`  - Added to map: campaignProductId=${campaignProductId}, quantity=${currentQuantity + item.quantity}`);
      }
    });
    
    const result = Array.from(platformVouchersMap.entries()).map(([campaignProductId, quantity]) => ({
      campaignProductId,
      quantity,
    }));
    
    console.log('🎁 [BUILD PLATFORM VOUCHERS] Result:', result);
    return result;
  }, [cartItems, platformVoucherDiscounts]);

  // Store voucher discount
  const voucherDiscount = useMemo(() => {
    return Object.values(appliedStoreVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
  }, [appliedStoreVouchers]);

  // Grand total = subtotal (after platform discount) - store voucher discount + shipping fee
  const total = useMemo(() => {
    return Math.max(0, subtotalAfterPlatformDiscount + shippingFee - voucherDiscount);
  }, [subtotalAfterPlatformDiscount, shippingFee, voucherDiscount]);

  const loadAddresses = useCallback(async (): Promise<CustomerAddressApiItem[]> => {
    try {
      const list = await AddressService.getAddresses();
      setAddresses(list);
      return list;
    } catch (error: any) {
      setError(error?.message || 'Không thể tải danh sách địa chỉ.');
      setAddresses([]);
      return [];
    }
  }, []);

  const handleAddressesChange = useCallback(async () => {
    await loadAddresses();
  }, [loadAddresses]);

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
          loadAddresses(),
          CustomerCartService.getCart(),
        ]);

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
  }, [loadAddresses]);

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }
    if (selectedAddressId && !addresses.some(addr => addr.id === selectedAddressId)) {
      const fallback = addresses.find(addr => addr.default) || addresses[0] || null;
      setSelectedAddressId(fallback ? fallback.id : null);
    }
  }, [addresses, selectedAddressId]);

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
        const platformDiscountsMap: Record<string, { discount: number; campaignProductId: string }> = {};
        
        const newStoreMeta: Record<string, { storeName: string }> = {};

        responses.forEach(({ voucherRes, productRes }, index) => {
          const productId = productIds[index];
          
          if (voucherRes && productRes) {
            const storeId = productRes.data?.storeId;
            if (storeId) {
              newStoreMeta[storeId] = {
                storeName: productRes.data?.storeName || `Cửa hàng ${storeId.substring(0, 6)}`,
              };
            }
            const vouchers = voucherRes.data?.vouchers?.shop || [];
            vouchers.forEach((v: any) => {
              shopVouchers.push({
                ...v,
                storeId: storeId || undefined,
              });
            });
          }
          
          // Calculate platform voucher discount and store campaignProductId
          if (voucherRes?.data) {
            const platformCampaigns = voucherRes.data.vouchers?.platform || [];
            let platformDiscount = 0;
            let campaignProductId: string | null = null; // Will be set from platformVoucherId
            
            if (voucherRes.data.product) {
              // Use product price from API response
              const originalPrice = voucherRes.data.product.price;
              
              for (const campaign of platformCampaigns) {
                if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
                  const activeVoucher = campaign.vouchers.find((v: any) => v.status === 'ACTIVE');
                  if (activeVoucher) {
                    // campaignProductId should be platformVoucherId from the active voucher
                    campaignProductId = activeVoucher.platformVoucherId;
                    
                    if (activeVoucher.type === 'FIXED') {
                      platformDiscount = activeVoucher.discountValue || 0;
                    } else if (activeVoucher.type === 'PERCENT') {
                      const percentDiscount = (originalPrice * (activeVoucher.discountPercent || 0)) / 100;
                      if (activeVoucher.maxDiscountValue !== null && activeVoucher.maxDiscountValue !== undefined) {
                        platformDiscount = Math.min(percentDiscount, activeVoucher.maxDiscountValue);
                      } else {
                        platformDiscount = percentDiscount;
                      }
                    }
                    break; // Use first active voucher found
                  }
                }
              }
            }
            
            // Only store if we have both discount and platformVoucherId
            if (platformDiscount > 0 && campaignProductId) {
              platformDiscountsMap[productId] = {
                discount: platformDiscount,
                campaignProductId: campaignProductId,
              };
            }
          }
        });

        if (Object.keys(newStoreMeta).length > 0) {
          setStoreMetadata(prev => ({ ...prev, ...newStoreMeta }));
        }

        const deduped = Array.from(new Map(shopVouchers.map(v => [v.code, v])).values());
        setAvailableVouchers(deduped);
        setPlatformVoucherDiscounts(platformDiscountsMap);
      } catch {
        setAvailableVouchers([]);
      }
    };

    loadVouchers();
  }, [cartItems]);

  useEffect(() => {
    // Chỉ validate khi đã có đủ dữ liệu
    // Nếu availableVouchers đang rỗng (chưa load xong) hoặc cartItems rỗng, giữ nguyên voucher
    if (cartItems.length === 0) return;
    
    // Kiểm tra xem productCache đã có đủ data cho tất cả items chưa
    const allProductsCached = cartItems.every(item => productCache.has(item.productId));
    
    // Nếu chưa có đủ data, giữ nguyên voucher (không validate)
    if (!allProductsCached && productCache.size === 0) {
      return;
    }

    const messages: string[] = [];

    setAppliedStoreVouchers(prev => {
      if (Object.keys(prev).length === 0) return prev;
      let changed = false;
      const next: Record<string, AppliedStoreVoucher> = {};

      Object.entries(prev).forEach(([storeId, applied]) => {
        // Nếu availableVouchers chưa load xong, giữ nguyên voucher với discountValue hiện tại
        if (availableVouchers.length === 0) {
          next[storeId] = applied;
          return;
        }

        const voucher = availableVouchers.find(v => v.code === applied.code);
        const storeTotal = calculateStoreTotal(cartItems, storeId, productCache, platformVoucherDiscounts);

        // Nếu không tìm thấy voucher trong availableVouchers, nhưng availableVouchers đã load xong
        // thì có thể voucher đã hết hạn hoặc không còn hợp lệ
        if (!voucher) {
          // Chỉ xóa nếu availableVouchers đã load xong (length > 0)
          // Nếu đang loading (length = 0), giữ nguyên
          if (availableVouchers.length > 0) {
            changed = true;
            messages.push(`Voucher ${applied.code} không còn hợp lệ.`);
            return;
          } else {
            // Đang loading, giữ nguyên
            next[storeId] = applied;
            return;
          }
        }

        // Nếu storeTotal = 0, có thể do productCache chưa có đủ data
        // Chỉ xóa nếu chắc chắn storeTotal = 0 (tất cả products đã có trong cache)
        if (storeTotal <= 0 && allProductsCached) {
          changed = true;
          return;
        }

        // Nếu storeTotal = 0 nhưng chưa có đủ cache, giữ nguyên voucher
        if (storeTotal <= 0) {
          next[storeId] = applied;
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
  }, [cartItems, productCache, availableVouchers, platformVoucherDiscounts]);

  const applyCartResponseToUI = (respItems: ApiCartItem[]) => {
    const nextItems = respItems
      .filter(item => selectedCartItemIds.includes(item.cartItemId))
      .map(mapApiItemToCartItem);
    setCartItems(nextItems);
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
      productId: item.productId,
      type: 'PRODUCT' as const,
      quantity: item.quantity,
    }));

    const storeVouchers = buildStoreVouchers(appliedStoreVouchers);
    const serviceTypeIds = buildServiceTypeIds(cartItems, productCache);
    const platformVouchers = buildPlatformVouchers();

    // Debug logging
    console.log('🔍 [CHECKOUT DEBUG] ===========================================');
    console.log('📦 Cart Items:', cartItems);
    console.log('💰 Applied Store Vouchers:', appliedStoreVouchers);
    console.log('🏪 Built Store Vouchers:', storeVouchers);
    console.log('🎫 Platform Voucher Discounts:', platformVoucherDiscounts);
    console.log('🎁 Built Platform Vouchers:', platformVouchers);
    console.log('📊 Subtotal (after platform discount):', subtotalAfterPlatformDiscount);
    console.log('💵 Total Platform Discount:', totalPlatformDiscount);
    console.log('🎟️ Store Voucher Discount:', voucherDiscount);
    console.log('🚚 Shipping Fee:', shippingFee);
    console.log('💳 Grand Total:', total);
    console.log('============================================================');

    setIsSubmitting(true);
    setError(null);

    try {
      if (paymentMethod === 'cod') {
        const request: CheckoutCodRequest = {
          items: checkoutItemsPayload,
          addressId: selectedAddressId,
          message: message || undefined,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers: platformVouchers.length > 0 ? platformVouchers : null,
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
        };
        
        console.log('📤 [COD REQUEST] Sending checkout request:', JSON.stringify(request, null, 2));
        
        const response = await CustomerCartService.checkoutCod(request);
        
        console.log('✅ [COD RESPONSE] Received response:', response);
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
          platformVouchers: platformVouchers.length > 0 ? platformVouchers : null,
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
          returnUrl,
          cancelUrl,
        };
        
        console.log('📤 [PAYOS REQUEST] Sending checkout request:', JSON.stringify(request, null, 2));
        
        const response = await CustomerCartService.checkoutPayOS(request);
        
        console.log('✅ [PAYOS RESPONSE] Received response:', response);
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
                      addresses={addresses}
                      selectedAddressId={selectedAddressId}
                      onSelect={setSelectedAddressId}
                      onAddressesChange={handleAddressesChange}
                    />
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-base font-semibold text-gray-900">Sản phẩm</p>
                  </div>
                  <div className="px-6 py-4">
                    <CartItemList groups={groupedCartItems} onRemove={removeItem} />
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
                        subtotal={subtotalAfterPlatformDiscount}
                        platformDiscount={totalPlatformDiscount}
                        voucherDiscount={voucherDiscount}
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

