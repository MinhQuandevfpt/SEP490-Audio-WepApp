# Luồng Xử Lý Khi Ấn Nút "Xác nhận & Thanh toán" (COD)

## Tổng Quan

Khi người dùng ấn nút **"Xác nhận & Thanh toán"** trên trang checkout và chọn phương thức thanh toán **COD (Cash on Delivery)**, hệ thống sẽ thực hiện một chuỗi các bước xử lý phức tạp để tạo đơn hàng.

**Component chính:** `CheckoutOrderContainer.tsx`  
**Function xử lý:** `handleSubmit()`  
**Service API:** `CustomerCartService.checkoutCod()`

---

## 1. Vị Trí Nút "Xác nhận & Thanh toán"

### 1.1. Component: `OrderSummaryCard.tsx`

```tsx
<button
  disabled={disabled}
  onClick={onSubmit}
  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
>
  Xác nhận & Thanh toán
</button>
```

**Props:**
- `disabled`: Disable khi:
  - `isSubmitting` (đang xử lý)
  - `!selectedAddressId` (chưa chọn địa chỉ)
  - `!paymentMethod` (chưa chọn phương thức thanh toán)
  - `cartItems.length === 0` (giỏ hàng trống)
  - `!!shippingFeeError` (có lỗi tính phí vận chuyển)
- `onSubmit`: Callback → `handleSubmit()` trong `CheckoutOrderContainer`

---

## 2. Luồng Xử Lý Chi Tiết: `handleSubmit()`

### 2.1. Bước 1: Validation Cơ Bản

**Mục đích:** Kiểm tra các điều kiện bắt buộc trước khi xử lý.

```typescript
// 1. Kiểm tra giỏ hàng không trống
if (cartItems.length === 0) {
  setError('Giỏ hàng của bạn đang trống.');
  return;
}

// 2. Kiểm tra đã chọn địa chỉ nhận hàng
if (!selectedAddressId) {
  setError('Vui lòng chọn địa chỉ nhận hàng.');
  return;
}

// 3. Kiểm tra đã chọn phương thức thanh toán
if (!paymentMethod) {
  setError('Vui lòng chọn phương thức thanh toán.');
  return;
}

// 4. Kiểm tra không có lỗi tính phí vận chuyển
if (shippingFeeError) {
  setError('Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau.');
  return;
}
```

**Kết quả:**
- Nếu bất kỳ validation nào fail → Hiển thị lỗi, dừng xử lý
- Nếu tất cả pass → Tiếp tục bước 2

---

### 2.2. Bước 2: Lấy Message từ Địa Chỉ

**Mục đích:** Lấy ghi chú (note) từ địa chỉ nhận hàng đã chọn.

```typescript
const addressForMessage = addresses.find(addr => addr.id === selectedAddressId);
const message = addressForMessage?.note || '';
```

**Kết quả:** `message` sẽ được gửi kèm trong request body (có thể là empty string).

---

### 2.3. Bước 3: Build Checkout Items Payload

**Mục đích:** Chuyển đổi `cartItems` thành format phù hợp với API backend.

**Logic quan trọng:**
- Nếu có `variantId` → Chỉ gửi `variantId`, **KHÔNG** gửi `productId`
- Nếu không có `variantId` → Chỉ gửi `productId`, **KHÔNG** gửi `variantId`
- Nếu `type === 'COMBO'` → Dùng `comboId` (lấy từ `productId`)

```typescript
const checkoutItemsPayload = cartItems.map(item => {
  const itemType = item.type || 'PRODUCT';
  const basePayload: any = {
    type: itemType,
    quantity: item.quantity,
  };
  
  // Xử lý COMBO
  if (itemType === 'COMBO') {
    basePayload.comboId = item.productId; // refId trong trường hợp COMBO
    return basePayload;
  }
  
  // Xử lý PRODUCT
  // Nếu có variantId (không null), dùng variantId và không gửi productId
  if (item.variantId !== null && item.variantId !== undefined) {
    basePayload.variantId = item.variantId;
    return basePayload; // KHÔNG gửi productId
  }
  
  // Nếu không có variantId (null), dùng productId và không gửi variantId
  basePayload.productId = item.productId;
  return basePayload; // KHÔNG gửi variantId
});
```

**Ví dụ Output:**

```json
[
  {
    "type": "PRODUCT",
    "variantId": "0b04c7b4-83a3-4f81-939f-9145dde83ee8",
    "quantity": 1
  },
  {
    "type": "PRODUCT",
    "productId": "abc123",
    "quantity": 2
  },
  {
    "type": "COMBO",
    "comboId": "combo456",
    "quantity": 1
  }
]
```

---

### 2.4. Bước 4: Build Store Vouchers

**Mục đích:** Tổng hợp các voucher đã áp dụng (product-specific + store-wide) thành format API.

**Function:** `buildStoreVouchers(appliedStoreVouchers, appliedStoreWideVouchers)`

```typescript
const buildStoreVouchers = (
  applied: Record<string, AppliedStoreVoucher>,
  appliedStoreWide: Record<string, AppliedStoreWideVoucher>
): CheckoutStoreVoucher[] => {
  const result: CheckoutStoreVoucher[] = [];
  
  // 1. Thêm product-specific vouchers
  Object.values(applied).forEach(voucher => {
    result.push({
      storeId: voucher.storeId,
      codes: [voucher.code],
    });
  });
  
  // 2. Thêm store-wide vouchers
  Object.values(appliedStoreWide).forEach(voucher => {
    const existingIndex = result.findIndex(v => v.storeId === voucher.storeId);
    if (existingIndex >= 0) {
      // Nếu store đã có voucher, thêm code vào mảng codes
      result[existingIndex].codes.push(voucher.code);
    } else {
      // Nếu store chưa có voucher, tạo entry mới
      result.push({
        storeId: voucher.storeId,
        codes: [voucher.code],
      });
    }
  });
  
  return result;
};
```

**Ví dụ Output:**

```json
[
  {
    "storeId": "store-123",
    "codes": ["VOUCHER1", "VOUCHER2"]
  },
  {
    "storeId": "store-456",
    "codes": ["VOUCHER3"]
  }
]
```

**Lưu ý:** Nếu không có voucher nào → Trả về `[]`, sau đó sẽ được set thành `undefined` trong request.

---

### 2.5. Bước 5: Build Service Type IDs

**Mục đích:** Xác định loại dịch vụ vận chuyển (light/heavy) cho từng store.

**Function:** `buildServiceTypeIds(cartItems, productCache)`

**Logic:**
- Tính tổng trọng lượng (gram) của tất cả sản phẩm trong mỗi store
- Nếu tổng trọng lượng ≤ 7500g (7.5kg) → `serviceTypeId = 2` (light package)
- Nếu tổng trọng lượng > 7500g → `serviceTypeId = 5` (heavy package)

```typescript
const buildServiceTypeIds = (items: CartItem[], productCache: Map<string, Product>): ServiceTypeIds => {
  const result: ServiceTypeIds = {};
  const storeIds = new Set<string>();
  
  // 1. Thu thập tất cả storeId từ items
  items.forEach(item => {
    const product = productCache.get(item.productId);
    if (product?.storeId) {
      storeIds.add(product.storeId);
    }
  });
  
  // 2. Tính serviceTypeId cho từng store
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
      const weightKg = product.weight && product.weight > 0 ? product.weight : 0.5; // Default 0.5kg
      totalWeight += weightKg * 1000 * item.quantity; // Convert to grams
    }
  });
  return totalWeight <= 7500 ? 2 : 5;
};
```

**Ví dụ Output:**

```json
{
  "78394c8f-2c88-4b2e-a9a0-7632555844f5": 2,
  "another-store-id": 5
}
```

**Lưu ý:** Nếu không có items → Trả về `{}`, sau đó sẽ được set thành `undefined` trong request.

---

### 2.6. Bước 6: Fetch Platform Vouchers (Nếu Thiếu)

**Mục đích:** Đảm bảo platform vouchers được fetch đầy đủ, đặc biệt cho items có variant.

**Vấn đề:** Khi có variant, `checkoutItemsPayload` chỉ chứa `variantId`, không có `productId`. Nhưng platform voucher được lưu theo `productId` (parent product), nên cần tìm lại `productId` từ `cartItems`.

**Logic:**

```typescript
// 1. Tìm các productId cần fetch platform voucher
const missingProductIds = new Set<string>();

checkoutItemsPayload.forEach(item => {
  if (item.variantId && !item.productId) {
    // Có variantId nhưng không có productId trong payload
    // Tìm productId từ cartItems
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

// 2. Fetch platform vouchers cho các productId còn thiếu
let finalPlatformVoucherDiscounts = { ...platformVoucherDiscounts };

if (missingProductIds.size > 0) {
  const voucherPromises = Array.from(missingProductIds).map(async (productId) => {
    try {
      const voucherRes = await ProductVoucherService.getProductVouchers(productId, 'ALL', null);
      const platformCampaigns = voucherRes.data?.vouchers?.platform || [];
      let platformDiscount = 0;
      let campaignProductId: string | null = null;
      
      if (voucherRes.data?.product) {
        const originalPrice = voucherRes.data.product.price;
        
        // Tìm voucher ACTIVE đầu tiên
        for (const campaign of platformCampaigns) {
          if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
            const activeVoucher = campaign.vouchers.find((v: any) => v.status === 'ACTIVE');
            if (activeVoucher) {
              campaignProductId = activeVoucher.platformVoucherId;
              
              // Tính discount
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
        return { productId, discount: platformDiscount, campaignProductId };
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch platform voucher for product ${productId}:`, error);
      return null;
    }
  });
  
  const results = await Promise.all(voucherPromises);
  
  // 3. Cập nhật finalPlatformVoucherDiscounts
  results.forEach(result => {
    if (result) {
      finalPlatformVoucherDiscounts[result.productId] = {
        discount: result.discount,
        campaignProductId: result.campaignProductId,
      };
    }
  });
}
```

**Kết quả:** `finalPlatformVoucherDiscounts` chứa đầy đủ platform voucher info cho tất cả products (kể cả có variant).

---

### 2.7. Bước 7: Build Platform Vouchers Array

**Mục đích:** Chuyển đổi `finalPlatformVoucherDiscounts` thành array format cho API.

**Logic:** Gộp các items có cùng `campaignProductId` và tính tổng `quantity`.

```typescript
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
  
  // Nếu có platform voucher cho productId này
  if (productId && finalPlatformVoucherDiscounts[productId]) {
    const { campaignProductId } = finalPlatformVoucherDiscounts[productId];
    const currentQuantity = platformVouchersMap.get(campaignProductId) || 0;
    platformVouchersMap.set(campaignProductId, currentQuantity + item.quantity);
  }
});

// Chuyển Map thành Array
const platformVouchers = Array.from(platformVouchersMap.entries()).map(([campaignProductId, quantity]) => ({
  campaignProductId,
  quantity,
}));
```

**Ví dụ Output:**

```json
[
  {
    "campaignProductId": "campaign-123",
    "quantity": 3
  },
  {
    "campaignProductId": "campaign-456",
    "quantity": 1
  }
]
```

**Lưu ý:** Nếu không có platform voucher nào → Trả về `[]`, sau đó sẽ được set thành `null` trong request.

---

### 2.8. Bước 8: Debug Logging

**Mục đích:** Log thông tin để debug.

```typescript
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
```

---

### 2.9. Bước 9: Set Submitting State

**Mục đích:** Bắt đầu trạng thái submitting, clear error.

```typescript
setIsSubmitting(true);
setError(null);
```

**Kết quả:** Nút "Xác nhận & Thanh toán" sẽ bị disable, UI hiển thị "Đang gửi đơn hàng...".

---

### 2.10. Bước 10: Build Request Body (COD)

**Mục đích:** Tạo request body đầy đủ cho API.

```typescript
if (paymentMethod === 'cod') {
  const request: CheckoutCodRequest = {
    items: checkoutItemsPayload,
    addressId: selectedAddressId,
    message: message || undefined,
    storeVouchers: storeVouchers.length > 0 ? storeVouchers : undefined,
    platformVouchers: platformVouchers.length > 0 ? platformVouchers : null,
    serviceTypeIds: Object.keys(serviceTypeIds).length > 0 ? serviceTypeIds : undefined,
  };
}
```

**Ví dụ Request Body:**

```json
{
  "items": [
    {
      "type": "PRODUCT",
      "variantId": "0b04c7b4-83a3-4f81-939f-9145dde83ee8",
      "quantity": 1
    }
  ],
  "addressId": "b0a52240-7e4f-43eb-952d-83587aa4dc6b",
  "message": "",
  "storeVouchers": null,
  "platformVouchers": [
    {
      "campaignProductId": "campaign-123",
      "quantity": 1
    }
  ],
  "serviceTypeIds": {
    "78394c8f-2c88-4b2e-a9a0-7632555844f5": 2
  }
}
```

---

### 2.11. Bước 11: Log Full Request Body

**Mục đích:** Log đầy đủ request body (kể cả null/undefined/empty) để debug.

```typescript
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
```

---

### 2.12. Bước 12: Call API `checkoutCod`

**Mục đích:** Gửi request đến backend để tạo đơn hàng.

**Service:** `CustomerCartService.checkoutCod(request)`

```typescript
const response = await CustomerCartService.checkoutCod(request);
```

**API Endpoint:**
```
POST /api/v1/customers/{customerId}/cart/checkout-cod
```

**Service Implementation:**

```typescript
static async checkoutCod(request: CheckoutCodRequest): Promise<CheckoutCodResponse> {
  try {
    const customerId = this.getCustomerId();
    
    const response = await HttpInterceptor.post<CheckoutCodResponse>(
      `/api/v1/customers/${customerId}/cart/checkout-cod`,
      request,
      { userType: 'customer' }
    );
    
    return response;
  } catch (error) {
    console.error('❌ [COD CHECKOUT ERROR]', error);
    throw error;
  }
}
```

**Request Flow:**
1. `HttpInterceptor.post()` → Thêm authentication headers
2. Gửi POST request đến backend
3. Backend xử lý:
   - Validate request
   - Tạo đơn hàng (có thể tách thành nhiều orders nếu có nhiều stores)
   - Áp dụng vouchers
   - Tính toán tổng tiền
   - Lưu vào database
4. Trả về response

---

### 2.13. Bước 13: Log Full Response Body

**Mục đích:** Log đầy đủ response body (kể cả null/undefined/empty) để debug.

```typescript
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
```

**Ví dụ Response Body:**

```json
{
  "status": 200,
  "message": "✅ Checkout COD thành công",
  "data": [
    {
      "id": "8634489f-74e6-4bf7-bdc3-519cb21f7c6a",
      "orderCode": "DATS061225000033",
      "status": "PENDING",
      "message": "string",
      "createdAt": "2025-12-06T15:59:05.833499317",
      "storeId": "78394c8f-2c88-4b2e-a9a0-7632555844f5",
      "storeName": "Seller1",
      "totalAmount": 700000,
      "shippingFeeTotal": 29001,
      "discountTotal": 0,
      "grandTotal": 729001,
      "storeVoucherDiscount": null,
      "platformDiscount": {},
      "receiverName": "Nguyễn Văn A",
      "phoneNumber": "039690166",
      "country": "Việt Nam",
      "province": "Hà Nội",
      "district": "Huyện Mê Linh",
      "ward": "Xã Tiến Thịnh",
      "street": "Tô Hò",
      "addressLine": "155",
      "postalCode": "26565",
      "note": "",
      "shippingServiceTypeId": 2
    }
  ]
}
```

---

### 2.14. Bước 14: Xử Lý Response

**Mục đích:** Xử lý kết quả từ API.

#### 2.14.1. Trường Hợp Thành Công (`status === 200`)

```typescript
if (response.status === 200) {
  // 1. Xóa checkout session data
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  
  // 2. Hiển thị thông báo thành công
  showCenterSuccess(response.message || 'Đặt hàng thành công!', 'Thành công', 4000);
  
  // 3. Clear cart items trong state
  setCartItems([]);
  
  // 4. Redirect đến trang Order History
  navigate('/orders', { replace: true });
}
```

**Kết quả:**
- User thấy thông báo "✅ Checkout COD thành công"
- Giỏ hàng được clear
- Chuyển hướng đến `/orders` để xem đơn hàng vừa tạo

#### 2.14.2. Trường Hợp Thất Bại (`status !== 200`)

```typescript
else {
  setError(response.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
}
```

**Kết quả:**
- Hiển thị lỗi trong UI (phía trên OrderSummaryCard)
- User có thể thử lại

---

### 2.15. Bước 15: Error Handling

**Mục đích:** Xử lý các lỗi có thể xảy ra (network, validation, server error).

```typescript
catch (err: any) {
  const msg =
    err?.message ||
    err?.data?.message ||
    CustomerCartService.formatCartError(err) ||
    'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.';
  setError(msg);
}
```

**Các loại lỗi có thể xảy ra:**
1. **Network Error:** Mất kết nối, timeout
2. **Validation Error:** Backend reject request (ví dụ: sản phẩm hết hàng, voucher không hợp lệ)
3. **Server Error:** Lỗi 500 từ backend
4. **Authentication Error:** Token hết hạn, không có quyền

**Kết quả:** Hiển thị thông báo lỗi trong UI.

---

### 2.16. Bước 16: Finally - Reset Submitting State

**Mục đích:** Đảm bảo `isSubmitting` luôn được reset, kể cả khi có lỗi.

```typescript
finally {
  setIsSubmitting(false);
}
```

**Kết quả:** Nút "Xác nhận & Thanh toán" được enable lại, cho phép user thử lại.

---

## 3. Sơ Đồ Luồng Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Xác nhận & Thanh toán" button                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Validation: Cart, Address, Payment Method, Shipping Fee │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Get message from selected address                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Build checkoutItemsPayload                               │
│    - PRODUCT with variantId → only variantId                 │
│    - PRODUCT without variant → only productId                │
│    - COMBO → comboId                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Build storeVouchers (product + store-wide)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Build serviceTypeIds (2 or 5 per store)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Fetch missing platform vouchers (for variants)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Build platformVouchers array                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Debug logging                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Set isSubmitting = true                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Build request body                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Log full request body                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. Call API: CustomerCartService.checkoutCod(request)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 13. Log full response body                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐          ┌──────────────────┐
│ Success       │          │ Error            │
│ (status 200)  │          │ (status != 200)  │
└───────┬───────┘          └────────┬─────────┘
        │                           │
        ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│ - Remove checkout session                                    │
│ - Show success notification                                  │
│ - Clear cart items                                           │
│ - Navigate to /orders                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Các Trường Hợp Đặc Biệt

### 4.1. Nhiều Stores trong Một Đơn Hàng

**Tình huống:** User có items từ nhiều stores khác nhau.

**Xử lý:**
- Backend sẽ tách thành nhiều orders (mỗi order cho một store)
- Response `data` là một array các orders
- Mỗi order có `storeId`, `storeName` riêng

**Ví dụ Response:**

```json
{
  "status": 200,
  "data": [
    {
      "orderCode": "DATS061225000033",
      "storeId": "store-1",
      "storeName": "Store 1",
      "grandTotal": 500000
    },
    {
      "orderCode": "DATS061225000034",
      "storeId": "store-2",
      "storeName": "Store 2",
      "grandTotal": 300000
    }
  ]
}
```

---

### 4.2. Sản Phẩm Có Variant

**Tình huống:** Item có `variantId`, cần áp dụng platform voucher.

**Xử lý:**
1. Trong `checkoutItemsPayload`, chỉ gửi `variantId`, không gửi `productId`
2. Trong bước 6, tìm lại `productId` từ `cartItems` dựa trên `variantId`
3. Fetch platform voucher cho `productId` (parent product)
4. Build `platformVouchers` với `campaignProductId` từ parent product

**Lưu ý:** Backend sẽ tự động map `variantId` → `productId` để áp dụng platform voucher.

---

### 4.3. Không Có Voucher Nào

**Tình huống:** User không áp dụng voucher nào.

**Xử lý:**
- `storeVouchers = []` → Set thành `undefined` trong request
- `platformVouchers = []` → Set thành `null` trong request

**Request Body:**

```json
{
  "items": [...],
  "addressId": "...",
  "message": "",
  "storeVouchers": undefined,  // hoặc không có field này
  "platformVouchers": null,
  "serviceTypeIds": {...}
}
```

---

### 4.4. Lỗi Tính Phí Vận Chuyển

**Tình huống:** `shippingFeeError` không null (ví dụ: địa chỉ không hợp lệ).

**Xử lý:**
- Validation ở bước 1 sẽ fail
- Hiển thị lỗi: "Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau."
- Không cho phép submit

---

## 5. Tóm Tắt Các Task Chính

Khi ấn nút **"Xác nhận & Thanh toán" (COD)**, hệ thống thực hiện các task sau:

1. ✅ **Validation:** Kiểm tra cart, address, payment method, shipping fee
2. ✅ **Extract Message:** Lấy note từ địa chỉ đã chọn
3. ✅ **Build Items Payload:** Chuyển đổi cartItems thành format API (xử lý variant/combo)
4. ✅ **Build Store Vouchers:** Tổng hợp product-specific + store-wide vouchers
5. ✅ **Build Service Type IDs:** Xác định loại dịch vụ vận chuyển (2 hoặc 5) cho từng store
6. ✅ **Fetch Platform Vouchers:** Đảm bảo platform vouchers được fetch đầy đủ (đặc biệt cho variants)
7. ✅ **Build Platform Vouchers:** Chuyển đổi platform voucher discounts thành array format
8. ✅ **Debug Logging:** Log thông tin để debug
9. ✅ **Set Submitting State:** Bắt đầu trạng thái submitting
10. ✅ **Build Request Body:** Tạo request body đầy đủ
11. ✅ **Log Request:** Log full request body
12. ✅ **Call API:** Gửi request đến backend
13. ✅ **Log Response:** Log full response body
14. ✅ **Handle Success:** Xóa session, show notification, clear cart, redirect
15. ✅ **Handle Error:** Hiển thị lỗi nếu có
16. ✅ **Reset State:** Reset `isSubmitting` trong finally

---

## 6. Files Liên Quan

- **Component:** `src/components/CheckoutOrderComponents/CheckoutOrderContainer.tsx`
- **Button Component:** `src/components/CheckoutOrderComponents/OrderSummaryCard.tsx`
- **Service:** `src/services/customer/CartService.ts`
- **Types:** `src/types/cart.ts`
- **Hooks:** 
  - `src/hooks/useAutoShippingFee.ts` (tính phí vận chuyển)
  - `src/hooks/useServiceTypeCalculator.ts` (tính service type)

---

## 7. Lưu Ý Quan Trọng

1. **Variant Handling:** Khi có variant, luôn dùng `productId` (parent) để fetch platform voucher, không dùng `variantId`.

2. **Service Type:** Service type (2 hoặc 5) được tính dựa trên tổng trọng lượng của tất cả sản phẩm trong store, không phải từng sản phẩm riêng lẻ.

3. **Multiple Stores:** Nếu có nhiều stores, backend sẽ tách thành nhiều orders. Response `data` là array.

4. **Error Handling:** Tất cả lỗi đều được catch và hiển thị trong UI, không crash app.

5. **Session Storage:** Checkout session data được lưu trong `sessionStorage` với key `checkout:payload:v1`, và được xóa sau khi checkout thành công.

6. **Console Logging:** Request và response body được log đầy đủ (kể cả null/undefined/empty) để dễ debug.

---

**Tài liệu này mô tả chi tiết toàn bộ luồng xử lý khi ấn nút "Xác nhận & Thanh toán" bằng COD. Mọi thắc mắc hoặc cần bổ sung, vui lòng liên hệ team phát triển.**

