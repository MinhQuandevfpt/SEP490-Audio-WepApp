import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calcCartSummary, type CartItem as UICartItem } from '../../../data/shoppingcart';
import Layout from '../../../components/Layout';
import CartItemsList from '../../../components/ShoppingCartComponents/CartItemsList';
import CartSummarySidebar from '../../../components/ShoppingCartComponents/CartSummarySidebar';
import type { AppliedStoreVoucher } from '../../../components/ShoppingCartComponents/StoreVoucherPicker';
import { useCart } from '../../../hooks/useCart';
import { useServiceTypeCalculator } from '../../../hooks/useServiceTypeCalculator';
import { AddressService } from '../../../services/customer/AddressService';
import { CustomerCartService } from '../../../services/customer/CartService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { CartItem as ApiCartItem } from '../../../types/cart';
import type { CustomerAddressApiItem } from '../../../types/api';
import { ProductVoucherService } from '../../../services/customer/ProductVoucherService';
import type { ShopVoucher } from '../../../components/ShoppingCartComponents/VoucherSection';
import { ProductListService } from '../../../services/customer/ProductListService';
import { Home, ChevronRight } from 'lucide-react';

/**
 * Extract platform voucher info from API response
 * Supports both new structure (vouchers.platformVouchers) and legacy structure (vouchers.platform)
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

const CHECKOUT_SESSION_KEY = 'checkout:payload:v1';

const ShoppingCart: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { cart, isLoading, error, loadCart } = useCart();
  const [items, setItems] = useState<UICartItem[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddressApiItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  // Avoid spamming campaign warnings across renders
  const campaignWarnedRef = useRef<Set<string>>(new Set());

  // Use service type calculator hook
  const {
    serviceTypeId,
    setServiceTypeId,
    packageWeight,
    setPackageWeight,
    productCache,
    setProductCache,
  } = useServiceTypeCalculator({ items });

  // Map API cart items to UI items - sử dụng trực tiếp từ backend response
  // Backend đã xử lý platform campaign, chỉ cần map đúng giá
  const mapApiItemToUI = (apiItem: ApiCartItem, preserveSelection: boolean = false, currentItems: UICartItem[] = []): UICartItem => {
    // Backend trả về:
    // - baseUnitPrice: giá gốc (chưa campaign)
    // - platformCampaignPrice: giá sau campaign (nếu có)
    // - unitPrice: giá hiện tại (đã áp dụng campaign nếu có)
    // - inPlatformCampaign: có đang trong campaign không
    // - campaignUsageExceeded: đã vượt giới hạn chưa
    
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
    
    // Preserve selection state if requested
    let isSelected: boolean = true; // Default to true for initial load
    if (preserveSelection) {
      const existingItem = currentItems.find(item => item.id === apiItem.cartItemId);
      if (existingItem) {
        isSelected = existingItem.isSelected ?? true;
      }
    }
    
    return {
      id: apiItem.cartItemId,
      productId: apiItem.refId, // refId is productId for PRODUCT, comboId for COMBO
      name: apiItem.name,
      // Ưu tiên sử dụng variantUrl nếu có, nếu không thì dùng image
      image: apiItem.variantUrl || apiItem.image,
      price: finalPrice, // Giá sau khi áp dụng platform campaign (nếu có)
      originalPrice: originalPrice, // Giá gốc để hiển thị
      quantity: apiItem.quantity,
      isSelected: isSelected,
      variant: apiItem.variantOptionValue || undefined,
      variantId: apiItem.variantId || null, // Lưu variantId từ API
      type: apiItem.type, // Store type to distinguish PRODUCT vs COMBO
      campaignRemaining: apiItem.campaignRemaining, // Số lượng còn lại trong campaign
    };
  };

  /**
   * Ensure items that exceed campaign quota use base/original price and notify once.
   */
  const normalizeCampaignPricing = (itemsToNormalize: UICartItem[]): UICartItem[] => {
    const normalized = itemsToNormalize.map((item) => {
      const hasCampaignLimit =
        item.campaignRemaining !== null &&
        item.campaignRemaining !== undefined &&
        item.campaignRemaining >= 0 &&
        item.quantity > item.campaignRemaining;

      if (hasCampaignLimit) {
        // Force price back to original/base price for exceeded quantity
        return {
          ...item,
          price: item.originalPrice ?? item.price,
        };
      }
      return item;
    });

    // Notify once per cartItemId
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
  };

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

  // Platform voucher info: Record<productId, { discount: number; campaignProductId: string; inPlatformCampaign?: boolean }>
  type PlatformVoucherInfo = { discount: number; campaignProductId: string; inPlatformCampaign?: boolean };
  const [platformVoucherDiscounts, setPlatformVoucherDiscounts] = useState<Record<string, PlatformVoucherInfo>>({});

  useEffect(() => {
    const init = async () => {
      await loadCart();
      await loadAddresses();
    };
    init();
  }, [loadCart]);

  // Giá hiển thị trên UI: nếu backend trả về giá gốc nhưng product đang có platform campaign,
  // tự tính lại giá sau giảm dựa trên platformVoucherDiscounts (theo productId).
  // Điều này giúp fix case có từ 2 variant cùng productId ở cart nhưng backend trả về giá gốc.
  const itemsForDisplay = useMemo<UICartItem[]>(() => {
    if (items.length === 0) return items;

    return items.map((item) => {
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
  }, [items, platformVoucherDiscounts]);

  // Load cart items - backend đã xử lý platform campaign, chỉ cần map
  useEffect(() => {
    if (!cart?.items) {
      setItems([]);
      return;
    }

    // Log cart response khi vào shopping cart page
    console.log('🛒 [SHOPPING CART PAGE] Cart Response Body:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('GET /api/v1/customers/{customerId}/cart');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(JSON.stringify(cart, null, 2));
    console.log('═══════════════════════════════════════════════════════════════');

    // Backend đã xử lý platform campaign, chỉ cần map trực tiếp
    // Initial load: don't preserve selection (default to all selected)
    const apiItems = cart.items as unknown as ApiCartItem[];
    const mappedItems = apiItems.map(apiItem => mapApiItemToUI(apiItem, false, []));
    setItems(normalizeCampaignPricing(mappedItems));
  }, [cart]);

  // Load vouchers for all products in the cart (unique by refId)
  const [availableVouchers, setAvailableVouchers] = useState<ShopVoucher[]>([]);
  const [productVoucherAvailability, setProductVoucherAvailability] = useState<Record<string, boolean>>({});
  const [, setVouchersLoading] = useState(false);

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        setVouchersLoading(true);
        // Chỉ lấy PRODUCT items (không phải COMBO) để load voucher
        // refId của PRODUCT là productId, refId của COMBO là comboId
        const productItems = (cart?.items || []).filter(item => item.type === 'PRODUCT');
        const productIds = Array.from(new Set(productItems.map(i => i.refId)));
        if (productIds.length === 0) {
          setAvailableVouchers([]);
          setProductVoucherAvailability({});
          return;
        }

        // Fetch vouchers and product details to get storeId
        const responses = await Promise.all(
          productIds.map(async (pid) => {
            try {
              console.log(`🛒 Loading vouchers for productId: ${pid}`);
              const [voucherRes, productRes] = await Promise.all([
                ProductVoucherService.getProductVouchers(pid, 'ALL', null).catch((err) => {
                  console.error(`❌ Failed to load vouchers for productId ${pid}:`, err);
                  return null;
                }),
                ProductListService.getProductById(pid).catch((err) => {
                  console.error(`❌ Failed to load product details for productId ${pid}:`, err);
                  return null;
                }),
              ]);
              if (voucherRes) {
                console.log(`✅ Loaded vouchers for productId ${pid}:`, {
                  shopVouchers: voucherRes.data?.vouchers?.shop?.length || 0,
                  platformCampaigns: voucherRes.data?.vouchers?.platform?.length || 0,
                });
              }
              return { productId: pid, voucherRes, productRes };
            } catch (err) {
              console.error(`❌ Error loading vouchers for productId ${pid}:`, err);
              return { productId: pid, voucherRes: null, productRes: null };
            }
          })
        );

        // Extract shop vouchers with storeId
        // Map: productId -> vouchers[] để mỗi product chỉ có vouchers của chính nó
        const productVouchersMap = new Map<string, ShopVoucher[]>();
        const availabilityMap: Record<string, boolean> = {};
        const platformDiscountsMap: Record<string, PlatformVoucherInfo> = {};
        
        responses.forEach(({ productId, voucherRes, productRes }) => {
          const vouchers = voucherRes?.data?.vouchers?.shop || [];
          availabilityMap[productId] = vouchers.length > 0;
          
          // Lưu vouchers theo productId (mỗi product chỉ có vouchers của chính nó)
          if (voucherRes && productRes) {
            const storeId = productRes.data?.storeId;
            const productVouchers: ShopVoucher[] = vouchers.map((v: any) => ({
              ...v,
              storeId: storeId || undefined,
            }));
            productVouchersMap.set(productId, productVouchers);
          } else {
            productVouchersMap.set(productId, []);
          }
          
          // Calculate platform voucher discount and store campaignProductId
          // productId ở đây chính là refId (productId gốc)
          if (voucherRes?.data) {
            // Tìm tất cả cart items có cùng refId (bao gồm cả variants)
            // Dùng items (state gốc) để lấy giá gốc, không dùng itemsForDisplay
            const itemsWithSameRefId = items.filter(item => item.productId === productId);
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
            const apiItem = cart?.items?.find(item => item.refId === productId) as ApiCartItem | undefined;
            const inPlatformCampaign = apiItem?.inPlatformCampaign || false;
            const campaignUsageExceeded = apiItem?.campaignUsageExceeded || false;
            
            console.log(`💰 [LOAD VOUCHERS] Processing platform voucher for refId ${productId}:`, {
              itemsCount: itemsWithSameRefId.length,
              hasVariants: itemsWithSameRefId.some(item => (item as any).variantId),
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
              if (campaignProductId) {
                platformDiscountsMap[productId] = {
                  discount: platformDiscount,
                  campaignProductId: campaignProductId,
                  inPlatformCampaign: inPlatformCampaign && !campaignUsageExceeded,
                };
                console.log(`✅ [LOAD VOUCHERS] Stored platform voucher for product ${productId}:`, {
                  campaignProductId,
                  discount: platformDiscount,
                  inPlatformCampaign,
                  campaignUsageExceeded,
                });
              } else if (inPlatformCampaign && !campaignUsageExceeded) {
                console.warn(`⚠️ [LOAD VOUCHERS] Product ${productId} has inPlatformCampaign=true but no platformVoucherId found in response`);
              }
            }
          }
        });
        
        setPlatformVoucherDiscounts(platformDiscountsMap);
        
        setProductVoucherAvailability(availabilityMap);
        
        // Lưu productVouchersMap để sử dụng sau - mỗi product chỉ có vouchers của chính nó
        setProductVouchersMapState(productVouchersMap);
        
        // Lưu allVouchers để tương thích với code cũ (storeVoucherMap)
        const allVouchers: ShopVoucher[] = [];
        productVouchersMap.forEach((vouchers) => {
          allVouchers.push(...vouchers);
        });
        
        // Dedupe by code (keep first occurrence) - chỉ để tương thích
        const deduped = Array.from(
          new Map(allVouchers.map(v => [v.code, v])).values()
        );
        setAvailableVouchers(deduped);
      } finally {
        setVouchersLoading(false);
      }
    };
    loadVouchers();
  }, [cart?.items]);

  const allSelected = useMemo(() => itemsForDisplay.every(i => i.isSelected), [itemsForDisplay]);
  const summary = useMemo(() => calcCartSummary(itemsForDisplay), [itemsForDisplay]);

  // Store vouchers - Track by productId (not storeId) to prevent same voucher code on multiple products
  const [appliedStoreVouchers, setAppliedStoreVouchers] = useState<Record<string, AppliedStoreVoucher>>({});
  
  // Map voucher code to productId to check if voucher is already used by another product
  const voucherCodeToProductIdMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(appliedStoreVouchers).forEach(([productId, voucher]) => {
      map.set(voucher.code, productId);
    });
    return map;
  }, [appliedStoreVouchers]);

  // Shipping fee estimation state
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Note: Shipping fee is no longer calculated on the cart page.
  // It will be determined on the checkout page after address and shipping methods are confirmed.

  // Ensure product cache contains store info for all items
  useEffect(() => {
    const ensureProductDetails = async () => {
      const missingProductIds = items
        .map(item => item.productId)
        .filter(pid => !productCache.has(pid));

      if (missingProductIds.length === 0) return;

      const productDetails = await Promise.all(
        missingProductIds.map(async (pid) => {
          try {
            const res = await ProductListService.getProductById(pid);
            return res.data;
          } catch (error) {
            console.error(`Failed to fetch product ${pid}:`, error);
            return null;
          }
        })
      );

      const newCache = new Map(productCache);
      productDetails.forEach(product => {
        if (product) {
          newCache.set(product.productId, product);
        }
      });
      if (productDetails.some(Boolean)) {
        setProductCache(newCache);
      }
    };

    if (items.length > 0) {
      ensureProductDetails();
    }
  }, [items, productCache, setProductCache]);

  // Map: productId -> vouchers[] - mỗi product chỉ có vouchers của chính nó
  const [productVouchersMapState, setProductVouchersMapState] = useState<Map<string, ShopVoucher[]>>(new Map());
  
  const storeVoucherMap = useMemo(() => {
    const map = new Map<string, ShopVoucher[]>();
    availableVouchers.forEach(voucher => {
      if (!voucher.storeId) {
        return;
      }
      if (!map.has(voucher.storeId)) {
        map.set(voucher.storeId, []);
      }
      map.get(voucher.storeId)!.push(voucher);
    });
    return map;
  }, [availableVouchers]);

  const calculateVoucherDiscount = (voucher: ShopVoucher, storeTotal: number): number => {
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

  const calculateSelectedTotalForStore = (storeId: string): number => {
    return itemsForDisplay.reduce((sum, item) => {
      if (!item.isSelected) return sum;
      const product = productCache.get(item.productId);
      const itemStoreId = product?.storeId || `unknown-${item.productId}`;
      if (itemStoreId !== storeId) return sum;
      return sum + item.price * item.quantity;
    }, 0);
  };

  useEffect(() => {
    const messages: string[] = [];

    setAppliedStoreVouchers(prev => {
      let changed = false;
      const next: Record<string, AppliedStoreVoucher> = {};

      Object.entries(prev).forEach(([productId, applied]) => {
        const product = productCache.get(productId);
        const storeId = product?.storeId || `unknown-${productId}`;
        const vouchers = productVouchersMapState.get(productId) || [];
        const matchedVoucher = vouchers.find(v => v.code === applied.code);
        const storeTotal = calculateSelectedTotalForStore(storeId);

        if (!matchedVoucher || storeTotal <= 0) {
          changed = true;
          return;
        }

        if (matchedVoucher.minOrderValue && storeTotal < matchedVoucher.minOrderValue) {
          changed = true;
          messages.push(
            t('cart.voucher.removedMinOrder', { 
              code: applied.code, 
              amount: matchedVoucher.minOrderValue.toLocaleString('vi-VN') 
            })
          );
          return;
        }

        const discountValue = calculateVoucherDiscount(matchedVoucher, storeTotal);
        next[productId] = {
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

      messages.forEach(msg => showCenterError(msg, t('cart.voucher.title')));
  }, [items, productCache, productVouchersMapState]);

  // Calculate subtotal dựa trên giá gốc (để hiển thị giống HomePage: giá gốc + giảm giá)
  const subtotalBeforePlatformDiscount = useMemo(() => {
    return Math.round(itemsForDisplay.reduce((sum, item) => {
      if (!item.isSelected) return sum;
      const original = item.originalPrice ?? item.price;
      return sum + original * item.quantity;
    }, 0));
  }, [itemsForDisplay]);
  
  // Tổng giảm giá nền tảng = (giá gốc - giá sau giảm) * quantity
  const totalPlatformDiscount = useMemo(() => {
    return Math.round(itemsForDisplay.reduce((sum, item) => {
      if (!item.isSelected) return sum;
      const original = item.originalPrice ?? item.price;
      const discountPerUnit = Math.max(0, original - item.price);
      return sum + discountPerUnit * item.quantity;
    }, 0));
  }, [itemsForDisplay]);

  // Store voucher discount
  const voucherDiscount = useMemo(() => {
    return Object.values(appliedStoreVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
  }, [appliedStoreVouchers]);

  // Detect cases where UI nên hiển thị giá gốc (không áp dụng giảm giá nền tảng ở mức tổng):
  // 1. Có từ 2 variant trở lên cùng 1 productId
  // 2. Có variant với quantity ≥ 2
  // 3. Sản phẩm không có variant nhưng quantity ≥ 2
  const hasMultipleVariantsSameProduct = useMemo(() => {
    const counts = new Map<string, number>();
    itemsForDisplay.forEach(item => {
      if ((item as any).variantId !== null && (item as any).variantId !== undefined) {
        const key = item.productId;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    });
    return Array.from(counts.values()).some(count => count >= 2);
  }, [itemsForDisplay]);

  const hasVariantWithQtyAtLeast2 = useMemo(() => {
    return itemsForDisplay.some(
      (item: any) =>
        item.variantId !== null &&
        item.variantId !== undefined &&
        item.quantity >= 2
    );
  }, [itemsForDisplay]);

  const hasNonVariantWithQtyAtLeast2 = useMemo(() => {
    return itemsForDisplay.some(
      (item: any) =>
        (item.variantId === null || item.variantId === undefined) &&
        item.quantity >= 2
    );
  }, [itemsForDisplay]);

  const forceShowOriginalTotal =
    hasMultipleVariantsSameProduct || hasVariantWithQtyAtLeast2 || hasNonVariantWithQtyAtLeast2;

  // Danh sách mã voucher đã áp dụng (chỉ voucher shop, không tính platform)
  const selectedVoucherCodes = useMemo(
    () => Array.from(new Set(Object.values(appliedStoreVouchers).map(v => v.code))),
    [appliedStoreVouchers]
  );

  // Grand total = subtotal - platform discount - store voucher discount + shipping fee
  const grandTotal = useMemo(() => {
    const baseWithShipping = subtotalBeforePlatformDiscount + shippingFee;

    if (forceShowOriginalTotal) {
      // Không trừ platform discount, chỉ trừ voucher + cộng phí ship
      const withoutPlatformDiscount = baseWithShipping - voucherDiscount;
      return Math.max(0, Math.round(withoutPlatformDiscount));
    }

    const total =
      subtotalBeforePlatformDiscount -
      totalPlatformDiscount -
      voucherDiscount +
      shippingFee;
    // Làm tròn để tránh số thập phân
    return Math.max(0, Math.round(total));
  }, [
    subtotalBeforePlatformDiscount,
    totalPlatformDiscount,
    voucherDiscount,
    shippingFee,
    forceShowOriginalTotal,
  ]);

  // Calculate discount amount for a voucher
  const handleApplyStoreVoucher = (productId: string, storeId: string, voucher: ShopVoucher, discountValue: number) => {
    // Check if this voucher code is already applied to another product
    const existingProductId = voucherCodeToProductIdMap.get(voucher.code);
    if (existingProductId && existingProductId !== productId) {
      const existingProduct = productCache.get(existingProductId);
      const existingProductName = existingProduct?.name || t('cart.product.other');
      showCenterError(
        t('cart.voucher.alreadyUsed', { code: voucher.code, productName: existingProductName }),
        t('cart.voucher.title')
      );
      return;
    }

    setAppliedStoreVouchers(prev => ({
      ...prev,
      [productId]: {
        code: voucher.code,
        type: voucher.type,
        discountValue,
        storeId,
      },
    }));
  };

  const handleRemoveStoreVoucher = (productId: string) => {
    setAppliedStoreVouchers(prev => {
      if (!prev[productId]) return prev;
      const { [productId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const storeGroups = useMemo(() => {
    const groups = new Map<string, {
      storeId: string;
      storeName: string;
      items: UICartItem[];
      vouchers: ShopVoucher[];
      appliedVoucher?: AppliedStoreVoucher;
      selectedTotal: number;
    }>();

    itemsForDisplay.forEach(item => {
      const product = productCache.get(item.productId);
      const storeId = product?.storeId || `unknown-${item.productId}`;
      const storeName = product?.storeName || t('cart.store.unknown');

      if (!groups.has(storeId)) {
        groups.set(storeId, {
          storeId,
          storeName,
          items: [],
          vouchers: storeVoucherMap.get(storeId) || [],
          appliedVoucher: undefined, // No longer used at store level
          selectedTotal: 0,
        });
      }

      const group = groups.get(storeId)!;
      group.items.push(item);
      if (item.isSelected) {
        group.selectedTotal += item.price * item.quantity;
      }
      group.vouchers = storeVoucherMap.get(storeId) || [];
    });

    return Array.from(groups.values());
  }, [items, productCache, storeVoucherMap]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, isSelected: !it.isSelected } : it));
  };

  const toggleAll = () => {
    const next = !allSelected;
    setItems(prev => prev.map(it => ({ ...it, isSelected: next })));
  };

  // Apply cart response to UI - backend đã xử lý platform campaign
  const applyCartResponseToUI = (respItems: ApiCartItem[], preserveSelection: boolean = false) => {
    // Backend đã xử lý platform campaign, chỉ cần map trực tiếp
    // Preserve selection state when updating quantity to avoid auto-selecting all items
    const mappedItems = respItems.map(apiItem => mapApiItemToUI(apiItem, preserveSelection, items));
    setItems(normalizeCampaignPricing(mappedItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Build store vouchers from appliedStoreVouchers
  const buildStoreVouchers = (): Array<{ storeId: string; codes: string[] }> | null => {
    const storeVouchersMap = new Map<string, string[]>();
    
    Object.values(appliedStoreVouchers).forEach(voucher => {
      if (!voucher.storeId) return;
      if (!storeVouchersMap.has(voucher.storeId)) {
        storeVouchersMap.set(voucher.storeId, []);
      }
      storeVouchersMap.get(voucher.storeId)!.push(voucher.code);
    });
    
    const result = Array.from(storeVouchersMap.entries()).map(([storeId, codes]) => ({
      storeId,
      codes,
    }));
    
    return result.length > 0 ? result : null;
  };

  // Build platform vouchers from cart items
  // Load platform vouchers for the item being updated
  const buildPlatformVouchers = async (
    targetItem: UICartItem,
    newQuantity: number
  ): Promise<Array<{ campaignProductId: string; quantity: number }> | null> => {
    try {
      // Check if item is in platform campaign (from cart response)
      const apiItem = cart?.items?.find(item => item.cartItemId === targetItem.id) as ApiCartItem | undefined;
      if (!apiItem?.inPlatformCampaign || apiItem.campaignUsageExceeded) {
        console.log('🔍 [PLATFORM VOUCHER] Item not in platform campaign or usage exceeded:', {
          cartItemId: targetItem.id,
          inPlatformCampaign: apiItem?.inPlatformCampaign,
          campaignUsageExceeded: apiItem?.campaignUsageExceeded,
        });
        return null;
      }

      console.log('🔍 [PLATFORM VOUCHER] Loading platform vouchers for product:', targetItem.productId);

      // Load platform vouchers for this product (refId)
      const voucherRes = await ProductVoucherService.getProductVouchers(targetItem.productId, 'ALL', null);
      
      // Support new structure: vouchers.platformVouchers
      const platformVouchers = voucherRes.data?.vouchers?.platformVouchers || [];
      // Support legacy structure: vouchers.platform
      const platformCampaigns = voucherRes.data?.vouchers?.platform || [];
      
      let campaignProductId: string | null = null;
      
      // Process new structure first
      if (platformVouchers.length > 0) {
        for (const campaign of platformVouchers) {
          if (campaign.vouchers && campaign.vouchers.length > 0) {
            // Find active voucher
            const activeVoucher = campaign.vouchers.find((v: any) => v.status === 'ACTIVE');
            if (activeVoucher && activeVoucher.platformVoucherId) {
              campaignProductId = activeVoucher.platformVoucherId;
              console.log('✅ [PLATFORM VOUCHER] Found active platform voucher:', campaignProductId);
              break;
            } else if (campaign.vouchers.length > 0 && !campaignProductId) {
              // If no active voucher but vouchers exist, use first one (for inPlatformCampaign=true case)
              const firstVoucher = campaign.vouchers[0];
              if (firstVoucher?.platformVoucherId) {
                campaignProductId = firstVoucher.platformVoucherId;
                console.log('⚠️ [PLATFORM VOUCHER] Using non-active platform voucher:', campaignProductId);
                break;
              }
            }
          }
        }
      }
      
      // Fallback to legacy structure if new structure didn't find anything
      if (!campaignProductId && platformCampaigns.length > 0) {
        // Try to find active platform voucher first
        for (const campaign of platformCampaigns) {
          if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
            const activeVoucher = campaign.vouchers.find((v: any) => v.status === 'ACTIVE');
            if (activeVoucher && activeVoucher.platformVoucherId) {
              campaignProductId = activeVoucher.platformVoucherId;
              console.log('✅ [PLATFORM VOUCHER] Found active platform voucher (legacy):', campaignProductId);
              break;
            }
          }
        }
        
        // If no active voucher found, try to get from any voucher (for items already in campaign)
        if (!campaignProductId) {
          for (const campaign of platformCampaigns) {
            if (campaign.vouchers && campaign.vouchers.length > 0) {
              const voucher = campaign.vouchers[0];
              if (voucher?.platformVoucherId) {
                campaignProductId = voucher.platformVoucherId;
                console.log('⚠️ [PLATFORM VOUCHER] Using non-active platform voucher (legacy):', campaignProductId);
                break;
              }
            }
          }
        }
      }
      
      if (campaignProductId) {
        const result = [{
          campaignProductId,
          quantity: newQuantity,
        }];
        console.log('✅ [PLATFORM VOUCHER] Built platform vouchers:', result);
        return result;
      }
      
      console.log('⚠️ [PLATFORM VOUCHER] No platform voucher found for product:', targetItem.productId);
      return null;
    } catch (error) {
      console.error('❌ [PLATFORM VOUCHER] Failed to build platform vouchers:', error);
      return null;
    }
  };

  // Build service type IDs for all stores in cart
  const buildServiceTypeIds = (): Record<string, number> | null => {
    const result: Record<string, number> = {};
    const storeIds = new Set<string>();
    
    // Dùng itemsForDisplay để tính service type (dựa trên items đã được hiển thị)
    itemsForDisplay.forEach(item => {
      const product = productCache.get(item.productId);
      if (product?.storeId) {
        storeIds.add(product.storeId);
      }
    });
    
    storeIds.forEach(storeId => {
      // Calculate total weight for this store
      let totalWeight = 0;
      itemsForDisplay.forEach(item => {
        const product = productCache.get(item.productId);
        if (product && product.storeId === storeId) {
          const weightKg = product.weight && product.weight > 0 ? product.weight : 0.5;
          totalWeight += weightKg * 1000 * item.quantity;
        }
      });
      
      // Service type: ≤7500g → 2, >7500g → 5
      result[storeId] = totalWeight <= 7500 ? 2 : 5;
    });
    
    return Object.keys(result).length > 0 ? result : null;
  };

  const updateQuantity = async (cartItemId: string, nextQty: number) => {
    try {
      const clamped = Math.max(1, Math.min(nextQty, 99));
      
      console.log('🛒 [UPDATE QUANTITY] Starting quantity update:', {
        cartItemId,
        oldQuantity: itemsForDisplay.find(item => item.id === cartItemId)?.quantity,
        newQuantity: nextQty,
        clampedQuantity: clamped,
      });
      
      // Find the item being updated
      const targetItem = itemsForDisplay.find(item => item.id === cartItemId);
      if (!targetItem) {
        console.error('❌ [UPDATE QUANTITY] Item not found:', cartItemId);
        showCenterError(t('cart.errors.productNotFound'), t('cart.errors.title'));
        return;
      }

      // Optimization: Skip API call if item is not in campaign
      // If item has no campaign or campaign is exhausted, price will always be base price
      // No need to check API regardless of quantity (1, 2, 3, 4, 5...)
      const apiItem = cart?.items?.find(item => item.cartItemId === cartItemId) as ApiCartItem | undefined;
      const isNotInCampaign = !apiItem?.inPlatformCampaign || apiItem?.campaignUsageExceeded;
      const currentQuantity = targetItem.quantity;
      
      // Skip API call if item is not in campaign (no campaign or campaign exhausted)
      // This applies to any quantity change (1→2, 2→3, 3→4, etc.) since price will always be base price
      if (isNotInCampaign) {
        console.log('⚡ [UPDATE QUANTITY] Optimization: Item not in campaign, skipping API call');
        console.log('   Item:', targetItem.name);
        console.log('   Current quantity:', currentQuantity);
        console.log('   New quantity:', clamped);
        console.log('   Price will remain base price:', targetItem.originalPrice);
        console.log('   Reason: Item has no campaign or campaign is exhausted');
        
        // Update quantity locally without API call
        // Note: Update vào items (state gốc), itemsForDisplay sẽ tự động cập nhật
        const updatedItems = items.map(item => {
          if (item.id === cartItemId) {
            return {
              ...item,
              quantity: clamped,
              // Price remains the same (base price) since no campaign
              price: item.originalPrice ?? item.price,
            };
          }
          return item;
        });
        
        setItems(updatedItems);
        window.dispatchEvent(new Event('cartUpdated'));
        console.log('✅ [UPDATE QUANTITY] Quantity updated locally (no API call)');
        return;
      }

      console.log('🔍 [UPDATE QUANTITY] Building vouchers and service type IDs...');

      // Build vouchers and service type IDs
      const storeVouchers = buildStoreVouchers();
      console.log('🏪 [UPDATE QUANTITY] Built store vouchers:', storeVouchers);
      
      const platformVouchers = await buildPlatformVouchers(targetItem, clamped);
      console.log('🎁 [UPDATE QUANTITY] Built platform vouchers:', platformVouchers);
      
      const serviceTypeIds = buildServiceTypeIds();
      console.log('📦 [UPDATE QUANTITY] Built service type IDs:', serviceTypeIds);

      // Build request payload
      const requestPayload = {
        cartItemId,
        quantity: clamped,
        storeVouchers: storeVouchers || null,
        platformVouchers: platformVouchers || null,
        serviceTypeIds: serviceTypeIds || null,
      };

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📤 [UPDATE QUANTITY] Final Request Payload:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(JSON.stringify(requestPayload, null, 2));
      console.log('═══════════════════════════════════════════════════════════════');

      // Call new API with vouchers
      const resp = await CustomerCartService.updateQuantityWithVouchers(requestPayload);

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ [UPDATE QUANTITY] Response received:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('Cart Summary:', {
        subtotal: resp.subtotal,
        discountTotal: resp.discountTotal,
        grandTotal: resp.grandTotal,
        itemCount: resp.items.length,
      });
      console.log('═══════════════════════════════════════════════════════════════');

      // Apply response to UI - preserve selection state to avoid auto-selecting all items
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[], true);
      
      // Check for campaign usage exceeded warnings
      const updatedItem = resp.items.find(item => item.cartItemId === cartItemId);
        if (updatedItem?.campaignUsageExceeded) {
        console.warn('⚠️ [UPDATE QUANTITY] Campaign usage exceeded for item:', updatedItem.name);
        showCenterError(
          t('cart.campaign.exceeded', { productName: updatedItem.name }),
          t('cart.warning.title')
        );
      } else {
        console.log('✅ [UPDATE QUANTITY] Quantity updated successfully');
      }
    } catch (error: any) {
      console.error('❌ [UPDATE QUANTITY] Error:', error);
      const rawMsg =
        error?.message ||
        error?.data?.message ||
        CustomerCartService.formatCartError(error) ||
        '';
      const outOfStock =
        /out of stock/i.test(rawMsg) ||
        /hết hàng/i.test(rawMsg) ||
        /out of inventory/i.test(rawMsg);

      if (outOfStock) {
        showCenterError(
          'Sản phẩm đã hết hàng hoặc không đủ tồn kho.',
          t('cart.errors.title') || 'Lỗi giỏ hàng'
        );
        // Đồng bộ lại giỏ để trả trạng thái tồn kho mới nhất
        loadCart();
        return;
      }

      const msg = rawMsg || t('cart.errors.cannotUpdateQuantity');
      showCenterError(msg, t('cart.errors.title'));
    }
  };

  const inc = (id: string) => {
    const current = itemsForDisplay.find(it => it.id === id);
    if (!current) return;
    updateQuantity(id, current.quantity + 1);
  };

  const dec = (id: string) => {
    const current = itemsForDisplay.find(it => it.id === id);
    if (!current) return;
    updateQuantity(id, current.quantity - 1);
  };

  const removeItem = async (id: string) => {
    try {
      const resp = await CustomerCartService.deleteItems([id]);
      // Preserve selection state when removing item
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[], true);
      showCenterSuccess(t('cart.success.itemRemoved'), t('cart.success.title'));
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || t('cart.errors.cannotRemoveItem');
      showCenterError(msg, t('cart.errors.title'));
    }
  };

  const handleDeleteAll = async () => {
    if (itemsForDisplay.length === 0) return;
    try {
      const resp = await CustomerCartService.deleteCart();
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[]);
      showCenterSuccess(t('cart.success.cartCleared'), t('cart.success.title'));
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || t('cart.errors.cannotDeleteCart');
      showCenterError(msg, t('cart.errors.title'));
    }
  };

  const handleProceedToCheckout = async () => {
    const selectedItems = itemsForDisplay.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      showCenterError(t('cart.errors.noItemsSelected'), t('cart.errors.title'));
      return;
    }

    // QUAN TRỌNG: Fetch platform vouchers cho TẤT CẢ products/variants trước khi checkout
    // Đảm bảo có platformVoucherId nếu product có platform campaign
    // Với variant: TRUY NGƯỢC LẠI refId (productId) từ variantId để gọi API
    
    // Collect tất cả refIds (productIds) cần fetch
    // Với variant: truy ngược lại refId từ cartItems
    const refIdsToFetch = new Set<string>();
    
    selectedItems.forEach(item => {
      const anyItem: any = item;
      if (anyItem.variantId !== null && anyItem.variantId !== undefined) {
        // Có variantId: truy ngược lại refId (productId) từ cartItems
        // item.productId chính là refId trong trường hợp này
        refIdsToFetch.add(item.productId);
        console.log(`🔍 [CHECKOUT] Variant detected - variantId: ${anyItem.variantId}, refId (productId): ${item.productId}`);
      } else {
        // Không có variant: productId = refId
        refIdsToFetch.add(item.productId);
      }
    });
    
    // Fetch platform vouchers cho TẤT CẢ refIds (kể cả đã có trong platformVoucherDiscounts)
    // Đảm bảo luôn có data mới nhất trước khi checkout
    console.log('🔍 [CHECKOUT] Fetching platform vouchers for ALL refIds (productIds) before checkout:', Array.from(refIdsToFetch));
    console.log('📌 Note: For variants, using refId (productId) to fetch vouchers');
    
    try {
      const voucherPromises = Array.from(refIdsToFetch).map(async (refId) => {
        try {
          // Gọi API GET /api/products/view/{refId}/vouchers
          // refId = productId gốc (không phải variantId)
          console.log(`📡 [CHECKOUT] Fetching vouchers for refId (productId): ${refId}`);
          const voucherRes = await ProductVoucherService.getProductVouchers(refId, 'ALL', null);
          
          // Lấy thông tin từ cart items có cùng refId (bao gồm cả variants)
          const itemsWithSameRefId = selectedItems.filter(item => item.productId === refId);
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
          
          const apiItem = cart?.items?.find(item => item.refId === refId) as ApiCartItem | undefined;
          const inPlatformCampaign = apiItem?.inPlatformCampaign || false;
          const campaignUsageExceeded = apiItem?.campaignUsageExceeded || false;
          
          // Log thông tin
          const hasVariants = itemsWithSameRefId.some(item => (item as any).variantId);
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
      
      // Update platformVoucherDiscounts với các voucher mới fetch được
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
    } catch (error) {
      console.error('❌ [CHECKOUT] Error fetching platform vouchers:', error);
      // Continue with checkout even if voucher fetch fails
    }

    const payload = {
      selectedCartItemIds: selectedItems.map(item => item.id),
      storeVouchers: appliedStoreVouchers, // Still pass for checkout compatibility
      selectedAddressId,
      createdAt: Date.now(),
    };

    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(payload));
      navigate('/checkout');
    } catch (error) {
      console.error('Failed to cache checkout payload:', error);
      showCenterError(t('cart.errors.cannotPrepareCheckout'), t('cart.errors.title'));
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb / Progress bar */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-5">
          <div className="flex items-center gap-2 px-6 py-4 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <span className="font-medium text-gray-900">{t('cart.breadcrumb.cart')}</span>
            <ChevronRight className="w-4 h-4" />
            <span>{t('cart.breadcrumb.checkout')}</span>
            <ChevronRight className="w-4 h-4" />
            <span>{t('cart.breadcrumb.confirm')}</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('cart.title')}</h1>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-3">{t('cart.loading')}</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items List */}
            <CartItemsList
              storeGroups={storeGroups}
              totalItemCount={itemsForDisplay.length}
              productVoucherAvailability={productVoucherAvailability}
              productVouchersMap={productVouchersMapState}
              appliedStoreVouchers={appliedStoreVouchers}
              voucherCodeToProductIdMap={voucherCodeToProductIdMap}
              productCache={productCache}
              showAddress={false}
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
              onApplyVoucher={handleApplyStoreVoucher}
              onRemoveVoucher={handleRemoveStoreVoucher}
              platformVoucherDiscounts={platformVoucherDiscounts}
            />

            {/* Summary Sidebar */}
            <CartSummarySidebar
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
              subtotal={subtotalBeforePlatformDiscount}
              discount={totalPlatformDiscount}
              voucherDiscount={voucherDiscount}
              selectedCount={summary.selectedCount}
              grandTotal={grandTotal}
              onCheckout={handleProceedToCheckout}
              isCheckingOut={false}
              disabled={false}
              selectedVoucherCodes={selectedVoucherCodes}
              forceShowOriginalTotal={forceShowOriginalTotal}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingCart;
