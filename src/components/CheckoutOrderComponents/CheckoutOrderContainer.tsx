import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useLanguage } from '../../contexts/LanguageContext';
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

const mapApiItemToCartItem = (apiItem: ApiCartItem): CartItem & { inPlatformCampaign?: boolean; campaignUsageExceeded?: boolean; campaignRemaining?: number | null } => {
  // Backend đã xử lý platform campaign, sử dụng trực tiếp từ response
  // Logic: Nếu có platformCampaignPrice và inPlatformCampaign = true và campaignUsageExceeded = false
  // thì dùng platformCampaignPrice, ngược lại dùng unitPrice
  const finalPrice = 
    apiItem.inPlatformCampaign && 
    !apiItem.campaignUsageExceeded && 
    apiItem.platformCampaignPrice !== undefined
      ? apiItem.platformCampaignPrice
      : apiItem.unitPrice;
  
  // originalPrice: dùng baseUnitPrice nếu có, ngược lại dùng unitPrice
  const originalPrice = apiItem.baseUnitPrice ?? apiItem.unitPrice;
  
  return {
    id: apiItem.cartItemId,
    productId: apiItem.refId,
    name: apiItem.name,
    // Ưu tiên sử dụng variantUrl nếu có, nếu không thì dùng image
    image: apiItem.variantUrl || apiItem.image,
    price: finalPrice, // Giá sau khi áp dụng platform campaign (nếu có)
    originalPrice: originalPrice, // Giá gốc để hiển thị
    quantity: apiItem.quantity,
    isSelected: true,
    variant: apiItem.variantOptionValue || undefined,
    variantId: apiItem.variantId || null, // Lưu variantId từ API (có thể là null)
    type: apiItem.type || 'PRODUCT', // Lưu type từ API
    // Lưu thông tin platform campaign từ cart response
    inPlatformCampaign: apiItem.inPlatformCampaign,
    campaignUsageExceeded: apiItem.campaignUsageExceeded,
    campaignRemaining: (apiItem as any).campaignRemaining ?? null,
  } as CartItem & { inPlatformCampaign?: boolean; campaignUsageExceeded?: boolean; campaignRemaining?: number | null };
};

/**
 * Map API items to CartItems - Backend đã xử lý platform campaign
 * Không cần fetch platform vouchers nữa, sử dụng trực tiếp từ response
 */
const mapApiItemsToCartItems = (apiItems: ApiCartItem[]): CartItem[] => {
  return apiItems.map(mapApiItemToCartItem);
};

const calculateStoreTotal = (
  items: CartItem[],
  storeId: string,
  productCache: Map<string, Product>
): number => {
  // Tính tổng tiền theo giá đã áp dụng giảm giá nền tảng (item.price)
  // Làm tròn để tránh số thập phân
  return Math.round(items.reduce((sum, item) => {
    const product = productCache.get(item.productId);
    if (!product || product.storeId !== storeId) return sum;
    return sum + item.price * item.quantity;
  }, 0));
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

/**
 * Extract platform voucher info from API response
 * Supports both new structure (vouchers.platformVouchers) and legacy structure (vouchers.platform)
 * 
 * @param voucherRes - API response from GET /api/products/view/{productId}/vouchers
 * @param productId - Product ID (refId)
 * @param variantPrice - Optional: Price from variant (for products with variants where product.price is null)
 */
const extractPlatformVoucherInfo = (
  voucherRes: any,
  productId: string,
  variantPrice?: number | null
): { platformDiscount: number; campaignProductId: string | null } => {
  let platformDiscount = 0;
  let campaignProductId: string | null = null;

  if (!voucherRes?.data) {
    console.log(`⚠️ [EXTRACT PLATFORM VOUCHER] No data in response for product ${productId}`);
    return { platformDiscount: 0, campaignProductId: null };
  }

  // Get product price (support both direct fields and nested product object)
  // QUAN TRỌNG: Nếu product có variants, price ở root sẽ là null
  // => Cần dùng variantPrice từ cartItem hoặc lấy từ variants array
  let originalPrice = voucherRes.data.price ?? voucherRes.data.product?.price ?? 0;
  
  // Nếu price là null/0 và có variants, cần lấy giá từ variant
  if ((originalPrice === null || originalPrice === 0) && voucherRes.data.variants && voucherRes.data.variants.length > 0) {
    // Nếu có variantPrice từ cartItem, dùng nó
    if (variantPrice && variantPrice > 0) {
      originalPrice = variantPrice;
      console.log(`💰 [EXTRACT PLATFORM VOUCHER] Using variant price from cartItem: ${variantPrice} for product ${productId}`);
    } else {
      // Nếu không có variantPrice, lấy giá từ variant đầu tiên (fallback)
      const firstVariant = voucherRes.data.variants[0];
      if (firstVariant?.price && firstVariant.price > 0) {
        originalPrice = firstVariant.price;
        console.log(`💰 [EXTRACT PLATFORM VOUCHER] Using first variant price: ${originalPrice} for product ${productId}`);
      } else {
        console.warn(`⚠️ [EXTRACT PLATFORM VOUCHER] Product ${productId} has variants but no valid price found`);
      }
    }
  }
  
  console.log(`💰 [EXTRACT PLATFORM VOUCHER] Original price for product ${productId}: ${originalPrice} (variantPrice: ${variantPrice || 'not provided'})`);

  // Support new structure: vouchers.platformVouchers
  const platformVouchers = voucherRes.data.vouchers?.platformVouchers || [];
  // Support legacy structure: vouchers.platform
  const platformCampaigns = voucherRes.data.vouchers?.platform || [];

  // Process new structure first
  if (platformVouchers.length > 0) {
    for (const campaign of platformVouchers) {
      if (campaign.vouchers && campaign.vouchers.length > 0) {
        // Find active voucher
        const activeVoucher = campaign.vouchers.find(
          (v: any) => v.status === 'ACTIVE'
        );

        if (activeVoucher && activeVoucher.platformVoucherId) {
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
        } else if (campaign.vouchers.length > 0 && !campaignProductId) {
          // If no active voucher but vouchers exist, use first one (for inPlatformCampaign=true case)
          const firstVoucher = campaign.vouchers[0];
          if (firstVoucher?.platformVoucherId) {
            campaignProductId = firstVoucher.platformVoucherId;
          }
        }
      }
    }
  }

  // Fallback to legacy structure if new structure didn't find anything
  if (!campaignProductId && platformCampaigns.length > 0) {
    for (const campaign of platformCampaigns) {
      if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
        const activeVoucher = campaign.vouchers.find((v: any) => v.status === 'ACTIVE');
        if (activeVoucher && activeVoucher.platformVoucherId) {
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

  return { platformDiscount, campaignProductId };
};

const CheckoutOrderContainer: React.FC = () => {
  const { t } = useLanguage();
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
  // Platform voucher info: Record<productId, { discount: number; campaignProductId: string; inPlatformCampaign?: boolean }>
  // inPlatformCampaign: từ cart response, cho biết product có đang trong platform campaign không
  type PlatformVoucherInfo = { discount: number; campaignProductId: string; inPlatformCampaign?: boolean };
  const [platformVoucherDiscounts, setPlatformVoucherDiscounts] = useState<Record<string, PlatformVoucherInfo>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [storeShippingFees, setStoreShippingFees] = useState<Record<string, StoreShippingFee>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingFeeError, setShippingFeeError] = useState<string | null>(null);
  const [storeMetadata, setStoreMetadata] = useState<Record<string, { storeName: string }>>({});
  // Avoid spamming campaign warnings (align with Cart page)
  const campaignWarnedRef = useRef<Set<string>>(new Set());

  // Giá hiển thị trên UI: nếu backend trả về giá gốc nhưng product đang có platform campaign,
  // tự tính lại giá sau giảm dựa trên platformVoucherDiscounts (theo productId).
  // Điều này giúp fix case có từ 2 variant cùng productId ở checkout nhưng backend trả về giá gốc.
  const cartItemsForDisplay = useMemo<CartItem[]>(() => {
    if (cartItems.length === 0) return cartItems;

    return cartItems.map((item) => {
      const platformInfo = platformVoucherDiscounts[item.productId];
      const original = item.originalPrice ?? item.price;

      // Chỉ điều chỉnh khi:
      // - Có thông tin campaign ở platformVoucherDiscounts
      // - Có discount > 0
      // - Giá hiện tại >= giá gốc (tức là chưa áp dụng giảm giá)
      if (
        platformInfo &&
        platformInfo.discount > 0 &&
        original > 0 &&
        item.price >= original
      ) {
        const discountedPrice = Math.max(0, original - platformInfo.discount);
        return {
          ...item,
          price: discountedPrice,
        };
      }

      return item;
    });
  }, [cartItems, platformVoucherDiscounts]);

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
    return cartItemsForDisplay.map(item => ({
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

  /**
   * Ensure items exceeding campaign quota use base price and warn once (align with Cart).
   */
  const normalizeCampaignPricing = useCallback((itemsToNormalize: CartItem[]): CartItem[] => {
    const normalized = itemsToNormalize.map((item) => {
      const hasCampaignLimit =
        item.campaignRemaining !== null &&
        item.campaignRemaining !== undefined &&
        item.campaignRemaining >= 0 &&
        item.quantity > item.campaignRemaining;

      if (hasCampaignLimit) {
        return {
          ...item,
          price: item.originalPrice ?? item.price,
        };
      }
      return item;
    });

    normalized.forEach((item) => {
      const hasCampaignLimit =
        item.campaignRemaining !== null &&
        item.campaignRemaining !== undefined &&
        item.campaignRemaining >= 0 &&
        item.quantity > item.campaignRemaining;

      if (hasCampaignLimit && !campaignWarnedRef.current.has(item.id)) {
        campaignWarnedRef.current.add(item.id);
        showCenterError(
          t('cart.campaign.exceeded', { productName: item.name }),
          t('cart.warning.title')
        );
      }
    });

    return normalized;
  }, [t]);

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
        t('checkout.store.unknown');

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
    return Math.round(cartItemsForDisplay.reduce((sum, item) => {
      const original = item.originalPrice ?? item.price;
      return sum + original * item.quantity;
    }, 0));
  }, [cartItemsForDisplay]);

  // Subtotal sau khi áp dụng giảm giá nền tảng (dùng giá hiện tại)
  const subtotalAfterPlatformDiscount = useMemo(() => {
    return Math.round(cartItemsForDisplay.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0));
  }, [cartItemsForDisplay]);

  // Tổng giảm giá nền tảng = chênh lệch giữa giá gốc và giá sau giảm
  const totalPlatformDiscount = useMemo(() => {
    return Math.round(cartItemsForDisplay.reduce((sum, item) => {
      const original = item.originalPrice ?? item.price;
      const discountPerUnit = Math.max(0, original - item.price);
      return sum + discountPerUnit * item.quantity;
    }, 0));
  }, [cartItemsForDisplay]);

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
      totals[storeId] = calculateStoreTotal(cartItemsForDisplay, storeId, productCache);
    });
    
    return totals;
  }, [cartItemsForDisplay, productCache, platformVoucherDiscounts]);

  // Store voucher discount (product-specific + store-wide)
  const voucherDiscount = useMemo(() => {
    const productVoucherDiscount = Object.values(appliedStoreVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
    const storeWideVoucherDiscount = Object.values(appliedStoreWideVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
    // Làm tròn để tránh số thập phân
    return Math.round(productVoucherDiscount + storeWideVoucherDiscount);
  }, [appliedStoreVouchers, appliedStoreWideVouchers]);

  // Danh sách mã voucher đã áp dụng (voucher sản phẩm + voucher toàn shop)
  const selectedVoucherCodes = useMemo(() => {
    const productCodes = Object.values(appliedStoreVouchers).map(v => v.code);
    const storeWideCodes = Object.values(appliedStoreWideVouchers).map(v => v.code);
    return Array.from(new Set([...productCodes, ...storeWideCodes]));
  }, [appliedStoreVouchers, appliedStoreWideVouchers]);

  // Nếu có ≥2 biến thể cùng productId hoặc một biến thể có quantity ≥2, hiển thị cảnh báo giá gốc
  const hasMultipleVariantsSameProduct = useMemo(() => {
    const counts = new Map<string, number>();
    cartItems.forEach(item => {
      if (item.variantId !== null && item.variantId !== undefined) {
        const key = item.productId;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    });
    return Array.from(counts.values()).some(count => count >= 2);
  }, [cartItems]);

  const hasVariantWithQtyAtLeast2 = useMemo(() => {
    return cartItems.some(item => (item.variantId !== null && item.variantId !== undefined) && item.quantity >= 2);
  }, [cartItems]);

  // Bổ sung: nếu sản phẩm KHÔNG có variant nhưng quantity ≥ 2, cũng coi là case có thể quay về giá gốc
  const hasNonVariantWithQtyAtLeast2 = useMemo(() => {
    return cartItems.some(item => (item.variantId === null || item.variantId === undefined) && item.quantity >= 2);
  }, [cartItems]);

  const forceShowOriginalTotal =
    hasMultipleVariantsSameProduct || hasVariantWithQtyAtLeast2 || hasNonVariantWithQtyAtLeast2;
  const originalTotalWithShipping = useMemo(() => {
    return subtotalBeforePlatformDiscount + shippingFee;
  }, [subtotalBeforePlatformDiscount, shippingFee]);

  // Grand total
  // - Mặc định: subtotal - platform discount - store voucher discount + shipping fee
  // - Nếu forceShowOriginalTotal = true: KHÔNG trừ platform discount nữa, chỉ trừ voucher + cộng phí ship
  const total = useMemo(() => {
    // Tổng gốc + ship
    const baseWithShipping = subtotalBeforePlatformDiscount + shippingFee;

    if (forceShowOriginalTotal) {
      // Trong chế độ forceShowOriginal, không trừ platform discount, chỉ trừ voucher + cộng phí ship
      const withoutPlatformDiscount = baseWithShipping - voucherDiscount;
      return Math.max(0, Math.round(withoutPlatformDiscount));
    }

    const calculatedTotal =
      subtotalBeforePlatformDiscount -
      totalPlatformDiscount -
      voucherDiscount +
      shippingFee;

    // Làm tròn để tránh số thập phân
    return Math.max(0, Math.round(calculatedTotal));
  }, [
    subtotalBeforePlatformDiscount,
    totalPlatformDiscount,
    voucherDiscount,
    shippingFee,
    forceShowOriginalTotal,
  ]);

  const loadAddresses = useCallback(async (): Promise<CustomerAddressApiItem[]> => {
    try {
      const list = await AddressService.getAddresses();
      setAddresses(list);
      return list;
    } catch (error: any) {
      setError(error?.message || t('checkout.errors.cannotLoadData'));
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
        showCenterError(t('checkout.errors.cartNotFound'), t('checkout.notification.title'));
        window.location.href = '/cart';
        return;
      }

      let payload: CheckoutSessionPayload;
      try {
        payload = JSON.parse(payloadRaw) as CheckoutSessionPayload;
      } catch {
        showCenterError(t('checkout.errors.invalidCart'), t('checkout.notification.title'));
        window.location.href = '/cart';
        return;
      }

      if (!payload.selectedCartItemIds || payload.selectedCartItemIds.length === 0) {
        showCenterError(t('checkout.errors.emptyCart'), t('checkout.notification.title'));
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
          showCenterError(t('checkout.errors.selectedItemsNotFound'), t('checkout.notification.title'));
          window.location.href = '/cart';
          return;
        }

        // Backend đã xử lý platform campaign, chỉ cần map trực tiếp + normalize quota
        const mappedItems = mapApiItemsToCartItems(selectedCartItems);
        setCartItems(normalizeCampaignPricing(mappedItems));
      } catch (err: any) {
        setError(err?.message || t('checkout.errors.cannotLoadData'));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [loadAddresses]);

  useEffect(() => {
    // Khi đã có ít nhất một địa chỉ, luôn đảm bảo có địa chỉ được chọn
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }

    // Nếu chưa có selectedAddressId nhưng đã có addresses (case mới thêm lần đầu)
    if (!selectedAddressId) {
      const fallback = addresses.find(addr => addr.default) || addresses[0] || null;
      setSelectedAddressId(fallback ? fallback.id : null);
      return;
    }

    // Nếu selectedAddressId hiện tại không còn tồn tại trong danh sách (vừa bị xóa)
    if (!addresses.some(addr => addr.id === selectedAddressId)) {
      const fallback = addresses.find(addr => addr.default) || addresses[0] || null;
      setSelectedAddressId(fallback ? fallback.id : null);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        // Collect unique productIds (refId) để fetch platform vouchers
        // QUAN TRỌNG: Với variant, item.productId chính là refId (productId gốc)
        // Luôn dùng refId để gọi API GET /api/products/view/{productId}/vouchers
        const productIds = new Set<string>();
        
        cartItems.forEach(item => {
          // item.productId = refId từ API (productId gốc, không phải variantId)
          // Với variant: item.variantId có giá trị, nhưng item.productId vẫn là refId
          // Với product không variant: item.productId = refId
          // => Luôn dùng item.productId (refId) để fetch platform vouchers
          const refId = item.productId; // refId = productId gốc
          productIds.add(refId);
          
          // Log để debug
          if (item.variantId) {
            console.log(`🔍 [LOAD VOUCHERS] Variant detected - variantId: ${item.variantId}, refId (productId): ${refId}`);
          }
        });
        
        if (productIds.size === 0) {
          setAvailableVouchers([]);
          return;
        }

        console.log('🛒 [CHECKOUT PAGE] Loading vouchers for products (refIds):', Array.from(productIds));
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🎫 [CHECKOUT PAGE] Product Vouchers API Calls');
        console.log('📌 Note: Using refId (productId) for all items, including variants');
        console.log('═══════════════════════════════════════════════════════════════');

        const responses = await Promise.all(
          Array.from(productIds).map(async (refId) => {
            try {
              // Gọi API GET /api/products/view/{refId}/vouchers
              // refId = productId gốc (không phải variantId)
              console.log(`📡 [LOAD VOUCHERS] Fetching vouchers for refId (productId): ${refId}`);
              const [voucherRes, productRes] = await Promise.all([
                ProductVoucherService.getProductVouchers(refId, 'ALL', null).catch((err) => {
                  console.error(`❌ [LOAD VOUCHERS] Failed to fetch vouchers for refId ${refId}:`, err);
                  return null;
                }),
                ProductListService.getProductById(refId).catch((err) => {
                  console.error(`❌ [LOAD VOUCHERS] Failed to fetch product for refId ${refId}:`, err);
                  return null;
                }),
              ]);
              return { productId: refId, voucherRes, productRes };
            } catch (err) {
              console.error(`❌ [LOAD VOUCHERS] Error processing refId ${refId}:`, err);
              return { productId: refId, voucherRes: null, productRes: null };
            }
          })
        );

        const shopVouchers: ShopVoucher[] = [];
        const platformDiscountsMap: Record<string, PlatformVoucherInfo> = {};
        
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
          // productId ở đây chính là refId (productId gốc)
          if (voucherRes?.data) {
            // Tìm tất cả cart items có cùng refId (bao gồm cả variants)
            const itemsWithSameRefId = cartItems.filter(item => item.productId === productId);
            const cartItem = itemsWithSameRefId[0]; // Lấy item đầu tiên để check inPlatformCampaign và lấy giá
            
            // Lấy giá từ cartItem (originalPrice) nếu có variant
            // Với variant: cartItem.originalPrice sẽ là giá của variant đó
            const variantPrice = cartItem?.originalPrice ?? cartItem?.price ?? null;
            
            // Extract platform voucher info với variantPrice
            const { platformDiscount, campaignProductId } = extractPlatformVoucherInfo(
              voucherRes, 
              productId,
              variantPrice // Truyền giá từ variant để tính discount đúng
            );
            
            // Store platform discount for refId (productId gốc)
            // QUAN TRỌNG: Với variant, vẫn dùng refId (productId) để lưu vào map
            // Tất cả items (kể cả variants) cùng refId sẽ dùng chung platform voucher info
            const inPlatformCampaign = cartItem && 'inPlatformCampaign' in cartItem ? (cartItem as any).inPlatformCampaign : false;
            const campaignUsageExceeded = cartItem && 'campaignUsageExceeded' in cartItem ? (cartItem as any).campaignUsageExceeded : false;
            
            console.log(`💰 [LOAD VOUCHERS] Processing platform voucher for refId ${productId}:`, {
              itemsCount: itemsWithSameRefId.length,
              hasVariants: itemsWithSameRefId.some(item => item.variantId),
              variantPrice,
              platformDiscount,
              campaignProductId,
              inPlatformCampaign,
            });
            
            // Lưu campaignProductId nếu:
            // 1. Tìm thấy platformVoucherId từ API (campaignProductId !== null)
            // 2. HOẶC item có inPlatformCampaign = true từ cart response (ngay cả khi không tìm thấy active voucher)
            // Nếu campaignUsageExceeded = true, không lưu vì đã vượt giới hạn
            if (campaignProductId || (inPlatformCampaign && !campaignUsageExceeded)) {
              // Nếu không tìm thấy campaignProductId từ API nhưng có inPlatformCampaign = true,
              // helper function đã cố gắng lấy voucher đầu tiên (kể cả không active)
              // Nếu vẫn không có, sẽ không lưu vào map
              if (campaignProductId) {
                platformDiscountsMap[productId] = {
                  discount: platformDiscount,
                  campaignProductId: campaignProductId,
                  inPlatformCampaign: inPlatformCampaign && !campaignUsageExceeded,
                };
                console.log(`✅ [CHECKOUT] Stored platform voucher for product ${productId}:`, {
                  campaignProductId,
                  discount: platformDiscount,
                  inPlatformCampaign,
                  campaignUsageExceeded,
                });
              } else if (inPlatformCampaign && !campaignUsageExceeded) {
                console.warn(`⚠️ [CHECKOUT] Product ${productId} has inPlatformCampaign=true but no platformVoucherId found in response`);
              }
            }
          }
        });

        if (Object.keys(newStoreMeta).length > 0) {
          setStoreMetadata(prev => ({ ...prev, ...newStoreMeta }));
        }

        const deduped = Array.from(new Map(shopVouchers.map(v => [v.code, v])).values());
        setAvailableVouchers(deduped);
        setPlatformVoucherDiscounts(platformDiscountsMap);

        // Backend đã xử lý platform campaign trong response, không cần áp dụng lại giá
        // platformDiscountsMap chỉ dùng để lấy campaignProductId cho platform vouchers payload khi checkout
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
        const storeTotal = calculateStoreTotal(cartItemsForDisplay, storeId, productCache);

        // Nếu không tìm thấy voucher trong availableVouchers, nhưng availableVouchers đã load xong
        // thì có thể voucher đã hết hạn hoặc không còn hợp lệ
        if (!voucher) {
          changed = true;
          messages.push(t('checkout.voucher.invalid', { code: applied.code }));
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
            t('checkout.voucher.removedMinOrder', { 
              code: applied.code, 
              amount: voucher.minOrderValue.toLocaleString('vi-VN') 
            })
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

    messages.forEach(msg => showCenterError(msg, t('cart.voucher.title')));
  }, [cartItemsForDisplay, productCache, availableVouchers, platformVoucherDiscounts]);

  const applyCartResponseToUI = (respItems: ApiCartItem[]) => {
    // Backend đã xử lý platform campaign, chỉ cần map trực tiếp
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
      showCenterSuccess(t('checkout.success.itemRemoved'), t('checkout.success.title'));
      if (remainingIds.length === 0) {
        showCenterError(t('checkout.errors.emptyCartRedirect'), t('checkout.notification.title'));
        window.location.href = '/cart';
      }
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || t('checkout.errors.cannotRemoveItem');
      setError(msg);
    }
  };

  // Shipping selection removed: API provides shipping fee directly

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      setError(t('checkout.errors.emptyCart'));
      return;
    }
    if (!selectedAddressId) {
      setError(t('checkout.errors.noAddress'));
      return;
    }
    if (!paymentMethod) {
      setError(t('checkout.errors.noPaymentMethod'));
      return;
    }
    if (shippingFeeError) {
      setError(t('checkout.errors.shippingFeeError'));
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
    
    // QUAN TRỌNG: Luôn fetch platform vouchers cho TẤT CẢ products/variants trước khi checkout
    // Đảm bảo có platformVoucherId nếu product có platform campaign
    // Với variant: TRUY NGƯỢC LẠI refId (productId) từ variantId để gọi API
    
    // Collect tất cả refIds (productIds) cần fetch
    // Với variant: truy ngược lại refId từ cartItems
    const refIdsToFetch = new Set<string>();
    
    checkoutItemsPayload.forEach(item => {
      if (item.variantId && !item.productId) {
        // Có variantId nhưng không có productId trong payload
        // TRUY NGƯỢC: Tìm refId (productId) từ cartItems dựa trên variantId
        const cartItem = cartItems.find(ci => ci.variantId === item.variantId);
        if (cartItem) {
          const refId = cartItem.productId; // refId = productId gốc
          refIdsToFetch.add(refId);
          console.log(`🔍 [CHECKOUT] Variant detected - variantId: ${item.variantId}, refId (productId): ${refId}`);
        } else {
          console.warn(`⚠️ [CHECKOUT] Cannot find cartItem for variantId: ${item.variantId}`);
        }
      } else if (item.productId) {
        // Có productId trực tiếp (không phải variant)
        // productId = refId trong trường hợp này
        refIdsToFetch.add(item.productId);
      }
    });
    
    // Fetch platform vouchers cho TẤT CẢ refIds (kể cả đã có trong platformVoucherDiscounts)
    // Đảm bảo luôn có data mới nhất trước khi checkout
    // Gọi API: GET /api/products/view/{refId}/vouchers
    console.log('🔍 [CHECKOUT] Fetching platform vouchers for ALL refIds (productIds) before checkout:', Array.from(refIdsToFetch));
    console.log('📌 Note: For variants, using refId (productId) to fetch vouchers');
    
    const voucherPromises = Array.from(refIdsToFetch).map(async (refId) => {
      try {
        // Gọi API GET /api/products/view/{refId}/vouchers
        // refId = productId gốc (không phải variantId)
        console.log(`📡 [CHECKOUT] Fetching vouchers for refId (productId): ${refId}`);
        const voucherRes = await ProductVoucherService.getProductVouchers(refId, 'ALL', null);
        
        // Lấy thông tin từ cart items có cùng refId (bao gồm cả variants)
        const itemsWithSameRefId = cartItems.filter(item => item.productId === refId);
        const cartItem = itemsWithSameRefId[0]; // Lấy item đầu tiên để check inPlatformCampaign và lấy giá
        
        // Lấy giá từ cartItem (originalPrice) nếu có variant
        // Với variant: cartItem.originalPrice sẽ là giá của variant đó
        const variantPrice = cartItem?.originalPrice ?? cartItem?.price ?? null;
        
        // Extract platform voucher info với variantPrice
        const { platformDiscount, campaignProductId } = extractPlatformVoucherInfo(
          voucherRes, 
          refId,
          variantPrice // Truyền giá từ variant để tính discount đúng
        );
        
        const inPlatformCampaign = cartItem && 'inPlatformCampaign' in cartItem ? (cartItem as any).inPlatformCampaign : false;
        const campaignUsageExceeded = cartItem && 'campaignUsageExceeded' in cartItem ? (cartItem as any).campaignUsageExceeded : false;
        
        // Log thông tin
        const hasVariants = itemsWithSameRefId.some(item => item.variantId);
        console.log(`💰 [CHECKOUT] Platform voucher info for refId ${refId}:`, {
          itemsCount: itemsWithSameRefId.length,
          hasVariants,
          variantPrice,
          platformDiscount,
          campaignProductId,
          inPlatformCampaign,
        });
        
        // Nếu có platformVoucherId hoặc có inPlatformCampaign, trả về thông tin
        if (campaignProductId || (inPlatformCampaign && !campaignUsageExceeded)) {
          console.log(`✅ [CHECKOUT] Found platform voucher for refId ${refId}:`, { 
            campaignProductId, 
            discount: platformDiscount,
            inPlatformCampaign,
            campaignUsageExceeded
          });
          return { 
            productId: refId, // Lưu với key là refId
            discount: platformDiscount, 
            campaignProductId: campaignProductId || undefined,
            inPlatformCampaign: inPlatformCampaign && !campaignUsageExceeded
          };
        }
        
        return null;
      } catch (error) {
        console.error(`❌ [CHECKOUT] Failed to fetch platform voucher for refId ${refId}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(voucherPromises);
    
    // Update finalPlatformVoucherDiscounts với các voucher mới fetch được
    // Override với data mới nhất từ API
    const finalPlatformVoucherDiscounts = { ...platformVoucherDiscounts };
    results.forEach(result => {
      if (result && result.campaignProductId) {
        finalPlatformVoucherDiscounts[result.productId] = {
          discount: result.discount,
          campaignProductId: result.campaignProductId,
          inPlatformCampaign: result.inPlatformCampaign,
        };
      }
    });
    
    console.log('🎫 [CHECKOUT] Final platform voucher discounts before checkout:', finalPlatformVoucherDiscounts);
    
    // Build platform vouchers với data đã cập nhật
    const platformVouchersMap = new Map<string, number>();
    
    checkoutItemsPayload.forEach(item => {
      let refId: string | null = null; // refId = productId gốc
      
      // TRUY NGƯỢC: Tìm refId từ variantId nếu cần
      if (item.variantId && !item.productId) {
        // Có variantId: truy ngược lại refId từ cartItems
        const cartItem = cartItems.find(ci => ci.variantId === item.variantId);
        if (cartItem) {
          refId = cartItem.productId; // refId = productId gốc
          console.log(`🔍 [CHECKOUT] Variant item - variantId: ${item.variantId}, refId: ${refId}`);
        } else {
          console.warn(`⚠️ [CHECKOUT] Cannot find cartItem for variantId: ${item.variantId}`);
        }
      } else if (item.productId) {
        // Không có variant: productId = refId
        refId = item.productId;
      }
      
      // Sử dụng refId để lấy platform voucher info
      // Tất cả items (kể cả variants) cùng refId sẽ dùng chung platform voucher
      if (refId && finalPlatformVoucherDiscounts[refId]) {
        const { campaignProductId, inPlatformCampaign } = finalPlatformVoucherDiscounts[refId];
        
        // Chỉ thêm vào platform vouchers nếu có campaignProductId
        // và (có discount > 0 HOẶC inPlatformCampaign = true)
        if (campaignProductId && (finalPlatformVoucherDiscounts[refId].discount > 0 || inPlatformCampaign)) {
          const currentQuantity = platformVouchersMap.get(campaignProductId) || 0;
          platformVouchersMap.set(campaignProductId, currentQuantity + item.quantity);
          console.log(`🎁 [CHECKOUT] Added platform voucher for refId ${refId} (variantId: ${item.variantId || 'none'}, quantity: ${item.quantity}):`, {
            campaignProductId,
            quantity: currentQuantity + item.quantity,
            discount: finalPlatformVoucherDiscounts[refId].discount,
            inPlatformCampaign,
          });
        }
      } else if (refId) {
        console.log(`ℹ️ [CHECKOUT] No platform voucher found for refId ${refId} (variantId: ${item.variantId || 'none'})`);
      }
    });
    
    const platformVouchers = Array.from(platformVouchersMap.entries()).map(([campaignProductId, quantity]) => ({
      campaignProductId,
      quantity,
    }));
    
    console.log('🎁 [CHECKOUT] Final Platform Vouchers:', platformVouchers);

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
          showCenterSuccess(response.message || t('checkout.success.orderPlaced'), t('checkout.success.title'), 4000);
          setCartItems([]);
          // Redirect to orders page similar to old flow
          navigate('/orders', { replace: true });
        } else {
          setError(response.message || t('checkout.errors.checkoutFailed'));
        }
      } else if (paymentMethod === 'payos') {
        const returnUrl = `${window.location.origin}/payment/success`;
        const cancelUrl = `${window.location.origin}/payment/fail`;
        const request: CheckoutPayOSRequest = {
          addressId: selectedAddressId,
          message: message || undefined,
          description: t('checkout.orderDescription', { count: cartItems.length }),
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
        setError(response.message || t('checkout.errors.cannotCreatePayOS'));
      } else {
        setError(t('checkout.errors.invalidPaymentMethod'));
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.data?.message ||
        CustomerCartService.formatCartError(err) ||
        t('checkout.errors.checkoutFailed');
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
              <span>{t('checkout.breadcrumb.cart')}</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">{t('checkout.breadcrumb.checkout')}</span>
              <ChevronRight className="w-4 h-4" />
              <span>{t('checkout.breadcrumb.confirm')}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-3">{t('checkout.loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-base font-semibold text-gray-900">{t('checkout.sections.deliveryAddress')}</p>
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
                    <p className="text-base font-semibold text-gray-900">{t('checkout.sections.products')}</p>
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
                      <p className="text-base font-semibold text-gray-900">{t('checkout.sections.paymentMethod')}</p>
                    </div>
                    <div className="px-5 py-4">
                      <PaymentMethodDropdown value={paymentMethod} onChange={setPaymentMethod} />
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{t('checkout.sections.order')}</p>
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
                    forceShowOriginal={forceShowOriginalTotal}
                    originalTotalOverride={originalTotalWithShipping}
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
                        <p className="text-xs text-gray-500 text-center mt-3">{t('checkout.submitting')}</p>
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

