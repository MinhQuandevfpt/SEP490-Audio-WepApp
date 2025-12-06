# PHÂN TÍCH CHI TIẾT LUỒNG SHOPPING CART ĐẾN CHECKOUT COD THÀNH CÔNG

## TỔNG QUAN

Tài liệu này mô tả chi tiết luồng xử lý từ trang Shopping Cart (`ShoppingCart.tsx`) đến khi hoàn tất checkout COD thành công (`CheckoutOrderContainer.tsx`), bao gồm các bước xử lý, API calls, state management, và logic tính toán.

**⚠️ LƯU Ý QUAN TRỌNG - SHIPPING FEE MULTI-STORE:**
- Mỗi store có địa chỉ gửi hàng riêng (warehouse/district khác nhau)
- Shipping fee được tính riêng cho từng store dựa trên địa chỉ gửi của store đó
- Tổng shipping fee = sum của tất cả stores
- UI hiển thị shipping fee theo từng store trong CartItemList và OrderSummaryCard

---

## 1. SHOPPING CART PAGE - KHỞI TẠO VÀ LOAD DỮ LIỆU

### 1.1. Component Mount và Initialization

**File:** `src/pages/Customer/Cart/ShoppingCart.tsx`

**Flow:**
```
1. Component mount
2. useEffect(() => { init() }) chạy
3. Gọi loadCart() và loadAddresses() song song
```

**Chi tiết:**

#### 1.1.1. Load Cart Data
```typescript
// Hook: useCart()
const { cart, isLoading, error, loadCart } = useCart();

// Service: CustomerCartService.getCart()
// API: GET /api/v1/customers/{customerId}/cart
// Response: CartResponse {
//   cartId: string,
//   customerId: string,
//   status: 'ACTIVE',
//   subtotal: number,
//   discountTotal: number,
//   grandTotal: number,
//   items: CartItem[]
// }
```

**CartItem từ API:**
```typescript
{
  cartItemId: string,      // ID của cart item
  type: 'PRODUCT' | 'COMBO',
  refId: string,           // productId hoặc comboId
  name: string,
  image: string,
  variantUrl?: string,     // URL ảnh variant (ưu tiên hơn image)
  quantity: number,
  unitPrice: number,
  lineTotal: number,
  variantId?: string,
  variantOptionName?: string,
  variantOptionValue?: string
}
```

#### 1.1.2. Load Addresses
```typescript
// Service: AddressService.getAddresses()
// API: GET /api/customers/{customerId}/addresses
// Response: CustomerAddressApiItem[]
// Auto-select: default address hoặc address đầu tiên
```

---

### 1.2. Áp Dụng Platform Discount

**Logic:** Mỗi cart item (PRODUCT) được kiểm tra và áp dụng platform voucher discount nếu có.

**Flow:**
```typescript
useEffect(() => {
  const loadAndEnhanceItems = async () => {
    if (!cart?.items) return;
    
    const apiItems = cart.items as ApiCartItem[];
    // Áp dụng platform discount cho từng item
    const enhanced = await enhanceApiItemsWithPlatformDiscounts(apiItems);
    setItems(enhanced);
  };
  
  loadAndEnhanceItems();
}, [cart]);
```

**Function: `enhanceApiItemWithPlatformDiscount`**

**Bước 1:** Kiểm tra item type
- Nếu `type === 'COMBO'` → bỏ qua, return baseItem
- Nếu không có `refId` → bỏ qua

**Bước 2:** Load vouchers cho product
```typescript
// Service: ProductVoucherService.getProductVouchers()
// API: GET /api/products/view/{productId}/vouchers?type=ALL
// Response: {
//   data: {
//     vouchers: {
//       shop: ShopVoucher[],
//       platform: PlatformCampaign[]
//     }
//   }
// }
```

**Bước 3:** Tìm active platform voucher
```typescript
// Logic tìm voucher ACTIVE:
for (const campaign of platformCampaigns) {
  if (campaign.status === 'ACTIVE' && campaign.vouchers?.length > 0) {
    for (const v of campaign.vouchers) {
      if (v.status !== 'ACTIVE') continue;
      
      // Kiểm tra time slot (nếu có)
      if (v.slotOpenTime && v.slotCloseTime) {
        isActive = now >= slotOpenTime && now <= slotCloseTime && v.slotStatus === 'ACTIVE';
      } else {
        // Kiểm tra startTime/endTime
        isActive = now >= startTime && now <= endTime && v.status === 'ACTIVE';
      }
      
      if (isActive) {
        activePlatformVoucher = v;
        break;
      }
    }
  }
}
```

**Bước 4:** Tính toán giá sau giảm
```typescript
const originalPrice = baseItem.originalPrice ?? baseItem.price;
let discountedPrice = originalPrice;

if (voucher.type === 'PERCENT' && voucher.discountPercent) {
  discountedPrice = originalPrice * (1 - voucher.discountPercent / 100);
} else if (voucher.type === 'FIXED' && voucher.discountValue) {
  discountedPrice = Math.max(0, originalPrice - voucher.discountValue);
}

// Cập nhật item với giá mới
return {
  ...baseItem,
  price: discountedPrice,        // Giá sau giảm
  originalPrice: originalPrice    // Giá gốc (để hiển thị)
};
```

**Kết quả:** Mỗi item có:
- `price`: Giá sau khi áp dụng platform discount
- `originalPrice`: Giá gốc (để hiển thị gạch ngang)

---

### 1.3. Load Vouchers cho Products

**Flow:**
```typescript
useEffect(() => {
  const loadVouchers = async () => {
    // 1. Lấy danh sách productIds (chỉ PRODUCT, không phải COMBO)
    const productItems = cart?.items.filter(item => item.type === 'PRODUCT');
    const productIds = Array.from(new Set(productItems.map(i => i.refId)));
    
    // 2. Load vouchers và product details song song
    const responses = await Promise.all(
      productIds.map(async (pid) => {
        const [voucherRes, productRes] = await Promise.all([
          ProductVoucherService.getProductVouchers(pid, 'ALL', null),
          ProductListService.getProductById(pid)
        ]);
        return { productId: pid, voucherRes, productRes };
      })
    );
    
    // 3. Map vouchers theo productId
    const productVouchersMap = new Map<string, ShopVoucher[]>();
    responses.forEach(({ productId, voucherRes, productRes }) => {
      const vouchers = voucherRes?.data?.vouchers?.shop || [];
      const storeId = productRes.data?.storeId;
      
      const productVouchers: ShopVoucher[] = vouchers.map(v => ({
        ...v,
        storeId: storeId || undefined
      }));
      
      productVouchersMap.set(productId, productVouchers);
    });
    
    setProductVouchersMapState(productVouchersMap);
  };
  
  loadVouchers();
}, [cart?.items]);
```

**Kết quả:**
- `productVouchersMap`: Map<productId, ShopVoucher[]> - mỗi product chỉ có vouchers của chính nó
- `productVoucherAvailability`: Record<productId, boolean> - đánh dấu product có voucher hay không

---

### 1.4. Tính Toán Service Type và Shipping Fee

**Hook: `useServiceTypeCalculator`**

**Logic:**
```typescript
// 1. Tính tổng weight của selected items
let totalWeight = 0;
selectedItems.forEach(item => {
  const product = productCache.get(item.productId);
  const weightKg = product?.weight && product.weight > 0 ? product.weight : 0.5;
  const weightGr = Math.round(weightKg * 1000);
  totalWeight += weightGr * item.quantity;
});

// 2. Auto-select service type dựa trên weight
// ≤ 7500 gram → service_type_id = 2 (Hàng nhẹ)
// > 7500 gram → service_type_id = 5 (Hàng nặng)
if (totalWeight <= 7500) {
  setServiceTypeId(2);
} else {
  setServiceTypeId(5);
}

setPackageWeight(totalWeight);
```

**Lưu ý:** Shipping fee KHÔNG được tính trên Cart page, chỉ tính trên Checkout page sau khi chọn địa chỉ.

---

### 1.5. Validate và Update Applied Vouchers

**Flow:**
```typescript
useEffect(() => {
  // Validate applied vouchers khi items hoặc productCache thay đổi
  setAppliedStoreVouchers(prev => {
    const next: Record<string, AppliedStoreVoucher> = {};
    
    Object.entries(prev).forEach(([productId, applied]) => {
      const product = productCache.get(productId);
      const storeId = product?.storeId;
      const vouchers = productVouchersMapState.get(productId) || [];
      const matchedVoucher = vouchers.find(v => v.code === applied.code);
      const storeTotal = calculateSelectedTotalForStore(storeId);
      
      // Kiểm tra voucher còn hợp lệ
      if (!matchedVoucher || storeTotal <= 0) {
        return; // Xóa voucher không hợp lệ
      }
      
      // Kiểm tra minOrderValue
      if (matchedVoucher.minOrderValue && storeTotal < matchedVoucher.minOrderValue) {
        showCenterError(`Voucher ${applied.code} đã được gỡ vì đơn hàng không đạt tối thiểu...`);
        return; // Xóa voucher
      }
      
      // Tính lại discount value
      const discountValue = calculateVoucherDiscount(matchedVoucher, storeTotal);
      next[productId] = {
        ...applied,
        discountValue
      };
    });
    
    return next;
  });
}, [items, productCache, productVouchersMapState]);
```

**Tính discount:**
```typescript
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
```

---

### 1.6. Tính Toán Tổng Tiền

**Các giá trị được tính:**

```typescript
// 1. Subtotal trước platform discount (giá gốc)
const subtotalBeforePlatformDiscount = items.reduce((sum, item) => {
  if (!item.isSelected) return sum;
  const original = item.originalPrice ?? item.price;
  return sum + original * item.quantity;
}, 0);

// 2. Tổng giảm giá nền tảng
const totalPlatformDiscount = items.reduce((sum, item) => {
  if (!item.isSelected) return sum;
  const original = item.originalPrice ?? item.price;
  const discountPerUnit = Math.max(0, original - item.price);
  return sum + discountPerUnit * item.quantity;
}, 0);

// 3. Voucher discount (store vouchers)
const voucherDiscount = Object.values(appliedStoreVouchers).reduce(
  (total, voucher) => total + voucher.discountValue, 
  0
);

// 4. Grand total
const grandTotal = subtotalBeforePlatformDiscount 
  - totalPlatformDiscount 
  - voucherDiscount 
  + shippingFee;
```

---

### 1.7. Proceed to Checkout

**Function: `handleProceedToCheckout`**

```typescript
const handleProceedToCheckout = () => {
  // 1. Validate: Phải có ít nhất 1 item được chọn
  const selectedItems = items.filter(item => item.isSelected);
  if (selectedItems.length === 0) {
    showCenterError('Vui lòng chọn ít nhất một sản phẩm để mua.');
    return;
  }
  
  // 2. Build payload
  const payload = {
    selectedCartItemIds: selectedItems.map(item => item.id),
    storeVouchers: appliedStoreVouchers,  // Record<productId, AppliedStoreVoucher>
    selectedAddressId,
    createdAt: Date.now()
  };
  
  // 3. Lưu vào sessionStorage
  sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(payload));
  
  // 4. Navigate to checkout
  navigate('/checkout');
};
```

**Session Storage Key:** `checkout:payload:v1`

**Payload Structure:**
```typescript
{
  selectedCartItemIds: string[],           // IDs của cart items đã chọn
  storeVouchers: Record<string, {          // Vouchers đã áp dụng (key = productId)
    code: string,
    type: 'FIXED' | 'PERCENT',
    discountValue: number,
    storeId: string
  }>,
  selectedAddressId: string | null,
  createdAt: number
}
```

---

## 2. CHECKOUT PAGE - XỬ LÝ THANH TOÁN

### 2.1. Component Mount và Load Data

**File:** `src/components/CheckoutOrderComponents/CheckoutOrderContainer.tsx`

**Flow:**
```typescript
useEffect(() => {
  const init = async () => {
    // 1. Load payload từ sessionStorage
    const payloadRaw = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!payloadRaw) {
      showCenterError('Không tìm thấy thông tin giỏ hàng...');
      window.location.href = '/cart';
      return;
    }
    
    const payload: CheckoutSessionPayload = JSON.parse(payloadRaw);
    
    // 2. Validate payload
    if (!payload.selectedCartItemIds || payload.selectedCartItemIds.length === 0) {
      showCenterError('Giỏ hàng của bạn đang trống...');
      window.location.href = '/cart';
      return;
    }
    
    // 3. Restore applied vouchers
    setAppliedStoreVouchers(payload.storeVouchers || {});
    setSelectedCartItemIds(payload.selectedCartItemIds);
    
    // 4. Load addresses và cart data song song
    const [addressList, cartResponse] = await Promise.all([
      loadAddresses(),
      CustomerCartService.getCart()
    ]);
    
    // 5. Select default address
    const defaultAddress = payload.selectedAddressId 
      || addressList.find(addr => addr.default)?.id 
      || addressList[0]?.id 
      || null;
    setSelectedAddressId(defaultAddress);
    
    // 6. Filter selected cart items
    const selectedCartItems = cartResponse.items.filter(item =>
      payload.selectedCartItemIds.includes(item.cartItemId)
    ) as ApiCartItem[];
    
    if (selectedCartItems.length === 0) {
      showCenterError('Không tìm thấy sản phẩm đã chọn...');
      window.location.href = '/cart';
      return;
    }
    
    // 7. Áp dụng platform discount cho items
    const enhancedItems = await enhanceApiItemsWithPlatformDiscounts(selectedCartItems);
    setCartItems(enhancedItems);
  };
  
  init();
}, [loadAddresses]);
```

---

### 2.2. Áp Dụng Platform Discount (Lần 2)

**Function: `enhanceApiItemsWithPlatformDiscounts`**

**Logic giống ShoppingCart:** Áp dụng platform discount cho từng item để đảm bảo giá hiển thị nhất quán.

**Kết quả:** `cartItems` có `price` (sau giảm) và `originalPrice` (giá gốc).

---

### 2.3. Load Vouchers và Tính Platform Discount

**Flow:**
```typescript
useEffect(() => {
  const loadVouchers = async () => {
    const productIds = Array.from(new Set(cartItems.map(item => item.productId)));
    
    // Load vouchers và product details
    const responses = await Promise.all(
      productIds.map(async pid => {
        const [voucherRes, productRes] = await Promise.all([
          ProductVoucherService.getProductVouchers(pid, 'ALL', null),
          ProductListService.getProductById(pid)
        ]);
        return { voucherRes, productRes };
      })
    );
    
    // Extract shop vouchers và platform discounts
    const shopVouchers: ShopVoucher[] = [];
    const platformDiscountsMap: Record<string, { discount: number; campaignProductId: string }> = {};
    
    responses.forEach(({ voucherRes, productRes }, index) => {
      const productId = productIds[index];
      const storeId = productRes.data?.storeId;
      
      // Shop vouchers
      const vouchers = voucherRes.data?.vouchers?.shop || [];
      vouchers.forEach(v => {
        shopVouchers.push({ ...v, storeId });
      });
      
      // Platform discount calculation
      if (voucherRes?.data) {
        const platformCampaigns = voucherRes.data.vouchers?.platform || [];
        const originalPrice = voucherRes.data.product.price;
        let platformDiscount = 0;
        let campaignProductId: string | null = null;
        
        for (const campaign of platformCampaigns) {
          if (campaign.status === 'ACTIVE' && campaign.vouchers?.length > 0) {
            const activeVoucher = campaign.vouchers.find(v => v.status === 'ACTIVE');
            if (activeVoucher) {
              campaignProductId = activeVoucher.platformVoucherId;
              
              if (activeVoucher.type === 'FIXED') {
                platformDiscount = activeVoucher.discountValue || 0;
              } else if (activeVoucher.type === 'PERCENT') {
                const percentDiscount = (originalPrice * (activeVoucher.discountPercent || 0)) / 100;
                platformDiscount = activeVoucher.maxDiscountValue 
                  ? Math.min(percentDiscount, activeVoucher.maxDiscountValue)
                  : percentDiscount;
              }
              break;
            }
          }
        }
        
        if (platformDiscount > 0 && campaignProductId) {
          platformDiscountsMap[productId] = {
            discount: platformDiscount,
            campaignProductId: campaignProductId
          };
        }
      }
    });
    
    setAvailableVouchers(shopVouchers);
    setPlatformVoucherDiscounts(platformDiscountsMap);
    
    // Áp dụng platform discount vào cartItems
    if (Object.keys(platformDiscountsMap).length > 0) {
      setCartItems(prev =>
        prev.map(item => {
          const info = platformDiscountsMap[item.productId];
          const original = item.originalPrice ?? item.price;
          
          if (!info || !info.discount || info.discount <= 0) {
            return { ...item, originalPrice: original };
          }
          
          const discounted = Math.max(0, original - info.discount);
          if (discounted >= original) {
            return { ...item, originalPrice: original };
          }
          
          return {
            ...item,
            price: discounted,
            originalPrice: original
          };
        })
      );
    }
  };
  
  loadVouchers();
}, [cartItems]);
```

**Kết quả:**
- `availableVouchers`: Shop vouchers cho các products
- `platformVoucherDiscounts`: Map<productId, { discount, campaignProductId }> - dùng để build platform vouchers cho checkout request

---

### 2.4. Load Store-Wide Vouchers

**Flow:**
```typescript
useEffect(() => {
  const loadStoreWideVouchers = async () => {
    // 1. Lấy danh sách storeIds từ cartItems
    const storeIds = new Set<string>();
    cartItems.forEach(item => {
      const product = productCache.get(item.productId);
      if (product?.storeId) {
        storeIds.add(product.storeId);
      }
    });
    
    // 2. Load vouchers cho từng store
    const voucherPromises = Array.from(storeIds).map(async (storeId) => {
      const response = await VoucherService.getShopVouchersByStore(
        storeId, 
        'ACTIVE', 
        'ALL_SHOP_VOUCHER'
      );
      return { storeId, vouchers: response.data || [] };
    });
    
    const results = await Promise.all(voucherPromises);
    const vouchersMap: Record<string, StoreVoucher[]> = {};
    results.forEach(({ storeId, vouchers }) => {
      vouchersMap[storeId] = vouchers;
    });
    
    setStoreWideVouchers(vouchersMap);
  };
  
  if (cartItems.length > 0 && productCache.size > 0) {
    loadStoreWideVouchers();
  }
}, [cartItems, productCache]);
```

**API:** `GET /api/v1/stores/{storeId}/vouchers?status=ACTIVE&type=ALL_SHOP_VOUCHER`

---

### 2.5. Auto Calculate Shipping Fee

**Hook: `useAutoShippingFee`**

**Flow:**
```typescript
useAutoShippingFee({
  items: shippingItems,              // Cart items (all selected)
  addresses,
  selectedAddressId,
  productCache,
  serviceTypeId,                     // 2 hoặc 5 (từ useServiceTypeCalculator)
  onShippingFeeChange: (fee) => {
    setShippingFee(fee);
    setShippingFeeError(null);
  },
  onProductCacheUpdate: setProductCache,
  autoCalculate: shippingItems.length > 0 && !!selectedAddressId,
  onError: (message) => {
    if (message.trim().length > 0) {
      setShippingFeeError(message);
      setShippingFee(0);
    } else {
      setShippingFeeError(null);
    }
  }
});
```

**Logic tính shipping fee:**

**Bước 1:** Lấy thông tin địa chỉ gửi và nhận
```typescript
// From: Lấy từ product đầu tiên
const firstProd = productById.get(selectedItems[0].productId);
const fromDistrictId = firstProd?.districtCode ? Number(firstProd.districtCode) : NaN;
const fromWardCode = firstProd?.wardCode || '';

// To: Lấy từ selected address
const selectedAddress = addresses.find(a => a.id === selectedAddressId);
const toDistrictId = selectedAddress.districtId;
const toWardCode = selectedAddress.wardCode;
```

**Bước 2:** Build GHN items
```typescript
const ghnItems = selectedItems.map(item => {
  const product = productById.get(item.productId);
  const weightKg = product?.weight && product.weight > 0 ? product.weight : 0.5;
  const weightGr = Math.round(weightKg * 1000);
  
  return {
    name: item.name,
    quantity: item.quantity,
    length: 1,    // Default 1cm
    width: 1,    // Default 1cm
    height: 1,   // Default 1cm
    weight: weightGr
  };
});

const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);
```

**Bước 3:** Call GHN API
```typescript
// Service: ShippingService.calculateGhnFee()
// API: POST /api/ghn/calculate-fee
// Request Body:
{
  service_type_id: 2 | 5,
  from_district_id: number,
  from_ward_code: string,
  to_district_id: number,
  to_ward_code: string,
  length: 1,
  width: 1,
  height: 1,
  weight: number,  // grams
  insurance_value: 0,
  coupon: '',
  items: ghnItems[]
}

// Response:
{
  code: 200,
  message: string,
  data: {
    service_fee: number  // Shipping fee (VND)
  }
}
```

**Bước 4:** Update shipping fee
```typescript
const serviceFee = Number(resp.data.service_fee) || 0;
onShippingFeeChange(serviceFee);
```

**Debounce:** 500ms để tránh gọi API quá nhiều khi user thay đổi địa chỉ.

**Lưu ý:** Với nhiều stores, hook sẽ gọi GHN API song song cho tất cả stores để tối ưu performance.

---

### 2.6. Validate Applied Vouchers

**Flow tương tự ShoppingCart:** Validate vouchers khi `cartItems`, `productCache`, hoặc `availableVouchers` thay đổi.

**Logic:**
- Kiểm tra voucher còn tồn tại trong `availableVouchers`
- Kiểm tra `minOrderValue` của voucher
- Tính lại `discountValue` dựa trên `storeTotal` hiện tại
- Xóa voucher không hợp lệ và hiển thị thông báo

---

### 2.7. Build Checkout Request Payload

**Function: `handleSubmit` (COD)**

**Bước 1:** Validate
```typescript
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
  setError('Không thể tính phí vận chuyển...');
  return;
}
```

**Bước 2:** Build checkout items
```typescript
const checkoutItemsPayload = cartItems.map(item => {
  const itemType = item.type || 'PRODUCT';
  const basePayload: any = {
    type: itemType,
    quantity: item.quantity
  };
  
  // Xử lý theo type
  if (itemType === 'COMBO') {
    basePayload.comboId = item.productId;  // refId trong trường hợp COMBO
    return basePayload;
  }
  
  // Xử lý PRODUCT
  if (item.variantId !== null && item.variantId !== undefined) {
    // Có variantId → dùng variantId, KHÔNG gửi productId
    basePayload.variantId = item.variantId;
    return basePayload;
  }
  
  // Không có variantId → dùng productId, KHÔNG gửi variantId
  basePayload.productId = item.productId;
  return basePayload;
});
```

**Lưu ý quan trọng:**
- Nếu có `variantId` → chỉ gửi `variantId`, không gửi `productId`
- Nếu không có `variantId` → chỉ gửi `productId`, không gửi `variantId`
- Nếu là `COMBO` → chỉ gửi `comboId`

**Bước 3:** Build store vouchers
```typescript
const buildStoreVouchers = (
  applied: Record<string, AppliedStoreVoucher>,      // Product-specific vouchers
  appliedStoreWide: Record<string, AppliedStoreWideVoucher>  // Store-wide vouchers
): CheckoutStoreVoucher[] => {
  const result: CheckoutStoreVoucher[] = [];
  
  // Add product-specific vouchers
  Object.values(applied).forEach(voucher => {
    result.push({
      storeId: voucher.storeId,
      codes: [voucher.code]
    });
  });
  
  // Add store-wide vouchers (merge với product vouchers nếu cùng store)
  Object.values(appliedStoreWide).forEach(voucher => {
    const existingIndex = result.findIndex(v => v.storeId === voucher.storeId);
    if (existingIndex >= 0) {
      result[existingIndex].codes.push(voucher.code);
    } else {
      result.push({
        storeId: voucher.storeId,
        codes: [voucher.code]
      });
    }
  });
  
  return result;
};
```

**Bước 4:** Build platform vouchers
```typescript
const buildPlatformVouchers = (): PlatformVoucher[] => {
  const platformVouchersMap = new Map<string, number>();
  
  cartItems.forEach(item => {
    const platformVoucherInfo = platformVoucherDiscounts[item.productId];
    if (platformVoucherInfo && platformVoucherInfo.discount > 0) {
      const { campaignProductId } = platformVoucherInfo;
      const currentQuantity = platformVouchersMap.get(campaignProductId) || 0;
      platformVouchersMap.set(campaignProductId, currentQuantity + item.quantity);
    }
  });
  
  return Array.from(platformVouchersMap.entries()).map(([campaignProductId, quantity]) => ({
    campaignProductId,
    quantity
  }));
};
```

**Logic:**
- Group theo `campaignProductId` (platformVoucherId)
- Tính tổng `quantity` cho mỗi `campaignProductId`

**Bước 5:** Build service type IDs
```typescript
const buildServiceTypeIds = (items: CartItem[], productCache: Map<string, Product>): ServiceTypeIds => {
  const result: ServiceTypeIds = {};
  const storeIds = new Set<string>();
  
  // Lấy danh sách storeIds
  items.forEach(item => {
    const product = productCache.get(item.productId);
    if (product?.storeId) {
      storeIds.add(product.storeId);
    }
  });
  
  // Tính serviceTypeId cho mỗi store
  storeIds.forEach(storeId => {
    result[storeId] = calculateServiceTypeIdForStore(items, storeId, productCache);
  });
  
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
```

**Kết quả:** `ServiceTypeIds = Record<storeId, 2 | 5>`

---

### 2.8. Submit COD Checkout Request

**Function: `handleSubmit` (tiếp)**

```typescript
if (paymentMethod === 'cod') {
  const addressForMessage = addresses.find(addr => addr.id === selectedAddressId);
  const message = addressForMessage?.note || '';
  
  const request: CheckoutCodRequest = {
    items: checkoutItemsPayload,
    addressId: selectedAddressId,
    message: message || undefined,
    storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
    platformVouchers: platformVouchers.length > 0 ? platformVouchers : null,
    serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined
  };
  
  console.log('📤 [COD REQUEST]', JSON.stringify(request, null, 2));
  
  // Call API
  const response = await CustomerCartService.checkoutCod(request);
  
  console.log('✅ [COD RESPONSE]', response);
  
  if (response.status === 200) {
    // Success
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
    showCenterSuccess(response.message || 'Đặt hàng thành công!', 'Thành công', 4000);
    setCartItems([]);
    navigate('/orders', { replace: true });
  } else {
    setError(response.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
  }
}
```

**API Call:**
```typescript
// Service: CustomerCartService.checkoutCod()
// API: POST /api/v1/customers/{customerId}/cart/checkout-cod
// Request Body: CheckoutCodRequest {
//   items: CheckoutCodItem[],
//   addressId: string,
//   message?: string,
//   storeVouchers?: StoreVoucher[],
//   platformVouchers?: PlatformVoucher[] | null,
//   serviceTypeIds?: ServiceTypeIds
// }
```

**Request Body Example:**
```json
{
  "items": [
    {
      "type": "PRODUCT",
      "variantId": "variant-uuid-123",
      "quantity": 2
    },
    {
      "type": "PRODUCT",
      "productId": "product-uuid-456",
      "quantity": 1
    },
    {
      "type": "COMBO",
      "comboId": "combo-uuid-789",
      "quantity": 1
    }
  ],
  "addressId": "address-uuid-abc",
  "message": "Giao hàng giờ hành chính",
  "storeVouchers": [
    {
      "storeId": "store-uuid-xyz",
      "codes": ["VOUCHER1", "VOUCHER2"]
    }
  ],
  "platformVouchers": [
    {
      "campaignProductId": "platform-voucher-uuid-123",
      "quantity": 2
    }
  ],
  "serviceTypeIds": {
    "store-uuid-xyz": 2,
    "store-uuid-abc": 5
  }
}
```

**Response:**
```typescript
// Response: CheckoutCodResponse {
//   status: 200,
//   message: string,
//   data: CheckoutCodResponseData {
//     id: string,                    // Order ID
//     status: string,
//     message: string | null,
//     createdAt: string,
//     totalAmount: number,
//     discountTotal: number,
//     grandTotal: number,
//     storeDiscounts: Record<string, number>,
//     receiverName: string,
//     phoneNumber: string,
//     country: string,
//     province: string,
//     district: string,
//     ward: string,
//     street: string,
//     addressLine: string,
//     postalCode: string,
//     note: string | null
//   }
// }
```

---

### 2.9. Xử Lý Response Thành Công

**Flow:**
```typescript
if (response.status === 200) {
  // 1. Xóa checkout session
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  
  // 2. Hiển thị thông báo thành công
  showCenterSuccess(
    response.message || 'Đặt hàng thành công!', 
    'Thành công', 
    4000
  );
  
  // 3. Clear cart items
  setCartItems([]);
  
  // 4. Redirect to orders page
  navigate('/orders', { replace: true });
}
```

**Kết quả:**
- Đơn hàng đã được tạo thành công
- User được redirect đến trang `/orders` để xem đơn hàng
- Cart đã được clear (items đã checkout được xóa khỏi cart)

---

## 3. TÍNH TOÁN TỔNG TIỀN - CHI TIẾT

### 3.1. Subtotal (Trước Platform Discount)

```typescript
const subtotalBeforePlatformDiscount = cartItems.reduce((sum, item) => {
  const original = item.originalPrice ?? item.price;
  return sum + original * item.quantity;
}, 0);
```

**Giải thích:** Tổng giá gốc của tất cả items (chưa áp dụng platform discount).

---

### 3.2. Platform Discount

```typescript
const totalPlatformDiscount = cartItems.reduce((sum, item) => {
  const original = item.originalPrice ?? item.price;
  const discountPerUnit = Math.max(0, original - item.price);
  return sum + discountPerUnit * item.quantity;
}, 0);
```

**Giải thích:** Tổng giảm giá từ platform vouchers = (giá gốc - giá sau giảm) × quantity.

---

### 3.3. Store Voucher Discount

```typescript
// Product-specific vouchers
const productVoucherDiscount = Object.values(appliedStoreVouchers).reduce(
  (total, voucher) => total + voucher.discountValue, 
  0
);

// Store-wide vouchers
const storeWideVoucherDiscount = Object.values(appliedStoreWideVouchers).reduce(
  (total, voucher) => total + voucher.discountValue, 
  0
);

const voucherDiscount = productVoucherDiscount + storeWideVoucherDiscount;
```

**Giải thích:** Tổng giảm giá từ store vouchers (product-specific + store-wide).

---

### 3.4. Shipping Fee (Multi-Store)

**Logic mới:** Tính shipping fee riêng cho từng store vì mỗi store có địa chỉ gửi khác nhau.

```typescript
// Hook: useAutoShippingFee
// 1. Group items by storeId
const itemsByStore = new Map<string, { items: CartItem[]; storeName: string }>();
selectedItems.forEach(item => {
  const product = productCache.get(item.productId);
  if (product?.storeId) {
    if (!itemsByStore.has(product.storeId)) {
      itemsByStore.set(product.storeId, {
        items: [],
        storeName: product.storeName || `Cửa hàng ${product.storeId.substring(0, 6)}`
      });
    }
    itemsByStore.get(product.storeId)!.items.push(item);
  }
});

// 2. Calculate shipping fee for each store
const storeShippingFees: Record<string, StoreShippingFee> = {};
let totalShippingFee = 0;

for (const [storeId, { items: storeItems, storeName }] of itemsByStore.entries()) {
  // Get origin address from first product of this store
  const firstStoreProduct = productCache.get(storeItems[0].productId);
  const fromDistrictId = Number(firstStoreProduct.districtCode);
  const fromWardCode = firstStoreProduct.wardCode;
  
  // Build GHN items for this store
  const ghnItems = storeItems.map(item => {
    const product = productCache.get(item.productId);
    const weightKg = product?.weight && product.weight > 0 ? product.weight : 0.5;
    const weightGr = Math.round(weightKg * 1000);
    return {
      name: item.name,
      quantity: item.quantity,
      length: 1, width: 1, height: 1,
      weight: weightGr
    };
  });
  
  const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);
  const storeServiceTypeId: 2 | 5 = pkgWeight <= 7500 ? 2 : 5;
  
  // Call GHN API for this store
  const resp = await ShippingService.calculateGhnFee({
    service_type_id: storeServiceTypeId,
    from_district_id: fromDistrictId,
    from_ward_code: fromWardCode,
    to_district_id: toDistrictId,
    to_ward_code: toWardCode,
    weight: pkgWeight,
    items: ghnItems
  });
  
  const serviceFee = resp.data.service_fee;
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: serviceFee
  };
  totalShippingFee += serviceFee;
}

// 3. Update total shipping fee
onShippingFeeChange(totalShippingFee);
onStoreShippingFeesChange(storeShippingFees);
```

**Giải thích:** 
- **Group items by storeId:** Mỗi store có items riêng
- **Calculate per store:** Mỗi store có địa chỉ gửi riêng (từ product đầu tiên của store đó)
- **Service type per store:** Tính riêng dựa trên weight của items trong store đó
- **Sum total:** Tổng shipping fee = sum của tất cả stores
- **UI hiển thị:** Shipping fee được hiển thị theo từng store trong CartItemList và OrderSummaryCard

---

### 3.5. Grand Total

```typescript
const total = Math.max(
  0,
  subtotalBeforePlatformDiscount 
    - totalPlatformDiscount 
    - voucherDiscount 
    + shippingFee
);
```

**Công thức:**
```
Grand Total = Subtotal (giá gốc)
            - Platform Discount
            - Store Voucher Discount
            + Shipping Fee
```

---

## 4. STATE MANAGEMENT

### 4.1. Shopping Cart State

```typescript
// Cart data
const { cart, isLoading, error, loadCart } = useCart();

// UI items (đã áp dụng platform discount)
const [items, setItems] = useState<UICartItem[]>([]);

// Addresses
const [addresses, setAddresses] = useState<CustomerAddressApiItem[]>([]);
const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

// Vouchers
const [availableVouchers, setAvailableVouchers] = useState<ShopVoucher[]>([]);
const [productVouchersMapState, setProductVouchersMapState] = useState<Map<string, ShopVoucher[]>>(new Map());
const [appliedStoreVouchers, setAppliedStoreVouchers] = useState<Record<string, AppliedStoreVoucher>>({});

// Service type & shipping
const { serviceTypeId, packageWeight, productCache, setProductCache } = useServiceTypeCalculator({ items });
const [shippingFee, setShippingFee] = useState<number>(0);
```

---

### 4.2. Checkout State

```typescript
// Cart items (đã filter và enhance)
const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [selectedCartItemIds, setSelectedCartItemIds] = useState<string[]>([]);

// Addresses
const [addresses, setAddresses] = useState<CustomerAddressApiItem[]>([]);
const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

// Vouchers
const [availableVouchers, setAvailableVouchers] = useState<ShopVoucher[]>([]);
const [appliedStoreVouchers, setAppliedStoreVouchers] = useState<Record<string, AppliedStoreVoucher>>({});
const [storeWideVouchers, setStoreWideVouchers] = useState<Record<string, StoreVoucher[]>>({});
const [appliedStoreWideVouchers, setAppliedStoreWideVouchers] = useState<Record<string, AppliedStoreWideVoucher>>({});
const [platformVoucherDiscounts, setPlatformVoucherDiscounts] = useState<Record<string, { discount: number; campaignProductId: string }>>({});

// Payment & shipping
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
const [shippingFee, setShippingFee] = useState<number>(0);
const [shippingFeeError, setShippingFeeError] = useState<string | null>(null);

// Service type
const { serviceTypeId, productCache, setProductCache } = useServiceTypeCalculator({ items: shippingItems });

// Status
const [isLoading, setIsLoading] = useState<boolean>(true);
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

---

## 5. API ENDPOINTS SUMMARY

### 5.1. Cart APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/v1/customers/{customerId}/cart` | GET | Lấy thông tin cart |
| `/api/v1/customers/{customerId}/cart/items` | POST | Thêm items vào cart |
| `/api/v1/customers/{customerId}/cart/item/quantity` | PATCH | Cập nhật số lượng |
| `/api/v1/customers/{customerId}/cart/items` | DELETE | Xóa items khỏi cart |
| `/api/v1/customers/{customerId}/cart` | DELETE | Xóa toàn bộ cart |
| `/api/v1/customers/{customerId}/cart/checkout-cod` | POST | Checkout COD |

### 5.2. Address APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/customers/{customerId}/addresses` | GET | Lấy danh sách addresses |
| `/api/customers/{customerId}/addresses` | POST | Tạo address mới |
| `/api/customers/{customerId}/addresses/{addressId}` | PUT | Cập nhật address |
| `/api/customers/{customerId}/addresses/{addressId}` | DELETE | Xóa address |

### 5.3. Product & Voucher APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/products/{productId}` | GET | Lấy chi tiết product |
| `/api/products/view/{productId}/vouchers` | GET | Lấy vouchers cho product |
| `/api/v1/stores/{storeId}/vouchers` | GET | Lấy store-wide vouchers |

### 5.4. Shipping APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/ghn/calculate-fee` | POST | Tính phí vận chuyển GHN |

---

## 6. ERROR HANDLING

### 6.1. Cart Errors

```typescript
// Format error từ CustomerCartService
static formatCartError(error: any): string {
  if (error?.status === 400) return 'Dữ liệu không hợp lệ...';
  if (error?.status === 404) return 'Không tìm thấy sản phẩm...';
  if (error?.status === 401) return 'Vui lòng đăng nhập...';
  return error?.message || 'Đã xảy ra lỗi...';
}
```

### 6.2. Checkout Errors

- **Missing payload:** Redirect về `/cart`
- **Empty cart:** Redirect về `/cart`
- **Missing address:** Hiển thị error, yêu cầu chọn address
- **Missing payment method:** Hiển thị error, yêu cầu chọn payment
- **Shipping fee error:** Hiển thị error, không cho submit
- **API error:** Hiển thị error message từ response

---

## 7. OPTIMIZATION & PERFORMANCE

### 7.1. Caching

- **Product cache:** Cache product details trong `productCache` Map để tránh fetch lại
- **Voucher cache:** Không cache (vouchers có thể thay đổi theo thời gian)

### 7.2. Debouncing

- **Shipping fee calculation:** Debounce 500ms để tránh gọi API quá nhiều khi user thay đổi địa chỉ

### 7.3. Parallel Loading

- **Initial load:** `loadCart()` và `loadAddresses()` chạy song song
- **Voucher loading:** Load vouchers và product details song song cho nhiều products

### 7.4. Lazy Loading

- **Product details:** Chỉ fetch khi cần (missing trong cache)
- **Store-wide vouchers:** Chỉ load khi có cart items và product cache

---

## 8. FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    SHOPPING CART PAGE                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  1. Load Cart & Addresses         │
        │     - GET /cart                   │
        │     - GET /addresses              │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  2. Apply Platform Discount       │
        │     - Load vouchers per product   │
        │     - Calculate discounted price  │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  3. Load Product Vouchers         │
        │     - Map vouchers by productId   │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  4. Calculate Totals             │
        │     - Subtotal                    │
        │     - Platform discount           │
        │     - Voucher discount            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  5. Proceed to Checkout           │
        │     - Save to sessionStorage      │
        │     - Navigate to /checkout       │
        └───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT PAGE                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  1. Load Payload from Session     │
        │     - Restore selected items      │
        │     - Restore applied vouchers    │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  2. Load Cart & Enhance Items      │
        │     - Apply platform discount     │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  3. Load Vouchers                 │
        │     - Product vouchers            │
        │     - Store-wide vouchers         │
        │     - Platform discounts          │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  4. Auto Calculate Shipping Fee   │
        │     - POST /ghn/calculate-fee    │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  5. Build Checkout Payload         │
        │     - Items (variantId/productId) │
        │     - Store vouchers              │
        │     - Platform vouchers           │
        │     - Service type IDs            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  6. Submit COD Request             │
        │     - POST /checkout-cod          │
        └───────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   SUCCESS?    │
                    └───────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌───────────────┐      ┌───────────────┐
        │   SUCCESS     │      │     ERROR     │
        │               │      │               │
        │ - Clear       │      │ - Show error  │
        │   session     │      │ - Keep form   │
        │ - Show        │      │               │
        │   success msg │      │               │
        │ - Navigate    │      │               │
        │   to /orders  │      │               │
        └───────────────┘      └───────────────┘
```

---

## 9. KEY POINTS & BEST PRACTICES

### 9.1. Platform Discount

- **Áp dụng 2 lần:** Một lần ở Cart page, một lần ở Checkout page để đảm bảo nhất quán
- **Chỉ cho PRODUCT:** Không áp dụng cho COMBO
- **Time-based validation:** Kiểm tra `slotOpenTime/slotCloseTime` hoặc `startTime/endTime`

### 9.2. Voucher Management

- **Product-specific vouchers:** Map theo `productId`, mỗi product chỉ có vouchers của chính nó
- **Store-wide vouchers:** Map theo `storeId`, có thể áp dụng cho toàn bộ products của store
- **Validation:** Validate vouchers khi items hoặc totals thay đổi
- **Duplicate prevention:** Mỗi voucher code chỉ có thể áp dụng cho một product

### 9.3. Variant Handling

- **Có variantId:** Chỉ gửi `variantId`, không gửi `productId`
- **Không có variantId:** Chỉ gửi `productId`, không gửi `variantId`
- **COMBO:** Chỉ gửi `comboId`

### 9.4. Shipping Fee (Multi-Store)

- **Group by store:** Items được group theo `storeId` vì mỗi store có địa chỉ gửi riêng
- **Calculate per store:** Mỗi store gọi GHN API riêng với:
  - `from_district_id`, `from_ward_code`: Từ product đầu tiên của store đó
  - `to_district_id`, `to_ward_code`: Từ selected address (chung cho tất cả stores)
  - `service_type_id`: Tính riêng dựa trên weight của items trong store đó
- **Sum total:** Tổng shipping fee = sum của tất cả stores
- **UI display:** Hiển thị shipping fee theo từng store trong CartItemList và OrderSummaryCard
- **Auto-calculate:** Tự động tính khi có địa chỉ và items
- **Debounce:** 500ms để tránh spam API
- **Error handling:** Set error cho từng store nếu tính thất bại, tổng fee vẫn có thể > 0 nếu một số store thành công

### 9.5. State Management

- **Session storage:** Lưu checkout payload để restore khi reload
- **Product cache:** Cache product details để tránh fetch lại
- **Validation:** Validate vouchers và totals khi dependencies thay đổi

---

## 10. TESTING SCENARIOS

### 10.1. Happy Path

1. User có items trong cart
2. Chọn items và áp dụng vouchers
3. Chọn địa chỉ
4. Shipping fee được tính tự động
5. Chọn payment method (COD)
6. Submit checkout
7. Nhận response thành công
8. Redirect đến orders page

### 10.2. Error Scenarios

1. **Empty cart:** Hiển thị error, redirect về cart
2. **Missing address:** Hiển thị error, yêu cầu chọn address
3. **Shipping fee error:** Hiển thị error, không cho submit
4. **Invalid voucher:** Tự động xóa voucher, hiển thị thông báo
5. **API error:** Hiển thị error message từ response

### 10.3. Edge Cases

1. **Platform discount hết hạn:** Tự động cập nhật giá về giá gốc
2. **Voucher minOrderValue không đạt:** Tự động xóa voucher
3. **Product out of stock:** Backend sẽ reject, frontend hiển thị error
4. **Multiple stores:** Mỗi store có shipping fee riêng (tính tổng)
5. **COMBO items:** Không áp dụng platform discount, chỉ áp dụng store vouchers

---

## KẾT LUẬN

Luồng từ Shopping Cart đến Checkout COD thành công bao gồm nhiều bước phức tạp:

1. **Load và enhance data:** Cart items, addresses, vouchers
2. **Tính toán discounts:** Platform discount, store vouchers
3. **Tính shipping fee:** Tự động dựa trên địa chỉ và weight
4. **Build payload:** Items, vouchers, service types
5. **Submit request:** Gọi API checkout COD
6. **Handle response:** Success hoặc error

Tất cả các bước đều có error handling và validation để đảm bảo trải nghiệm người dùng tốt nhất.

