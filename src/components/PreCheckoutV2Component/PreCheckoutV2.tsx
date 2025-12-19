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
import { useAutoShippingFee } from '../../hooks/useAutoShippingFee';
import { CustomerCartService } from '../../services/customer/CartService';
import ProductVoucherService from '../../services/customer/ProductVoucherService';

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
      console.groupEnd();
    } catch (error) {
      console.error(
        `❌ [PreCheckoutV2] Failed to build platform vouchers for product ${productId}:`,
        error
      );
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
      if (payload.storeVouchers) {
        const vouchersMap = new Map<
          string,
          { shopVoucherId: string; code: string }
        >();
        Object.entries(payload.storeVouchers).forEach(([storeId, voucherInfo]) => {
          // Support both old format (string) and new format (object)
          if (typeof voucherInfo === 'string') {
            // Old format: chỉ có shopVoucherId, cần load code từ API sau
            vouchersMap.set(storeId, { shopVoucherId: voucherInfo, code: voucherInfo });
          } else {
            // New format: có cả shopVoucherId và code
            vouchersMap.set(storeId, voucherInfo);
          }
        });
        setSelectedShopVouchers(vouchersMap);
        console.log('🎫 [PreCheckoutV2] Loaded shop vouchers:', Array.from(vouchersMap.entries()));
      }

      // Load selected product vouchers
      if (payload.productVouchers) {
        const productVouchersMap = new Map<
          string,
          { shopVoucherId: string; code: string }
        >();
        Object.entries(payload.productVouchers).forEach(([cartItemId, voucherInfo]) => {
          productVouchersMap.set(cartItemId, voucherInfo);
        });
        setSelectedProductVouchers(productVouchersMap);
        console.log('🎟 [PreCheckoutV2] Loaded product vouchers:', Array.from(productVouchersMap.entries()));
      }
      
      console.groupCollapsed('🧾 [PreCheckoutV2] Loaded checkout session payload');
      console.log('Payload:', payload);
      console.log('Selected Cart Item IDs:', payload.selectedCartItemIds);
      console.log('Shop Vouchers:', Array.from(selectedShopVouchers.entries()));
      console.log('Product Vouchers:', Array.from(selectedProductVouchers.entries()));
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

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
      { storeId: string; storeName: string; items: typeof items }
    >();

    items.forEach((item) => {
      let storeId = `unknown-${item.refId}`;
      let storeName = 'Cửa hàng';

      if (item.type === 'PRODUCT') {
        const product = productCache.get(item.refId);
        if (product?.storeId) {
          storeId = product.storeId;
        }
        if (product?.store?.name || product?.storeName) {
          storeName = product.store?.name || product.storeName || storeName;
        }
      }

      if (!groups.has(storeId)) {
        groups.set(storeId, { storeId, storeName, items: [] });
      }
      groups.get(storeId)!.items.push(item);
    });

    return Array.from(groups.values());
  }, [items, productCache]);

  const [previewData, setPreviewData] = useState<CheckoutPreviewData | null>(null);

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
  // Nếu preview không có, có thể tính thủ công từ items và voucher info
  const productVoucherDiscount = useMemo(() => {
    // Ưu tiên lấy từ preview data (backend đã tính chính xác)
    // Product vouchers có thể được tính trong storeDiscount hoặc riêng
    // Tạm thời return 0 vì backend sẽ tính trong preview/checkout
    // Nếu cần tính thủ công, có thể load voucher details và tính từ items
    return 0;
  }, [selectedProductVouchers, previewData, items]);

  // Parse voucher details từ JSON strings
  const parseVoucherDetails = useCallback((jsonString: string | null | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse voucher details:', e);
      return null;
    }
  }, []);

  // Lấy chi tiết discount theo từng store
  const storeDiscountDetails = useMemo(() => {
    if (!previewData?.stores) return [];
    return previewData.stores.map((store) => {
      const storeVoucherDetails = parseVoucherDetails(store.storeVoucherDetailJson);
      const platformVoucherDetails = parseVoucherDetails(store.platformVoucherDetailJson);
      return {
        storeId: store.storeId,
        storeName: store.storeName,
        platformDiscount: store.platformDiscount || 0,
        storeDiscount: store.storeDiscount || 0,
        storeVoucherDetails,
        platformVoucherDetails,
        items: store.items || [],
      };
    });
  }, [previewData, parseVoucherDetails]);

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

    // Map product vouchers từ cartItemId sang storeId
    selectedProductVouchers.forEach((voucherInfo, cartItemId) => {
      // Tìm item tương ứng để lấy storeId
      const item = items.find((it) => it.cartItemId === cartItemId);
      if (!item || item.type !== 'PRODUCT') return;

      const product = productCache.get(item.refId);
      if (!product?.storeId) return;

      const storeId = product.storeId;
      if (!storeVoucherMap.has(storeId)) {
        storeVoucherMap.set(storeId, []);
      }
      // Thêm code của product voucher vào store vouchers
      storeVoucherMap.get(storeId)!.push(voucherInfo.code);
      console.log(`🎟 [PreCheckoutV2] Added product voucher for cartItemId ${cartItemId} (store ${storeId}):`, voucherInfo);
    });

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
  const discountTotal =
    previewData?.overallDiscount ?? platformDiscountTotal + storeDiscountTotal + productVoucherDiscount;

  // Tổng thanh toán: ưu tiên giá trị từ BE, nếu không có thì tự tính
  const grandTotal =
    previewData?.overallGrandTotal ??
    Math.max(0, baseSubtotal - discountTotal + shippingTotal);

  // Giá gốc hiển thị trong tóm tắt
  const subtotal = baseSubtotal;

  const formatCurrency = (value: number | null | undefined) =>
    `${(value ?? 0).toLocaleString('vi-VN')} ₫`;

  // Xử lý nút "Tiếp tục đến thanh toán"
  const handleProceed = async () => {
    if (!items.length) {
      console.warn('[PreCheckoutV2] No items to checkout.');
      return;
    }
    if (!selectedAddressId) {
      console.warn('[PreCheckoutV2] No address selected.');
      return;
    }

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
      } catch (err) {
        console.error('❌ [PreCheckoutV2] COD checkout failed:', err);
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
      } catch (err) {
        console.error('❌ [PreCheckoutV2] PayOS checkout error:', err);
      }
      return;
    }

    // Fallback (không nên xảy ra) – điều hướng về trang checkout cũ
    navigate('/checkout');
  };

  // Gọi API preview checkout khi đã có địa chỉ + items + thông tin cửa hàng
  useEffect(() => {
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

    const run = async () => {
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
        console.log('Response Body:', resp);
        console.log('Response Body JSON:', JSON.stringify(resp, null, 2));
        setPreviewData(resp.data);
      } catch (err) {
        console.error('❌ [PreCheckoutV2] Failed to preview checkout:', err);
      } finally {
        console.groupEnd();
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedAddressId, productCache, selectedShopVouchers, selectedProductVouchers]);

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
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
        Không có sản phẩm nào để thanh toán. Vui lòng quay lại giỏ hàng và chọn sản phẩm.
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
                <div className="mb-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                        <span className="text-sm font-semibold">
                          {group.storeName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {group.storeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {group.items.length} sản phẩm
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      Tổng tạm tính:{' '}
                      <span className="ml-1">
                        {formatCurrency(
                          group.items.reduce(
                            (sum, i) => sum + i.unitPrice * i.quantity,
                            0
                          )
                        )}
                      </span>
                    </span>
                  </div>
                  
                  {/* Hiển thị breakdown discount cho từng store */}
                  {(() => {
                    const storeDetail = storeDiscountDetails.find(
                      (d) => d.storeId === group.storeId
                    );
                    if (!storeDetail) return null;
                    
                    const hasDiscounts =
                      storeDetail.platformDiscount > 0 ||
                      storeDetail.storeDiscount > 0;
                    
                    if (!hasDiscounts) return null;
                    
                    return (
                      <div className="ml-10 space-y-1 rounded-lg bg-gray-50 p-2 text-xs">
                        {storeDetail.platformDiscount > 0 && (
                          <div className="flex items-center justify-between text-gray-600">
                            <span>🎁 Giảm giá nền tảng:</span>
                            <span className="font-medium text-red-500">
                              -{formatCurrency(storeDetail.platformDiscount)}
                            </span>
                          </div>
                        )}
                        {storeDetail.storeDiscount > 0 && (
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between text-gray-600">
                              <span>🏪 Giảm giá voucher cửa hàng:</span>
                              <span className="font-medium text-red-500">
                                -{formatCurrency(storeDetail.storeDiscount)}
                              </span>
                            </div>
                            {storeDetail.storeVoucherDetails && (
                              <div className="ml-2 text-gray-500">
                                {Array.isArray(storeDetail.storeVoucherDetails) ? (
                                  storeDetail.storeVoucherDetails.map((v: any, idx: number) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>• {v.title || v.code || 'Voucher'}:</span>
                                      <span>
                                        -{formatCurrency(v.discountAmount || v.discountValue || 0)}
                                      </span>
                                    </div>
                                  ))
                                ) : typeof storeDetail.storeVoucherDetails === 'object' ? (
                                  <div className="flex justify-between">
                                    <span>
                                      • {storeDetail.storeVoucherDetails.title || storeDetail.storeVoucherDetails.code || 'Voucher'}:
                                    </span>
                                    <span>
                                      -{formatCurrency(storeDetail.storeVoucherDetails.discountAmount || storeDetail.storeVoucherDetails.discountValue || 0)}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                  <div className="ml-2 space-y-0.5 text-xs text-gray-500">
                    {storeDiscountDetails
                      .filter((detail) => detail.platformDiscount > 0)
                      .map((detail) => (
                        <div key={detail.storeId} className="flex justify-between">
                          <span>{detail.storeName}:</span>
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
                  <div className="ml-2 space-y-0.5 text-xs text-gray-500">
                    {storeDiscountDetails
                      .filter((detail) => detail.storeDiscount > 0)
                      .map((detail) => (
                        <div key={detail.storeId} className="space-y-0.5">
                          <div className="flex justify-between">
                            <span>{detail.storeName}:</span>
                            <span>-{formatCurrency(detail.storeDiscount)}</span>
                          </div>
                          {detail.storeVoucherDetails && (
                            <div className="ml-2 text-xs text-gray-400">
                              {Array.isArray(detail.storeVoucherDetails) ? (
                                detail.storeVoucherDetails.map((v: any, idx: number) => (
                                  <div key={idx}>
                                    • {v.title || v.code || 'Voucher cửa hàng'}: -{formatCurrency(v.discountAmount || v.discountValue || 0)}
                                  </div>
                                ))
                              ) : typeof detail.storeVoucherDetails === 'object' ? (
                                <div>
                                  • {detail.storeVoucherDetails.title || detail.storeVoucherDetails.code || 'Voucher cửa hàng'}: -{formatCurrency(detail.storeVoucherDetails.discountAmount || detail.storeVoucherDetails.discountValue || 0)}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Product voucher discount (nếu có trong tương lai) */}
            {discountTotal > platformDiscountTotal + storeDiscountTotal && (
              <div className="space-y-1 border-l-2 border-green-200 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">🎟 Giảm giá voucher sản phẩm</span>
                  <span className="font-medium text-red-500">
                    -{formatCurrency(discountTotal - platformDiscountTotal - storeDiscountTotal)}
                  </span>
                </div>
              </div>
            )}

            {discountTotal > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 font-medium">
                <span className="text-gray-700">Tổng giảm giá</span>
                <span className="text-red-500">
                  -{formatCurrency(discountTotal)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Phí vận chuyển</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(shippingTotal)}
              </span>
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
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              Tiếp tục đến thanh toán
            </button>
            <button
              type="button"
              onClick={() => navigate('/cartv2')}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
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


