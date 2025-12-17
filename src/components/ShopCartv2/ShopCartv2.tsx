import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { ProductListService, type Product } from '../../services/customer/ProductListService';

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
  const productCacheRef = useRef(productCache);

  // Đồng bộ ref với state để dùng bên trong effect async mà không phải
  // đưa productCache vào dependency (tránh nguy cơ lặp vô hạn).
  useEffect(() => {
    productCacheRef.current = productCache;
  }, [productCache]);

  // Trạng thái chọn item trong giỏ
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set()
  );

  // Khi cart thay đổi:
  // - Nếu giỏ hàng trống: reset trạng thái chọn
  // - Nếu có items:
  //   + Lần đầu load: tự động select tất cả
  //   + Các lần cập nhật sau: giữ nguyên trạng thái chọn hiện tại,
  //     chỉ loại bỏ những item đã bị xoá khỏi giỏ.
  const initializedSelectionRef = useRef(false);
  useEffect(() => {
    if (!cart || !cart.items) {
      initializedSelectionRef.current = false;
      setSelectedIds(new Set());
      return;
    }

    const currentItems = cart.items;
    const currentIds = new Set(currentItems.map((item) => item.cartItemId));

    setSelectedIds((prev) => {
      if (!initializedSelectionRef.current) {
        initializedSelectionRef.current = true;
        const all = new Set<string>();
        currentItems.forEach((item) => all.add(item.cartItemId));
        return all;
      }

      const next = new Set<string>();
      prev.forEach((id) => {
        if (currentIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [cart]);

  // Các item đang được chọn
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.cartItemId)),
    [items, selectedIds]
  );

  // Tất cả item đã được chọn?
  const allSelected = useMemo(
    () =>
      items.length > 0 &&
      items.every((item) => selectedIds.has(item.cartItemId)),
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
      const currentCache = productCacheRef.current;

      const missingProductIds = items
        .filter((item) => item.type === 'PRODUCT')
        .map((item) => item.refId)
        .filter((productId) => productId && !currentCache.has(productId));

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

  const formatCurrency = (value: number | null | undefined) =>
    `${(value ?? 0).toLocaleString('vi-VN')} ₫`;

  // Placeholder handlers for voucher selection (sau này sẽ gắn API/voucher modal)
  const handleOpenStoreVoucher = (storeId: string) => {
    console.log('🧾 [ShopCartV2] Open store voucher picker for storeId:', storeId);
  };

  const handleOpenProductVoucher = (cartItemId: string) => {
    console.log(
      '🧾 [ShopCartV2] Open product voucher picker for cartItemId:',
      cartItemId
    );
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
    const selectedCartItemIds = Array.from(selectedIds);

    if (selectedCartItemIds.length === 0) {
      console.warn('[ShopCartV2] No items selected for checkout.');
      return;
    }

    const payload = {
      selectedCartItemIds,
      storeVouchers: {}, // placeholder cho future store vouchers
      selectedAddressId: null,
      createdAt: Date.now(),
    };

    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(payload));
      console.groupCollapsed('🧾 [ShopCartV2] Saved checkout session payload');
      console.log('Payload:', payload);
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
                  const next = new Set<string>();
                  const currentlyAllSelected =
                    items.length > 0 &&
                    items.every((item) => prev.has(item.cartItemId));
                  if (!currentlyAllSelected) {
                    items.forEach((item) => next.add(item.cartItemId));
                  }
                  return next;
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
                    checked={group.items.every((item) =>
                      selectedIds.has(item.cartItemId)
                    )}
                    onChange={() =>
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        const allInStoreSelected = group.items.every((item) =>
                          next.has(item.cartItemId)
                        );

                        if (allInStoreSelected) {
                          // Unselect toàn bộ product trong store này
                          group.items.forEach((item) =>
                            next.delete(item.cartItemId)
                          );
                        } else {
                          // Select toàn bộ product trong store này
                          group.items.forEach((item) =>
                            next.add(item.cartItemId)
                          );
                        }

                        return next;
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>{group.storeName}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenStoreVoucher(group.storeId)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600 hover:bg-orange-100"
                >
                  🎟 Voucher cửa hàng
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {group.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="grid grid-cols-[24px,80px,1fr] items-center gap-3 py-3 text-sm md:grid-cols-[24px,80px,1fr,120px,120px,24px]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.cartItemId)}
                      onChange={() =>
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.cartItemId)) {
                            next.delete(item.cartItemId);
                          } else {
                            next.add(item.cartItemId);
                          }
                          return next;
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
                      <button
                        type="button"
                        onClick={() => handleOpenProductVoucher(item.cartItemId)}
                        className="inline-flex items-center gap-1 rounded-md border border-dashed border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-100"
                      >
                        🎟 Chọn voucher cho sản phẩm
                      </button>
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
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between text-base font-semibold text-orange-600">
            <span>Tổng giỏ hàng</span>
            <span>{formatCurrency(currentSubtotal)}</span>
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
