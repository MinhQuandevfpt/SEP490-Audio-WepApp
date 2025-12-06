# Giải Thích Chi Tiết: Voucher và Platform Voucher cho Variant

## Tổng Quan

Trong hệ thống checkout, có **2 loại voucher** chính:
1. **Store Vouchers** (Voucher của cửa hàng): Bao gồm product-specific vouchers và store-wide vouchers
2. **Platform Vouchers** (Voucher nền tảng): Được áp dụng tự động cho sản phẩm, đặc biệt phức tạp khi xử lý với **variant products**

---

## Phần 1: Store Vouchers (Voucher Cửa Hàng)

### 1.1. Các Loại Store Vouchers

#### 1.1.1. Product-Specific Vouchers
- **Định nghĩa:** Voucher áp dụng cho một sản phẩm cụ thể
- **Lưu trữ:** `appliedStoreVouchers: Record<string, AppliedStoreVoucher>`
  - Key: `productId` (product gốc, không phải variantId)
  - Value: Thông tin voucher đã áp dụng

#### 1.1.2. Store-Wide Vouchers
- **Định nghĩa:** Voucher áp dụng cho toàn bộ cửa hàng (tất cả sản phẩm trong store)
- **Lưu trữ:** `appliedStoreWideVouchers: Record<string, AppliedStoreWideVoucher>`
  - Key: `storeId`
  - Value: Thông tin voucher đã áp dụng

### 1.2. Load Store Vouchers

**Function:** `loadVouchers()` trong `useEffect` (dòng 507-653)

**Bước 1: Collect Product IDs**
```typescript
const productIds = new Set<string>();
cartItems.forEach(item => {
  // Luôn dùng productId (product gốc) để get vouchers
  // Kể cả khi có variant, vẫn dùng productId
  productIds.add(item.productId);
});
```

**Bước 2: Fetch Vouchers cho từng Product**
```typescript
const responses = await Promise.all(
  Array.from(productIds).map(async pid => {
    try {
      const [voucherRes, productRes] = await Promise.all([
        ProductVoucherService.getProductVouchers(pid, 'ALL', null),
        ProductListService.getProductById(pid),
      ]);
      return { productId: pid, voucherRes, productRes };
    } catch {
      return { productId: pid, voucherRes: null, productRes: null };
    }
  })
);
```

**Bước 3: Extract Shop Vouchers**
```typescript
const shopVouchers: ShopVoucher[] = [];

responses.forEach(({ productId, voucherRes, productRes }) => {
  if (voucherRes && productRes) {
    const storeId = productRes.data?.storeId;
    const vouchers = voucherRes.data?.vouchers?.shop || [];
    
    vouchers.forEach((v: any) => {
      shopVouchers.push({
        ...v,
        storeId: storeId || undefined,
      });
    });
  }
});
```

**Kết quả:** `availableVouchers` chứa danh sách tất cả shop vouchers có thể áp dụng.

### 1.3. Load Store-Wide Vouchers

**Function:** `loadStoreWideVouchers()` trong `useEffect` (dòng 655-698)

```typescript
const loadStoreWideVouchers = async () => {
  // 1. Collect storeIds từ cartItems
  const storeIds = new Set<string>();
  cartItems.forEach(item => {
    const product = productCache.get(item.productId);
    if (product?.storeId) {
      storeIds.add(product.storeId);
    }
  });

  // 2. Fetch vouchers cho từng store
  const voucherPromises = Array.from(storeIds).map(async (storeId) => {
    try {
      const response = await VoucherService.getShopVouchersByStore(
        storeId, 
        'ACTIVE', 
        'ALL_SHOP_VOUCHER'
      );
      return { storeId, vouchers: response.data || [] };
    } catch (error) {
      return { storeId, vouchers: [] };
    }
  });

  // 3. Build vouchersMap
  const results = await Promise.all(voucherPromises);
  const vouchersMap: Record<string, StoreVoucher[]> = {};
  results.forEach(({ storeId, vouchers }) => {
    vouchersMap[storeId] = vouchers;
  });

  setStoreWideVouchers(vouchersMap);
};
```

**Kết quả:** `storeWideVouchers` chứa danh sách store-wide vouchers cho từng store.

### 1.4. Validate Store Vouchers

**Function:** `useEffect` validation (dòng 700-791)

**Logic:**
1. Kiểm tra voucher còn tồn tại trong `availableVouchers`
2. Kiểm tra `minOrderValue` của voucher
3. Tính lại `discountValue` dựa trên `storeTotal` hiện tại
4. Xóa voucher không hợp lệ và hiển thị thông báo

```typescript
setAppliedStoreVouchers(prev => {
  const next: Record<string, AppliedStoreVoucher> = {};
  
  Object.entries(prev).forEach(([productId, applied]) => {
    const product = productCache.get(productId);
    const storeId = product?.storeId;
    const storeTotal = calculateStoreTotal(cartItems, storeId, productCache);
    
    // Tìm voucher theo code
    const voucher = availableVouchers.find(
      v => v.code === applied.code && (!v.storeId || v.storeId === storeId)
    );
    
    // Validate
    if (!voucher) {
      // Voucher không còn hợp lệ → Xóa
      return;
    }
    
    if (voucher.minOrderValue && storeTotal < voucher.minOrderValue) {
      // Không đạt minOrderValue → Xóa
      return;
    }
    
    // Tính lại discountValue
    const discountValue = calculateVoucherDiscountAmount(voucher, storeTotal);
    next[productId] = {
      ...applied,
      storeId,
      discountValue,
    };
  });
  
  return next;
});
```

### 1.5. Build Store Vouchers cho Request

**Function:** `buildStoreVouchers()` (dòng 170-202)

**Mục đích:** Chuyển đổi `appliedStoreVouchers` và `appliedStoreWideVouchers` thành format API.

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

**Lưu ý:** Nếu một store có cả product-specific và store-wide vouchers, các codes sẽ được gộp vào cùng một entry.

---

## Phần 2: Platform Voucher cho Variant

### 2.1. Vấn Đề Với Variant

**Tình huống:**
- Product có nhiều variants (ví dụ: Áo thun có size S, M, L)
- Platform voucher được lưu theo **`productId`** (product gốc), không phải `variantId`
- Khi checkout, `checkoutItemsPayload` chỉ chứa `variantId`, không có `productId`

**Ví dụ:**
```typescript
// Cart Item
{
  productId: "product-123",      // Product gốc
  variantId: "variant-abc",       // Variant cụ thể
  quantity: 2
}

// Checkout Payload (sau khi build)
{
  variantId: "variant-abc",       // Chỉ có variantId
  quantity: 2
  // KHÔNG có productId
}
```

**Vấn đề:** Làm sao để fetch platform voucher khi chỉ có `variantId`?

### 2.2. Giải Pháp: Luôn Dùng `productId` (Parent Product)

**Nguyên tắc:**
- Platform voucher **LUÔN** được lưu và lookup theo `productId` (product gốc)
- Kể cả khi có variant, vẫn dùng `productId` để fetch platform voucher
- Backend sẽ tự động map `variantId` → `productId` để áp dụng discount

### 2.3. Load Platform Vouchers (Lúc Load Trang)

**Function:** `loadVouchers()` trong `useEffect` (dòng 507-653)

**Bước 1: Collect Product IDs (KHÔNG phải Variant IDs)**
```typescript
const productIds = new Set<string>();

cartItems.forEach(item => {
  // QUAN TRỌNG: Luôn dùng productId (product gốc)
  // Kể cả khi có variant, vẫn dùng productId
  // Vì platform voucher được lưu theo productId
  productIds.add(item.productId);
});
```

**Ví dụ:**
```typescript
// Cart có 2 items:
// - Item 1: productId="prod-1", variantId="var-1"
// - Item 2: productId="prod-1", variantId="var-2" (cùng product, khác variant)

// productIds = Set(["prod-1"])  // Chỉ có 1 productId, không có variantId
```

**Bước 2: Fetch Platform Vouchers cho từng Product ID**
```typescript
const responses = await Promise.all(
  Array.from(productIds).map(async pid => {
    const [voucherRes, productRes] = await Promise.all([
      ProductVoucherService.getProductVouchers(pid, 'ALL', null),
      ProductListService.getProductById(pid),
    ]);
    return { productId: pid, voucherRes, productRes };
  })
);
```

**Bước 3: Calculate Platform Discount và Lưu `campaignProductId`**
```typescript
const platformDiscountsMap: Record<string, { discount: number; campaignProductId: string }> = {};

responses.forEach(({ productId, voucherRes, productRes }) => {
  if (voucherRes?.data) {
    const platformCampaigns = voucherRes.data.vouchers?.platform || [];
    let platformDiscount = 0;
    let campaignProductId: string | null = null;
    
    if (voucherRes.data.product) {
      const originalPrice = voucherRes.data.product.price;
      
      // Tìm voucher ACTIVE đầu tiên
      for (const campaign of platformCampaigns) {
        if (campaign.status === 'ACTIVE' && campaign.vouchers && campaign.vouchers.length > 0) {
          const activeVoucher = campaign.vouchers.find((v: any) => v.status === 'ACTIVE');
          if (activeVoucher) {
            // Lưu platformVoucherId làm campaignProductId
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
    
    // QUAN TRỌNG: Chỉ lưu cho productId, không lưu cho variantId
    if (platformDiscount > 0 && campaignProductId) {
      platformDiscountsMap[productId] = {
        discount: platformDiscount,
        campaignProductId: campaignProductId,
      };
    }
  }
});
```

**Kết quả:** `platformVoucherDiscounts` map:
```typescript
{
  "product-123": {
    discount: 100000,
    campaignProductId: "campaign-abc"
  }
}
```

**Bước 4: Áp Dụng Platform Discount vào Cart Items**
```typescript
if (Object.keys(platformDiscountsMap).length > 0) {
  setCartItems(prev =>
    prev.map(item => {
      // QUAN TRỌNG: Luôn lookup theo productId, kể cả khi có variant
      const info = platformDiscountsMap[item.productId];
      
      const original = item.originalPrice ?? item.price;
      if (!info || !info.discount || info.discount <= 0) {
        return { ...item, originalPrice: original };
      }

      const discounted = Math.max(0, original - info.discount);
      return {
        ...item,
        price: discounted,
        originalPrice: original,
      };
    })
  );
}
```

**Lưu ý:** Tất cả variants của cùng một product sẽ có cùng platform discount, vì chúng đều lookup theo `productId`.

### 2.4. Fetch Platform Vouchers (Lúc Checkout - Nếu Thiếu)

**Function:** `handleSubmit()` - Bước 6 (dòng 877-959)

**Vấn đề:** Khi checkout, `checkoutItemsPayload` chỉ chứa `variantId`, không có `productId`. Cần tìm lại `productId` từ `cartItems` để fetch platform voucher nếu chưa có.

**Bước 1: Tìm Các Product IDs Còn Thiếu**
```typescript
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
```

**Ví dụ:**
```typescript
// checkoutItemsPayload
[
  { variantId: "var-1", quantity: 2 }  // Không có productId
]

// cartItems
[
  { productId: "prod-1", variantId: "var-1", quantity: 2 }
]

// Tìm được: productId = "prod-1"
// Kiểm tra: platformVoucherDiscounts["prod-1"] có tồn tại không?
// Nếu không → missingProductIds.add("prod-1")
```

**Bước 2: Fetch Platform Vouchers cho Các Product IDs Còn Thiếu**
```typescript
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
      return null;
    }
  });
  
  const results = await Promise.all(voucherPromises);
  
  // Update finalPlatformVoucherDiscounts
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

### 2.5. Build Platform Vouchers Array cho Request

**Function:** `handleSubmit()` - Bước 7 (dòng 961-991)

**Mục đích:** Chuyển đổi `finalPlatformVoucherDiscounts` thành array format cho API, gộp các items có cùng `campaignProductId`.

**Bước 1: Tìm Product ID từ Variant ID (Nếu Cần)**
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
```

**Ví dụ:**
```typescript
// checkoutItemsPayload
[
  { variantId: "var-1", quantity: 2 },
  { variantId: "var-2", quantity: 1 }  // Cùng product, khác variant
]

// cartItems
[
  { productId: "prod-1", variantId: "var-1", quantity: 2 },
  { productId: "prod-1", variantId: "var-2", quantity: 1 }
]

// finalPlatformVoucherDiscounts
{
  "prod-1": {
    discount: 100000,
    campaignProductId: "campaign-abc"
  }
}

// Process:
// Item 1: variantId="var-1" → tìm productId="prod-1" → campaignProductId="campaign-abc" → quantity += 2
// Item 2: variantId="var-2" → tìm productId="prod-1" → campaignProductId="campaign-abc" → quantity += 1

// platformVouchersMap
{
  "campaign-abc": 3  // Tổng quantity = 2 + 1
}
```

**Bước 2: Chuyển Map thành Array**
```typescript
const platformVouchers = Array.from(platformVouchersMap.entries()).map(([campaignProductId, quantity]) => ({
  campaignProductId,
  quantity,
}));
```

**Kết quả:**
```json
[
  {
    "campaignProductId": "campaign-abc",
    "quantity": 3
  }
]
```

**Lưu ý:** Nếu có nhiều variants của cùng một product, chúng sẽ được gộp lại thành một entry với `quantity` là tổng số lượng.

---

## Phần 3: So Sánh Store Vouchers vs Platform Vouchers

| Tiêu chí | Store Vouchers | Platform Vouchers |
|----------|----------------|-------------------|
| **Nguồn gốc** | Cửa hàng tạo | Nền tảng tạo |
| **Áp dụng** | User phải chọn và nhập code | Tự động áp dụng |
| **Scope** | Product-specific hoặc Store-wide | Product-specific (theo productId) |
| **Với Variant** | Áp dụng theo productId | Áp dụng theo productId (parent) |
| **Lưu trữ** | `appliedStoreVouchers`, `appliedStoreWideVouchers` | `platformVoucherDiscounts` |
| **Request format** | `storeVouchers: [{ storeId, codes: [...] }]` | `platformVouchers: [{ campaignProductId, quantity }]` |
| **Tính discount** | Dựa trên `storeTotal` | Dựa trên `productPrice` |

---

## Phần 4: Flow Diagram - Platform Voucher cho Variant

```
┌─────────────────────────────────────────────────────────────┐
│ Cart Item với Variant                                        │
│ { productId: "prod-1", variantId: "var-1", quantity: 2 }    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Load Vouchers (Lúc Load Trang)                           │
│    - Collect productIds: ["prod-1"]                          │
│    - Fetch platform voucher cho "prod-1"                     │
│    - Lưu: platformVoucherDiscounts["prod-1"]                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Áp Dụng Discount vào Cart Item                           │
│    - Lookup: platformVoucherDiscounts["prod-1"]             │
│    - Tính: price = originalPrice - discount                 │
│    - Update: item.price, item.originalPrice                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Build Checkout Payload                                    │
│    - Input: { productId: "prod-1", variantId: "var-1" }     │
│    - Output: { variantId: "var-1", quantity: 2 }            │
│    - LƯU Ý: Chỉ gửi variantId, KHÔNG gửi productId          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Fetch Missing Platform Vouchers (Nếu Cần)                │
│    - Tìm productId từ variantId: "var-1" → "prod-1"         │
│    - Kiểm tra: platformVoucherDiscounts["prod-1"] có chưa? │
│    - Nếu chưa: Fetch platform voucher cho "prod-1"          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Build Platform Vouchers Array                            │
│    - Tìm productId từ variantId: "var-1" → "prod-1"        │
│    - Lookup: finalPlatformVoucherDiscounts["prod-1"]        │
│    - Lấy: campaignProductId = "campaign-abc"                │
│    - Gộp quantity: 2 (từ item này)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Request Body                                              │
│    {                                                         │
│      items: [{ variantId: "var-1", quantity: 2 }],        │
│      platformVouchers: [                                    │
│        { campaignProductId: "campaign-abc", quantity: 2 }   │
│      ]                                                       │
│    }                                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend Xử Lý                                             │
│    - Nhận variantId: "var-1"                                 │
│    - Map variantId → productId: "var-1" → "prod-1"          │
│    - Tìm platform voucher theo productId: "prod-1"          │
│    - Áp dụng discount từ campaignProductId: "campaign-abc"  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phần 5: Ví Dụ Cụ Thể

### Ví Dụ 1: Product Không Có Variant

**Cart Item:**
```typescript
{
  productId: "prod-1",
  variantId: null,
  quantity: 2,
  price: 1000000,
  originalPrice: 1000000
}
```

**Load Platform Voucher:**
```typescript
// 1. Collect productIds
productIds = ["prod-1"]

// 2. Fetch platform voucher
platformVoucherDiscounts = {
  "prod-1": {
    discount: 100000,
    campaignProductId: "campaign-abc"
  }
}

// 3. Áp dụng discount
item.price = 900000
item.originalPrice = 1000000
```

**Checkout Payload:**
```json
{
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2
    }
  ],
  "platformVouchers": [
    {
      "campaignProductId": "campaign-abc",
      "quantity": 2
    }
  ]
}
```

### Ví Dụ 2: Product Có Variant

**Cart Items:**
```typescript
[
  {
    productId: "prod-1",
    variantId: "var-1",
    quantity: 2,
    price: 900000,
    originalPrice: 1000000
  },
  {
    productId: "prod-1",
    variantId: "var-2",
    quantity: 1,
    price: 900000,
    originalPrice: 1000000
  }
]
```

**Load Platform Voucher:**
```typescript
// 1. Collect productIds (KHÔNG có variantIds)
productIds = ["prod-1"]  // Chỉ có 1 productId

// 2. Fetch platform voucher cho "prod-1"
platformVoucherDiscounts = {
  "prod-1": {
    discount: 100000,
    campaignProductId: "campaign-abc"
  }
}

// 3. Áp dụng discount cho CẢ HAI variants
// Vì cả hai đều có productId = "prod-1"
item1.price = 900000
item1.originalPrice = 1000000
item2.price = 900000
item2.originalPrice = 1000000
```

**Checkout Payload:**
```json
{
  "items": [
    {
      "variantId": "var-1",
      "quantity": 2
    },
    {
      "variantId": "var-2",
      "quantity": 1
    }
  ],
  "platformVouchers": [
    {
      "campaignProductId": "campaign-abc",
      "quantity": 3  // Tổng quantity = 2 + 1
    }
  ]
}
```

**Lưu ý:** 
- Cả hai variants đều có cùng platform discount (100000)
- Trong request, chỉ gửi `variantId`, không gửi `productId`
- `platformVouchers` gộp quantity của cả hai variants thành 3

### Ví Dụ 3: Nhiều Products, Một Product Có Variant

**Cart Items:**
```typescript
[
  {
    productId: "prod-1",
    variantId: "var-1",
    quantity: 2
  },
  {
    productId: "prod-2",
    variantId: null,
    quantity: 1
  }
]
```

**Load Platform Vouchers:**
```typescript
// 1. Collect productIds
productIds = ["prod-1", "prod-2"]

// 2. Fetch platform vouchers
platformVoucherDiscounts = {
  "prod-1": {
    discount: 100000,
    campaignProductId: "campaign-abc"
  },
  "prod-2": {
    discount: 50000,
    campaignProductId: "campaign-xyz"
  }
}
```

**Checkout Payload:**
```json
{
  "items": [
    {
      "variantId": "var-1",
      "quantity": 2
    },
    {
      "productId": "prod-2",
      "quantity": 1
    }
  ],
  "platformVouchers": [
    {
      "campaignProductId": "campaign-abc",
      "quantity": 2
    },
    {
      "campaignProductId": "campaign-xyz",
      "quantity": 1
    }
  ]
}
```

---

## Phần 6: Lưu Ý Quan Trọng

### 6.1. Platform Voucher Luôn Theo `productId`

- ✅ **Đúng:** Lookup platform voucher theo `productId` (product gốc)
- ❌ **Sai:** Lookup platform voucher theo `variantId`

**Lý do:**
- Platform voucher được lưu ở cấp product, không phải variant
- Tất cả variants của cùng một product sẽ có cùng platform discount
- Backend sẽ tự động map `variantId` → `productId` để áp dụng discount

### 6.2. Checkout Payload Chỉ Gửi `variantId`

- ✅ **Đúng:** Khi có variant, chỉ gửi `variantId`, không gửi `productId`
- ❌ **Sai:** Gửi cả `variantId` và `productId`

**Lý do:**
- Backend yêu cầu format này để tránh nhầm lẫn
- Backend sẽ tự động map `variantId` → `productId`

### 6.3. Gộp Quantity Khi Build Platform Vouchers

- ✅ **Đúng:** Gộp quantity của tất cả items có cùng `campaignProductId`
- ❌ **Sai:** Tạo nhiều entries cho cùng một `campaignProductId`

**Ví dụ:**
```typescript
// Đúng
[
  { campaignProductId: "campaign-abc", quantity: 3 }
]

// Sai
[
  { campaignProductId: "campaign-abc", quantity: 2 },
  { campaignProductId: "campaign-abc", quantity: 1 }
]
```

### 6.4. Fetch Missing Platform Vouchers Trước Khi Checkout

- ✅ **Đúng:** Kiểm tra và fetch platform vouchers còn thiếu trước khi build request
- ❌ **Sai:** Giả định tất cả platform vouchers đã được load

**Lý do:**
- Có thể platform voucher chưa được load (ví dụ: item mới được thêm vào cart)
- Đảm bảo request body có đầy đủ thông tin platform vouchers

---

## Phần 7: Tóm Tắt

### Store Vouchers
1. **Load:** Fetch từ API cho từng productId
2. **Validate:** Kiểm tra minOrderValue, tính lại discountValue
3. **Build:** Gộp product-specific và store-wide vouchers theo storeId
4. **Request:** `storeVouchers: [{ storeId, codes: [...] }]`

### Platform Vouchers cho Variant
1. **Load:** Fetch theo `productId` (không phải `variantId`)
2. **Lưu:** `platformVoucherDiscounts[productId]` chứa `discount` và `campaignProductId`
3. **Áp dụng:** Tất cả variants của cùng product có cùng discount
4. **Checkout:**
   - Tìm `productId` từ `variantId` (nếu cần)
   - Fetch missing platform vouchers
   - Build `platformVouchers` array với `campaignProductId` và `quantity`
5. **Request:** `platformVouchers: [{ campaignProductId, quantity }]`

**Điểm mấu chốt:** Platform voucher **LUÔN** được xử lý theo `productId` (parent product), kể cả khi có variant. Backend sẽ tự động map `variantId` → `productId` để áp dụng discount.

---

**Tài liệu này giải thích chi tiết cách hệ thống xử lý vouchers và platform vouchers cho variant products. Mọi thắc mắc, vui lòng liên hệ team phát triển.**

