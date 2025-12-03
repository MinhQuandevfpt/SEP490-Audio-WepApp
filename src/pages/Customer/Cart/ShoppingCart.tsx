import React, { useEffect, useMemo, useState } from 'react';
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
import type { CartItem as ApiCartItem } from '../../../types/cart';
import type { CustomerAddressApiItem } from '../../../types/api';
import { ProductVoucherService } from '../../../services/customer/ProductVoucherService';
import type { ShopVoucher } from '../../../components/ShoppingCartComponents/VoucherSection';
import { ProductListService } from '../../../services/customer/ProductListService';
import { Home, ChevronRight } from 'lucide-react';

const CHECKOUT_SESSION_KEY = 'checkout:payload:v1';

const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isLoading, error, loadCart } = useCart();
  const [items, setItems] = useState<UICartItem[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddressApiItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);

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
    productId: apiItem.refId, // refId is productId for PRODUCT, comboId for COMBO
    name: apiItem.name,
    // Ưu tiên sử dụng variantUrl nếu có, nếu không thì dùng image
    image: apiItem.variantUrl || apiItem.image,
    price: apiItem.unitPrice,
    quantity: apiItem.quantity,
    isSelected: true,
    variant: apiItem.variantOptionValue || undefined,
    type: apiItem.type, // Store type to distinguish PRODUCT vs COMBO
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

  // Load cart items và áp dụng logic giảm giá nền tảng tương tự HomePage
  useEffect(() => {
    const enhanceItemsWithPlatformDiscounts = async () => {
      if (!cart?.items) {
        setItems([]);
        return;
      }

      try {
        const apiItems = cart.items as unknown as ApiCartItem[];

        const enhanced: UICartItem[] = await Promise.all(
          apiItems.map(async (apiItem) => {
            const baseItem: UICartItem = {
              id: apiItem.cartItemId,
              productId: apiItem.refId,
              name: apiItem.name,
              image: apiItem.variantUrl || apiItem.image,
              price: apiItem.unitPrice,
              originalPrice: apiItem.unitPrice,
              quantity: apiItem.quantity,
              isSelected: true,
              variant: apiItem.variantOptionValue || undefined,
              type: apiItem.type,
            };

            // Chỉ áp dụng giảm giá nền tảng cho PRODUCT (không áp dụng cho COMBO)
            if (!apiItem.refId || apiItem.type === 'COMBO') {
              return baseItem;
            }

            try {
              const response = await ProductVoucherService.getProductVouchers(apiItem.refId, 'ALL', null);

              const platformCampaigns = response.data?.vouchers?.platform || [];
              let activePlatformVoucher: any = null;
              const now = new Date();

              // Tìm voucher nền tảng đang ACTIVE (giống logic ProductSuggestions)
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

                // Nếu có giảm giá hợp lệ thì cập nhật price để dùng cho tính toán & hiển thị
                if (discountedPrice < originalPrice) {
                  return {
                    ...baseItem,
                    price: discountedPrice,
                    originalPrice,
                  };
                }
              }
            } catch (err) {
              console.error('Failed to load platform vouchers for cart item:', err);
            }

            return baseItem;
          })
        );

        setItems(enhanced);
      } finally {
        // no-op
      }
    };

    enhanceItemsWithPlatformDiscounts();
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
        });
        
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

  const allSelected = useMemo(() => items.every(i => i.isSelected), [items]);
  const summary = useMemo(() => calcCartSummary(items), [items]);

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
    return items.reduce((sum, item) => {
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
            `Voucher ${applied.code} đã được gỡ vì đơn hàng của cửa hàng không đạt tối thiểu ${matchedVoucher.minOrderValue.toLocaleString('vi-VN')}đ.`
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

    messages.forEach(msg => showCenterError(msg, 'Voucher'));
  }, [items, productCache, productVouchersMapState]);

  // Calculate subtotal dựa trên giá gốc (để hiển thị giống HomePage: giá gốc + giảm giá)
  const subtotalBeforePlatformDiscount = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.isSelected) return sum;
      const original = item.originalPrice ?? item.price;
      return sum + original * item.quantity;
    }, 0);
  }, [items]);
  
  // Tổng giảm giá nền tảng = (giá gốc - giá sau giảm) * quantity
  const totalPlatformDiscount = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.isSelected) return sum;
      const original = item.originalPrice ?? item.price;
      const discountPerUnit = Math.max(0, original - item.price);
      return sum + discountPerUnit * item.quantity;
    }, 0);
  }, [items]);

  // Store voucher discount
  const voucherDiscount = useMemo(() => {
    return Object.values(appliedStoreVouchers).reduce((total, voucher) => total + voucher.discountValue, 0);
  }, [appliedStoreVouchers]);

  // Danh sách mã voucher đã áp dụng (chỉ voucher shop, không tính platform)
  const selectedVoucherCodes = useMemo(
    () => Array.from(new Set(Object.values(appliedStoreVouchers).map(v => v.code))),
    [appliedStoreVouchers]
  );

  // Grand total = subtotal - platform discount - store voucher discount + shipping fee
  const grandTotal = useMemo(() => {
    const total =
      subtotalBeforePlatformDiscount -
      totalPlatformDiscount -
      voucherDiscount +
      shippingFee;
    return Math.max(0, total);
  }, [subtotalBeforePlatformDiscount, totalPlatformDiscount, voucherDiscount, shippingFee]);

  // Calculate discount amount for a voucher
  const handleApplyStoreVoucher = (productId: string, storeId: string, voucher: ShopVoucher, discountValue: number) => {
    // Check if this voucher code is already applied to another product
    const existingProductId = voucherCodeToProductIdMap.get(voucher.code);
    if (existingProductId && existingProductId !== productId) {
      const existingProduct = productCache.get(existingProductId);
      const existingProductName = existingProduct?.name || 'sản phẩm khác';
      showCenterError(
        `Voucher ${voucher.code} đã được sử dụng cho ${existingProductName}. Mỗi voucher chỉ có thể áp dụng cho một sản phẩm.`,
        'Voucher'
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

    items.forEach(item => {
      const product = productCache.get(item.productId);
      const storeId = product?.storeId || `unknown-${item.productId}`;
      const storeName = product?.storeName || 'Cửa hàng chưa xác định';

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
    try {
      const resp = await CustomerCartService.deleteCart();
      applyCartResponseToUI(resp.items as unknown as ApiCartItem[]);
      showCenterSuccess('Đã xóa toàn bộ giỏ hàng', 'Thành công');
    } catch (error: any) {
      const msg = CustomerCartService.formatCartError(error) || 'Không thể xóa giỏ hàng. Vui lòng thử lại.';
      showCenterError(msg, 'Lỗi');
    }
  };

  const handleProceedToCheckout = () => {
    const selectedItems = items.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      showCenterError('Vui lòng chọn ít nhất một sản phẩm để mua.', 'Lỗi');
      return;
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
      showCenterError('Không thể chuẩn bị dữ liệu thanh toán. Vui lòng thử lại.', 'Lỗi');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb / Progress bar */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-5">
          <div className="flex items-center gap-2 px-6 py-4 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <span className="font-medium text-gray-900">Giỏ hàng</span>
            <ChevronRight className="w-4 h-4" />
            <span>Thanh toán</span>
            <ChevronRight className="w-4 h-4" />
            <span>Xác nhận</span>
          </div>
        </div>
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
              storeGroups={storeGroups}
              totalItemCount={items.length}
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
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingCart;
