import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AddressForm, PaymentMethodDropdown, CartItemList, OrderSummaryCard } from '.';
import type { StoreGroup } from './CartItemList';
import { useServiceTypeCalculator } from '../../hooks/useServiceTypeCalculator';
import { useAutoShippingFee, type StoreShippingFee } from '../../hooks/useAutoShippingFee';
import { AddressService } from '../../services/customer/AddressService';
import { CustomerCartService } from '../../services/customer/CartService';
import { ProductVoucherService } from '../../services/customer/ProductVoucherService';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
import { VoucherService, type StoreVoucher } from '../../services/seller/VoucherService';
import { showCenterError, showCenterSuccess } from '../../utils/notification';
import type { CustomerAddressApiItem } from '../../types/api';
import type { CartItem as ApiCartItem, CheckoutCodRequest, CheckoutPayOSRequest, StoreVoucher as CheckoutStoreVoucher, ServiceTypeIds } from '../../types/cart';
import type { CartItem } from '../../data/shoppingcart';
import type { CheckoutCartItem, PaymentMethod } from '../../data/checkout';
import type { ShopVoucher } from '../ShoppingCartComponents/VoucherSection';
import type { AppliedStoreVoucher } from '../ShoppingCartComponents/StoreVoucherPicker';
import type { AppliedStoreWideVoucher } from './StoreWideVoucherSection';
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
  // Ưu tiên sử dụng variantUrl nếu có, nếu không thì dùng image
  image: apiItem.variantUrl || apiItem.image,
  price: apiItem.unitPrice,
  quantity: apiItem.quantity,
  isSelected: true,
  variant: apiItem.variantOptionValue || undefined,
  variantId: apiItem.variantId || null, // Lưu variantId từ API (có thể là null)
  type: apiItem.type || 'PRODUCT', // Lưu type từ API
});

/**
 * Áp dụng giảm giá nền tảng cho từng cart item dựa trên unitPrice (giống ShoppingCart)
 * - Chỉ áp dụng cho PRODUCT, không áp dụng cho COMBO
 * - Trả về CartItem với price (sau giảm) và originalPrice (giá gốc)
 */
const enhanceApiItemsWithPlatformDiscounts = async (
  apiItems: ApiCartItem[]
): Promise<CartItem[]> => {
  return Promise.all(
    apiItems.map(async (apiItem) => {
      const baseItem: CartItem = {
        id: apiItem.cartItemId,
        productId: apiItem.refId,
        name: apiItem.name,
        image: apiItem.variantUrl || apiItem.image,
        price: apiItem.unitPrice,
        originalPrice: apiItem.unitPrice,
        quantity: apiItem.quantity,
        isSelected: true,
        variant: apiItem.variantOptionValue || undefined,
        variantId: apiItem.variantId || null,
        type: apiItem.type || 'PRODUCT',
      };

      // Chỉ áp dụng giảm giá nền tảng cho PRODUCT
      if (!apiItem.refId || apiItem.type === 'COMBO') {
        return baseItem;
      }

      try {
        const response = await ProductVoucherService.getProductVouchers(
          apiItem.refId,
          'ALL',
          null
        );

        const platformCampaigns = response.data?.vouchers?.platform || [];
        let activePlatformVoucher: any = null;
        const now = new Date();

        // Tìm voucher nền tảng đang ACTIVE (giống logic ShoppingCart/ProductSuggestions)
        for (const campaign of platformCampaigns) {
          if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
            for (const v of campaign.vouchers) {
              if (v.status !== 'ACTIVE') continue;

              let isActive = false;
              if (v.slotOpenTime && v.slotCloseTime) {
                isActive =
                  now >= new Date(v.slotOpenTime) &&
                  now <= new Date(v.slotCloseTime) &&
                  v.slotStatus === 'ACTIVE';
              } else {
                isActive =
                  now >= new Date(v.startTime) &&
                  now <= new Date(v.endTime) &&
                  v.status === 'ACTIVE';
              }

              if (isActive) {
                activePlatformVoucher = v;
                break;
              }
            }

            if (activePlatformVoucher) break;
          }
        }

        if (activePlatformVoucher) {
          const originalPrice = baseItem.originalPrice ?? baseItem.price;
          let discountedPrice = originalPrice;

          if (activePlatformVoucher.type === 'PERCENT' && activePlatformVoucher.discountPercent) {
            discountedPrice = originalPrice * (1 - activePlatformVoucher.discountPercent / 100);
          } else if (activePlatformVoucher.type === 'FIXED' && activePlatformVoucher.discountValue) {
            discountedPrice = Math.max(0, originalPrice - activePlatformVoucher.discountValue);
          }

          if (discountedPrice < originalPrice) {
            return {
              ...baseItem,
              price: discountedPrice,
              originalPrice,
            };
          }
        }
      } catch (err) {
        console.error('Failed to load platform vouchers for checkout item:', err);
      }

      return baseItem;
    })
  );
};

const calculateStoreTotal = (
  items: CartItem[],
  storeId: string,
  productCache: Map<string, Product>
): number => {
  // Tính tổng tiền theo giá đã áp dụng giảm giá nền tảng (item.price)
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

const buildStoreVouchers = (
  applied: Record<string, AppliedStoreVoucher>,
  appliedStoreWide: Record<string, AppliedStoreWideVoucher>
): CheckoutStoreVoucher[] => {
  const result: CheckoutStoreVoucher[] = [];
  
  // Add product-specific vouchers
  Object.values(applied).forEach(voucher => {
    result.push({
      storeId: voucher.storeId,
      codes: [voucher.code],
    });
  });
  
  // Add store-wide vouchers
  Object.values(appliedStoreWide).forEach(voucher => {
    // Check if store already has vouchers
    const existingIndex = result.findIndex(v => v.storeId === voucher.storeId);
    if (existingIndex >= 0) {
      // Add code to existing store vouchers
      result[existingIndex].codes.push(voucher.code);
    } else {
      // Create new entry for this store
      result.push({
        storeId: voucher.storeId,
        codes: [voucher.code],
      });
    }
  });
  
  console.log('🏪 [BUILD STORE VOUCHERS] Input:', { applied, appliedStoreWide }, 'Output:', result);
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
  // NOTE: keys = productId (giống ShoppingCart), value = AppliedStoreVoucher có chứa storeId
  const [appliedStoreVouchers, setAppliedStoreVouchers] = useState<Record<string, AppliedStoreVoucher>>({});
  // Store-wide vouchers: Record<storeId, StoreVoucher[]>
  const [storeWideVouchers, setStoreWideVouchers] = useState<Record<string, StoreVoucher[]>>({});
  // Applied store-wide vouchers: Record<storeId, AppliedStoreWideVoucher>
  const [appliedStoreWideVouchers, setAppliedStoreWideVouchers] = useState<Record<string, AppliedStoreWideVoucher>>({});
  // Platform voucher info: Record<productId, { discount: number; campaignProductId: string }>
  const [platformVoucherDiscounts, setPlatformVoucherDiscounts] = useState<Record<string, { discount: number; campaignProductId: string }>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [storeShippingFees, setStoreShippingFees] = useState<Record<string, StoreShippingFee>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingFeeError, setShippingFeeError] = useState<string | null>(null);
  const [storeMetadata, setStoreMetadata] = useState<Record<string, { storeName: string }>>({});

  const shippingItems = useMemo(
    () => cartItems.map(item => ({ ...item, isSelected: true })),
    [cartItems]
  );

  // selectedAddress & formatted address display đã được hiển thị trong AddressForm,
  // không cần lặp lại ở phần "Đơn hàng" nên không sử dụng tại đây nữa.

  const { serviceTypeId, productCache, setProductCache } = useServiceTypeCalculator({
    items: shippingItems,
  });

  useAutoShippingFee({
    items: shippingItems,
    addresses,
    selectedAddressId,
    productCache,
    serviceTypeId,
    onShippingFeeChange: (fee: number) => {
      setShippingFee(fee);
      // Xóa lỗi phí vận chuyển nếu tính lại thành công
      setShippingFeeError(null);
    },
    onStoreShippingFeesChange: (fees) => {
      setStoreShippingFees(fees);
    },
    onProductCacheUpdate: setProductCache,
    autoCalculate: shippingItems.length > 0 && !!selectedAddressId,
    onError: (message: string) => {
      // Lưu lỗi và reset phí ship về 0 để tránh tính sai tổng
      const trimmed = message.trim();
      // Chỉ set error nếu message không rỗng (không phải là clear error signal)
      if (trimmed.length > 0) {
        setShippingFeeError(trimmed);
        setShippingFee(0);
      } else {
        // Clear error if message is empty (success case)
        setShippingFeeError(null);
      }
    },
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
      itemType: item.type,
      variantId: item.variantId ?? undefined,
      variant: item.variant ?? null,
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

  // Calculate subtotal dựa trên giá gốc (giống Cart/HomePage)
  const subtotalBeforePlatformDiscount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const original = item.originalPrice ?? item.price;
      return sum + original * item.quantity;
    }, 0);
  }, [cartItems]);

  // Subtotal sau khi áp dụng giảm giá nền tảng (dùng giá hiện tại)
  const subtotalAfterPlatformDiscount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  }, [cartItems]);

  // Tổng giảm giá nền tảng = chênh lệch giữa giá gốc và giá sau giảm
  const totalPlatformDiscount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const original = item.originalPrice ?? item.price;
      const discountPerUnit = Math.max(0, original - item.price);
      return sum + discountPerUnit * item.quantity;
    }, 0);
  }, [cartItems]);

  // Note: buildPlatformVouchers logic has been moved to handleSubmit
  // to support fetching platform vouchers for variants at checkout time

  // Calculate store totals for each store (after platform discount)
  const storeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const storeIds = new Set<string>();
    
    cartItems.forEach(item => {
      const product = productCache.get(item.productId);
      if (product?.storeId) {
        storeIds.add(product.storeId);
      }
    });
    
    storeIds.forEach(storeId => {
      totals[storeId] = calculateStoreTotal(cartItems, storeId, productCache);
    });
    
    return totals;
  }, [cartItems, productCache, platformVoucherDiscounts]);

  // Store voucher discount (product-specific + store-wide)
  const voucherDiscount = useMemo(() => {
    const productVoucherDiscount = Object.values(appliedStoreVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
    const storeWideVoucherDiscount = Object.values(appliedStoreWideVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
    return productVoucherDiscount + storeWideVoucherDiscount;
  }, [appliedStoreVouchers, appliedStoreWideVouchers]);

  // Danh sách mã voucher đã áp dụng (voucher sản phẩm + voucher toàn shop)
  const selectedVoucherCodes = useMemo(() => {
    const productCodes = Object.values(appliedStoreVouchers).map(v => v.code);
    const storeWideCodes = Object.values(appliedStoreWideVouchers).map(v => v.code);
    return Array.from(new Set([...productCodes, ...storeWideCodes]));
  }, [appliedStoreVouchers, appliedStoreWideVouchers]);

  // Grand total = subtotal - platform discount - store voucher discount + shipping fee
  const total = useMemo(() => {
    return Math.max(
      0,
      subtotalBeforePlatformDiscount -
        totalPlatformDiscount -
        voucherDiscount +
        shippingFee
    );
  }, [subtotalBeforePlatformDiscount, totalPlatformDiscount, voucherDiscount, shippingFee]);

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
        ) as ApiCartItem[];

        if (selectedCartItems.length === 0) {
          showCenterError('Không tìm thấy sản phẩm đã chọn. Vui lòng kiểm tra lại giỏ hàng.', 'Thông báo');
          window.location.href = '/cart';
          return;
        }

        // Áp dụng giảm giá nền tảng cho từng item dựa trên unitPrice (giống trang Cart)
        const enhancedItems = await enhanceApiItemsWithPlatformDiscounts(selectedCartItems);
        setCartItems(enhancedItems);
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
        // Collect unique productIds (luôn dùng productId để get platform voucher, kể cả khi có variant)
        const productIds = new Set<string>();
        
        cartItems.forEach(item => {
          // Luôn dùng productId (product gốc) để get platform voucher
          // Kể cả khi có variant, vẫn dùng productId vì platform voucher được lưu theo productId
          productIds.add(item.productId);
        });
        
        if (productIds.size === 0) {
          setAvailableVouchers([]);
          return;
        }

        const responses = await Promise.all(
          Array.from(productIds).map(async pid => {
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

        const shopVouchers: ShopVoucher[] = [];
        const platformDiscountsMap: Record<string, { discount: number; campaignProductId: string }> = {};
        
        const newStoreMeta: Record<string, { storeName: string }> = {};

        responses.forEach(({ productId, voucherRes, productRes }) => {
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
            
            // Store platform discount for productId (product gốc)
            // QUAN TRỌNG: Chỉ lưu cho productId, không lưu cho variantId
            // Khi có variant, vẫn dùng productId để lookup platform voucher
            // Backend sẽ tự động map từ variantId sang productId để tìm platform voucher
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

        // Áp dụng giảm giá nền tảng vào cartItems (giá hiển thị + tính toán)
        // QUAN TRỌNG: Luôn lookup theo productId, kể cả khi có variant
        if (Object.keys(platformDiscountsMap).length > 0) {
          setCartItems(prev =>
            prev.map(item => {
              // Luôn dùng productId để lookup platform discount
              // Kể cả khi có variant, vẫn dùng productId vì platform voucher được lưu theo productId
              const info = platformDiscountsMap[item.productId];
              
              const original = item.originalPrice ?? item.price;
              if (!info || !info.discount || info.discount <= 0) {
                return {
                  ...item,
                  originalPrice: original,
                };
              }

              const discounted = Math.max(0, original - info.discount);
              if (discounted >= original) {
                return {
                  ...item,
                  originalPrice: original,
                };
              }

              return {
                ...item,
                price: discounted,
                originalPrice: original,
              };
            })
          );
        }
      } catch {
        setAvailableVouchers([]);
      }
    };

    loadVouchers();
  }, [cartItems]);

  // Load store-wide vouchers for each store
  useEffect(() => {
    const loadStoreWideVouchers = async () => {
      try {
        const storeIds = new Set<string>();
        cartItems.forEach(item => {
          const product = productCache.get(item.productId);
          if (product?.storeId) {
            storeIds.add(product.storeId);
          }
        });

        if (storeIds.size === 0) {
          setStoreWideVouchers({});
          return;
        }

        const voucherPromises = Array.from(storeIds).map(async (storeId) => {
          try {
            const response = await VoucherService.getShopVouchersByStore(storeId, 'ACTIVE', 'ALL_SHOP_VOUCHER');
            return { storeId, vouchers: response.data || [] };
          } catch (error) {
            console.error(`Error loading store-wide vouchers for store ${storeId}:`, error);
            return { storeId, vouchers: [] };
          }
        });

        const results = await Promise.all(voucherPromises);
        const vouchersMap: Record<string, StoreVoucher[]> = {};
        results.forEach(({ storeId, vouchers }) => {
          vouchersMap[storeId] = vouchers;
        });

        setStoreWideVouchers(vouchersMap);
      } catch (error) {
        console.error('Error loading store-wide vouchers:', error);
        setStoreWideVouchers({});
      }
    };

    if (cartItems.length > 0 && productCache.size > 0) {
      loadStoreWideVouchers();
    }
  }, [cartItems, productCache]);

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

      // Lưu ý: key ở đây là productId (giống ShoppingCart), KHÔNG phải storeId
      Object.entries(prev).forEach(([productId, applied]) => {
        // Nếu availableVouchers chưa load xong, giữ nguyên voucher với discountValue hiện tại
        if (availableVouchers.length === 0) {
          next[productId] = applied;
          return;
        }

        const product = productCache.get(productId);
        const storeId = product?.storeId;

        // Nếu chưa xác định được storeId, tạm giữ nguyên để tránh xóa nhầm
        if (!storeId) {
          next[productId] = applied;
          return;
        }

        // Tìm voucher theo code và (nếu có) đúng storeId
        const voucher = availableVouchers.find(
          v => v.code === applied.code && (!v.storeId || v.storeId === storeId)
        );
        const storeTotal = calculateStoreTotal(cartItems, storeId, productCache);

        // Nếu không tìm thấy voucher trong availableVouchers, nhưng availableVouchers đã load xong
        // thì có thể voucher đã hết hạn hoặc không còn hợp lệ
        if (!voucher) {
          changed = true;
          messages.push(`Voucher ${applied.code} không còn hợp lệ.`);
          return;
        }

        // Nếu storeTotal = 0, có thể do productCache chưa có đủ data
        // Chỉ xóa nếu chắc chắn storeTotal = 0 (tất cả products đã có trong cache)
        if (storeTotal <= 0 && allProductsCached) {
          changed = true;
          return;
        }

        // Nếu storeTotal = 0 nhưng chưa có đủ cache, giữ nguyên voucher
        if (storeTotal <= 0) {
          next[productId] = applied;
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
        next[productId] = {
          ...applied,
          storeId,
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
    if (shippingFeeError) {
      setError('Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau.');
      return;
    }

    const addressForMessage = addresses.find(addr => addr.id === selectedAddressId);
    const message = addressForMessage?.note || '';
    
    // Build checkout items payload với logic mới:
    // - Nếu variantId === null → dùng productId (refId), không gửi variantId
    // - Nếu variantId !== null → để trống productId, dùng variantId
    // - Nếu type === 'COMBO' → dùng comboId
    const checkoutItemsPayload = cartItems.map(item => {
      // Lấy type từ cart item (nếu có), mặc định là 'PRODUCT'
      const itemType = item.type || 'PRODUCT';
      
      // Base payload
      const basePayload: any = {
        type: itemType,
        quantity: item.quantity,
      };
      
      // Xử lý theo type
      if (itemType === 'COMBO') {
        // Nếu là COMBO, dùng comboId (refId)
        basePayload.comboId = item.productId; // refId trong trường hợp COMBO
        return basePayload;
      }
      
      // Xử lý PRODUCT
      // Nếu có variantId (không null), dùng variantId và không gửi productId
      if (item.variantId !== null && item.variantId !== undefined) {
        basePayload.variantId = item.variantId;
        // Không gửi productId khi có variantId
        return basePayload;
      }
      
      // Nếu không có variantId (null), dùng productId (refId) và không gửi variantId
      basePayload.productId = item.productId;
      return basePayload;
    });

    const storeVouchers = buildStoreVouchers(appliedStoreVouchers, appliedStoreWideVouchers);
    const serviceTypeIds = buildServiceTypeIds(cartItems, productCache);
    
    // QUAN TRỌNG: Fetch platform vouchers cho các items có variant nếu chưa có
    // Vì khi có variant, cần dùng productId để get platform voucher
    // Tìm các productId cần fetch platform voucher
    const missingProductIds = new Set<string>();
    
    checkoutItemsPayload.forEach(item => {
      if (item.variantId && !item.productId) {
        // Có variantId nhưng không có productId trong payload
        // Cần tìm productId từ cartItems
        const cartItem = cartItems.find(ci => ci.variantId === item.variantId);
        if (cartItem) {
          const productId = cartItem.productId;
          if (!platformVoucherDiscounts[productId]) {
            missingProductIds.add(productId);
          }
        }
      } else if (item.productId && !platformVoucherDiscounts[item.productId]) {
        // Có productId nhưng chưa có platform voucher
        missingProductIds.add(item.productId);
      }
    });
    
    // Fetch platform vouchers cho các productId còn thiếu
    let finalPlatformVoucherDiscounts = { ...platformVoucherDiscounts };
    
    if (missingProductIds.size > 0) {
      console.log('🔍 [CHECKOUT] Fetching platform vouchers for missing products:', Array.from(missingProductIds));
      
      const voucherPromises = Array.from(missingProductIds).map(async (productId) => {
        try {
          const voucherRes = await ProductVoucherService.getProductVouchers(productId, 'ALL', null);
          const platformCampaigns = voucherRes.data?.vouchers?.platform || [];
          let platformDiscount = 0;
          let campaignProductId: string | null = null;
          
          if (voucherRes.data?.product) {
            const originalPrice = voucherRes.data.product.price;
            
            for (const campaign of platformCampaigns) {
              if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
                const activeVoucher = campaign.vouchers.find((v: any) => v.status === 'ACTIVE');
                if (activeVoucher) {
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
                  break;
                }
              }
            }
          }
          
          if (platformDiscount > 0 && campaignProductId) {
            console.log(`✅ [CHECKOUT] Found platform voucher for product ${productId}:`, { campaignProductId, discount: platformDiscount });
            return { productId, discount: platformDiscount, campaignProductId };
          }
          return null;
        } catch (error) {
          console.error(`❌ [CHECKOUT] Failed to fetch platform voucher for product ${productId}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(voucherPromises);
      
      // Update finalPlatformVoucherDiscounts với các voucher mới fetch được
      results.forEach(result => {
        if (result) {
          finalPlatformVoucherDiscounts[result.productId] = {
            discount: result.discount,
            campaignProductId: result.campaignProductId,
          };
        }
      });
    }
    
    // Build platform vouchers với data đã cập nhật
    const platformVouchersMap = new Map<string, number>();
    
    checkoutItemsPayload.forEach(item => {
      let productId: string | null = null;
      
      // Tìm productId từ variantId nếu cần
      if (item.variantId && !item.productId) {
        const cartItem = cartItems.find(ci => ci.variantId === item.variantId);
        if (cartItem) {
          productId = cartItem.productId;
        }
      } else if (item.productId) {
        productId = item.productId;
      }
      
      if (productId && finalPlatformVoucherDiscounts[productId]) {
        const { campaignProductId } = finalPlatformVoucherDiscounts[productId];
        const currentQuantity = platformVouchersMap.get(campaignProductId) || 0;
        platformVouchersMap.set(campaignProductId, currentQuantity + item.quantity);
        console.log(`🎁 [CHECKOUT] Added platform voucher for product ${productId} (variant: ${item.variantId || 'none'}):`, {
          campaignProductId,
          quantity: currentQuantity + item.quantity
        });
      }
    });
    
    const platformVouchers = Array.from(platformVouchersMap.entries()).map(([campaignProductId, quantity]) => ({
      campaignProductId,
      quantity,
    }));

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
    console.log('💳 Grand Total:', total);
    console.log('============================================================');

    setIsSubmitting(true);
    setError(null);

    try {
      if (paymentMethod === 'cod') {
        // Build request với tất cả thuộc tính (kể cả null/undefined/empty)
        const request: CheckoutCodRequest = {
          items: checkoutItemsPayload,
          addressId: selectedAddressId,
          message: message || undefined,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers: platformVouchers.length > 0 ? platformVouchers : null,
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
        };
        
        // Build full request body để hiển thị đầy đủ (bao gồm cả null/undefined/empty)
        const fullRequestBody = {
          items: checkoutItemsPayload.map(item => ({
            productId: item.productId || '',
            variantId: item.variantId || '',
            comboId: item.comboId || '',
            type: item.type || '',
            quantity: item.quantity || 0,
          })),
          addressId: selectedAddressId || '',
          message: message || '',
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : null,
          platformVouchers: platformVouchers.length > 0 ? platformVouchers : null,
          serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : null,
        };
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📤 [COD CHECKOUT REQUEST BODY]');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(JSON.stringify(fullRequestBody, null, 2));
        console.log('═══════════════════════════════════════════════════════════════');
        
        const response = await CustomerCartService.checkoutCod(request);
        
        // Build full response body để hiển thị đầy đủ
        const fullResponseBody = {
          status: response.status || null,
          message: response.message || '',
          data: Array.isArray(response.data) 
            ? response.data.map((order: any) => ({
                id: order.id || '',
                orderCode: order.orderCode || '',
                status: order.status || '',
                message: order.message || null,
                createdAt: order.createdAt || '',
                storeId: order.storeId || '',
                storeName: order.storeName || '',
                totalAmount: order.totalAmount || 0,
                shippingFeeTotal: order.shippingFeeTotal || 0,
                discountTotal: order.discountTotal || 0,
                grandTotal: order.grandTotal || 0,
                storeVoucherDiscount: order.storeVoucherDiscount || null,
                platformDiscount: order.platformDiscount || {},
                receiverName: order.receiverName || '',
                phoneNumber: order.phoneNumber || '',
                country: order.country || '',
                province: order.province || '',
                district: order.district || '',
                ward: order.ward || '',
                street: order.street || '',
                addressLine: order.addressLine || '',
                postalCode: order.postalCode || '',
                note: order.note || '',
                shippingServiceTypeId: order.shippingServiceTypeId || null,
              }))
            : (response.data ? [response.data] : []),
        };
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ [COD CHECKOUT RESPONSE BODY]');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(JSON.stringify(fullResponseBody, null, 2));
        console.log('═══════════════════════════════════════════════════════════════');
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
                    <CartItemList 
                      groups={groupedCartItems} 
                      onRemove={removeItem}
                      storeWideVouchers={storeWideVouchers}
                      appliedStoreWideVouchers={appliedStoreWideVouchers}
                      storeTotals={storeTotals}
                      storeShippingFees={storeShippingFees}
                      onApplyStoreWideVoucher={(storeId, voucher) => {
                        const storeTotal = storeTotals[storeId] || 0;
                        let discountValue = 0;
                        
                        if (voucher.type === 'FIXED') {
                          discountValue = voucher.discountValue || 0;
                        } else if (voucher.type === 'PERCENT') {
                          const percent = voucher.discountPercent || 0;
                          const discount = Math.round((storeTotal * percent) / 100);
                          discountValue = voucher.maxDiscountValue && discount > voucher.maxDiscountValue
                            ? voucher.maxDiscountValue
                            : discount;
                        }
                        
                        setAppliedStoreWideVouchers(prev => ({
                          ...prev,
                          [storeId]: {
                            storeId,
                            code: voucher.code,
                            voucherId: voucher.id,
                            discountValue,
                            type: voucher.type,
                          },
                        }));
                      }}
                      onRemoveStoreWideVoucher={(storeId) => {
                        setAppliedStoreWideVouchers(prev => {
                          const next = { ...prev };
                          delete next[storeId];
                          return next;
                        });
                      }}
                    />
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
                      <div>
                        <p className="text-base font-semibold text-gray-900">Đơn hàng</p>
                      </div>
                      {error && (
                        <span className="text-xs text-red-500 font-medium">
                          {error}
                        </span>
                      )}
                    </div>
                    <div className="px-5 py-4">
                      <OrderSummaryCard
                        subtotal={subtotalBeforePlatformDiscount}
                        platformDiscount={totalPlatformDiscount}
                        voucherDiscount={voucherDiscount}
                        shippingFee={shippingFee}
                        total={total}
                        disabled={
                          isSubmitting ||
                          !selectedAddressId ||
                          !paymentMethod ||
                          cartItems.length === 0 ||
                          !!shippingFeeError
                        }
                        onSubmit={handleSubmit}
                        selectedVoucherCodes={selectedVoucherCodes}
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

