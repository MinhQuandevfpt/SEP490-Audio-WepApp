import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import useCart from '../../hooks/useCart';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
import ProductVoucherService from '../../services/customer/ProductVoucherService';

/**
 * ShopCartV2
 * Cart UI that reads real data from Customer cart API (via useCart/CustomerCartService).
 * Sử dụng API /api/v1/customers/{customerId}/cart/items/quantity-with-vouchers
 * (qua CustomerCartService.updateQuantityWithVouchers) cho nút tăng/giảm số lượng.
 */
const CHECKOUT_SESSION_KEY = 'checkout:payload:v1';

const ShopCartV2: React.FC = () => {
  const { cart, isLoading, error, loadCart, updateQuantity, removeItems } =
    useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Tự động load giỏ hàng cho CUSTOMER (CustomerCartService sẽ tự kiểm tra token/role)
    loadCart();
  }, [loadCart]);

  const items = cart?.items ?? [];

  // Cache thông tin sản phẩm để lấy storeId / storeName
  const [productCache, setProductCache] = useState<Map<string, Product>>(
    () => new Map()
  );

  // Store vouchers theo storeId: Map<storeId, Array<shopVoucher>>
  type ShopVoucher = {
    shopVoucherId: string;
    code: string;
    title: string;
    discountValue: number | null;
    discountPercent: number | null;
    maxDiscountValue: number | null;
    minOrderValue: number | null;
    startTime: string;
    endTime: string;
    scopeType?: string; // 'ALL_SHOP_VOUCHER' | 'PRODUCT_VOUCHER'
  };
  const [storeVouchers, setStoreVouchers] = useState<Map<string, ShopVoucher[]>>(
    () => new Map()
  );
  
  // Selected shop vouchers: Map<storeId, { shopVoucherId, code }>
  const [selectedShopVouchers, setSelectedShopVouchers] = useState<
    Map<string, { shopVoucherId: string; code: string }>
  >(() => new Map());

  // Product vouchers theo cartItemId: Map<cartItemId, Array<productVoucher>>
  const [productVouchers, setProductVouchers] = useState<Map<string, ShopVoucher[]>>(
    () => new Map()
  );

  // Selected product vouchers: Map<cartItemId, { shopVoucherId, code }>
  const [selectedProductVouchers, setSelectedProductVouchers] = useState<
    Map<string, { shopVoucherId: string; code: string }>
  >(() => new Map());

  /**
   * selectedIds:
   * - null  => mặc định hiểu là "tất cả item trong cart đang được chọn"
   * - Set   => tập id do user chọn/thao tác thủ công
   */
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);

  // Khi danh sách items thay đổi:
  // - Nếu giỏ trống → reset về mặc định (null = không có gì để chọn)
  // - Nếu đang dùng Set cụ thể → loại bỏ các id không còn tồn tại trong cart
  useEffect(() => {
    if (items.length === 0) {
      setSelectedIds(null);
      return;
    }

    setSelectedIds((prev) => {
      if (prev === null) {
        // Đang ở trạng thái "mặc định tất cả được chọn" → không cần làm gì
        return prev;
      }
      const currentIds = new Set(items.map((item) => item.cartItemId));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (currentIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [items]);

  // Các item đang được chọn
  const selectedItems = useMemo(
    () =>
      selectedIds === null
        ? items
        : items.filter((item) => selectedIds.has(item.cartItemId)),
    [items, selectedIds]
  );

  // Tất cả item đã được chọn?
  const allSelected = useMemo(
    () => {
      if (items.length === 0) return false;
      if (selectedIds === null) return true;
      return items.every((item) => selectedIds.has(item.cartItemId));
    },
    [items, selectedIds]
  );

  // Tổng số lượng của các item đang chọn
  const totalItems = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  // Đảm bảo có thông tin store cho tất cả PRODUCT items
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

      if (!productDetails.some(Boolean)) return;

      setProductCache((prev) => {
        const next = new Map(prev);
        productDetails.forEach((product) => {
          if (product) {
            next.set(product.productId, product);
          }
        });
        return next;
      });
    };

    if (items.length > 0) {
      void ensureProductDetails();
    }
  }, [items]);

  // Load shop vouchers (ALL_SHOP_VOUCHER) cho từng store
  useEffect(() => {
    const loadStoreVouchers = async () => {
      // Lấy danh sách unique storeIds từ items
      const storeIds = new Set<string>();
      items.forEach((item) => {
        if (item.type === 'PRODUCT') {
          const product = productCache.get(item.refId);
          if (product?.storeId) {
            storeIds.add(product.storeId);
          }
        }
      });

      if (storeIds.size === 0) return;

      // Với mỗi store, lấy product đầu tiên để gọi API vouchers
      const storeProductMap = new Map<string, string>(); // storeId -> productId
      items.forEach((item) => {
        if (item.type === 'PRODUCT') {
          const product = productCache.get(item.refId);
          if (product?.storeId && !storeProductMap.has(product.storeId)) {
            storeProductMap.set(product.storeId, item.refId);
          }
        }
      });

      // Gọi API cho từng store (chỉ gọi 1 lần mỗi store)
      const voucherPromises = Array.from(storeProductMap.entries()).map(
        async ([storeId, productId]) => {
          try {
            console.groupCollapsed('🎫 [ShopCartV2] Fetch shop vouchers');
            console.log('StoreId:', storeId);
            console.log('ProductId:', productId);
            console.log('Request URL:', `/api/products/view/${productId}/vouchers?type=ALL`);
            const voucherRes = await ProductVoucherService.getProductVouchers(
              productId,
              'ALL',
              null
            );
            console.log('Response Body:', voucherRes);

            // Lọc ra vouchers có scopeType: "ALL_SHOP_VOUCHER"
            const shopVouchers =
              voucherRes.data?.vouchers?.shopVouchers?.filter(
                (v) => v.scopeType === 'ALL_SHOP_VOUCHER'
              ) || [];

            console.log(
              `✅ [ShopCartV2] Found ${shopVouchers.length} ALL_SHOP_VOUCHER vouchers for store ${storeId}`
            );

            return { storeId, vouchers: shopVouchers };
          } catch (error) {
            console.error(
              `❌ [ShopCartV2] Failed to load vouchers for store ${storeId}:`,
              error
            );
            return { storeId, vouchers: [] };
          } finally {
            console.groupEnd();
          }
        }
      );

      const results = await Promise.all(voucherPromises);
      const nextVouchers = new Map<string, ShopVoucher[]>();
      results.forEach(({ storeId, vouchers }) => {
        if (vouchers.length > 0) {
          nextVouchers.set(storeId, vouchers);
        }
      });

      setStoreVouchers(nextVouchers);
    };

    if (items.length > 0 && productCache.size > 0) {
      void loadStoreVouchers();
    }
  }, [items, productCache]);

  // Load product vouchers (PRODUCT_VOUCHER) cho từng cart item
  useEffect(() => {
    const loadProductVouchers = async () => {
      // Lấy danh sách PRODUCT items cần load vouchers
      const productItems = items.filter((item) => item.type === 'PRODUCT');

      if (productItems.length === 0) return;

      // Gọi API cho từng product (chỉ gọi nếu chưa có trong cache)
      const voucherPromises = productItems
        .filter((item) => {
          // Chỉ load nếu chưa có trong productVouchers cache
          return !productVouchers.has(item.cartItemId);
        })
        .map(async (item) => {
          try {
            console.groupCollapsed('🎫 [ShopCartV2] Fetch product vouchers');
            console.log('CartItemId:', item.cartItemId);
            console.log('ProductId:', item.refId);
            console.log('Request URL:', `/api/products/view/${item.refId}/vouchers?type=ALL`);
            const voucherRes = await ProductVoucherService.getProductVouchers(
              item.refId,
              'ALL',
              null
            );
            console.log('Response Body:', voucherRes);

            // Lọc ra vouchers có scopeType: "PRODUCT_VOUCHER"
            const productVouchersList =
              voucherRes.data?.vouchers?.shopVouchers?.filter(
                (v) => v.scopeType === 'PRODUCT_VOUCHER'
              ) || [];

            console.log(
              `✅ [ShopCartV2] Found ${productVouchersList.length} PRODUCT_VOUCHER vouchers for cartItemId ${item.cartItemId}`
            );

            return { cartItemId: item.cartItemId, vouchers: productVouchersList };
          } catch (error) {
            console.error(
              `❌ [ShopCartV2] Failed to load product vouchers for cartItemId ${item.cartItemId}:`,
              error
            );
            return { cartItemId: item.cartItemId, vouchers: [] };
          } finally {
            console.groupEnd();
          }
        });

      if (voucherPromises.length === 0) return;

      const results = await Promise.all(voucherPromises);
      setProductVouchers((prev) => {
        const next = new Map(prev);
        results.forEach(({ cartItemId, vouchers }) => {
          if (vouchers.length > 0) {
            next.set(cartItemId, vouchers);
          }
        });
        return next;
      });
    };

    if (items.length > 0) {
      void loadProductVouchers();
    }
  }, [items, productVouchers]);

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

  // Tổng giá gốc trước khi áp dụng giảm nền tảng (chỉ tính trên item được chọn)
  const baseSubtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const base = item.baseUnitPrice ?? item.unitPrice;
        return sum + base * item.quantity;
      }, 0),
    [selectedItems]
  );

  // Tổng giá hiện tại (sau khi áp dụng giá campaign vào unitPrice) cho item được chọn
  const currentSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      ),
    [selectedItems]
  );

  // Tổng giảm giá nền tảng = baseSubtotal - currentSubtotal (nếu dương)
  const platformDiscountTotal = useMemo(
    () => Math.max(0, baseSubtotal - currentSubtotal),
    [baseSubtotal, currentSubtotal]
  );

  // Tính giảm giá từ shop vouchers đã chọn (PHẢI đặt trước early return)
  const shopVoucherDiscount = useMemo(() => {
    let total = 0;
    selectedShopVouchers.forEach((voucherInfo, storeId) => {
      const vouchers = storeVouchers.get(storeId) || [];
      const voucher = vouchers.find(
        (v) => v.shopVoucherId === voucherInfo.shopVoucherId
      );
      if (!voucher) return;

      // Tính subtotal của store này (chỉ tính items được chọn)
      const storeItems = selectedItems.filter((item) => {
        if (item.type !== 'PRODUCT') return false;
        const product = productCache.get(item.refId);
        return product?.storeId === storeId;
      });

      const storeSubtotal = storeItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      // Kiểm tra minOrderValue
      if (voucher.minOrderValue && storeSubtotal < voucher.minOrderValue) {
        return;
      }

      // Tính discount
      if (voucher.discountPercent) {
        const discount = (storeSubtotal * voucher.discountPercent) / 100;
        total += voucher.maxDiscountValue
          ? Math.min(discount, voucher.maxDiscountValue)
          : discount;
      } else if (voucher.discountValue) {
        total += voucher.discountValue;
      }
    });
    return total;
  }, [selectedShopVouchers, storeVouchers, selectedItems, productCache]);

  // Tính giảm giá từ product vouchers đã chọn
  const productVoucherDiscount = useMemo(() => {
    let total = 0;
    selectedProductVouchers.forEach((voucherInfo, cartItemId) => {
      const vouchers = productVouchers.get(cartItemId) || [];
      const voucher = vouchers.find(
        (v) => v.shopVoucherId === voucherInfo.shopVoucherId
      );
      if (!voucher) return;

      // Tìm item tương ứng từ selectedItems để đảm bảo consistency với shopVoucherDiscount
      const item = selectedItems.find((it) => it.cartItemId === cartItemId);
      if (!item) return;

      // Tính subtotal của item này (sử dụng baseUnitPrice nếu có, fallback về unitPrice)
      // Đảm bảo discount được tính dựa trên giá gốc, không phải giá đã điều chỉnh bởi campaign
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
  }, [selectedProductVouchers, productVouchers, selectedItems]);

  const formatCurrency = (value: number | null | undefined) =>
    `${(value ?? 0).toLocaleString('vi-VN')} ₫`;

  // Handler để chọn shop voucher
  const handleSelectShopVoucher = (
    storeId: string,
    shopVoucherId: string,
    code: string
  ) => {
    setSelectedShopVouchers((prev) => {
      const next = new Map(prev);
      next.set(storeId, { shopVoucherId, code });
      return next;
    });
  };

  // Handler để xóa shop voucher
  const handleRemoveShopVoucher = (storeId: string) => {
    setSelectedShopVouchers((prev) => {
      const next = new Map(prev);
      next.delete(storeId);
      return next;
    });
  };

  // Handler để mở voucher picker (có thể mở modal sau này)
  const handleOpenStoreVoucher = (storeId: string) => {
    console.log('🧾 [ShopCartV2] Open store voucher picker for storeId:', storeId);
    // TODO: Có thể mở modal để chọn voucher
  };

  // Handler để chọn product voucher
  const handleSelectProductVoucher = (
    cartItemId: string,
    shopVoucherId: string,
    code: string
  ) => {
    setSelectedProductVouchers((prev) => {
      const next = new Map(prev);
      next.set(cartItemId, { shopVoucherId, code });
      return next;
    });
  };

  // Handler để xóa product voucher
  const handleRemoveProductVoucher = (cartItemId: string) => {
    setSelectedProductVouchers((prev) => {
      const next = new Map(prev);
      next.delete(cartItemId);
      return next;
    });
  };

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

  // Giỏ hàng trống
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
        Giỏ hàng của bạn đang trống.
      </div>
    );
  }

  const handleProceedToPreCheckout = () => {
    const selectedCartItemIds =
      selectedIds === null
        ? items.map((item) => item.cartItemId)
        : Array.from(selectedIds);

    if (selectedCartItemIds.length === 0) {
      console.warn('[ShopCartV2] No items selected for checkout.');
      return;
    }

    // Build storeVouchers payload: Map<storeId, { shopVoucherId, code }>
    const storeVouchersPayload: Record<string, { shopVoucherId: string; code: string }> = {};
    selectedShopVouchers.forEach((voucherInfo, storeId) => {
      storeVouchersPayload[storeId] = voucherInfo;
    });

    // Build productVouchers payload: Map<cartItemId, { shopVoucherId, code }>
    const productVouchersPayload: Record<string, { shopVoucherId: string; code: string }> = {};
    selectedProductVouchers.forEach((voucherInfo, cartItemId) => {
      // Chỉ lưu voucher của items được chọn
      if (selectedCartItemIds.includes(cartItemId)) {
        productVouchersPayload[cartItemId] = voucherInfo;
      }
    });

    const payload = {
      selectedCartItemIds,
      storeVouchers: storeVouchersPayload, // Lưu selected shopVoucherId theo storeId
      productVouchers: productVouchersPayload, // Lưu selected productVoucherId theo cartItemId
      selectedAddressId: null,
      createdAt: Date.now(),
    };

    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(payload));
      console.groupCollapsed('🧾 [ShopCartV2] Saved checkout session payload');
      console.log('Payload JSON:', JSON.stringify(payload, null, 2));
      console.groupEnd();
    } catch (err) {
      console.error('[ShopCartV2] Failed to save checkout session payload:', err);
    }

    navigate('/precheckoutv2');
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2.2fr_1fr]">
      {/* LEFT - Cart items (grouped theo cửa hàng) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
        {/* Cart header */}
        <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2 text-sm md:text-base">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelectedIds((prev) => {
                  const currentlyAllSelected =
                    items.length > 0 &&
                    (prev === null ||
                      items.every((item) => prev.has(item.cartItemId)));

                  if (currentlyAllSelected) {
                    // Unselect all
                    return new Set<string>();
                  }

                  // Select all
                  const all = new Set<string>();
                  items.forEach((item) => all.add(item.cartItemId));
                  return all;
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="font-medium text-gray-800">
              Chọn tất cả ({totalItems} sản phẩm)
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600"
            onClick={() => removeItems(items.map((item) => item.cartItemId))}
          >
            <span role="img" aria-label="trash">
              🗑
            </span>
            Xóa tất cả
          </button>
        </div>

        {/* Danh sách sản phẩm theo từng cửa hàng */}
        <div className="space-y-4">
          {storeGroups.map((group) => (
            <div
              key={group.storeId}
              className="rounded-xl border border-gray-200 p-3 md:p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds === null
                        ? true
                        : group.items.every((item) =>
                            selectedIds.has(item.cartItemId)
                          )
                    }
                    onChange={() =>
                      setSelectedIds((prev) => {
                        // Nếu đang ở trạng thái "mặc định tất cả được chọn"
                        // thì chuyển sang Set đầy đủ để thao tác.
                        const base =
                          prev === null
                            ? new Set(items.map((it) => it.cartItemId))
                            : new Set(prev);

                        const allInStoreSelected = group.items.every((item) =>
                          base.has(item.cartItemId)
                        );

                        if (allInStoreSelected) {
                          // Unselect toàn bộ product trong store này
                          group.items.forEach((item) =>
                            base.delete(item.cartItemId)
                          );
                        } else {
                          // Select toàn bộ product trong store này
                          group.items.forEach((item) =>
                            base.add(item.cartItemId)
                          );
                        }

                        return base;
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>{group.storeName}</span>
                </div>

                {/* Shop Vouchers Dropdown */}
                {storeVouchers.has(group.storeId) ? (
                  <div className="relative">
                    <select
                      value={
                        selectedShopVouchers.get(group.storeId)?.shopVoucherId ||
                        ''
                      }
                      onChange={(e) => {
                        const shopVoucherId = e.target.value;
                        if (shopVoucherId) {
                          const vouchers = storeVouchers.get(group.storeId) || [];
                          const voucher = vouchers.find(
                            (v) => v.shopVoucherId === shopVoucherId
                          );
                          if (voucher) {
                            handleSelectShopVoucher(
                              group.storeId,
                              voucher.shopVoucherId,
                              voucher.code
                            );
                          }
                        } else {
                          // Xóa voucher đã chọn
                          handleRemoveShopVoucher(group.storeId);
                        }
                      }}
                      className="appearance-none rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 pr-8 text-xs font-medium text-orange-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 hover:bg-orange-100 transition-colors"
                    >
                      <option value="">🎟 Chọn voucher cửa hàng</option>
                      {storeVouchers.get(group.storeId)?.map((voucher) => {
                        const discountText =
                          voucher.discountPercent
                            ? `-${voucher.discountPercent}%`
                            : voucher.discountValue
                            ? `-${formatCurrency(voucher.discountValue)}`
                            : '';
                        return (
                          <option
                            key={voucher.shopVoucherId}
                            value={voucher.shopVoucherId}
                          >
                            {voucher.title} {discountText && `(${discountText})`}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-600" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenStoreVoucher(group.storeId)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    🎟 Voucher cửa hàng
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-200">
                {group.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="grid grid-cols-[24px,80px,1fr] items-center gap-3 py-3 text-sm md:grid-cols-[24px,80px,1fr,120px,120px,24px]"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedIds === null
                          ? true
                          : selectedIds.has(item.cartItemId)
                      }
                      onChange={() =>
                        setSelectedIds((prev) => {
                          // Nếu đang ở trạng thái "mặc định tất cả được chọn"
                          // thì chuyển sang Set đầy đủ trước khi toggle từng item.
                          const base =
                            prev === null
                              ? new Set(items.map((it) => it.cartItemId))
                              : new Set(prev);

                          if (base.has(item.cartItemId)) {
                            base.delete(item.cartItemId);
                          } else {
                            base.add(item.cartItemId);
                          }
                          return base;
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
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
                      {/* Product Voucher Dropdown */}
                      {productVouchers.has(item.cartItemId) ? (
                        <div className="relative">
                          <select
                            value={
                              selectedProductVouchers.get(item.cartItemId)?.shopVoucherId ||
                              ''
                            }
                            onChange={(e) => {
                              const shopVoucherId = e.target.value;
                              if (shopVoucherId) {
                                const vouchers = productVouchers.get(item.cartItemId) || [];
                                const voucher = vouchers.find(
                                  (v) => v.shopVoucherId === shopVoucherId
                                );
                                if (voucher) {
                                  handleSelectProductVoucher(
                                    item.cartItemId,
                                    voucher.shopVoucherId,
                                    voucher.code
                                  );
                                }
                              } else {
                                // Xóa voucher đã chọn
                                handleRemoveProductVoucher(item.cartItemId);
                              }
                            }}
                            className="appearance-none rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 pr-6 text-xs font-medium text-orange-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 hover:bg-orange-100 transition-colors"
                          >
                            <option value="">🎟 Chọn voucher sản phẩm</option>
                            {productVouchers.get(item.cartItemId)?.map((voucher) => {
                              const discountText =
                                voucher.discountPercent
                                  ? `-${voucher.discountPercent}%`
                                  : voucher.discountValue
                                  ? `-${formatCurrency(voucher.discountValue)}`
                                  : '';
                              return (
                                <option
                                  key={voucher.shopVoucherId}
                                  value={voucher.shopVoucherId}
                                >
                                  {voucher.title} {discountText && `(${discountText})`}
                                </option>
                              );
                            })}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-orange-600" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            console.log(
                              '🧾 [ShopCartV2] Open product voucher picker for cartItemId:',
                              item.cartItemId
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-dashed border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-100"
                        >
                          🎟 Chọn voucher cho sản phẩm
                        </button>
                      )}
                      {item.inPlatformCampaign && !item.campaignUsageExceeded && (
                        <span className="inline-flex cursor-pointer items-center rounded-md border border-dashed border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                          🎟 Đang áp dụng khuyến mãi nền tảng
                        </span>
                      )}
                      {item.campaignUsageExceeded && (
                        <p className="text-xs font-medium text-red-500">
                          Bạn đã vượt số lượng áp dụng khuyến mãi, các sản phẩm
                          vượt mức sẽ tính theo giá gốc.
                        </p>
                      )}
                    </div>
                    <div className="hidden text-right text-sm md:block">
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
                    <div className="hidden items-center justify-center gap-2 md:flex">
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700"
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span className="text-sm font-medium text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700"
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="hidden text-lg text-gray-400 hover:text-red-500 md:block"
                      aria-label="Xóa sản phẩm"
                      onClick={() => removeItems([item.cartItemId])}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT - Summary */}
      <div className="h-fit rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Tóm tắt giỏ hàng
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Giá gốc</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(baseSubtotal)}
            </span>
          </div>
          {platformDiscountTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Giảm giá nền tảng</span>
              <span className="font-medium text-red-500">
                -{formatCurrency(platformDiscountTotal)}
              </span>
            </div>
          )}
          {shopVoucherDiscount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Giảm giá voucher cửa hàng</span>
              <span className="font-medium text-red-500">
                -{formatCurrency(shopVoucherDiscount)}
              </span>
            </div>
          )}
          {productVoucherDiscount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Giảm giá voucher sản phẩm</span>
              <span className="font-medium text-red-500">
                -{formatCurrency(productVoucherDiscount)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between text-base font-semibold text-orange-600">
            <span>Tổng giỏ hàng</span>
            <span>
              {formatCurrency(
                Math.max(0, currentSubtotal - shopVoucherDiscount - productVoucherDiscount)
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          onClick={handleProceedToPreCheckout}
        >
          Tiến hành thanh toán
        </button>
      </div>
    </div>
  );
};

export default ShopCartV2;
