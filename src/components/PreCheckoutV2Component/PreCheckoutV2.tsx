import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
import { AddressForm } from '../CheckoutOrderComponents';
import { AddressService } from '../../services/customer/AddressService';
import type { CustomerAddressApiItem } from '../../types/api';
import type {
  CartItem as ApiCartItem,
  ServiceTypeIds,
  PlatformVoucher,
  CheckoutPreviewData,
  CheckoutPreviewRequest,
  CheckoutCodRequest,
  CheckoutPayOSRequest
} from '../../types/cart';
import type { CartItem as UiCartItem } from '../../data/shoppingcart';
import type { PaymentMethod } from '../../data/checkout';
import { useAutoShippingFee, type StoreShippingFee } from '../../hooks/useAutoShippingFee';
import { CustomerCartService } from '../../services/customer/CartService';
import ProductVoucherService from '../../services/customer/ProductVoucherService';
import { ShippingService, type GhnLeadtimeResponseData } from '../../services/customer/ShippingService';
import { showCenterError } from '../../utils/notification';

const CHECKOUT_SESSION_KEY = 'checkout:payload:v1';

// Helper: tính serviceTypeId cho từng cửa hàng (2: hàng nhẹ, 5: hàng nặng) dựa trên tổng khối lượng
const calculateStoreServiceType = (
  items: ApiCartItem[],
  storeId: string,
  productCache: Map<string, Product>
): 2 | 5 => {
  let totalWeightGr = 0;
  items.forEach((item) => {
    if (item.type !== 'PRODUCT') return;
    const product = productCache.get(item.refId);
    if (!product || product.storeId !== storeId) return;
    const weightKg = product.weight && product.weight > 0 ? product.weight : 0.5;
    totalWeightGr += Math.round(weightKg * 1000) * item.quantity;
  });
  // ≤ 7500g → service_type_id = 2 (Hàng nhẹ), > 7500g → 5 (Hàng nặng)
  return totalWeightGr <= 7500 ? 2 : 5;
};

const buildServiceTypeIds = (
  items: ApiCartItem[],
  productCache: Map<string, Product>
): ServiceTypeIds => {
  const result: ServiceTypeIds = {};
  const storeIds = new Set<string>();

  items.forEach((item) => {
    if (item.type !== 'PRODUCT') return;
    const product = productCache.get(item.refId);
    if (product?.storeId) {
      storeIds.add(product.storeId);
    }
  });

  storeIds.forEach((storeId) => {
    result[storeId] = calculateStoreServiceType(items, storeId, productCache);
  });

  return result;
};

// Helper: xây dựng danh sách platformVouchers từ API /api/products/view/{productId}/vouchers
// Logic bám sát buildPlatformVouchers trong ShoppingCart.tsx
const buildPlatformVouchers = async (
  apiItems: ApiCartItem[]
): Promise<PlatformVoucher[]> => {
  const result: PlatformVoucher[] = [];

  // Chỉ xử lý các item PRODUCT đang trong campaign và chưa vượt quota
  const targetItems = apiItems.filter(
    (item) =>
      item.type === 'PRODUCT' &&
      item.inPlatformCampaign &&
      !item.campaignUsageExceeded
  );

  if (!targetItems.length) {
    console.log(
      '🎫 [PreCheckoutV2] No items in platform campaign, skip building platformVouchers.'
    );
    return [];
  }

  for (const item of targetItems) {
    const productId = item.refId; // refId = productId gốc

    try {
      console.groupCollapsed('🔍 [PreCheckoutV2] Platform vouchers fetch');
      console.log('ProductId:', productId);
      console.log('Request URL:', `/api/products/view/${productId}/vouchers?type=ALL`);

      const voucherRes = await ProductVoucherService.getProductVouchers(
        productId,
        'ALL',
        null
      );
      console.log('Response Body:', voucherRes);

      const platformVouchers = voucherRes.data?.vouchers?.platformVouchers || [];
      const platformCampaigns = voucherRes.data?.vouchers?.platform || [];

      let campaignProductId: string | null = null;

      // Ưu tiên cấu trúc mới vouchers.platformVouchers
      if (platformVouchers.length > 0) {
        for (const campaign of platformVouchers) {
          if (campaign.vouchers && campaign.vouchers.length > 0) {
            const activeVoucher = campaign.vouchers.find(
              (v: any) => v.status === 'ACTIVE'
            );
            if (activeVoucher && activeVoucher.platformVoucherId) {
              campaignProductId = activeVoucher.platformVoucherId;
              console.log(
                '✅ [PreCheckoutV2] Found active platform voucher (platformVoucherId -> campaignProductId):',
                campaignProductId
              );
              break;
            } else if (campaign.vouchers.length > 0 && !campaignProductId) {
              const firstVoucher = campaign.vouchers[0];
              if (firstVoucher?.platformVoucherId) {
                campaignProductId = firstVoucher.platformVoucherId;
                console.log(
                  '⚠️ [PreCheckoutV2] Using non-active platform voucher (platformVoucherId -> campaignProductId):',
                  campaignProductId
                );
                break;
              }
            }
          }
        }
      }

      // Fallback sang legacy vouchers.platform nếu chưa tìm được
      if (!campaignProductId && platformCampaigns.length > 0) {
        for (const campaign of platformCampaigns) {
          if (
            campaign.status === 'ACTIVE' &&
            campaign.vouchers &&
            campaign.vouchers.length > 0
          ) {
            const activeVoucher = campaign.vouchers.find(
              (v: any) => v.status === 'ACTIVE'
            );
            if (activeVoucher && activeVoucher.platformVoucherId) {
              campaignProductId = activeVoucher.platformVoucherId;
              console.log(
                '✅ [PreCheckoutV2] Found active platform voucher (legacy platformVoucherId -> campaignProductId):',
                campaignProductId
              );
              break;
            }
          }
        }

        if (!campaignProductId) {
          for (const campaign of platformCampaigns) {
            if (campaign.vouchers && campaign.vouchers.length > 0) {
              const voucher = campaign.vouchers[0];
              if (voucher?.platformVoucherId) {
                campaignProductId = voucher.platformVoucherId;
                console.log(
                  '⚠️ [PreCheckoutV2] Using non-active platform voucher (legacy platformVoucherId -> campaignProductId):',
                  campaignProductId
                );
                break;
              }
            }
          }
        }
      }

      if (campaignProductId) {
        // Lượng còn lại trong campaign (nếu BE trả về)
        const usable =
          typeof item.campaignRemaining === 'number'
            ? Math.min(item.quantity, item.campaignRemaining)
            : item.quantity;

        if (usable > 0) {
          const existing = result.find(
            (v) => v.campaignProductId === campaignProductId
          );
          if (existing) {
            existing.quantity += usable;
          } else {
            result.push({ campaignProductId, quantity: usable });
          }
        }
      } else {
        console.log(
          '⚠️ [PreCheckoutV2] No platform voucher found for product:',
          productId
        );
      }
      console.log('🎁 [PreCheckoutV2] Built platform vouchers for this product:', result);
    } catch (error) {
      console.error(
        `❌ [PreCheckoutV2] Failed to build platform vouchers for product ${productId}:`,
        error
      );
    } finally {
      console.groupEnd();
    }
  }

  console.log('🎁 [PreCheckoutV2] Built platform vouchers for preview (final):', result);
  return result;
};

// Map cart API item -> CartItem (dùng cho logic tính phí vận chuyển)
const mapApiItemToUiCartItem = (apiItem: ApiCartItem): UiCartItem => {
  const finalPrice =
    apiItem.inPlatformCampaign &&
    !apiItem.campaignUsageExceeded &&
    apiItem.platformCampaignPrice !== undefined
      ? apiItem.platformCampaignPrice
      : apiItem.unitPrice;

  const originalPrice = apiItem.baseUnitPrice ?? apiItem.unitPrice;

  return {
    id: apiItem.cartItemId,
    productId: apiItem.refId,
    name: apiItem.name,
    image: apiItem.variantUrl || apiItem.image,
    price: finalPrice,
    originalPrice,
    quantity: apiItem.quantity,
    isSelected: true,
    variant: apiItem.variantOptionValue || undefined,
    variantId: apiItem.variantId || null,
    type: (apiItem.type as any) || 'PRODUCT',
    campaignRemaining: (apiItem as any).campaignRemaining ?? undefined,
  };
};

const PreCheckoutV2: React.FC = () => {
  const { cart, isLoading, error, loadCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Tự động load giỏ hàng cho CUSTOMER
    loadCart();
  }, [loadCart]);

  // Selected shop vouchers: Map<storeId, { shopVoucherId, code }>
  const [selectedShopVouchers, setSelectedShopVouchers] = useState<
    Map<string, { shopVoucherId: string; code: string }>
  >(() => new Map());

  // Selected product vouchers: Map<cartItemId, { shopVoucherId, code }>
  const [selectedProductVouchers, setSelectedProductVouchers] = useState<
    Map<string, { shopVoucherId: string; code: string }>
  >(() => new Map());

  // Serialize Map objects để dùng trong dependency array (tránh infinite loop)
  const selectedShopVouchersKey = useMemo(
    () => JSON.stringify(Array.from(selectedShopVouchers.entries())),
    [selectedShopVouchers]
  );
  const selectedProductVouchersKey = useMemo(
    () => JSON.stringify(Array.from(selectedProductVouchers.entries())),
    [selectedProductVouchers]
  );

  // Cache product voucher details để tính discount (tương tự ShopCartv2)
  type ProductVoucherDetail = {
    shopVoucherId: string;
    code: string;
    discountValue: number | null;
    discountPercent: number | null;
    maxDiscountValue: number | null;
    minOrderValue: number | null;
  };
  const [productVoucherDetailsCache, setProductVoucherDetailsCache] = useState<
    Map<string, ProductVoucherDetail>
  >(() => new Map());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as {
        selectedCartItemIds?: string[];
        selectedAddressId?: string | null;
        storeVouchers?: Record<string, string | { shopVoucherId: string; code: string }>; // storeId -> shopVoucherId (old) or {shopVoucherId, code} (new)
        productVouchers?: Record<string, { shopVoucherId: string; code: string }>; // cartItemId -> {shopVoucherId, code}
        createdAt?: number;
      };
      
      if (payload.selectedCartItemIds?.length) {
        setSelectedCartItemIds(payload.selectedCartItemIds);
      }
      
      if (payload.selectedAddressId) {
        setSelectedAddressId(payload.selectedAddressId);
      }
      
      // Load selected shop vouchers
      let loadedShopVouchers: Map<string, { shopVoucherId: string; code: string }> = new Map();
      if (payload.storeVouchers) {
        const vouchersMap = new Map<
          string,
          { shopVoucherId: string; code: string }
        >();
        const oldFormatVouchers: Array<{ storeId: string; shopVoucherId: string }> = [];
        
        Object.entries(payload.storeVouchers).forEach(([storeId, voucherInfo]) => {
          // Support both old format (string) and new format (object)
          if (typeof voucherInfo === 'string') {
            // Old format: chỉ có shopVoucherId, cần load code từ API sau
            // Tạm thời dùng shopVoucherId làm code, nhưng sẽ cố gắng load code thực từ API
            vouchersMap.set(storeId, { shopVoucherId: voucherInfo, code: voucherInfo });
            oldFormatVouchers.push({ storeId, shopVoucherId: voucherInfo });
            console.warn(
              `⚠️ [PreCheckoutV2] Old format voucher detected for store ${storeId}. ` +
              `Using shopVoucherId as code temporarily. Voucher may not work correctly. ` +
              `Please re-select voucher from cart page.`
            );
          } else {
            // New format: có cả shopVoucherId và code
            vouchersMap.set(storeId, voucherInfo);
          }
        });
        
        loadedShopVouchers = vouchersMap;
        setSelectedShopVouchers(vouchersMap);
        console.log('🎫 [PreCheckoutV2] Loaded shop vouchers:', Array.from(vouchersMap.entries()));
        
        // TODO: Load actual voucher codes from API for old format vouchers
        // This requires productId from items, which may not be available at this point
        // For now, we log a warning and use shopVoucherId as code (may cause backend validation failure)
      }

      // Load selected product vouchers
      let loadedProductVouchers: Map<string, { shopVoucherId: string; code: string }> = new Map();
      if (payload.productVouchers) {
        const productVouchersMap = new Map<
          string,
          { shopVoucherId: string; code: string }
        >();
        Object.entries(payload.productVouchers).forEach(([cartItemId, voucherInfo]) => {
          productVouchersMap.set(cartItemId, voucherInfo);
        });
        loadedProductVouchers = productVouchersMap;
        setSelectedProductVouchers(productVouchersMap);
        console.log('🎟 [PreCheckoutV2] Loaded product vouchers:', Array.from(productVouchersMap.entries()));
      }
      
      console.groupCollapsed('🧾 [PreCheckoutV2] Loaded checkout session payload');
      console.log('Payload:', payload);
      console.log('Selected Cart Item IDs:', payload.selectedCartItemIds);
      console.log('Shop Vouchers:', Array.from(loadedShopVouchers.entries()));
      console.log('Product Vouchers:', Array.from(loadedProductVouchers.entries()));
      console.groupEnd();
    } catch (e) {
      console.error('[PreCheckoutV2] Failed to parse checkout session payload:', e);
    }
  }, []);

  const allItems = cart?.items ?? [];

  const [selectedCartItemIds, setSelectedCartItemIds] = useState<string[]>([]);

  const items = useMemo(
    () =>
      selectedCartItemIds.length
        ? allItems.filter((i) => selectedCartItemIds.includes(i.cartItemId))
        : allItems,
    [allItems, selectedCartItemIds]
  );

  // Clear sessionStorage và redirect nếu cart rỗng sau khi checkout thành công
  useEffect(() => {
    // Nếu cart đã load xong và rỗng, nhưng có selectedCartItemIds từ sessionStorage
    // Điều này có nghĩa là user đã checkout thành công và back về trang này
    if (!isLoading && cart && (!cart.items || cart.items.length === 0)) {
      if (selectedCartItemIds.length > 0) {
        console.log('[PreCheckoutV2] Cart is empty after checkout, clearing session and redirecting...');
        sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
        setSelectedCartItemIds([]);
        // Redirect về trang giỏ hàng hoặc trang chủ
        navigate('/cartv2', { replace: true });
      }
    }
  }, [isLoading, cart, selectedCartItemIds.length, navigate]);

  // Items dùng cho logic tính phí vận chuyển (theo chuẩn CheckoutOrderContainer)
  const shippingItems = useMemo<UiCartItem[]>(
    () => items.map(mapApiItemToUiCartItem),
    [items]
  );

  // Địa chỉ giao hàng
  const [addresses, setAddresses] = useState<CustomerAddressApiItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [storeShippingFees, setStoreShippingFees] = useState<Record<string, StoreShippingFee>>({});
  const [storeLogoErrors, setStoreLogoErrors] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  
  // Store leadtime data: Map<storeId, GhnLeadtimeResponseData>
  const [storeLeadtimes, setStoreLeadtimes] = useState<Record<string, GhnLeadtimeResponseData>>({});
  const [storeLeadtimesLoading, setStoreLeadtimesLoading] = useState<Set<string>>(new Set());

  // Cache thông tin sản phẩm để lấy storeId / storeName
  const [productCache, setProductCache] = useState<Map<string, Product>>(
    () => new Map()
  );

  useEffect(() => {
    const ensureProductDetails = async () => {
      const missingProductIds = items
        .filter((item) => item.type === 'PRODUCT')
        .map((item) => item.refId)
        .filter((productId) => productId && !productCache.has(productId));

      if (missingProductIds.length === 0) return;

      const productDetails = await Promise.all(
        missingProductIds.map(async (productId) => {
          try {
            const res = await ProductListService.getProductById(productId);
            return res.data;
          } catch (error) {
            console.error(`Failed to fetch product ${productId}:`, error);
            return null;
          }
        })
      );

      const next = new Map(productCache);
      productDetails.forEach((product) => {
        if (product) {
          next.set(product.productId, product);
        }
      });

      if (productDetails.some(Boolean)) {
        setProductCache(next);
      }
    };

    if (items.length > 0) {
      void ensureProductDetails();
    }
  }, [items, productCache]);


  // Tự động tính phí vận chuyển giống CheckoutOrderContainer
  useAutoShippingFee({
    items: shippingItems,
    addresses,
    selectedAddressId,
    productCache,
    serviceTypeId: 2, // hook tự tính service_type_id cho từng cửa hàng dựa trên khối lượng
    onShippingFeeChange: (fee: number) => {
      setShippingFee(fee);
    },
    onStoreShippingFeesChange: (fees: Record<string, StoreShippingFee>) => {
      setStoreShippingFees(fees);
    },
    onProductCacheUpdate: (nextCache) => {
      setProductCache(nextCache);
    },
    autoCalculate: shippingItems.length > 0 && !!selectedAddressId,
    onError: (message: string) => {
      const trimmed = (message || '').trim();
      if (trimmed.length > 0) {
        console.error('[PreCheckoutV2] Shipping fee error:', trimmed);
        setShippingFee(0);
      }
    },
  });

  const loadAddresses = useCallback(async () => {
    if (!AddressService.isAuthenticated()) return;
    try {
      setAddressesLoading(true);
      const list = await AddressService.getAddresses();
      setAddresses(list);
      const defaultAddr = list.find((a) => a.default) || list[0] || null;
      setSelectedAddressId(defaultAddr ? defaultAddr.id : null);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  // Group items theo cửa hàng
  const storeGroups = useMemo(() => {
    const groups = new Map<
      string,
      { storeId: string; storeName: string; storeLogoUrl?: string; items: typeof items }
    >();

    items.forEach((item) => {
      let storeId = `unknown-${item.refId}`;
      let storeName = 'Cửa hàng';
      let storeLogoUrl: string | undefined;

      if (item.type === 'PRODUCT') {
        const product = productCache.get(item.refId);
        if (product?.storeId) {
          storeId = product.storeId;
        }
        if (product?.store?.name || product?.storeName) {
          storeName = product.store?.name || product.storeName || storeName;
        }
        // Lấy logoUrl từ store object (có thể có trong API response)
        // Nếu không có trong ProductStore, có thể lấy từ (product as any).store?.logoUrl
        storeLogoUrl = (product?.store as any)?.logoUrl || (product as any)?.storeLogoUrl || undefined;
      }

      if (!groups.has(storeId)) {
        groups.set(storeId, { storeId, storeName, storeLogoUrl, items: [] });
      }
      const group = groups.get(storeId)!;
      group.items.push(item);
      
      // Cập nhật logo nếu group chưa có logo nhưng item hiện tại có logo
      if (!group.storeLogoUrl && storeLogoUrl) {
        group.storeLogoUrl = storeLogoUrl;
      }
      
      // Cập nhật tên cửa hàng nếu có thông tin tốt hơn
      if (storeName !== 'Cửa hàng' && group.storeName === 'Cửa hàng') {
        group.storeName = storeName;
      }
    });

    return Array.from(groups.values());
  }, [items, productCache]);

  // Clear logo errors khi storeGroups thay đổi (khi có stores mới hoặc items thay đổi)
  // Điều này đảm bảo nếu store có logo URL mới, nó sẽ được thử lại thay vì bị block bởi error state cũ
  useEffect(() => {
    // Clear tất cả errors khi storeGroups thay đổi
    // Vì logo URL có thể đã thay đổi hoặc có items mới với logo mới
    setStoreLogoErrors(new Set());
  }, [storeGroups]);

  // Load leadtime cho mỗi store khi có đủ thông tin
  useEffect(() => {
    if (!selectedAddressId || storeGroups.length === 0) return;

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress || !selectedAddress.districtId || !selectedAddress.wardCode) {
      return;
    }

    // Gọi API leadtime cho mỗi store
    storeGroups.forEach((group) => {
      // Lấy thông tin store address từ product đầu tiên trong group
      const firstProductItem = group.items.find((item) => item.type === 'PRODUCT');
      if (!firstProductItem) return;

      const product = productCache.get(firstProductItem.refId);
      if (!product) return;

      // Lấy districtCode và wardCode từ store
      const storeDistrictCode = product.store?.districtCode || product.districtCode;
      const storeWardCode = product.store?.wardCode || product.wardCode;

      if (!storeDistrictCode || !storeWardCode) {
        console.warn(`[PreCheckoutV2] Missing store address info for store ${group.storeId}`);
        return;
      }

      // Convert districtCode (string) to district_id (number)
      const fromDistrictId = parseInt(storeDistrictCode, 10);
      if (isNaN(fromDistrictId)) {
        console.warn(`[PreCheckoutV2] Invalid districtCode for store ${group.storeId}: ${storeDistrictCode}`);
        return;
      }

      // Tính serviceTypeId cho store này
      const serviceTypeId = calculateStoreServiceType(
        group.items as ApiCartItem[],
        group.storeId,
        productCache
      );

      // Map serviceTypeId to service_id: 2 -> 53322, 5 -> 100039
      const serviceId = serviceTypeId === 2 ? 53322 : 100039;

      // Kiểm tra xem đã load chưa hoặc đang load
      if (storeLeadtimes[group.storeId] || storeLeadtimesLoading.has(group.storeId)) {
        return;
      }

      // Set loading state
      setStoreLeadtimesLoading((prev) => new Set(prev).add(group.storeId));

      // Gọi API leadtime (đã check null ở trên)
      const toDistrictId = selectedAddress.districtId!;
      const toWardCode = selectedAddress.wardCode!;
      
      ShippingService.getGhnLeadtime({
        from_district_id: fromDistrictId,
        from_ward_code: storeWardCode,
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        service_id: serviceId,
      })
        .then((response) => {
          if (response.code === 200 && response.data) {
            setStoreLeadtimes((prev) => ({
              ...prev,
              [group.storeId]: response.data,
            }));
          }
        })
        .catch((error) => {
          console.error(`[PreCheckoutV2] Failed to get leadtime for store ${group.storeId}:`, error);
        })
        .finally(() => {
          setStoreLeadtimesLoading((prev) => {
            const next = new Set(prev);
            next.delete(group.storeId);
            return next;
          });
        });
    });
  }, [storeGroups, selectedAddressId, addresses, productCache, storeLeadtimes, storeLeadtimesLoading]);

  const [previewData, setPreviewData] = useState<CheckoutPreviewData | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Load product voucher details để tính discount khi không có preview data
  useEffect(() => {
    const loadProductVoucherDetails = async () => {
      // Chỉ load nếu không có preview data (cần tính thủ công)
      if (previewData?.overallDiscount !== undefined) {
        return;
      }

      if (selectedProductVouchers.size === 0) {
        return;
      }

      // Lấy danh sách shopVoucherId cần load
      const voucherIdsToLoad = Array.from(selectedProductVouchers.values())
        .map((v) => v.shopVoucherId)
        .filter((id) => !productVoucherDetailsCache.has(id));

      if (voucherIdsToLoad.length === 0) {
        return;
      }

      // Load voucher details từ API cho từng product
      // Cần productId để gọi API, lấy từ items
      const productIds = Array.from(
        new Set(
          items
            .filter((item) => item.type === 'PRODUCT' && selectedProductVouchers.has(item.cartItemId))
            .map((item) => item.refId)
        )
      );

      if (productIds.length === 0) {
        return;
      }

      try {
        // Load vouchers cho từng product và extract details
        const voucherPromises = productIds.map(async (productId) => {
          try {
            const voucherRes = await ProductVoucherService.getProductVouchers(
              productId,
              'ALL',
              null
            );
            const productVouchersList =
              voucherRes.data?.vouchers?.shopVouchers?.filter(
                (v: any) => v.scopeType === 'PRODUCT_VOUCHER'
              ) || [];
            return productVouchersList;
          } catch (error) {
            console.error(`Failed to load vouchers for product ${productId}:`, error);
            return [];
          }
        });

        const voucherResults = await Promise.all(voucherPromises);
        const allVouchers = voucherResults.flat();

        // Cache voucher details
        const nextCache = new Map(productVoucherDetailsCache);
        allVouchers.forEach((voucher: any) => {
          if (voucherIdsToLoad.includes(voucher.shopVoucherId)) {
            nextCache.set(voucher.shopVoucherId, {
              shopVoucherId: voucher.shopVoucherId,
              code: voucher.code || '',
              discountValue: voucher.discountValue || null,
              discountPercent: voucher.discountPercent || null,
              maxDiscountValue: voucher.maxDiscountValue || null,
              minOrderValue: voucher.minOrderValue || null,
            });
          }
        });

        if (nextCache.size > productVoucherDetailsCache.size) {
          setProductVoucherDetailsCache(nextCache);
        }
      } catch (error) {
        console.error('Failed to load product voucher details:', error);
      }
    };

    if (items.length > 0 && selectedProductVouchers.size > 0) {
      void loadProductVoucherDetails();
    }
  }, [items, selectedProductVouchers, previewData, productVoucherDetailsCache]);

  // Tổng giá gốc (chưa giảm) = baseUnitPrice * quantity (fallback về unitPrice nếu không có baseUnitPrice)
  const baseSubtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const base = item.baseUnitPrice ?? item.unitPrice;
        return sum + base * item.quantity;
      }, 0),
    [items]
  );

  // Tổng giảm giá nền tảng: lấy từ preview (ưu tiên) hoặc tính từ items
  const platformDiscountTotal = useMemo(
    () => {
      // Ưu tiên lấy từ preview response (chính xác hơn)
      if (previewData?.stores) {
        return previewData.stores.reduce(
          (sum, store) => sum + (store.platformDiscount || 0),
          0
        );
      }
      // Fallback: tính từ items
      return items.reduce((sum, item) => {
        const base = item.baseUnitPrice;
        const current = item.unitPrice;
        if (base != null && current != null && base > current) {
          return sum + (base - current) * item.quantity;
        }
        return sum;
      }, 0);
    },
    [items, previewData]
  );

  // Tổng giảm giá voucher cửa hàng: lấy từ preview theo từng store
  const storeDiscountTotal = useMemo(
    () =>
      previewData?.stores?.reduce(
        (sum, store) => sum + (store.storeDiscount || 0),
        0
      ) ?? 0,
    [previewData]
  );

  // Tính giảm giá từ product vouchers đã chọn
  // Lưu ý: Product vouchers được backend tính trong preview response
  // Nếu preview không có, tính thủ công từ items và voucher info trong cache
  const productVoucherDiscount = useMemo(() => {
    // Nếu có preview data, backend đã tính discount (có thể trong storeDiscount hoặc overallDiscount)
    // Nhưng để đảm bảo UI hiển thị đúng khi không có preview data, tính thủ công từ cache
    if (selectedProductVouchers.size === 0) {
      return 0;
    }

    let total = 0;
    selectedProductVouchers.forEach((voucherInfo, cartItemId) => {
      // Lấy voucher details từ cache
      const voucher = productVoucherDetailsCache.get(voucherInfo.shopVoucherId);
      if (!voucher) {
        // Nếu chưa có trong cache, skip (sẽ được load bởi useEffect)
        return;
      }

      // Tìm item tương ứng
      const item = items.find((it) => it.cartItemId === cartItemId);
      if (!item) {
        return;
      }

      // Tính subtotal của item này (sử dụng baseUnitPrice nếu có, fallback về unitPrice)
      const itemSubtotal = (item.baseUnitPrice ?? item.unitPrice) * item.quantity;

      // Kiểm tra minOrderValue
      if (voucher.minOrderValue && itemSubtotal < voucher.minOrderValue) {
        return;
      }

      // Tính discount
      if (voucher.discountPercent) {
        const discount = (itemSubtotal * voucher.discountPercent) / 100;
        total += voucher.maxDiscountValue
          ? Math.min(discount, voucher.maxDiscountValue)
          : discount;
      } else if (voucher.discountValue) {
        total += voucher.discountValue;
      }
    });
    return total;
  }, [selectedProductVouchers, productVoucherDetailsCache, items]);


  // Lấy chi tiết discount theo từng store
  const storeDiscountDetails = useMemo(() => {
    if (!previewData?.stores) return [];
    return previewData.stores.map((store) => {
      // Lưu raw JSON strings thay vì parse
      return {
        storeId: store.storeId,
        storeName: store.storeName,
        platformDiscount: store.platformDiscount || 0,
        storeDiscount: store.storeDiscount || 0,
        storeVoucherDetailJson: store.storeVoucherDetailJson || null,
        platformVoucherDetailJson: store.platformVoucherDetailJson || null,
        items: store.items || [],
      };
    });
  }, [previewData]);

  // Build storeVouchers payload từ selectedShopVouchers
  // Format: Array<{ storeId: string; codes: string[] }>
  const buildStoreVouchersPayload = useCallback((): Array<{
    storeId: string;
    codes: string[];
  }> => {
    if (selectedShopVouchers.size === 0) {
      console.log('🎫 [PreCheckoutV2] No shop vouchers selected');
      return [];
    }

    const result: Array<{ storeId: string; codes: string[] }> = [];
    const storeVoucherMap = new Map<string, string[]>(); // storeId -> codes[]

    // Với mỗi store có selected voucher, lấy code
    selectedShopVouchers.forEach((voucherInfo, storeId) => {
      if (!storeVoucherMap.has(storeId)) {
        storeVoucherMap.set(storeId, []);
      }
      // Sử dụng code từ voucherInfo
      storeVoucherMap.get(storeId)!.push(voucherInfo.code);
      console.log(`🎫 [PreCheckoutV2] Added voucher for store ${storeId}:`, voucherInfo);
    });

    storeVoucherMap.forEach((codes, storeId) => {
      result.push({ storeId, codes });
    });

    console.log('🎫 [PreCheckoutV2] Built store vouchers payload:', result);
    return result;
  }, [selectedShopVouchers]);

  // Build product vouchers payload: convert product vouchers sang store vouchers format
  // Product vouchers được gửi trong storeVouchers array, map từ cartItemId sang storeId
  const buildProductVouchersAsStoreVouchers = useCallback((): Array<{
    storeId: string;
    codes: string[];
  }> => {
    if (selectedProductVouchers.size === 0) {
      console.log('🎟 [PreCheckoutV2] No product vouchers selected');
      return [];
    }

    const result: Array<{ storeId: string; codes: string[] }> = [];
    const storeVoucherMap = new Map<string, string[]>(); // storeId -> codes[]
    const unmappedVouchers: Array<{
      cartItemId: string;
      reason: string;
      voucher: { shopVoucherId: string; code: string };
    }> = [];

    // Map product vouchers từ cartItemId sang storeId
    selectedProductVouchers.forEach((voucherInfo, cartItemId) => {
      // Tìm item tương ứng để lấy storeId
      const item = items.find((it) => it.cartItemId === cartItemId);
      if (!item) {
        unmappedVouchers.push({
          cartItemId,
          reason: 'Cart item not found for this cartItemId (possibly removed/changed before checkout)',
          voucher: voucherInfo,
        });
        return;
      }

      if (item.type !== 'PRODUCT') {
        unmappedVouchers.push({
          cartItemId,
          reason: `Cart item type is ${item.type}, expected PRODUCT for product voucher`,
          voucher: voucherInfo,
        });
        return;
      }

      const product = productCache.get(item.refId);
      if (!product?.storeId) {
        unmappedVouchers.push({
          cartItemId,
          reason: 'Product or storeId not found in productCache for this cart item',
          voucher: voucherInfo,
        });
        return;
      }

      const storeId = product.storeId;
      if (!storeVoucherMap.has(storeId)) {
        storeVoucherMap.set(storeId, []);
      }
      // Thêm code của product voucher vào store vouchers
      storeVoucherMap.get(storeId)!.push(voucherInfo.code);
      console.log(
        `🎟 [PreCheckoutV2] Added product voucher for cartItemId ${cartItemId} (store ${storeId}):`,
        voucherInfo
      );
    });

    if (unmappedVouchers.length > 0) {
      console.warn(
        '⚠️ [PreCheckoutV2] Some selected product vouchers could not be mapped to store vouchers and will not be sent to backend:',
        {
          unmappedVouchers,
          itemsSnapshot: items,
          productCacheKeys: Array.from(productCache.keys()),
        }
      );
    }

    storeVoucherMap.forEach((codes, storeId) => {
      result.push({ storeId, codes });
    });

    console.log('🎟 [PreCheckoutV2] Built product vouchers as store vouchers payload:', result);
    return result;
  }, [selectedProductVouchers, items, productCache]);

  // Merge store vouchers và product vouchers thành một payload
  const buildMergedStoreVouchersPayload = useCallback((): Array<{
    storeId: string;
    codes: string[];
  }> => {
    const storeVouchers = buildStoreVouchersPayload();
    const productVouchers = buildProductVouchersAsStoreVouchers();

    // Merge: nếu cùng storeId, gộp codes lại
    const mergedMap = new Map<string, string[]>();

    // Thêm store vouchers
    storeVouchers.forEach(({ storeId, codes }) => {
      mergedMap.set(storeId, [...(mergedMap.get(storeId) || []), ...codes]);
    });

    // Thêm product vouchers
    productVouchers.forEach(({ storeId, codes }) => {
      mergedMap.set(storeId, [...(mergedMap.get(storeId) || []), ...codes]);
    });

    const result = Array.from(mergedMap.entries()).map(([storeId, codes]) => ({
      storeId,
      codes,
    }));

    console.log('🎫 [PreCheckoutV2] Built merged store vouchers payload (shop + product):', result);
    return result;
  }, [buildStoreVouchersPayload, buildProductVouchersAsStoreVouchers]);

  const shippingTotal =
    shippingFee || previewData?.overallShipping || 0;

  // Tổng giảm giá chung từ BE (nếu có), fallback = platform + store + product
  // Lưu ý: Product vouchers có thể được tính trong storeDiscount hoặc overallDiscount
  // Nếu có overallDiscount, backend đã tính tổng tất cả discounts (bao gồm product voucher)
  // Nếu có previewData?.stores với storeDiscount, backend có thể đã tính product voucher trong storeDiscount
  // Chỉ tính thủ công productVoucherDiscount khi không có preview data từ backend
  const discountTotal = useMemo(() => {
    if (previewData?.overallDiscount !== undefined) {
      // Có overallDiscount từ backend, sử dụng trực tiếp (đã bao gồm tất cả discounts)
      return previewData.overallDiscount;
    }
    
    // Không có overallDiscount, tính fallback
    // Nếu có previewData?.stores, backend có thể đã tính product voucher trong storeDiscount
    // Trong trường hợp này, không cộng thêm productVoucherDiscount để tránh double-counting
    // Chỉ cộng productVoucherDiscount khi không có preview data (tính thủ công hoàn toàn)
    const hasPreviewData = previewData?.stores && previewData.stores.length > 0;
    if (hasPreviewData) {
      // Có preview data từ backend, không cộng thêm productVoucherDiscount
      // vì backend có thể đã tính trong storeDiscount
      return platformDiscountTotal + storeDiscountTotal;
    }
    
    // Không có preview data, tính thủ công tất cả
    return platformDiscountTotal + storeDiscountTotal + productVoucherDiscount;
  }, [previewData, platformDiscountTotal, storeDiscountTotal, productVoucherDiscount]);

  // Tổng thanh toán: ưu tiên giá trị từ BE, nếu không có thì tự tính
  const grandTotal =
    previewData?.overallGrandTotal ??
    Math.max(0, baseSubtotal - discountTotal + shippingTotal);

  // Giá gốc hiển thị trong tóm tắt
  const subtotal = baseSubtotal;

  const formatCurrency = (value: number | null | undefined) =>
    `${(value ?? 0).toLocaleString('vi-VN')} ₫`;

  // Helper function để parse error message từ API response và dịch sang tiếng Việt
  const parseErrorMessage = (err: any): string => {
    let apiMessage = '';
    
    // Lấy message từ API response
    if (err?.response?.data?.message) {
      apiMessage = err.response.data.message;
    } else if (err?.message) {
      apiMessage = err.message;
    }
    
    // Nếu không có message, trả về thông báo mặc định
    if (!apiMessage) {
      return 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.';
    }
    
    // Dịch các thông báo lỗi phổ biến sang tiếng Việt
    const lowerMessage = apiMessage.toLowerCase();
    
    // Lỗi hết hàng
    if (lowerMessage.includes('out of stock') || lowerMessage.includes('hết hàng') || lowerMessage.includes('product out of stock')) {
      // Tìm tên sản phẩm trong message nếu có
      const productMatch = apiMessage.match(/when preview checkout:\s*(.+)/i);
      if (productMatch && productMatch[1]) {
        const productName = productMatch[1].trim();
        return `Sản phẩm "${productName}" đã hết hàng. Vui lòng quay lại giỏ hàng và cập nhật số lượng hoặc xóa sản phẩm đã hết hàng.`;
      }
      return 'Một số sản phẩm trong giỏ hàng đã hết hàng. Vui lòng quay lại giỏ hàng và cập nhật số lượng hoặc xóa sản phẩm đã hết hàng.';
    }
    
    // Lỗi không đủ số lượng
    if (lowerMessage.includes('insufficient') || lowerMessage.includes('không đủ')) {
      return 'Số lượng sản phẩm trong giỏ hàng vượt quá số lượng tồn kho. Vui lòng giảm số lượng hoặc xóa sản phẩm.';
    }
    
    // Lỗi sản phẩm không tồn tại
    if (lowerMessage.includes('not found') || lowerMessage.includes('không tìm thấy')) {
      return 'Một số sản phẩm không còn tồn tại. Vui lòng quay lại giỏ hàng và kiểm tra lại.';
    }
    
    // Lỗi customer bị cấm mua hàng
    if (lowerMessage.includes('not allowed to buy') || lowerMessage.includes('buyable=false') || lowerMessage.includes('buyable is false')) {
      return 'Tài khoản của bạn đang bị hạn chế mua hàng. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm thông tin chi tiết.';
    }
    
    // Lỗi voucher không hợp lệ
    if (lowerMessage.includes('voucher') && (lowerMessage.includes('invalid') || lowerMessage.includes('không hợp lệ'))) {
      return 'Voucher không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại voucher.';
    }
    
    // Lỗi địa chỉ
    if (lowerMessage.includes('address') && (lowerMessage.includes('invalid') || lowerMessage.includes('không hợp lệ'))) {
      return 'Địa chỉ nhận hàng không hợp lệ. Vui lòng chọn lại địa chỉ.';
    }
    
    // Lỗi thanh toán
    if (lowerMessage.includes('payment') || lowerMessage.includes('thanh toán')) {
      return 'Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.';
    }
    
    // Lỗi server
    if (lowerMessage.includes('internal server error') || lowerMessage.includes('server error')) {
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    }
    
    // Nếu message đã là tiếng Việt hoặc không match với các pattern trên, trả về nguyên bản
    // Nhưng nếu là tiếng Anh, cố gắng dịch một số từ khóa phổ biến
    if (apiMessage.includes('when preview checkout')) {
      return 'Không thể xem trước đơn hàng. Vui lòng kiểm tra lại thông tin sản phẩm và thử lại.';
    }
    
    // Trả về message gốc nếu không match với bất kỳ pattern nào
    return apiMessage;
  };

  // Xử lý nút "Tiếp tục đến thanh toán"
  const handleProceed = async () => {
    if (!items.length) {
      console.warn('[PreCheckoutV2] No items to checkout.');
      showCenterError('Không có sản phẩm nào để thanh toán.', 'Lỗi');
      return;
    }
    if (!selectedAddressId) {
      console.warn('[PreCheckoutV2] No address selected.');
      showCenterError('Vui lòng chọn địa chỉ nhận hàng.', 'Thiếu thông tin');
      return;
    }

    setIsProcessingCheckout(true);

    // Nếu chọn COD: gọi luôn API checkout-cod tại bước pre-checkout
    if (paymentMethod === 'cod') {
      try {
        // Build items payload giống logic CheckoutOrderContainer
        const checkoutItemsPayload: CheckoutCodRequest['items'] = items.map(
          (item) => {
            const base: any = {
              type: item.type,
              quantity: item.quantity,
            };
            if (item.type === 'COMBO') {
              base.comboId = item.refId;
            } else if (item.variantId) {
              base.variantId = item.variantId;
            } else {
              base.productId = item.refId;
            }
            return base;
          }
        );

        const serviceTypeIds = buildServiceTypeIds(
          items as ApiCartItem[],
          productCache
        );
        const platformVouchers = await buildPlatformVouchers(
          items as ApiCartItem[]
        );
        // Merge store vouchers và product vouchers
        const storeVouchers = buildMergedStoreVouchersPayload();

        const addressForMessage = addresses.find(
          (a) => a.id === selectedAddressId
        );
        const message = addressForMessage?.note || '';

        const codRequest: CheckoutCodRequest = {
          items: checkoutItemsPayload,
          addressId: selectedAddressId,
          message,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers,
          serviceTypeIds,
        };

        console.groupCollapsed(
          '🧾 [PreCheckoutV2] POST /api/v1/customers/{customerId}/cart/checkout-cod'
        );
        console.log('Request Body:', codRequest);
        console.log('Request Body JSON:', JSON.stringify(codRequest, null, 2));

        const resp = await CustomerCartService.checkoutCod(codRequest);
        console.log('Response Body:', resp);
        console.log('Response Body JSON:', JSON.stringify(resp, null, 2));
        console.groupEnd();

        // Sau khi đặt hàng COD thành công: chuyển sang lịch sử đơn hàng
        navigate('/orders');
      } catch (err: any) {
        console.error('❌ [PreCheckoutV2] COD checkout failed:', err);
        const errorMessage = parseErrorMessage(err);
        showCenterError(errorMessage, 'Lỗi đặt hàng', 5000);
      } finally {
        setIsProcessingCheckout(false);
      }
      return;
    }

    // Thanh toán online qua PayOS
    if (paymentMethod === 'payos') {
      try {
        // Build items payload giống COD (chuẩn CheckoutPayOSRequest['items'])
        const checkoutItemsPayload: CheckoutPayOSRequest['items'] = items.map(
          (item) => {
            const base: any = {
              type: item.type,
              quantity: item.quantity,
            };
            if (item.type === 'COMBO') {
              base.comboId = item.refId;
            } else if (item.variantId) {
              base.variantId = item.variantId;
            } else {
              base.productId = item.refId;
            }
            return base;
          }
        );

        const serviceTypeIds = buildServiceTypeIds(
          items as ApiCartItem[],
          productCache
        );
        const platformVouchers = await buildPlatformVouchers(
          items as ApiCartItem[]
        );
        // Merge store vouchers và product vouchers
        const storeVouchers = buildMergedStoreVouchersPayload();

        const addressForMessage = addresses.find(
          (a) => a.id === selectedAddressId
        );
        const message = addressForMessage?.note || '';

        const returnUrl = `${window.location.origin}/payment/success`;
        const cancelUrl = `${window.location.origin}/payment/fail`;

        const payosRequest: CheckoutPayOSRequest = {
          addressId: selectedAddressId,
          message: message || undefined,
          description: `Thanh toán đơn hàng (${items.length} sản phẩm)`,
          items: checkoutItemsPayload,
          storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
          platformVouchers:
            platformVouchers.length > 0 ? platformVouchers : null,
          serviceTypeIds:
            Object.keys(serviceTypeIds).length > 0
              ? serviceTypeIds
              : undefined,
          returnUrl,
          cancelUrl,
        };

        console.groupCollapsed(
          '🧾 [PreCheckoutV2] POST /api/v1/payos/checkout'
        );
        console.log('Request Body:', payosRequest);
        console.log('Request Body JSON:', JSON.stringify(payosRequest, null, 2));

        const resp = await CustomerCartService.checkoutPayOS(payosRequest);
        console.log('Response Body:', resp);
        console.log('Response Body JSON:', JSON.stringify(resp, null, 2));
        console.groupEnd();

        if (resp.status === 200 && resp.data?.checkoutUrl) {
          // Xóa session tạm và chuyển hướng sang trang thanh toán PayOS
          sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
          window.location.href = resp.data.checkoutUrl;
          return;
        }

        console.error(
          '❌ [PreCheckoutV2] PayOS checkout failed:',
          resp.message
        );
        const errorMessage = parseErrorMessage({ message: resp.message });
        showCenterError(errorMessage, 'Lỗi thanh toán', 5000);
      } catch (err: any) {
        console.error('❌ [PreCheckoutV2] PayOS checkout error:', err);
        const errorMessage = parseErrorMessage(err);
        showCenterError(errorMessage, 'Lỗi thanh toán', 5000);
      } finally {
        setIsProcessingCheckout(false);
      }
      return;
    }

    // Fallback (không nên xảy ra) – điều hướng về trang checkout cũ
    navigate('/checkout');
  };

  // Gọi API preview checkout khi đã có địa chỉ + items + thông tin cửa hàng
  useEffect(() => {
    // Guard: Không chạy nếu đang loading hoặc cart rỗng
    if (isLoading || !cart || !cart.items || cart.items.length === 0) {
      return;
    }

    if (!selectedAddressId) return;
    if (!items.length) return;

    // Đảm bảo đã có đầy đủ thông tin product để tính serviceTypeIds
    const missing = items.some(
      (it) => it.type === 'PRODUCT' && !productCache.has(it.refId)
    );
    if (missing) {
      console.log(
        '[PreCheckoutV2] Waiting for product details before building serviceTypeIds...'
      );
      return;
    }

    // Prevent infinite loop: cleanup flag
    let isCancelled = false;

    const run = async () => {
      if (isCancelled) return;
      const previewItems = items.map((item) => {
        const base: any = {
          type: item.type,
          quantity: item.quantity,
        };
        if (item.type === 'COMBO') {
          base.comboId = item.refId;
        } else if (item.variantId) {
          base.variantId = item.variantId;
        } else {
          base.productId = item.refId;
        }
        return base;
      });

      const serviceTypeIds = buildServiceTypeIds(items as ApiCartItem[], productCache);
      const platformVouchers = await buildPlatformVouchers(items as ApiCartItem[]);
      // Merge store vouchers và product vouchers
      const storeVouchers = buildMergedStoreVouchersPayload();

      if (isCancelled) return;

      const requestPayload: CheckoutPreviewRequest = {
        items: previewItems,
        addressId: selectedAddressId,
        message: '',
        storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
        platformVouchers,
        serviceTypeIds,
      };

      console.groupCollapsed(
        '🧾 [PreCheckoutV2] POST /api/v1/customers/{customerId}/cart/checkout/preview'
      );
      console.log('Request Body:', requestPayload);
      console.log('Request Body JSON:', JSON.stringify(requestPayload, null, 2));

      try {
        const resp = await CustomerCartService.previewCheckout(requestPayload);
        if (isCancelled) return;
        
        console.log('Response Body:', resp);
        console.log('Response Body JSON:', JSON.stringify(resp, null, 2));
        setPreviewData(resp.data);
      } catch (err: any) {
        if (isCancelled) return;
        
        console.error('❌ [PreCheckoutV2] Failed to preview checkout:', err);
        
        // Parse error message sang tiếng Việt
        const errorMessage = parseErrorMessage(err);
        
        showCenterError(errorMessage, 'Lỗi xem trước đơn hàng', 5000);
      } finally {
        console.groupEnd();
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
    // Use serialized keys instead of Map objects to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedAddressId, productCache, selectedShopVouchersKey, selectedProductVouchersKey, isLoading, cart]);

  // Trạng thái loading
  if (isLoading && !cart) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-orange-500" />
          <span>Đang tải giỏ hàng...</span>
        </div>
      </div>
    );
  }

  // Lỗi khi gọi API
  if (error && !cart) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  // Không có sản phẩm để pre-checkout
  if (!items.length) {
    // Nếu đang loading, hiển thị loading state
    if (isLoading) {
      return (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-orange-500" />
            <span>Đang tải giỏ hàng...</span>
          </div>
        </div>
      );
    }

    // Nếu cart rỗng sau khi checkout, hiển thị thông báo và nút quay lại
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Giỏ hàng của bạn đang trống. Vui lòng quay lại giỏ hàng và chọn sản phẩm.
        </p>
        <button
          type="button"
          onClick={() => navigate('/cartv2')}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Quay lại giỏ hàng
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2.2fr_1fr]">
      {/* LEFT - Địa chỉ + sản phẩm theo cửa hàng */}
      <div className="space-y-4">
        {/* Địa chỉ nhận hàng */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <div className="mb-3 border-b border-gray-200 pb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Địa chỉ nhận hàng
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Chọn hoặc thêm mới địa chỉ giao hàng trước khi tiếp tục.
            </p>
          </div>
          {addressesLoading ? (
            <div className="flex min-h-[80px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-orange-500" />
                <span>Đang tải địa chỉ...</span>
              </div>
            </div>
          ) : (
            <AddressForm
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onAddressesChange={loadAddresses}
            />
          )}
        </section>

        {/* Sản phẩm sẽ thanh toán */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Sản phẩm bạn sẽ thanh toán
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Vui lòng kiểm tra lại số lượng và thông tin sản phẩm trước khi
                tiếp tục.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {storeGroups.map((group) => (
              <div
                key={group.storeId}
                className="rounded-xl border border-gray-200 p-3 md:p-4"
              >
                <div className="mb-3 border-b border-gray-200 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Logo cửa hàng */}
                      {group.storeLogoUrl && !storeLogoErrors.has(group.storeId) ? (
                        <img
                          src={group.storeLogoUrl}
                          alt={group.storeName}
                          className="h-10 w-10 rounded-full border-2 border-orange-200 object-cover"
                          onError={() => {
                            // Đánh dấu logo này bị lỗi để hiển thị fallback
                            setStoreLogoErrors((prev) => new Set(prev).add(group.storeId));
                          }}
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600"
                        >
                          <span className="text-sm font-semibold">
                            {group.storeName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {group.storeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {group.items.length} sản phẩm
                        </div>
                        {/* Thời gian giao hàng dự kiến */}
                        {storeLeadtimesLoading.has(group.storeId) ? (
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
                            <span>Đang tính thời gian giao hàng...</span>
                          </div>
                        ) : storeLeadtimes[group.storeId] ? (
                          <div className="mt-1 text-xs text-orange-600">
                            ⏱️ Giao hàng dự kiến: {(() => {
                              const baseDate = new Date(storeLeadtimes[group.storeId].leadtime_order.to_estimate_date);
                              // Cộng thêm 48 giờ (2 ngày)
                              const estimatedDate = new Date(baseDate.getTime() + 48 * 60 * 60 * 1000);
                              return estimatedDate.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });
                            })()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {group.items.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="grid grid-cols-[80px,1fr,110px,90px] items-center gap-3 py-3 md:grid-cols-[80px,1.5fr,1fr,90px]"
                    >
                      <img
                        src={item.variantUrl || item.image}
                        alt={item.name}
                        className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                      />
                      <div className="space-y-1">
                        <div className="line-clamp-2 font-medium text-gray-900">
                          {item.name}
                        </div>
                        {item.variantOptionName && item.variantOptionValue && (
                          <div className="text-xs text-gray-500">
                            {item.variantOptionName}: {item.variantOptionValue}
                          </div>
                        )}
                        {/* Hiển thị product voucher đã chọn */}
                        {selectedProductVouchers.has(item.cartItemId) && (
                          <div className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            🎟 Voucher: {selectedProductVouchers.get(item.cartItemId)?.code}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {item.baseUnitPrice != null &&
                        item.platformCampaignPrice != null &&
                        item.platformCampaignPrice !== item.baseUnitPrice &&
                        item.inPlatformCampaign &&
                        !item.campaignUsageExceeded ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-orange-600">
                              {formatCurrency(item.platformCampaignPrice)}
                            </div>
                            <div className="text-xs font-medium text-gray-400 line-through decoration-2">
                              {formatCurrency(item.baseUnitPrice)}
                            </div>
                          </div>
                        ) : (
                          <div className="font-semibold text-orange-600">
                            {formatCurrency(item.unitPrice)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-center gap-1 text-right text-xs text-gray-600">
                        <span>Số lượng: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RIGHT - Payment method + Summary */}
      <div className="space-y-4">
        {/* Chọn hình thức thanh toán */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <h3 className="mb-3 text-base font-semibold text-gray-900">
            Chọn hình thức thanh toán
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                paymentMethod === 'cod'
                  ? 'border-orange-500 bg-orange-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
              {paymentMethod === 'cod' && (
                <span className="text-xs font-semibold text-orange-600">
                  Đã chọn
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('payos')}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                paymentMethod === 'payos'
                  ? 'border-orange-500 bg-orange-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">Thanh toán online qua PayOS</span>
              {paymentMethod === 'payos' && (
                <span className="text-xs font-semibold text-orange-600">
                  Đã chọn
                </span>
              )}
            </button>
          </div>
        </section>

        {/* Tóm tắt đơn hàng */}
        <section className="h-fit rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Tóm tắt đơn hàng
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Giá gốc</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Breakdown giảm giá theo từng loại */}
            {platformDiscountTotal > 0 && (
              <div className="space-y-1 border-l-2 border-orange-200 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">🎁 Giảm giá nền tảng</span>
                  <span className="font-medium text-red-500">
                    -{formatCurrency(platformDiscountTotal)}
                  </span>
                </div>
                {storeDiscountDetails.length > 0 && (
                  <div className="ml-2 space-y-0.5 text-xs text-gray-500 hidden">
                    {storeDiscountDetails
                      .filter((detail) => detail.platformDiscount > 0)
                      .map((detail) => (
                        <div key={detail.storeId} className="flex justify-between">
                          <span>-</span>
                          <span>-{formatCurrency(detail.platformDiscount)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {storeDiscountTotal > 0 && (
              <div className="space-y-1 border-l-2 border-blue-200 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">🏪 Giảm giá voucher cửa hàng</span>
                  <span className="font-medium text-red-500">
                    -{formatCurrency(storeDiscountTotal)}
                  </span>
                </div>
                {storeDiscountDetails.length > 0 && (
                  <div className="ml-2 space-y-0.5 text-xs text-gray-500 hidden">
                    {storeDiscountDetails
                      .filter((detail) => detail.storeDiscount > 0)
                      .map((detail) => (
                        <div key={detail.storeId} className="flex justify-between">
                          <span>-</span>
                          <span>-{formatCurrency(detail.storeDiscount)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Product voucher discount - KHÔNG hiển thị riêng vì đã được bao gồm trong discountTotal */}
            {/* Hiển thị breakdown chỉ khi có overallDiscount từ backend để user thấy chi tiết */}
            {/* Khi không có overallDiscount, discountTotal đã bao gồm productVoucherDiscount,
                nên không cần hiển thị riêng để tránh confusion */}

            {discountTotal > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 font-medium">
                <span className="text-gray-700">Tổng giảm giá</span>
                <span className="text-red-500">
                  -{formatCurrency(discountTotal)}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(shippingTotal)}
                </span>
              </div>
              
              {/* Breakdown phí vận chuyển theo từng cửa hàng */}
              {Object.keys(storeShippingFees).length > 0 && (
                <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                  {Object.values(storeShippingFees).map((storeFee) => (
                    <div
                      key={storeFee.storeId}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-500">
                        {storeFee.storeName}
                        {storeFee.error && (
                          <span className="ml-1 text-red-500">({storeFee.error})</span>
                        )}
                      </span>
                      <span className="font-medium text-gray-700">
                        {storeFee.error ? '—' : formatCurrency(storeFee.fee)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-3 space-y-1">
            <div className="flex items-center justify-between text-sm font-semibold text-orange-600">
              <span>Tổng thanh toán</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Các ưu đãi và phí vận chuyển đã được áp dụng từ bản xem trước.
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={handleProceed}
              disabled={isProcessingCheckout}
              className={`w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-all ${
                isProcessingCheckout
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {isProcessingCheckout ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xử lý...
                </span>
              ) : (
                'Đặt hàng'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/cartv2')}
              disabled={isProcessingCheckout}
              className={`w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all ${
                isProcessingCheckout
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Quay lại giỏ hàng
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PreCheckoutV2;


