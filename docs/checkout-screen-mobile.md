# Checkout (Web) — Guide for Mobile (Expo)

Phân tích logic màn Checkout `src/components/CheckoutOrderComponents/CheckoutOrderContainer.tsx` để dựng lại trên mobile.

## Luồng tổng quan
- Đọc payload từ `sessionStorage` key `checkout:payload:v1` (từ bước Cart): `selectedCartItemIds`, `storeVouchers`, `selectedAddressId`.
- Gọi song song: địa chỉ (`AddressService.getAddresses`) và cart (`CustomerCartService.getCart`); lọc items theo `selectedCartItemIds`.
- Map cart API → cartItems (backend đã áp dụng platform campaign giá).
- Tải vouchers (shop + platform) cho các sản phẩm, tải voucher toàn shop (store-wide) theo store.
- Tự động tính phí ship qua hook `useAutoShippingFee` (dùng địa chỉ + service type + product cache).
- Cho phép: chọn địa chỉ, chọn phương thức thanh toán, áp dụng/bỏ voucher (sản phẩm + toàn shop), xóa item.
- Tính tổng tiền (gốc, giảm nền tảng, voucher, phí ship) và submit checkout (COD / PayOS).

## 📡 API CHÍNH - CHI TIẾT

### 1. Get Cart (Lấy giỏ hàng)

**📡 API Name:** Get Customer Cart  
**Method:** GET  
**URL:** `/api/v1/customers/{customerId}/cart`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body (GET request)

**Response:**
```typescript
{
  cartId: string;              // UUID của giỏ hàng
  customerId: string;           // UUID của customer
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  subtotal: number;             // Tổng tiền trước giảm giá
  discountTotal: number;        // Tổng giảm giá
  grandTotal: number;           // Tổng tiền cuối cùng
  items: CartItem[];            // Danh sách items trong giỏ hàng
}

// CartItem
{
  cartItemId: string;           // UUID của cart item
  refId: string;                // productId hoặc comboId
  name: string;                // Tên sản phẩm/combo
  image: string;               // URL ảnh
  variantUrl?: string;          // URL ảnh variant (ưu tiên hơn image)
  variantId?: string;          // ID variant (nếu có)
  variantOptionValue?: string;  // Giá trị variant (ví dụ: "Đen", "XL")
  type: 'PRODUCT' | 'COMBO';   // Loại item
  quantity: number;            // Số lượng
  baseUnitPrice: number;        // Giá gốc (chưa campaign)
  platformCampaignPrice?: number; // Giá sau platform campaign (nếu có)
  unitPrice: number;            // Giá hiện tại (đã áp dụng campaign nếu có)
  inPlatformCampaign: boolean; // Có đang trong campaign không
  campaignUsageExceeded: boolean; // Đã vượt giới hạn campaign chưa
  campaignRemaining?: number;   // Số lượng còn lại trong campaign
}
```

---

### 2. Get Addresses (Lấy danh sách địa chỉ)

**📡 API Name:** Get Customer Addresses  
**Method:** GET  
**URL:** `/api/customers/{customerId}/addresses`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body (GET request)

**Response:**
```typescript
CustomerAddressApiItem[] = [
  {
    id: string;                 // UUID của address
    customerId: string;         // UUID của customer
    receiverName: string;        // Tên người nhận
    phoneNumber: string;        // Số điện thoại
    label?: string;             // Nhãn (ví dụ: "Nhà", "Công ty")
    country: string;            // Quốc gia
    province: string;          // Tỉnh/Thành phố
    district: string;          // Quận/Huyện
    ward: string;              // Phường/Xã
    street: string;            // Đường
    addressLine: string;        // Địa chỉ chi tiết
    postalCode?: string;       // Mã bưu điện
    districtId: number;        // ID quận/huyện (dùng cho GHN)
    wardCode: string;          // Mã phường/xã (dùng cho GHN)
    default: boolean;          // Có phải địa chỉ mặc định không
  }
]
```

---

### 3. Get Product Detail (Lấy chi tiết sản phẩm)

**📡 API Name:** Get Product By ID  
**Method:** GET  
**URL:** `/api/v1/products/{productId}`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body (GET request)

**Response:**
```typescript
{
  status: number;
  message: string;
  data: {
    productId: string;
    name: string;
    storeId: string;            // ID của store
    storeName: string;          // Tên store
    weight: number;             // Trọng lượng (kg) - DÙNG ĐỂ TÍNH SHIPPING FEE
    districtCode: string;       // Mã quận/huyện gửi hàng (dùng cho GHN)
    wardCode: string;          // Mã phường/xã gửi hàng (dùng cho GHN)
    // ... các field khác
  }
}
```

---

### 4. Get Product Vouchers (Lấy vouchers của sản phẩm)

**📡 API Name:** Get Product Vouchers  
**Method:** GET  
**URL:** `/api/products/view/{productId}/vouchers?type={type}&campaignType={campaignType}`

**Query Parameters:**
- `type`: `'ALL'` | `'SHOP'` | `'PLATFORM'` (optional)
- `campaignType`: `null` hoặc campaign type (optional)

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body (GET request)

**Response:**
```typescript
{
  status: number;
  message: string;
  data: {
    product: {
      productId: string;
      name: string;
      price: number;
      discountPrice: number | null;
      finalPrice: number;
      brandName: string;
      category: string;
      thumbnailUrl: string;
    };
    vouchers: {
      shop: Array<{
        source: 'SHOP';
        shopVoucherId: string;
        shopVoucherProductId: string;
        code: string;
        title: string;
        type: 'FIXED' | 'PERCENT';
        discountValue: number | null;      // VND (cho FIXED)
        discountPercent: number | null;    // % (cho PERCENT)
        maxDiscountValue: number | null;   // Giới hạn discount tối đa
        minOrderValue: number | null;      // Giá trị đơn hàng tối thiểu
        startTime: string;                 // ISO datetime
        endTime: string;                   // ISO datetime
      }>;
      platform: Array<{
        campaignId: string;
        campaignType: string;
        code: string;
        name: string;
        description: string;
        badgeLabel: string;
        badgeColor: string;
        badgeIconUrl: string;
        status: string;                    // ACTIVE, EXPIRED, etc.
        startTime: string;
        endTime: string;
        vouchers: Array<{
          platformVoucherId: string;
          campaignId: string;
          type: 'FIXED' | 'PERCENT';
          discountValue: number | null;
          discountPercent: number | null;
          maxDiscountValue: number | null;
          minOrderValue: number | null;
          totalVoucherIssued: number;
          totalUsageLimit: number;
          usagePerUser: number;
          status: string;
          startTime: string;
          endTime: string;
          flashSlotId?: string;
          slotOpenTime?: string;
          slotCloseTime?: string;
          slotStatus?: string;
        }>;
      }>;
    };
  };
}
```

---

### 5. Get Store-Wide Vouchers (Lấy vouchers toàn shop)

**📡 API Name:** Get Shop Vouchers By Store  
**Method:** GET  
**URL:** `/api/shop-vouchers/by-store?storeId={storeId}&status={status}&scopeType={scopeType}`

**Query Parameters:**
- `storeId`: string (required) - ID của store
- `status`: `'ACTIVE'` (default) - Trạng thái voucher
- `scopeType`: `'ALL_SHOP_VOUCHER'` (default) - Loại voucher (toàn shop)

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body (GET request)

**Response:**
```typescript
{
  status: number;
  message: string;
  data: Array<{
    shopVoucherId: string;
    storeId: string;
    code: string;
    title: string;
    type: 'FIXED' | 'PERCENT';
    discountValue: number | null;
    discountPercent: number | null;
    maxDiscountValue: number | null;
    minOrderValue: number | null;
    startTime: string;
    endTime: string;
    status: string;
    scopeType: 'ALL_SHOP_VOUCHER';
  }>;
}
```

---

### 6. Calculate GHN Shipping Fee (Tính phí vận chuyển)

**📡 API Name:** Calculate GHN Fee  
**Method:** POST  
**URL:** `/api/ghn/fee`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Request Body:**
```typescript
{
  service_type_id?: 2 | 5;        // Optional: 2 = Hàng nhẹ, 5 = Hàng nặng
  from_district_id?: number;       // Optional: Quận/huyện người gửi
  from_ward_code?: string;         // Optional: Phường/xã người gửi
  to_district_id: number;          // Required: Quận/huyện người nhận
  to_ward_code: string;            // Required: Phường/xã người nhận
  length?: number;                 // Optional: Chiều dài (cm)
  width?: number;                  // Optional: Chiều rộng (cm)
  height?: number;                  // Optional: Chiều cao (cm)
  weight: number;                  // Required: Khối lượng đơn hàng (gram)
  insurance_value?: number;        // Optional: Giá trị bảo hiểm (tối đa 5.000.000)
  coupon?: string | null;          // Optional: Mã giảm giá GHN
  items: Array<{                    // Required: Danh sách sản phẩm
    name: string;
    quantity: number;
    length: number;                // cm
    width: number;                 // cm
    height: number;                // cm
    weight: number;                // grams
  }>;
}
```

**Response:**
```typescript
{
  code: number;                    // 200 = success
  message: string;
  data: {
    total: number;                 // Tổng phí (VND)
    service_fee: number;           // Phí dịch vụ vận chuyển (VND) - DÙNG CÁI NÀY
    insurance_fee: number;
    pick_station_fee: number;
    coupon_value: number;
    r2s_fee: number;
    return_again: number;
    document_return: number;
    double_check: number;
    cod_fee: number;
    pick_remote_areas_fee: number;
    deliver_remote_areas_fee: number;
    cod_failed_fee: number;
  };
}
```

**Xem chi tiết ở phần "📦 LOGIC TÍNH PHÍ VẬN CHUYỂN - CHI TIẾT" bên dưới.**

---

### 7. Delete Cart Item (Xóa item khỏi cart)

**📡 API Name:** Delete Cart Items  
**Method:** DELETE  
**URL:** `/api/v1/customers/{customerId}/cart/items`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request Body:**
```typescript
{
  cartItemIds: string[];          // Array các cartItemId cần xóa
}
```

**Response:**
```typescript
{
  cartId: string;
  customerId: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];               // Cart sau khi xóa items
}
```

---

### 8. Checkout COD (Thanh toán khi nhận hàng)

**📡 API Name:** Checkout COD  
**Method:** POST  
**URL:** `/api/v1/customers/{customerId}/cart/checkout-cod`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request Body:**
```typescript
{
  addressId: string;               // UUID của địa chỉ nhận hàng
  message?: string;                // Ghi chú đơn hàng (optional)
  items: Array<{
    productId?: string;            // Product ID (nếu không có variantId)
    variantId?: string;            // Variant ID (nếu có variant)
    comboId?: string;              // Combo ID (nếu là combo)
    type: 'PRODUCT' | 'COMBO';
    quantity: number;
  }>;
  storeVouchers?: Array<{          // Optional: Vouchers của store
    storeId: string;
    codes: string[];               // Array mã voucher
  }> | null;
  platformVouchers?: Array<{       // Optional: Vouchers của platform
    campaignProductId: string;
    quantity: number;
  }> | null;
  serviceTypeIds?: Record<string, number> | null;  // Optional: { storeId: 2|5 }
}
```

**Response:**
```typescript
{
  status: number;                  // 200 = success
  message: string;
  data: {
    id: string;                    // Order ID
    status: string;                // Order status
    message: string | null;        // Message từ customer
    createdAt: string;             // ISO datetime
    totalAmount: number;           // Tổng tiền (VND)
    discountTotal: number;         // Tổng giảm giá (VND)
    grandTotal: number;            // Tổng tiền cuối cùng (VND)
    storeDiscounts: Record<string, number>;  // Discount theo từng store
    receiverName: string;         // Tên người nhận
    phoneNumber: string;           // Số điện thoại
    country: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    addressLine: string;
    postalCode: string;
    note: string | null;
  };
}
```

---

### 9. Checkout PayOS (Thanh toán qua PayOS)

**📡 API Name:** Checkout PayOS  
**Method:** POST  
**URL:** `/api/v1/payos/checkout?customerId={customerId}`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request Body:**
```typescript
{
  addressId: string;               // UUID của địa chỉ nhận hàng
  message?: string;                // Ghi chú đơn hàng (optional)
  description?: string;            // Mô tả đơn hàng (optional)
  items: Array<{
    productId?: string;            // Product ID (nếu không có variantId)
    variantId?: string;            // Variant ID (nếu có variant)
    comboId?: string;              // Combo ID (nếu là combo)
    type: 'PRODUCT' | 'COMBO';
    quantity: number;
  }>;
  storeVouchers?: Array<{          // Optional: Vouchers của store
    storeId: string;
    codes: string[];
  }> | null;
  platformVouchers?: Array<{       // Optional: Vouchers của platform
    campaignProductId: string;
    quantity: number;
  }> | null;
  serviceTypeIds?: Record<string, number> | null;  // Optional: { storeId: 2|5 }
  returnUrl: string;               // Required: URL redirect sau khi thanh toán thành công
  cancelUrl: string;               // Required: URL redirect sau khi hủy thanh toán
}
```

**Response:**
```typescript
{
  status: number;                  // 200 = success
  message: string;
  data: {
    customerOrderId: string;       // Order ID
    amount: number;                // Số tiền thanh toán (VND)
    payOSOrderCode: number;        // Mã đơn hàng PayOS
    checkoutUrl: string;           // URL để redirect user đến trang thanh toán PayOS
    qrCode: string;                // QR code để thanh toán
    status: string;                // Trạng thái
  };
}
```

**Lưu ý:**
- Sau khi nhận được `checkoutUrl`, redirect user đến URL này để thanh toán
- PayOS sẽ redirect về `returnUrl` nếu thanh toán thành công
- PayOS sẽ redirect về `cancelUrl` nếu thanh toán thất bại hoặc hủy

## Mapping cart API → UI item
- Hàm `mapApiItemToCartItem(apiItem)`:
  - `finalPrice` = nếu `inPlatformCampaign && !campaignUsageExceeded && platformCampaignPrice` → dùng platformCampaignPrice, else `unitPrice`.
  - `originalPrice` = `baseUnitPrice ?? unitPrice`.
  - `image` = `variantUrl || image`.
  - Lưu `variantId`, `variant`, `type` (`PRODUCT`/`COMBO`), `inPlatformCampaign`, `campaignUsageExceeded`.
  - `isSelected` luôn true (Checkout chỉ hiển thị các item đã chọn).

## State chính
- `cartItems`, `selectedCartItemIds`
- `addresses`, `selectedAddressId`
- `availableVouchers` (shop vouchers đã dedup code)
- `appliedStoreVouchers` (per productId, chứa storeId + discountValue)
- `storeWideVouchers` (per storeId) & `appliedStoreWideVouchers` (per storeId)
- `platformVoucherDiscounts`: `{ [productId]: { discount, campaignProductId, inPlatformCampaign? } }` dùng để build payload platform vouchers khi checkout
- `productCache` (từ `useServiceTypeCalculator`) chứa storeId, storeName, weight
- `serviceTypeId`, `shippingFee`, `storeShippingFees`, `shippingFeeError`
- `paymentMethod`, `error`, `isLoading`, `isSubmitting`

## 🎫 TẢI VOUCHERS - CHI TIẾT

### Flow Tải Vouchers

```
┌─────────────────────────────────────────────────────────┐
│ 1. Lấy unique productIds từ cartItems                  │
│    const productIds = [...new Set(cartItems.map(i => i.productId))] │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Với mỗi productId (song song):                       │
│    a. Gọi Get Product Vouchers API                     │
│       📡 GET /api/products/view/{productId}/vouchers?type=ALL │
│    b. Gọi Get Product Detail API                       │
│       📡 GET /api/v1/products/{productId}              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Xử lý Shop Vouchers                                 │
│    - Lấy shop vouchers từ response                     │
│    - Gắn storeId từ product detail                     │
│    - Gộp tất cả shop vouchers                          │
│    - Dedup theo code (loại bỏ trùng)                   │
│    → availableVouchers                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Xử lý Platform Vouchers                             │
│    - Lấy platform vouchers từ response                 │
│    - Ưu tiên voucher có status = 'ACTIVE'              │
│    - Tính discount theo type (PERCENT/FIXED)          │
│    - Áp dụng maxDiscountValue nếu có                   │
│    - Lưu: platformVoucherDiscounts[productId] = {      │
│        discount: number,                               │
│        campaignProductId: string,                      │
│        inPlatformCampaign: boolean                     │
│      }                                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Lấy Store-Wide Vouchers                             │
│    - Thu thập storeIds từ productCache                 │
│    - Với mỗi storeId (song song):                       │
│      📡 GET /api/shop-vouchers/by-store?storeId={id}&status=ACTIVE&scopeType=ALL_SHOP_VOUCHER │
│    - Lưu vào storeWideVouchers[storeId] = vouchers[]   │
└─────────────────────────────────────────────────────────┘
```

### API Calls Chi Tiết

#### 2a. Get Product Vouchers

**📡 API:** `GET /api/products/view/{productId}/vouchers?type=ALL`

**Request Example:**
```
GET /api/products/view/abc123/vouchers?type=ALL
Headers: {
  "Authorization": "Bearer {CUSTOMER_token}"
}
```

**Response Example:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "product": {
      "productId": "abc123",
      "name": "Tai nghe Sony",
      "price": 5000000,
      "finalPrice": 5000000
    },
    "vouchers": {
      "shop": [
        {
          "source": "SHOP",
          "shopVoucherId": "voucher-001",
          "code": "SHOP50K",
          "title": "Giảm 50k",
          "type": "FIXED",
          "discountValue": 50000,
          "minOrderValue": 1000000,
          "startTime": "2024-01-01T00:00:00Z",
          "endTime": "2024-12-31T23:59:59Z"
        }
      ],
      "platform": [
        {
          "campaignId": "campaign-001",
          "code": "MEGA_SALE",
          "name": "Mega Sale",
          "status": "ACTIVE",
          "vouchers": [
            {
              "platformVoucherId": "platform-voucher-001",
              "type": "PERCENT",
              "discountPercent": 20,
              "maxDiscountValue": 500000,
              "status": "ACTIVE"
            }
          ]
        }
      ]
    }
  }
}
```

#### 2b. Get Product Detail

**📡 API:** `GET /api/v1/products/{productId}`

**Request Example:**
```
GET /api/v1/products/abc123
Headers: {
  "Authorization": "Bearer {CUSTOMER_token}"
}
```

**Response Example:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "productId": "abc123",
    "name": "Tai nghe Sony",
    "storeId": "store-001",
    "storeName": "Audio Store",
    "weight": 0.5,
    "districtCode": "1442",
    "wardCode": "1A0401"
  }
}
```

#### 5. Get Store-Wide Vouchers

**📡 API:** `GET /api/shop-vouchers/by-store?storeId={storeId}&status=ACTIVE&scopeType=ALL_SHOP_VOUCHER`

**Request Example:**
```
GET /api/shop-vouchers/by-store?storeId=store-001&status=ACTIVE&scopeType=ALL_SHOP_VOUCHER
Headers: {
  "Authorization": "Bearer {CUSTOMER_token}"
}
```

**Response Example:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "shopVoucherId": "store-voucher-001",
      "storeId": "store-001",
      "code": "STORE100K",
      "title": "Giảm 100k cho đơn hàng từ 2 triệu",
      "type": "FIXED",
      "discountValue": 100000,
      "minOrderValue": 2000000,
      "scopeType": "ALL_SHOP_VOUCHER"
    }
  ]
}
```

### Logic Xử Lý

#### Shop Vouchers Processing

```typescript
// 1. Gộp tất cả shop vouchers từ tất cả products
const allShopVouchers: ShopVoucher[] = [];

productVoucherResponses.forEach((response, index) => {
  const productId = productIds[index];
  const product = productDetails[index];
  
  response.data.vouchers.shop.forEach(voucher => {
    allShopVouchers.push({
      ...voucher,
      storeId: product.storeId,  // Gắn storeId từ product detail
      storeName: product.storeName
    });
  });
});

// 2. Dedup theo code (loại bỏ trùng)
const voucherCodeMap = new Map<string, ShopVoucher>();
allShopVouchers.forEach(voucher => {
  if (!voucherCodeMap.has(voucher.code)) {
    voucherCodeMap.set(voucher.code, voucher);
  }
});

const availableVouchers = Array.from(voucherCodeMap.values());
```

#### Platform Vouchers Processing

```typescript
// Với mỗi product
productVoucherResponses.forEach((response, index) => {
  const productId = productIds[index];
  const platformCampaigns = response.data.vouchers.platform;
  
  // Tìm voucher ACTIVE đầu tiên
  let activeVoucher = null;
  for (const campaign of platformCampaigns) {
    if (campaign.status === 'ACTIVE') {
      const activeVoucherItem = campaign.vouchers.find(v => v.status === 'ACTIVE');
      if (activeVoucherItem) {
        activeVoucher = activeVoucherItem;
        break;
      }
    }
  }
  
  if (activeVoucher) {
    // Tính discount
    let discount = 0;
    if (activeVoucher.type === 'FIXED') {
      discount = activeVoucher.discountValue || 0;
    } else if (activeVoucher.type === 'PERCENT') {
      const productPrice = response.data.product.finalPrice;
      discount = (productPrice * activeVoucher.discountPercent) / 100;
      if (activeVoucher.maxDiscountValue) {
        discount = Math.min(discount, activeVoucher.maxDiscountValue);
      }
    }
    
    // Lưu vào platformVoucherDiscounts
    platformVoucherDiscounts[productId] = {
      discount,
      campaignProductId: activeVoucher.platformVoucherId,
      inPlatformCampaign: true
    };
  }
});
```

#### Store-Wide Vouchers Processing

```typescript
// 1. Thu thập storeIds
const storeIds = Array.from(new Set(
  Object.values(productCache).map(p => p.storeId)
));

// 2. Gọi API cho từng store (song song)
const storeVoucherPromises = storeIds.map(storeId =>
  VoucherService.getShopVouchersByStore(storeId, 'ACTIVE', 'ALL_SHOP_VOUCHER')
);

const storeVoucherResponses = await Promise.all(storeVoucherPromises);

// 3. Lưu vào storeWideVouchers
storeIds.forEach((storeId, index) => {
  storeWideVouchers[storeId] = storeVoucherResponses[index].data || [];
});
```

## Tính toán tổng tiền
- `subtotalBeforePlatformDiscount`: sum `(originalPrice * qty)`.
- `subtotalAfterPlatformDiscount`: sum `(price * qty)`.
- `totalPlatformDiscount`: sum `(originalPrice - price) * qty`.
- `voucherDiscount`: tổng discount từ `appliedStoreVouchers` + `appliedStoreWideVouchers` (làm tròn).
- `total`: `subtotalBefore - totalPlatformDiscount - voucherDiscount + shippingFee` (>=0, làm tròn).

## Voucher logic
- Áp dụng/bỏ voucher sản phẩm: key theo `productId`; kiểm tra code đã dùng cho product khác chưa; validate `minOrderValue` theo `storeTotal`.
- Áp dụng/bỏ voucher toàn shop: key theo `storeId`; tính discount PERCENT/FIXED dựa trên `storeTotal`.
- Validate lại khi `cartItems`/`productCache`/`availableVouchers` thay đổi; tự bỏ voucher nếu không còn hợp lệ.

## Phí ship và service type
- `useServiceTypeCalculator`: tính `serviceTypeId` (2 hoặc 5) dựa trên tổng cân nặng mỗi store (default 0.5kg nếu thiếu). Cập nhật `productCache` (storeId, weight, storeName).
- `useAutoShippingFee`: nhận `items` (isSelected=true), `addresses`, `selectedAddressId`, `productCache`, `serviceTypeId`.
  - Gọi API tính phí ship tự động (theo từng store) → `shippingFee` tổng và `storeShippingFees`.
  - Nếu lỗi, set `shippingFeeError`, reset `shippingFee`=0 để tránh tính sai.
  - Có callback `onProductCacheUpdate` để bổ sung cache khi thiếu thông tin sản phẩm.

---

## 📦 LOGIC TÍNH PHÍ VẬN CHUYỂN - CHI TIẾT

### 1. Flow Tổng Quan

```
┌─────────────────────────────────────────────────────────┐
│ 1. User chọn địa chỉ nhận hàng                          │
│    → selectedAddressId thay đổi                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Hook useAutoShippingFee được trigger                │
│    - Debounce 500ms để tránh spam API                   │
│    - Filter items đã được chọn (isSelected = true)      │
│    - Kiểm tra: có items + có selectedAddressId          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Fetch missing product details                        │
│    - Lấy unique productIds từ selectedItems          │
│    - Kiểm tra productCache, fetch những product chưa có│
│    - Update productCache với thông tin mới               │
│                                                          │
│    📡 API: Get Product Detail                            │
│    Method: GET                                           │
│    URL: /api/v1/products/{productId}                    │
│    Request: { productId: string }                        │
│    Response: {                                          │
│      data: {                                            │
│        productId: string,                               │
│        storeId: string,                                 │
│        storeName: string,                                │
│        weight: number,  // kg                            │
│        districtCode: string,                            │
│        wardCode: string                                 │
│      }                                                   │
│    }                                                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Group items theo storeId                             │
│    - Mỗi store có địa chỉ gửi hàng riêng               │
│    - Mỗi store sẽ tính shipping fee riêng              │
│    - Lưu storeName cho mỗi store                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Với mỗi store (song song):                           │
│    a. Lấy địa chỉ gửi từ product đầu tiên của store    │
│    b. Build GHN items (weight, dimensions)              │
│    c. Tính tổng weight của package                     │
│    d. Tính service type (2 hoặc 5)                      │
│    e. Build request body                                │
│    f. Gọi GHN API                                       │
│                                                          │
│    📡 API: Calculate GHN Shipping Fee                   │
│    Method: POST                                          │
│    URL: /api/ghn/fee                                     │
│    Request Body: {                                      │
│      service_type_id?: 2 | 5,                           │
│      from_district_id?: number,                          │
│      from_ward_code?: string,                            │
│      to_district_id: number,                             │
│      to_ward_code: string,                               │
│      length?: number,                                    │
│      width?: number,                                     │
│      height?: number,                                    │
│      weight: number,  // grams                          │
│      insurance_value?: number,                           │
│      coupon?: string | null,                            │
│      items: [{                                           │
│        name: string,                                     │
│        quantity: number,                                 │
│        length: number,                                  │
│        width: number,                                   │
│        height: number,                                  │
│        weight: number  // grams                         │
│      }]                                                  │
│    }                                                     │
│    Response: {                                          │
│      code: number,  // 200 = success                   │
│      message: string,                                   │
│      data: {                                            │
│        total: number,                                   │
│        service_fee: number,  // VND - DÙNG CÁI NÀY    │
│        insurance_fee: number,                           │
│        pick_station_fee: number,                        │
│        coupon_value: number,                            │
│        r2s_fee: number,                                 │
│        return_again: number,                            │
│        document_return: number,                         │
│        double_check: number,                            │
│        cod_fee: number,                                 │
│        pick_remote_areas_fee: number,                   │
│        deliver_remote_areas_fee: number,                 │
│        cod_failed_fee: number                           │
│      }                                                   │
│    }                                                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Xử lý response từ GHN API                           │
│    - Lấy service_fee từ response                        │
│    - Lưu vào storeShippingFees[storeId]                  │
│    - Xử lý error nếu có                                 │
│                                                          │
│    ✅ Success (code: 200):                              │
│       service_fee = resp.data.service_fee               │
│                                                          │
│    ❌ Error (code: 400/500):                            │
│       - DistrictID validation error                     │
│       - Missing address info                            │
│       - API server error                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Sum tổng shipping fee từ tất cả stores               │
│    - totalShippingFee = sum(storeShippingFees)          │
│    - Call onShippingFeeChange(totalShippingFee)          │
│    - Call onStoreShippingFeesChange(storeShippingFees)  │
│    - Hiển thị error nếu có store nào lỗi                │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Logic Chi Tiết Từng Bước

#### 2.1. Trigger và Debounce

**File:** `src/hooks/useAutoShippingFee.ts`

```typescript
// Debounce 500ms để tránh spam API khi user thay đổi địa chỉ nhanh
useEffect(() => {
  // Clear previous timeout
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  // Don't auto calculate if disabled
  if (!autoCalculate) return;

  // Check if we have enough info to calculate
  const selectedItems = items.filter(it => it.isSelected);
  if (selectedItems.length === 0 || !selectedAddressId) {
    return;
  }

  // Debounce calculation
  timeoutRef.current = window.setTimeout(async () => {
    // ... calculation logic
  }, 500); // 500ms debounce
}, [items, selectedAddressId, serviceTypeId, autoCalculate]);
```

**Lý do debounce:**
- User có thể thay đổi địa chỉ nhiều lần trong thời gian ngắn
- Tránh gọi API quá nhiều, tiết kiệm tài nguyên
- Chỉ tính phí khi user đã chọn xong địa chỉ

---

#### 2.2. Fetch Missing Product Details

```typescript
// Lấy unique productIds từ selectedItems
const uniqueProductIds = Array.from(new Set(selectedItems.map(si => si.productId)));

// Kiểm tra productCache, tìm những product chưa có
const productsToFetch = uniqueProductIds.filter(pid => !currentCache.has(pid));

// Fetch missing products song song
if (productsToFetch.length > 0) {
  const productDetailsArr = await Promise.all(
    productsToFetch.map(async (pid) => {
      try {
        const res = await ProductListService.getProductById(pid);
        return res.data as Product;
      } catch (e) {
        return null;
      }
    })
  );
  
  // Update cache với products mới
  const newCache = new Map(currentCache);
  productDetailsArr.forEach((p) => {
    if (p) {
      newCache.set(p.productId, p);
      productById.set(p.productId, p);
    }
  });
  onProductCacheUpdateRef.current(newCache);
}
```

**Thông tin cần từ Product:**
- `storeId`: ID của store (để group items)
- `storeName`: Tên store (để hiển thị)
- `weight`: Trọng lượng sản phẩm (kg) - dùng để tính shipping fee
- `districtCode`: Mã quận/huyện gửi hàng
- `wardCode`: Mã phường/xã gửi hàng

---

#### 2.3. Group Items theo StoreId

```typescript
// Group selected items by storeId
const itemsByStore = new Map<string, { items: typeof selectedItems; storeName: string }>();

selectedItems.forEach(si => {
  const product = productById.get(si.productId);
  if (!product?.storeId) {
    // Skip items without storeId
    return;
  }
  
  if (!itemsByStore.has(product.storeId)) {
    itemsByStore.set(product.storeId, {
      items: [],
      storeName: product.storeName || `Cửa hàng ${product.storeId.substring(0, 6)}`
    });
  }
  
  itemsByStore.get(product.storeId)!.items.push(si);
});
```

**Ví dụ:**
- Store A (storeId: "store-001"): [Product1, Variant1, Combo1]
- Store B (storeId: "store-002"): [Product2, Variant2]
- → 2 stores, mỗi store sẽ tính shipping fee riêng

---

#### 2.4. Lấy Địa Chỉ Gửi Hàng (Origin Address)

```typescript
// Với mỗi store, lấy địa chỉ gửi từ product đầu tiên của store đó
const firstStoreProduct = productById.get(storeItems[0].productId);

// Lấy districtCode và wardCode từ product
const fromDistrictId = firstStoreProduct.districtCode 
  ? Number(firstStoreProduct.districtCode) 
  : NaN;

const fromWardCode = firstStoreProduct.wardCode || '';

// Validate địa chỉ gửi
if (!fromWardCode || Number.isNaN(fromDistrictId)) {
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: 'Thiếu thông tin địa chỉ gửi hàng'
  };
  hasError = true;
  return;
}
```

**Lưu ý:**
- Mỗi store có địa chỉ warehouse/kho hàng riêng
- Lấy từ product đầu tiên của store (có thể là product, variant, hoặc combo)
- `districtCode` và `wardCode` phải có đầy đủ, nếu không sẽ báo lỗi

---

#### 2.5. Build GHN Items cho Store

```typescript
// Build GHN items cho store này
const ghnItems = storeItems.map(si => {
  const p = productById.get(si.productId);
  
  // Lấy weight từ product (default 0.5kg nếu không có)
  const weightKg = (p?.weight && p.weight > 0 ? p.weight : 0.5);
  const weightGr = Math.round(weightKg * 1000); // Convert sang gram
  
  return {
    name: si.name,           // Tên sản phẩm
    quantity: si.quantity,   // Số lượng
    length: 1,              // Chiều dài (cm) - default 1cm
    width: 1,               // Chiều rộng (cm) - default 1cm
    height: 1,              // Chiều cao (cm) - default 1cm
    weight: weightGr,       // Trọng lượng (gram)
  };
});

// Tính tổng weight của package
const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);
```

**Ví dụ Store A:**
- Product1: weight 0.5kg, quantity 2 → 1000g
- Variant1: weight 0.25kg, quantity 1 → 250g
- Combo1: weight 1.2kg, quantity 1 → 1200g
- → Tổng: 2450g

**Lưu ý:**
- Weight được lấy từ product (không phân biệt product, variant, combo)
- Variant dùng weight của product gốc
- Combo có weight riêng (tổng weight của các sản phẩm trong combo)
- Dimensions mặc định: 1×1×1 cm (có thể cải thiện sau)

---

#### 2.6. Tính Service Type ID

```typescript
// Service type dựa trên tổng weight
// ≤ 7500 gram → service_type_id = 2 (Hàng nhẹ)
// > 7500 gram → service_type_id = 5 (Hàng nặng)
const storeServiceTypeId: 2 | 5 = pkgWeight <= 7500 ? 2 : 5;
```

**Ví dụ:**
- Store A: 2450g → `service_type_id = 2` (Hàng nhẹ)
- Store B: 8000g → `service_type_id = 5` (Hàng nặng)

**Lý do:**
- GHN có 2 loại dịch vụ: Hàng nhẹ (≤7.5kg) và Hàng nặng (>7.5kg)
- Phí vận chuyển khác nhau tùy theo loại dịch vụ

---

#### 2.7. Lấy Địa Chỉ Nhận Hàng (Destination Address)

```typescript
// Lấy địa chỉ nhận từ customer address
const selectedAddress = addresses.find(a => a.id === selectedAddressId);

// Validate địa chỉ nhận
const toDistrictId = selectedAddress.districtId;
const toWardCode = selectedAddress.wardCode;

if (!toDistrictId || !toWardCode) {
  if (onErrorRef.current) {
    onErrorRef.current('Địa chỉ nhận hàng không đầy đủ thông tin quận/huyện hoặc phường/xã.');
  }
  return;
}
```

**Thông tin cần:**
- `districtId`: ID quận/huyện (number)
- `wardCode`: Mã phường/xã (string)

---

### 3. API Request Format

#### 3.1. Endpoint

```
POST /api/ghn/fee
```

**Headers:**
```json
{
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Authorization": "Bearer {CUSTOMER_token}"
}
```

#### 3.2. Request Body Schema

```typescript
interface GhnFeeRequestBody {
  service_type_id?: 2 | 5;        // Optional: 2 = Hàng nhẹ, 5 = Hàng nặng
  from_district_id?: number;       // Optional: Quận/huyện người gửi
  from_ward_code?: string;         // Optional: Phường/xã người gửi
  to_district_id: number;           // Required: Quận/huyện người nhận
  to_ward_code: string;             // Required: Phường/xã người nhận
  length?: number;                  // Optional: Chiều dài (cm)
  width?: number;                   // Optional: Chiều rộng (cm)
  height?: number;                  // Optional: Chiều cao (cm)
  weight: number;                  // Required: Khối lượng đơn hàng (gram)
  insurance_value?: number;         // Optional: Giá trị bảo hiểm (tối đa 5.000.000)
  coupon?: string | null;          // Optional: Mã giảm giá GHN
  items: GhnFeeItem[];              // Required: Danh sách sản phẩm
}

interface GhnFeeItem {
  name: string;                     // Tên sản phẩm
  quantity: number;                 // Số lượng
  length: number;                   // Chiều dài (cm)
  width: number;                    // Chiều rộng (cm)
  height: number;                   // Chiều cao (cm)
  weight: number;                   // Trọng lượng (gram)
}
```

#### 3.3. Request Body Example

**Ví dụ Store A:**
```json
{
  "service_type_id": 2,
  "from_district_id": 1442,
  "from_ward_code": "1A0401",
  "to_district_id": 1450,
  "to_ward_code": "1A0701",
  "length": 1,
  "width": 1,
  "height": 1,
  "weight": 2450,
  "insurance_value": 0,
  "coupon": "",
  "items": [
    {
      "name": "Tai nghe Sony WH-1000XM5",
      "quantity": 2,
      "length": 1,
      "width": 1,
      "height": 1,
      "weight": 500
    },
    {
      "name": "Tai nghe Sony WH-1000XM5 - Đen",
      "quantity": 1,
      "length": 1,
      "width": 1,
      "height": 1,
      "weight": 250
    },
    {
      "name": "Combo Tai nghe + Loa Bluetooth",
      "quantity": 1,
      "length": 1,
      "width": 1,
      "height": 1,
      "weight": 1200
    }
  ]
}
```

**Giải thích:**
- `service_type_id: 2` → Hàng nhẹ (vì tổng weight 2450g ≤ 7500g)
- `from_district_id: 1442` → Quận 1, TP.HCM (từ product)
- `from_ward_code: "1A0401"` → Phường Bến Nghé (từ product)
- `to_district_id: 1450` → Quận 7, TP.HCM (từ customer address)
- `to_ward_code: "1A0701"` → Phường Tân Thuận Đông (từ customer address)
- `weight: 2450` → Tổng weight của package (gram)
- `items[]` → Danh sách từng sản phẩm với weight riêng

---

### 4. API Response Format

#### 4.1. Response Schema

```typescript
interface GhnFeeResponse {
  code: number;                     // HTTP status code (200 = success)
  message: string;                  // Message từ GHN API
  data: GhnFeeResponseData;
}

interface GhnFeeResponseData {
  total: number;                    // Tổng phí (VND)
  service_fee: number;              // Phí dịch vụ vận chuyển (VND) - DÙNG CÁI NÀY
  insurance_fee: number;            // Phí bảo hiểm
  pick_station_fee: number;        // Phí lấy hàng tại trạm
  coupon_value: number;            // Giá trị coupon
  r2s_fee: number;                 // Phí R2S
  return_again: number;           // Phí gửi lại
  document_return: number;         // Phí trả chứng từ
  double_check: number;            // Phí kiểm tra kép
  cod_fee: number;                 // Phí thu hộ COD
  pick_remote_areas_fee: number;   // Phí lấy hàng vùng xa
  deliver_remote_areas_fee: number;// Phí giao hàng vùng xa
  cod_failed_fee: number;          // Phí thu hộ thất bại
}
```

#### 4.2. Response Example - Success

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "total": 25000,
    "service_fee": 25000,
    "insurance_fee": 0,
    "pick_station_fee": 0,
    "coupon_value": 0,
    "r2s_fee": 0,
    "return_again": 0,
    "document_return": 0,
    "double_check": 0,
    "cod_fee": 0,
    "pick_remote_areas_fee": 0,
    "deliver_remote_areas_fee": 0,
    "cod_failed_fee": 0
  }
}
```

**Xử lý:**
```typescript
// Lấy service_fee từ response
const serviceFee = Number(resp.data.service_fee) || 0;

// Lưu vào storeShippingFees
storeShippingFees[storeId] = {
  storeId,
  storeName,
  fee: serviceFee
};

// Cộng vào tổng
totalShippingFee += serviceFee;
```

#### 4.3. Response Example - Error

**Error 400 - Invalid DistrictID:**
```json
{
  "code": 400,
  "message": "Field validation for 'DistrictID' failed",
  "data": null
}
```

**Xử lý:**
```typescript
// Check for specific DistrictID validation error
const isDistrictError = 
  resp?.code === 400 &&
  (errorMessage.includes('DistrictID') || 
   errorMessage.includes('District') ||
   codeMessage === 'SEND_DISTRICT_IS_INVALID');

if (isDistrictError) {
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: 'địa chỉ giao nhận có vấn đề từ API(400DB)'
  };
} else {
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: errorMessage || 'Không thể tính phí vận chuyển'
  };
}
```

**Error 500 - Server Error:**
```json
{
  "code": 500,
  "message": "Internal Server Error",
  "data": null
}
```

**Xử lý:**
```typescript
// Catch API error
catch (apiError: any) {
  const errorMessage = apiError?.message || apiError?.data?.message || '';
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: errorMessage || 'Không thể tính phí vận chuyển'
  };
  hasError = true;
}
```

---

### 5. Tính Tổng Shipping Fee

```typescript
// Sau khi tính xong tất cả stores
await Promise.all(storeCalculations);

// Update store shipping fees
if (onStoreShippingFeesChangeRef.current) {
  onStoreShippingFeesChangeRef.current(storeShippingFees);
}

// Update total shipping fee
onShippingFeeChangeRef.current(totalShippingFee);

// Handle errors
if (hasError) {
  const errorMessages = Object.values(storeShippingFees)
    .filter(sf => sf.error)
    .map(sf => `${sf.storeName}: ${sf.error}`)
    .join('; ');
  
  if (onErrorRef.current && errorMessages) {
    onErrorRef.current(`Một số cửa hàng không thể tính phí vận chuyển: ${errorMessages}`);
  }
} else {
  // Clear error on success
  if (onErrorRef.current) {
    onErrorRef.current('');
  }
}
```

**Ví dụ:**
- Store A: 25.000₫ (success)
- Store B: 30.000₫ (success)
- → Total: 55.000₫

**Nếu có lỗi:**
- Store A: 25.000₫ (success)
- Store B: 0₫ (error: "địa chỉ giao nhận có vấn đề từ API(400DB)")
- → Total: 25.000₫
- → Error message: "Một số cửa hàng không thể tính phí vận chuyển: Store B: địa chỉ giao nhận có vấn đề từ API(400DB)"

---

### 6. Ví Dụ Thực Tế - Full Flow

**Scenario:**
- Store A: 1 Product (0.5kg, qty: 2) + 1 Variant (0.25kg, qty: 1)
- Store B: 1 Combo (1.2kg, qty: 1)
- Địa chỉ nhận: Quận 7, TP.HCM (districtId: 1450, wardCode: "1A0701")

**Bước 1: Group items theo store**
```
Store A:
  - Product1: weight 0.5kg, qty 2
  - Variant1: weight 0.25kg, qty 1
  → Tổng weight: 1250g

Store B:
  - Combo1: weight 1.2kg, qty 1
  → Tổng weight: 1200g
```

**Bước 2: Tính service type**
```
Store A: 1250g ≤ 7500g → service_type_id = 2 (Hàng nhẹ)
Store B: 1200g ≤ 7500g → service_type_id = 2 (Hàng nhẹ)
```

**Bước 3: Build request cho Store A**
```json
{
  "service_type_id": 2,
  "from_district_id": 1442,
  "from_ward_code": "1A0401",
  "to_district_id": 1450,
  "to_ward_code": "1A0701",
  "length": 1,
  "width": 1,
  "height": 1,
  "weight": 1250,
  "insurance_value": 0,
  "coupon": "",
  "items": [
    {
      "name": "Tai nghe Sony WH-1000XM5",
      "quantity": 2,
      "length": 1,
      "width": 1,
      "height": 1,
      "weight": 500
    },
    {
      "name": "Tai nghe Sony WH-1000XM5 - Đen",
      "quantity": 1,
      "length": 1,
      "width": 1,
      "height": 1,
      "weight": 250
    }
  ]
}
```

**Bước 4: Gọi GHN API cho Store A**
```
POST /api/ghn/fee
Response: { code: 200, data: { service_fee: 25000 } }
```

**Bước 5: Build request cho Store B**
```json
{
  "service_type_id": 2,
  "from_district_id": 1443,
  "from_ward_code": "1A0501",
  "to_district_id": 1450,
  "to_ward_code": "1A0701",
  "length": 1,
  "width": 1,
  "height": 1,
  "weight": 1200,
  "insurance_value": 0,
  "coupon": "",
  "items": [
    {
      "name": "Combo Tai nghe + Loa Bluetooth",
      "quantity": 1,
      "length": 1,
      "width": 1,
      "height": 1,
      "weight": 1200
    }
  ]
}
```

**Bước 6: Gọi GHN API cho Store B**
```
POST /api/ghn/fee
Response: { code: 200, data: { service_fee: 30000 } }
```

**Bước 7: Tính tổng**
```
Store A: 25.000₫
Store B: 30.000₫
→ Total: 55.000₫
```

**Bước 8: Update state**
```typescript
storeShippingFees = {
  "store-001": { storeId: "store-001", storeName: "Store A", fee: 25000 },
  "store-002": { storeId: "store-002", storeName: "Store B", fee: 30000 }
}

shippingFee = 55000
```

---

### 7. Error Handling

#### 7.1. Missing Product Info

```typescript
if (!firstStoreProduct) {
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: 'Không tìm thấy thông tin sản phẩm'
  };
  hasError = true;
  return;
}
```

#### 7.2. Missing Origin Address

```typescript
if (!fromWardCode || Number.isNaN(fromDistrictId)) {
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: 'Thiếu thông tin địa chỉ gửi hàng'
  };
  hasError = true;
  return;
}
```

#### 7.3. Missing Destination Address

```typescript
if (!toDistrictId || !toWardCode) {
  if (onErrorRef.current) {
    onErrorRef.current('Địa chỉ nhận hàng không đầy đủ thông tin quận/huyện hoặc phường/xã.');
  }
  return;
}
```

#### 7.4. API Error

```typescript
try {
  resp = await ShippingService.calculateGhnFee(body);
} catch (apiError: any) {
  const errorMessage = apiError?.message || apiError?.data?.message || '';
  const errorCode = apiError?.status || apiError?.data?.code;
  
  // Check for specific DistrictID validation error
  const isDistrictError = 
    errorCode === 400 &&
    (errorMessage.includes('DistrictID') || 
     errorMessage.includes('District') ||
     codeMessage === 'SEND_DISTRICT_IS_INVALID');
  
  if (isDistrictError) {
    storeShippingFees[storeId] = {
      storeId,
      storeName,
      fee: 0,
      error: 'địa chỉ giao nhận có vấn đề từ API(400DB)'
    };
  } else {
    storeShippingFees[storeId] = {
      storeId,
      storeName,
      fee: 0,
      error: errorMessage || 'Không thể tính phí vận chuyển'
    };
  }
  hasError = true;
  return;
}
```

#### 7.5. Invalid Response

```typescript
if (!resp || resp.code !== 200 || !resp.data) {
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: resp?.message || 'Không thể tính phí vận chuyển'
  };
  hasError = true;
  return;
}

if (resp.data.service_fee === undefined || resp.data.service_fee === null) {
  storeShippingFees[storeId] = {
    storeId,
    storeName,
    fee: 0,
    error: 'Không tìm thấy phí vận chuyển trong phản hồi'
  };
  hasError = true;
  return;
}
```

---

### 8. Lưu Ý Quan Trọng

1. **Debounce 500ms**: Tránh spam API khi user thay đổi địa chỉ nhanh
2. **Parallel calculation**: Tính shipping fee cho tất cả stores song song để tối ưu performance
3. **Product cache**: Cache product details để tránh fetch lại nhiều lần
4. **Service type per store**: Mỗi store tính service type riêng dựa trên weight của items trong store đó
5. **Default weight**: Nếu product không có weight, dùng 0.5kg
6. **Default dimensions**: Tất cả items dùng 1×1×1 cm (có thể cải thiện sau)
7. **Error handling**: Nếu một store lỗi, vẫn tính phí cho các stores khác
8. **Reset shipping fee on error**: Nếu có lỗi, reset `shippingFee = 0` để tránh tính sai tổng tiền

---

### 9. Code Location

- **Hook tính shipping fee**: `src/hooks/useAutoShippingFee.ts`
- **Service GHN API**: `src/services/customer/ShippingService.ts`
- **Hook tính service type**: `src/hooks/useServiceTypeCalculator.ts`
- **Component sử dụng**: `src/components/CheckoutOrderComponents/CheckoutOrderContainer.tsx`

## 💳 CHECKOUT PAYLOAD - CHI TIẾT

### Flow Build Checkout Payload

```
┌─────────────────────────────────────────────────────────┐
│ 1. Build checkoutItemsPayload                           │
│    - Map cartItems → checkout items                     │
│    - Xử lý PRODUCT vs COMBO                            │
│    - Xử lý variantId vs productId                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Build storeVouchers                                  │
│    - Từ appliedStoreVouchers (per product)             │
│    - Từ appliedStoreWideVouchers (per store)           │
│    - Group theo storeId                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Build serviceTypeIds                                 │
│    - Map storeId → serviceTypeId (2 hoặc 5)            │
│    - Tính từ tổng weight của store                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Build platformVouchers                              │
│    - Đảm bảo có campaignProductId                      │
│    - Gom theo campaignProductId                        │
│    - Cộng dồn quantity                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Validate & Submit                                    │
│    - Validate: có address, có items, có payment method │
│    - COD: POST /api/v1/customers/{customerId}/cart/checkout-cod │
│    - PayOS: POST /api/v1/payos/checkout?customerId={id} │
└─────────────────────────────────────────────────────────┘
```

### 1. Build Checkout Items Payload

```typescript
const checkoutItemsPayload = cartItems.map(item => {
  const checkoutItem: any = {
    type: item.type,  // 'PRODUCT' hoặc 'COMBO'
    quantity: item.quantity
  };
  
  if (item.type === 'PRODUCT') {
    // PRODUCT: Nếu có variantId → gửi variantId, không gửi productId
    //          Nếu không có variantId → gửi productId
    if (item.variantId) {
      checkoutItem.variantId = item.variantId;
      // KHÔNG gửi productId khi có variantId
    } else {
      checkoutItem.productId = item.productId;
    }
  } else if (item.type === 'COMBO') {
    // COMBO: Gửi comboId = productId (refId)
    checkoutItem.comboId = item.productId;  // productId trong cartItem là comboId
  }
  
  return checkoutItem;
});
```

**Ví dụ:**
```typescript
// Input: cartItems
[
  { type: 'PRODUCT', productId: 'prod-001', variantId: null, quantity: 2 },
  { type: 'PRODUCT', productId: 'prod-002', variantId: 'var-001', quantity: 1 },
  { type: 'COMBO', productId: 'combo-001', variantId: null, quantity: 1 }
]

// Output: checkoutItemsPayload
[
  { type: 'PRODUCT', productId: 'prod-001', quantity: 2 },
  { type: 'PRODUCT', variantId: 'var-001', quantity: 1 },  // Không có productId
  { type: 'COMBO', comboId: 'combo-001', quantity: 1 }
]
```

---

### 2. Build Store Vouchers

```typescript
// Từ appliedStoreVouchers (per productId)
const storeVouchersMap = new Map<string, Set<string>>();  // Map<storeId, Set<voucherCodes>>

// 1. Lấy vouchers từ appliedStoreVouchers (per product)
Object.entries(appliedStoreVouchers).forEach(([productId, voucher]) => {
  const product = productCache.get(productId);
  if (product?.storeId && voucher.code) {
    if (!storeVouchersMap.has(product.storeId)) {
      storeVouchersMap.set(product.storeId, new Set());
    }
    storeVouchersMap.get(product.storeId)!.add(voucher.code);
  }
});

// 2. Lấy vouchers từ appliedStoreWideVouchers (per store)
Object.entries(appliedStoreWideVouchers).forEach(([storeId, voucher]) => {
  if (voucher.code) {
    if (!storeVouchersMap.has(storeId)) {
      storeVouchersMap.set(storeId, new Set());
    }
    storeVouchersMap.get(storeId)!.add(voucher.code);
  }
});

// 3. Convert Map → Array
const storeVouchers = Array.from(storeVouchersMap.entries()).map(([storeId, codes]) => ({
  storeId,
  codes: Array.from(codes)
}));
```

**Ví dụ:**
```typescript
// Input:
appliedStoreVouchers = {
  'prod-001': { code: 'SHOP50K', storeId: 'store-001', discountValue: 50000 },
  'prod-002': { code: 'SHOP100K', storeId: 'store-001', discountValue: 100000 }
}
appliedStoreWideVouchers = {
  'store-002': { code: 'STORE200K', discountValue: 200000 }
}

// Output: storeVouchers
[
  { storeId: 'store-001', codes: ['SHOP50K', 'SHOP100K'] },
  { storeId: 'store-002', codes: ['STORE200K'] }
]
```

---

### 3. Build Service Type IDs

```typescript
// Tính serviceTypeId cho mỗi store dựa trên tổng weight
const serviceTypeIds: Record<string, number> = {};

// Group items theo storeId
const itemsByStore = new Map<string, CartItem[]>();
cartItems.forEach(item => {
  const product = productCache.get(item.productId);
  if (product?.storeId) {
    if (!itemsByStore.has(product.storeId)) {
      itemsByStore.set(product.storeId, []);
    }
    itemsByStore.get(product.storeId)!.push(item);
  }
});

// Tính serviceTypeId cho mỗi store
itemsByStore.forEach((items, storeId) => {
  let totalWeight = 0;
  items.forEach(item => {
    const product = productCache.get(item.productId);
    const weightKg = (product?.weight && product.weight > 0) ? product.weight : 0.5;
    totalWeight += weightKg * item.quantity;
  });
  
  const totalWeightGr = totalWeight * 1000;  // Convert sang gram
  // ≤ 7500 gram → service_type_id = 2 (Hàng nhẹ)
  // > 7500 gram → service_type_id = 5 (Hàng nặng)
  serviceTypeIds[storeId] = totalWeightGr <= 7500 ? 2 : 5;
});
```

**Ví dụ:**
```typescript
// Input:
cartItems = [
  { productId: 'prod-001', quantity: 2 },  // weight: 0.5kg
  { productId: 'prod-002', quantity: 1 }  // weight: 1.2kg
]
// Store A: (0.5 * 2 + 1.2 * 1) * 1000 = 2200g → serviceTypeId = 2

// Output: serviceTypeIds
{
  'store-001': 2,  // Hàng nhẹ
  'store-002': 5   // Hàng nặng (nếu có store khác với weight > 7.5kg)
}
```

---

### 4. Build Platform Vouchers

```typescript
// Gom platform vouchers theo campaignProductId
const platformVouchersMap = new Map<string, number>();  // Map<campaignProductId, totalQuantity>

cartItems.forEach(item => {
  const platformDiscount = platformVoucherDiscounts[item.productId];
  
  if (platformDiscount && platformDiscount.campaignProductId) {
    const { campaignProductId } = platformDiscount;
    const currentQty = platformVouchersMap.get(campaignProductId) || 0;
    platformVouchersMap.set(campaignProductId, currentQty + item.quantity);
  }
});

// Convert Map → Array (chỉ thêm nếu có campaignProductId và (discount>0 hoặc inPlatformCampaign))
const platformVouchers = Array.from(platformVouchersMap.entries())
  .filter(([campaignProductId, quantity]) => {
    // Tìm product nào dùng campaignProductId này
    const productId = Object.keys(platformVoucherDiscounts).find(
      pid => platformVoucherDiscounts[pid].campaignProductId === campaignProductId
    );
    
    if (!productId) return false;
    
    const discount = platformVoucherDiscounts[productId];
    // Chỉ thêm nếu có discount > 0 hoặc inPlatformCampaign = true
    return discount.discount > 0 || discount.inPlatformCampaign === true;
  })
  .map(([campaignProductId, quantity]) => ({
    campaignProductId,
    quantity
  }));
```

**Ví dụ:**
```typescript
// Input:
cartItems = [
  { productId: 'prod-001', quantity: 2 },
  { productId: 'prod-002', quantity: 1 }
]
platformVoucherDiscounts = {
  'prod-001': { campaignProductId: 'campaign-prod-001', discount: 100000, inPlatformCampaign: true },
  'prod-002': { campaignProductId: 'campaign-prod-001', discount: 50000, inPlatformCampaign: true }
}

// Output: platformVouchers
[
  { campaignProductId: 'campaign-prod-001', quantity: 3 }  // 2 + 1 = 3
]
```

---

### 5. COD Checkout Request

**📡 API:** `POST /api/v1/customers/{customerId}/cart/checkout-cod`

**Request Body:**
```typescript
{
  addressId: string;                    // UUID của địa chỉ nhận hàng
  message?: string;                     // Ghi chú đơn hàng (optional)
  items: Array<{
    productId?: string;                 // Nếu không có variantId
    variantId?: string;                 // Nếu có variant
    comboId?: string;                   // Nếu là combo
    type: 'PRODUCT' | 'COMBO';
    quantity: number;
  }>;
  storeVouchers?: Array<{               // Optional, null nếu rỗng
    storeId: string;
    codes: string[];
  }> | null;
  platformVouchers?: Array<{            // Optional, null nếu rỗng
    campaignProductId: string;
    quantity: number;
  }> | null;
  serviceTypeIds?: Record<string, number> | null;  // Optional, null nếu rỗng
}
```

**Request Example:**
```json
{
  "addressId": "addr-001",
  "message": "Giao hàng vào buổi sáng",
  "items": [
    {
      "type": "PRODUCT",
      "productId": "prod-001",
      "quantity": 2
    },
    {
      "type": "PRODUCT",
      "variantId": "var-001",
      "quantity": 1
    },
    {
      "type": "COMBO",
      "comboId": "combo-001",
      "quantity": 1
    }
  ],
  "storeVouchers": [
    {
      "storeId": "store-001",
      "codes": ["SHOP50K", "SHOP100K"]
    }
  ],
  "platformVouchers": [
    {
      "campaignProductId": "campaign-prod-001",
      "quantity": 3
    }
  ],
  "serviceTypeIds": {
    "store-001": 2,
    "store-002": 5
  }
}
```

**Response:**
```typescript
{
  status: 200;
  message: "Order created successfully";
  data: {
    id: string;                    // Order ID
    status: string;                // Order status
    message: string | null;
    createdAt: string;             // ISO datetime
    totalAmount: number;           // Tổng tiền (VND)
    discountTotal: number;         // Tổng giảm giá (VND)
    grandTotal: number;            // Tổng tiền cuối cùng (VND)
    storeDiscounts: Record<string, number>;
    receiverName: string;
    phoneNumber: string;
    country: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    addressLine: string;
    postalCode: string;
    note: string | null;
  };
}
```

**Sau khi thành công:**
1. Clear `sessionStorage` key `checkout:payload:v1`
2. Hiển thị success toast
3. Redirect đến `/orders` hoặc `/orders/{orderId}`

---

### 6. PayOS Checkout Request

**📡 API:** `POST /api/v1/payos/checkout?customerId={customerId}`

**Request Body:**
```typescript
{
  addressId: string;                    // UUID của địa chỉ nhận hàng
  message?: string;                     // Ghi chú đơn hàng (optional)
  description?: string;                 // Mô tả đơn hàng (optional)
  items: Array<{
    productId?: string;
    variantId?: string;
    comboId?: string;
    type: 'PRODUCT' | 'COMBO';
    quantity: number;
  }>;
  storeVouchers?: Array<{               // Optional, null nếu rỗng
    storeId: string;
    codes: string[];
  }> | null;
  platformVouchers?: Array<{            // Optional, null nếu rỗng
    campaignProductId: string;
    quantity: number;
  }> | null;
  serviceTypeIds?: Record<string, number> | null;  // Optional, null nếu rỗng
  returnUrl: string;                    // Required: URL redirect sau khi thanh toán thành công
  cancelUrl: string;                    // Required: URL redirect sau khi hủy thanh toán
}
```

**Request Example:**
```json
{
  "addressId": "addr-001",
  "message": "Giao hàng vào buổi sáng",
  "description": "Đơn hàng Audio Equipment",
  "items": [
    {
      "type": "PRODUCT",
      "productId": "prod-001",
      "quantity": 2
    }
  ],
  "storeVouchers": [
    {
      "storeId": "store-001",
      "codes": ["SHOP50K"]
    }
  ],
  "platformVouchers": null,
  "serviceTypeIds": {
    "store-001": 2
  },
  "returnUrl": "https://yourapp.com/orders?payment=success",
  "cancelUrl": "https://yourapp.com/checkout?payment=cancelled"
}
```

**Response:**
```typescript
{
  status: 200;
  message: "PayOS checkout created successfully";
  data: {
    customerOrderId: string;       // Order ID
    amount: number;                // Số tiền thanh toán (VND)
    payOSOrderCode: number;        // Mã đơn hàng PayOS
    checkoutUrl: string;           // URL để redirect user đến trang thanh toán PayOS
    qrCode: string;                // QR code để thanh toán
    status: string;                // Trạng thái
  };
}
```

**Sau khi thành công:**
1. Clear `sessionStorage` key `checkout:payload:v1`
2. Redirect user đến `checkoutUrl` để thanh toán
3. PayOS sẽ redirect về `returnUrl` nếu thành công
4. PayOS sẽ redirect về `cancelUrl` nếu thất bại/hủy

---

### 7. Validation Trước Khi Checkout

```typescript
// Validate trước khi submit
const validateCheckout = () => {
  // 1. Kiểm tra có items không
  if (checkoutItemsPayload.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một sản phẩm để đặt hàng.');
  }
  
  // 2. Kiểm tra có địa chỉ không
  if (!selectedAddressId) {
    throw new Error('Vui lòng chọn địa chỉ nhận hàng.');
  }
  
  // 3. Kiểm tra có phương thức thanh toán không
  if (!paymentMethod) {
    throw new Error('Vui lòng chọn phương thức thanh toán.');
  }
  
  // 4. Kiểm tra shipping fee error
  if (shippingFeeError) {
    throw new Error('Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ.');
  }
  
  return true;
};
```

## UI mapping (gợi ý mobile)
- Breadcrumb có thể giản lược; giữ các section: Địa chỉ, Sản phẩm, Payment, Order summary.
- Địa chỉ: list/chọn, thêm/sửa; lưu `selectedAddressId`.
- Sản phẩm: group theo store, hiển thị giá sau giảm + giá gốc, voucher shop & store-wide, phí ship per store (nếu cần).
- Payment: chọn COD / PayOS.
- Summary: subtotal (gốc), giảm nền tảng, giảm voucher, phí ship, total; nút Đặt hàng (disable khi thiếu address/payment hoặc lỗi phí ship).
- Toast/cảnh báo cho lỗi voucher, phí ship, thiếu địa chỉ/payment.

## Lưu ý
- Backend đã áp dụng platform campaign giá trong cart response; platform voucher info chủ yếu để gửi `campaignProductId` khi checkout.
- `campaignUsageExceeded` → không dùng platform discount.
- Clamp quantity logic không có ở Checkout (đã chọn từ Cart); Checkout chỉ xóa item.
- Kiểm tra `selectedCartItemIds` rỗng hoặc không tìm thấy → redirect về /cart.

---

## 🚀 CHECKOUT FLOW THÀNH CÔNG - CHI TIẾT

### Flow Tổng Quan Từ Cart Đến Checkout Thành Công

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: INITIALIZATION (Component Mount)              │
│ 1. Đọc payload từ sessionStorage                        │
│ 2. Validate payload                                     │
│ 3. Load addresses và cart song song                    │
│ 4. Map cart items → UI items                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: LOAD DATA                                      │
│ 1. Load product vouchers (shop + platform)             │
│ 2. Load product details (storeId, weight, address)     │
│ 3. Load store-wide vouchers                            │
│ 4. Calculate shipping fee (auto)                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: USER INTERACTION                              │
│ 1. User chọn địa chỉ → trigger shipping fee calc      │
│ 2. User chọn payment method (COD/PayOS)                │
│ 3. User áp dụng/bỏ vouchers (optional)                 │
│ 4. User xóa items (optional)                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ PHASE 4: CHECKOUT SUBMIT                                │
│ 1. Validate: items, address, payment, shipping fee      │
│ 2. Build checkout items payload                         │
│ 3. Build store vouchers                                 │
│ 4. Build platform vouchers (fetch nếu thiếu)           │
│ 5. Build service type IDs                               │
│ 6. Submit checkout (COD hoặc PayOS)                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ PHASE 5: SUCCESS HANDLING                               │
│ 1. Clear sessionStorage                                 │
│ 2. Show success message                                 │
│ 3. Redirect (COD: /orders, PayOS: checkoutUrl)         │
└─────────────────────────────────────────────────────────┘
```

---

### PHASE 1: INITIALIZATION

#### 1.1. Đọc Payload từ SessionStorage

**Source:** `sessionStorage.getItem('checkout:payload:v1')`

**Payload Structure:**
```typescript
{
  selectedCartItemIds: string[];        // Array các cartItemId đã chọn
  storeVouchers: Record<string, AppliedStoreVoucher>;  // Vouchers đã áp dụng từ Cart
  selectedAddressId?: string | null;   // Địa chỉ đã chọn từ Cart (optional)
  createdAt?: number;                  // Timestamp (optional)
}
```

**Validation:**
```typescript
// 1. Kiểm tra payload có tồn tại không
if (!payloadRaw) {
  showCenterError('Không tìm thấy thông tin giỏ hàng.');
  window.location.href = '/cart';
  return;
}

// 2. Parse JSON
try {
  payload = JSON.parse(payloadRaw);
} catch {
  showCenterError('Thông tin giỏ hàng không hợp lệ.');
  window.location.href = '/cart';
  return;
}

// 3. Kiểm tra có items không
if (!payload.selectedCartItemIds || payload.selectedCartItemIds.length === 0) {
  showCenterError('Giỏ hàng của bạn đang trống.');
  window.location.href = '/cart';
  return;
}
```

---

#### 1.2. Load Addresses và Cart (Song Song)

**📡 API 1: Get Addresses**

**Method:** GET  
**URL:** `/api/customers/{customerId}/addresses`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body

**Response:**
```typescript
CustomerAddressApiItem[] = [
  {
    id: string;
    customerId: string;
    receiverName: string;
    phoneNumber: string;
    label?: string;
    country: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    addressLine: string;
    postalCode?: string;
    districtId: number;        // Dùng cho GHN
    wardCode: string;          // Dùng cho GHN
    default: boolean;
  }
]
```

**📡 API 2: Get Cart**

**Method:** GET  
**URL:** `/api/v1/customers/{customerId}/cart`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body

**Response:**
```typescript
{
  cartId: string;
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];  // Tất cả items trong cart
}
```

**Logic:**
```typescript
// Gọi song song
const [addressList, cartResponse] = await Promise.all([
  AddressService.getAddresses(),
  CustomerCartService.getCart(),
]);

// Filter items theo selectedCartItemIds
const selectedCartItems = cartResponse.items.filter(item =>
  payload.selectedCartItemIds.includes(item.cartItemId)
);

// Validate có items không
if (selectedCartItems.length === 0) {
  showCenterError('Không tìm thấy sản phẩm đã chọn.');
  window.location.href = '/cart';
  return;
}

// Set default address
const defaultAddress =
  payload.selectedAddressId ||
  addressList.find(addr => addr.default)?.id ||
  addressList[0]?.id ||
  null;
setSelectedAddressId(defaultAddress);

// Map API items → UI items
const mappedItems = mapApiItemsToCartItems(selectedCartItems);
setCartItems(mappedItems);
```

---

### PHASE 2: LOAD DATA

#### 2.1. Load Product Vouchers và Product Details (Song Song)

**📡 API 1: Get Product Vouchers**

**Method:** GET  
**URL:** `/api/products/view/{productId}/vouchers?type=ALL`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body

**Response:** (Xem chi tiết ở phần "🎫 TẢI VOUCHERS - CHI TIẾT" ở trên)

**📡 API 2: Get Product Detail**

**Method:** GET  
**URL:** `/api/v1/products/{productId}`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body

**Response:** (Xem chi tiết ở phần "📡 API CHÍNH - CHI TIẾT" ở trên)

**Logic:**
```typescript
// Lấy unique productIds
const productIds = new Set<string>();
cartItems.forEach(item => {
  productIds.add(item.productId);  // Luôn dùng productId (kể cả khi có variant)
});

// Gọi song song cho mỗi productId
const responses = await Promise.all(
  Array.from(productIds).map(async pid => {
    const [voucherRes, productRes] = await Promise.all([
      ProductVoucherService.getProductVouchers(pid, 'ALL', null),
      ProductListService.getProductById(pid),
    ]);
    return { productId: pid, voucherRes, productRes };
  })
);

// Xử lý shop vouchers
const shopVouchers: ShopVoucher[] = [];
responses.forEach(({ productId, voucherRes, productRes }) => {
  const storeId = productRes.data?.storeId;
  const vouchers = voucherRes.data?.vouchers?.shop || [];
  vouchers.forEach(v => {
    shopVouchers.push({
      ...v,
      storeId: storeId || undefined,
    });
  });
});

// Dedup shop vouchers theo code
const deduped = Array.from(new Map(shopVouchers.map(v => [v.code, v])).values());
setAvailableVouchers(deduped);

// Xử lý platform vouchers
const platformDiscountsMap: Record<string, PlatformVoucherInfo> = {};
responses.forEach(({ productId, voucherRes }) => {
  const platformCampaigns = voucherRes.data?.vouchers?.platform || [];
  let platformDiscount = 0;
  let campaignProductId: string | null = null;
  
  // Tìm active voucher
  for (const campaign of platformCampaigns) {
    if (campaign.status === 'ACTIVE' && campaign.vouchers?.length > 0) {
      const activeVoucher = campaign.vouchers.find(v => v.status === 'ACTIVE');
      if (activeVoucher) {
        campaignProductId = activeVoucher.platformVoucherId;
        
        // Tính discount
        if (activeVoucher.type === 'FIXED') {
          platformDiscount = activeVoucher.discountValue || 0;
        } else if (activeVoucher.type === 'PERCENT') {
          const originalPrice = voucherRes.data.product.price;
          const percentDiscount = (originalPrice * activeVoucher.discountPercent) / 100;
          platformDiscount = activeVoucher.maxDiscountValue
            ? Math.min(percentDiscount, activeVoucher.maxDiscountValue)
            : percentDiscount;
        }
        break;
      }
    }
  }
  
  // Lưu platform voucher info
  const cartItem = cartItems.find(item => item.productId === productId);
  const inPlatformCampaign = cartItem?.inPlatformCampaign || false;
  const campaignUsageExceeded = cartItem?.campaignUsageExceeded || false;
  
  if (campaignProductId || (inPlatformCampaign && !campaignUsageExceeded)) {
    if (!campaignProductId && inPlatformCampaign) {
      // Lấy platformVoucherId đầu tiên nếu không tìm thấy active
      for (const campaign of platformCampaigns) {
        if (campaign.vouchers?.length > 0) {
          campaignProductId = campaign.vouchers[0].platformVoucherId;
          break;
        }
      }
    }
    
    if (campaignProductId) {
      platformDiscountsMap[productId] = {
        discount: platformDiscount,
        campaignProductId,
        inPlatformCampaign: inPlatformCampaign && !campaignUsageExceeded,
      };
    }
  }
});

setPlatformVoucherDiscounts(platformDiscountsMap);
```

---

#### 2.2. Load Store-Wide Vouchers

**📡 API: Get Shop Vouchers By Store**

**Method:** GET  
**URL:** `/api/shop-vouchers/by-store?storeId={storeId}&status=ACTIVE&scopeType=ALL_SHOP_VOUCHER`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request:** Không có body

**Response:** (Xem chi tiết ở phần "📡 API CHÍNH - CHI TIẾT" ở trên)

**Logic:**
```typescript
// Thu thập storeIds từ productCache
const storeIds = new Set<string>();
cartItems.forEach(item => {
  const product = productCache.get(item.productId);
  if (product?.storeId) {
    storeIds.add(product.storeId);
  }
});

// Gọi API cho từng store (song song)
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

const results = await Promise.all(voucherPromises);
const vouchersMap: Record<string, StoreVoucher[]> = {};
results.forEach(({ storeId, vouchers }) => {
  vouchersMap[storeId] = vouchers;
});

setStoreWideVouchers(vouchersMap);
```

---

#### 2.3. Auto Calculate Shipping Fee

**📡 API: Calculate GHN Fee**

**Method:** POST  
**URL:** `/api/ghn/fee`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Request Body:** (Xem chi tiết ở phần "📦 LOGIC TÍNH PHÍ VẬN CHUYỂN - CHI TIẾT" ở trên)

**Response:** (Xem chi tiết ở phần "📦 LOGIC TÍNH PHÍ VẬN CHUYỂN - CHI TIẾT" ở trên)

**Trigger:** Khi `selectedAddressId` thay đổi hoặc `cartItems` thay đổi

**Logic:** (Xem chi tiết ở phần "📦 LOGIC TÍNH PHÍ VẬN CHUYỂN - CHI TIẾT" ở trên)

---

### PHASE 3: USER INTERACTION

#### 3.1. Chọn Địa Chỉ

**Action:** User chọn địa chỉ từ dropdown

**Effect:**
- `selectedAddressId` thay đổi
- Trigger `useAutoShippingFee` hook
- Tính lại shipping fee tự động (debounce 500ms)

---

#### 3.2. Chọn Phương Thức Thanh Toán

**Action:** User chọn COD hoặc PayOS

**Effect:**
- `paymentMethod` được set
- Enable/disable checkout button

---

#### 3.3. Áp Dụng/Bỏ Vouchers

**Action:** User áp dụng hoặc bỏ vouchers (product-specific hoặc store-wide)

**Effect:**
- `appliedStoreVouchers` hoặc `appliedStoreWideVouchers` được update
- Recalculate `voucherDiscount`
- Recalculate `total`

---

#### 3.4. Xóa Item

**📡 API: Delete Cart Items**

**Method:** DELETE  
**URL:** `/api/v1/customers/{customerId}/cart/items`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request Body:**
```json
{
  "cartItemIds": ["cart-item-id-1"]
}
```

**Response:**
```typescript
{
  cartId: string;
  customerId: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];  // Cart sau khi xóa
}
```

**Logic:**
```typescript
const resp = await CustomerCartService.deleteItems([id]);
const remainingIds = selectedCartItemIds.filter(itemId => itemId !== id);
setSelectedCartItemIds(remainingIds);

// Update cartItems với response mới
const nextItems = resp.items
  .filter(item => remainingIds.includes(item.cartItemId))
  .map(mapApiItemToCartItem);
setCartItems(nextItems);

// Nếu không còn items, redirect về /cart
if (remainingIds.length === 0) {
  window.location.href = '/cart';
}
```

---

### PHASE 4: CHECKOUT SUBMIT

#### 4.1. Validation

```typescript
// 1. Kiểm tra có items không
if (cartItems.length === 0) {
  setError('Giỏ hàng của bạn đang trống.');
  return;
}

// 2. Kiểm tra có địa chỉ không
if (!selectedAddressId) {
  setError('Vui lòng chọn địa chỉ nhận hàng.');
  return;
}

// 3. Kiểm tra có phương thức thanh toán không
if (!paymentMethod) {
  setError('Vui lòng chọn phương thức thanh toán.');
  return;
}

// 4. Kiểm tra shipping fee error
if (shippingFeeError) {
  setError('Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ.');
  return;
}
```

---

#### 4.2. Build Checkout Items Payload

**Logic:**
```typescript
const checkoutItemsPayload = cartItems.map(item => {
  const itemType = item.type || 'PRODUCT';
  const basePayload: any = {
    type: itemType,
    quantity: item.quantity,
  };
  
  if (itemType === 'COMBO') {
    // COMBO: Gửi comboId = productId (refId)
    basePayload.comboId = item.productId;
    return basePayload;
  }
  
  // PRODUCT
  if (item.variantId !== null && item.variantId !== undefined) {
    // Có variantId → gửi variantId, KHÔNG gửi productId
    basePayload.variantId = item.variantId;
    return basePayload;
  }
  
  // Không có variantId → gửi productId, KHÔNG gửi variantId
  basePayload.productId = item.productId;
  return basePayload;
});
```

**Ví dụ:**
```typescript
// Input: cartItems
[
  { type: 'PRODUCT', productId: 'prod-001', variantId: null, quantity: 2 },
  { type: 'PRODUCT', productId: 'prod-002', variantId: 'var-001', quantity: 1 },
  { type: 'COMBO', productId: 'combo-001', variantId: null, quantity: 1 }
]

// Output: checkoutItemsPayload
[
  { type: 'PRODUCT', productId: 'prod-001', quantity: 2 },
  { type: 'PRODUCT', variantId: 'var-001', quantity: 1 },  // Không có productId
  { type: 'COMBO', comboId: 'combo-001', quantity: 1 }
]
```

---

#### 4.3. Build Store Vouchers

**Logic:**
```typescript
const buildStoreVouchers = (
  applied: Record<string, AppliedStoreVoucher>,  // Per productId
  appliedStoreWide: Record<string, AppliedStoreWideVoucher>  // Per storeId
): CheckoutStoreVoucher[] => {
  const result: CheckoutStoreVoucher[] = [];
  
  // 1. Add product-specific vouchers
  Object.values(applied).forEach(voucher => {
    result.push({
      storeId: voucher.storeId,
      codes: [voucher.code],
    });
  });
  
  // 2. Add store-wide vouchers (merge với product vouchers nếu cùng store)
  Object.values(appliedStoreWide).forEach(voucher => {
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
  
  return result;
};
```

**Ví dụ:**
```typescript
// Input:
appliedStoreVouchers = {
  'prod-001': { code: 'SHOP50K', storeId: 'store-001', discountValue: 50000 },
  'prod-002': { code: 'SHOP100K', storeId: 'store-001', discountValue: 100000 }
}
appliedStoreWideVouchers = {
  'store-001': { code: 'STORE200K', discountValue: 200000 },
  'store-002': { code: 'STORE300K', discountValue: 300000 }
}

// Output: storeVouchers
[
  { storeId: 'store-001', codes: ['SHOP50K', 'SHOP100K', 'STORE200K'] },
  { storeId: 'store-002', codes: ['STORE300K'] }
]
```

---

#### 4.4. Build Platform Vouchers

**Logic:**
```typescript
// 1. Fetch missing platform vouchers nếu cần (cho variants)
const missingProductIds = new Set<string>();
checkoutItemsPayload.forEach(item => {
  if (item.variantId && !item.productId) {
    // Có variantId nhưng không có productId trong payload
    // Cần tìm productId từ cartItems
    const cartItem = cartItems.find(ci => ci.variantId === item.variantId);
    if (cartItem && !platformVoucherDiscounts[cartItem.productId]) {
      missingProductIds.add(cartItem.productId);
    }
  } else if (item.productId && !platformVoucherDiscounts[item.productId]) {
    missingProductIds.add(item.productId);
  }
});

// 2. Fetch platform vouchers cho missing products
let finalPlatformVoucherDiscounts = { ...platformVoucherDiscounts };
if (missingProductIds.size > 0) {
  const voucherPromises = Array.from(missingProductIds).map(async (productId) => {
    try {
      const voucherRes = await ProductVoucherService.getProductVouchers(productId, 'ALL', null);
      const platformCampaigns = voucherRes.data?.vouchers?.platform || [];
      let platformDiscount = 0;
      let campaignProductId: string | null = null;
      
      // Tìm active voucher
      for (const campaign of platformCampaigns) {
        if (campaign.status === 'ACTIVE' && campaign.vouchers?.length > 0) {
          const activeVoucher = campaign.vouchers.find(v => v.status === 'ACTIVE');
          if (activeVoucher) {
            campaignProductId = activeVoucher.platformVoucherId;
            
            // Tính discount
            if (activeVoucher.type === 'FIXED') {
              platformDiscount = activeVoucher.discountValue || 0;
            } else if (activeVoucher.type === 'PERCENT') {
              const originalPrice = voucherRes.data.product.price;
              const percentDiscount = (originalPrice * activeVoucher.discountPercent) / 100;
              platformDiscount = activeVoucher.maxDiscountValue
                ? Math.min(percentDiscount, activeVoucher.maxDiscountValue)
                : percentDiscount;
            }
            break;
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
  results.forEach(result => {
    if (result) {
      finalPlatformVoucherDiscounts[result.productId] = {
        discount: result.discount,
        campaignProductId: result.campaignProductId,
      };
    }
  });
}

// 3. Build platform vouchers map (gom theo campaignProductId)
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
  
  if (productId && finalPlatformVoucherDiscounts[productId]) {
    const { campaignProductId, inPlatformCampaign, discount } = finalPlatformVoucherDiscounts[productId];
    
    // Chỉ thêm nếu có campaignProductId và (discount > 0 hoặc inPlatformCampaign = true)
    if (campaignProductId && (discount > 0 || inPlatformCampaign)) {
      const currentQuantity = platformVouchersMap.get(campaignProductId) || 0;
      platformVouchersMap.set(campaignProductId, currentQuantity + item.quantity);
    }
  }
});

// 4. Convert Map → Array
const platformVouchers = Array.from(platformVouchersMap.entries()).map(([campaignProductId, quantity]) => ({
  campaignProductId,
  quantity,
}));
```

**Ví dụ:**
```typescript
// Input:
checkoutItemsPayload = [
  { type: 'PRODUCT', productId: 'prod-001', quantity: 2 },
  { type: 'PRODUCT', variantId: 'var-001', quantity: 1 }  // productId = 'prod-002'
]
finalPlatformVoucherDiscounts = {
  'prod-001': { campaignProductId: 'campaign-001', discount: 100000, inPlatformCampaign: true },
  'prod-002': { campaignProductId: 'campaign-001', discount: 50000, inPlatformCampaign: true }
}

// Output: platformVouchers
[
  { campaignProductId: 'campaign-001', quantity: 3 }  // 2 + 1 = 3
]
```

---

#### 4.5. Build Service Type IDs

**Logic:**
```typescript
const buildServiceTypeIds = (items: CartItem[], productCache: Map<string, Product>): ServiceTypeIds => {
  const result: ServiceTypeIds = {};
  const storeIds = new Set<string>();
  
  // Collect storeIds
  items.forEach(item => {
    const product = productCache.get(item.productId);
    if (product?.storeId) {
      storeIds.add(product.storeId);
    }
  });
  
  // Calculate serviceTypeId cho mỗi store
  storeIds.forEach(storeId => {
    let totalWeight = 0;
    items.forEach(item => {
      const product = productCache.get(item.productId);
      if (product && product.storeId === storeId) {
        const weightKg = (product.weight && product.weight > 0) ? product.weight : 0.5;
        totalWeight += weightKg * item.quantity;
      }
    });
    
    const totalWeightGr = totalWeight * 1000;  // Convert sang gram
    // ≤ 7500 gram → service_type_id = 2 (Hàng nhẹ)
    // > 7500 gram → service_type_id = 5 (Hàng nặng)
    result[storeId] = totalWeightGr <= 7500 ? 2 : 5;
  });
  
  return result;
};
```

**Ví dụ:**
```typescript
// Input:
cartItems = [
  { productId: 'prod-001', quantity: 2 },  // weight: 0.5kg, storeId: 'store-001'
  { productId: 'prod-002', quantity: 1 }    // weight: 1.2kg, storeId: 'store-001'
]
// Store-001: (0.5 * 2 + 1.2 * 1) * 1000 = 2200g → serviceTypeId = 2

// Output: serviceTypeIds
{
  'store-001': 2,  // Hàng nhẹ
  'store-002': 5   // Hàng nặng (nếu có store khác với weight > 7.5kg)
}
```

---

#### 4.6. COD Checkout Submit

**📡 API: Checkout COD**

**Method:** POST  
**URL:** `/api/v1/customers/{customerId}/cart/checkout-cod`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request Body:**
```typescript
{
  addressId: string;                    // UUID của địa chỉ nhận hàng
  message?: string;                     // Ghi chú đơn hàng (optional)
  items: Array<{
    productId?: string;                 // Nếu không có variantId
    variantId?: string;                // Nếu có variant
    comboId?: string;                  // Nếu là combo
    type: 'PRODUCT' | 'COMBO';
    quantity: number;
  }>;
  storeVouchers?: Array<{               // Optional, undefined nếu rỗng
    storeId: string;
    codes: string[];
  }> | undefined;
  platformVouchers?: Array<{            // Optional, null nếu rỗng
    campaignProductId: string;
    quantity: number;
  }> | null;
  serviceTypeIds?: Record<string, number> | undefined;  // Optional, undefined nếu rỗng
}
```

**Request Example:**
```json
{
  "addressId": "addr-001",
  "message": "Giao hàng vào buổi sáng",
  "items": [
    {
      "type": "PRODUCT",
      "productId": "prod-001",
      "quantity": 2
    },
    {
      "type": "PRODUCT",
      "variantId": "var-001",
      "quantity": 1
    },
    {
      "type": "COMBO",
      "comboId": "combo-001",
      "quantity": 1
    }
  ],
  "storeVouchers": [
    {
      "storeId": "store-001",
      "codes": ["SHOP50K", "SHOP100K", "STORE200K"]
    },
    {
      "storeId": "store-002",
      "codes": ["STORE300K"]
    }
  ],
  "platformVouchers": [
    {
      "campaignProductId": "campaign-prod-001",
      "quantity": 3
    }
  ],
  "serviceTypeIds": {
    "store-001": 2,
    "store-002": 5
  }
}
```

**Response Success (200):**
```typescript
{
  status: 200;
  message: "Order created successfully";
  data: Array<{                      // Array các store orders
    id: string;                      // Order ID
    orderCode: string;               // Mã đơn hàng
    status: string;                  // Order status
    message: string | null;          // Message từ customer
    createdAt: string;               // ISO datetime
    storeId: string;                 // Store ID
    storeName: string;               // Store name
    totalAmount: number;             // Tổng tiền (VND)
    shippingFeeTotal: number;        // Tổng phí ship (VND)
    discountTotal: number;           // Tổng giảm giá (VND)
    grandTotal: number;              // Tổng tiền cuối cùng (VND)
    storeVoucherDiscount: number | null;  // Discount từ store vouchers
    platformDiscount: Record<string, number>;  // Discount từ platform vouchers theo store
    receiverName: string;            // Tên người nhận
    phoneNumber: string;             // Số điện thoại
    country: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    addressLine: string;
    postalCode: string;
    note: string | null;
    shippingServiceTypeId: number | null;  // Service type ID (2 hoặc 5)
  }>;
}
```

**Response Example:**
```json
{
  "status": 200,
  "message": "Order created successfully",
  "data": [
    {
      "id": "order-001",
      "orderCode": "ORD20240101001",
      "status": "PENDING",
      "message": "Giao hàng vào buổi sáng",
      "createdAt": "2024-01-01T10:00:00Z",
      "storeId": "store-001",
      "storeName": "Audio Store",
      "totalAmount": 5000000,
      "shippingFeeTotal": 25000,
      "discountTotal": 350000,
      "grandTotal": 4675000,
      "storeVoucherDiscount": 350000,
      "platformDiscount": {},
      "receiverName": "Nguyễn Văn A",
      "phoneNumber": "0123456789",
      "country": "Việt Nam",
      "province": "TP. Hồ Chí Minh",
      "district": "Quận 7",
      "ward": "Phường Tân Thuận Đông",
      "street": "Đường Nguyễn Hữu Thọ",
      "addressLine": "123/45",
      "postalCode": "700000",
      "note": "Giao hàng vào buổi sáng",
      "shippingServiceTypeId": 2
    }
  ]
}
```

**Response Error (400/500):**
```json
{
  "status": 400,
  "message": "Invalid request data",
  "data": null
}
```

**Xử lý Response:**
```typescript
const response = await CustomerCartService.checkoutCod(request);

if (response.status === 200) {
  // Success
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  showCenterSuccess(
    response.message || 'Đặt hàng thành công!',
    'Thành công',
    4000
  );
  setCartItems([]);
  navigate('/orders', { replace: true });
} else {
  // Error
  setError(response.message || 'Không thể tạo đơn hàng.');
}
```

---

#### 4.7. PayOS Checkout Submit

**📡 API: Checkout PayOS**

**Method:** POST  
**URL:** `/api/v1/payos/checkout?customerId={customerId}`

**Headers:**
```json
{
  "Authorization": "Bearer {CUSTOMER_token}",
  "Content-Type": "application/json",
  "Accept": "*/*"
}
```

**Request Body:**
```typescript
{
  addressId: string;                    // UUID của địa chỉ nhận hàng
  message?: string;                     // Ghi chú đơn hàng (optional)
  description?: string;                 // Mô tả đơn hàng (optional)
  items: Array<{
    productId?: string;
    variantId?: string;
    comboId?: string;
    type: 'PRODUCT' | 'COMBO';
    quantity: number;
  }>;
  storeVouchers?: Array<{               // Optional, undefined nếu rỗng
    storeId: string;
    codes: string[];
  }> | undefined;
  platformVouchers?: Array<{            // Optional, null nếu rỗng
    campaignProductId: string;
    quantity: number;
  }> | null;
  serviceTypeIds?: Record<string, number> | undefined;  // Optional, undefined nếu rỗng
  returnUrl: string;                    // Required: URL redirect sau khi thanh toán thành công
  cancelUrl: string;                    // Required: URL redirect sau khi hủy thanh toán
}
```

**Request Example:**
```json
{
  "addressId": "addr-001",
  "message": "Giao hàng vào buổi sáng",
  "description": "Đơn hàng Audio Equipment",
  "items": [
    {
      "type": "PRODUCT",
      "productId": "prod-001",
      "quantity": 2
    }
  ],
  "storeVouchers": [
    {
      "storeId": "store-001",
      "codes": ["SHOP50K"]
    }
  ],
  "platformVouchers": null,
  "serviceTypeIds": {
    "store-001": 2
  },
  "returnUrl": "https://yourapp.com/payment/success",
  "cancelUrl": "https://yourapp.com/payment/fail"
}
```

**Response Success (200):**
```typescript
{
  status: 200;
  message: "PayOS checkout created successfully";
  data: {
    customerOrderId: string;       // Order ID
    amount: number;                // Số tiền thanh toán (VND)
    payOSOrderCode: number;        // Mã đơn hàng PayOS
    checkoutUrl: string;           // URL để redirect user đến trang thanh toán PayOS
    qrCode: string;                // QR code để thanh toán
    status: string;                // Trạng thái
  };
}
```

**Response Example:**
```json
{
  "status": 200,
  "message": "PayOS checkout created successfully",
  "data": {
    "customerOrderId": "order-001",
    "amount": 4675000,
    "payOSOrderCode": 1234567890,
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "qrCode": "data:image/png;base64,...",
    "status": "PENDING"
  }
}
```

**Xử lý Response:**
```typescript
const response = await CustomerCartService.checkoutPayOS(request);

if (response.status === 200 && response.data?.checkoutUrl) {
  // Success
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  window.location.href = response.data.checkoutUrl;  // Redirect đến PayOS
  return;
} else {
  // Error
  setError(response.message || 'Không thể tạo thanh toán PayOS.');
}
```

---

### PHASE 5: SUCCESS HANDLING

#### 5.1. COD Success

**Actions:**
1. Clear `sessionStorage` key `checkout:payload:v1`
2. Show success notification: "Đặt hàng thành công!"
3. Clear cart items: `setCartItems([])`
4. Redirect to `/orders` page

**Code:**
```typescript
if (response.status === 200) {
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  showCenterSuccess(
    response.message || 'Đặt hàng thành công!',
    'Thành công',
    4000
  );
  setCartItems([]);
  navigate('/orders', { replace: true });
}
```

---

#### 5.2. PayOS Success

**Actions:**
1. Clear `sessionStorage` key `checkout:payload:v1`
2. Redirect user đến `checkoutUrl` để thanh toán
3. PayOS sẽ redirect về `returnUrl` nếu thanh toán thành công
4. PayOS sẽ redirect về `cancelUrl` nếu thanh toán thất bại/hủy

**Code:**
```typescript
if (response.status === 200 && response.data?.checkoutUrl) {
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  window.location.href = response.data.checkoutUrl;
  return;
}
```

---

### TÓM TẮT API CALLS TRONG CHECKOUT FLOW

| Phase | API Name | Method | URL | Purpose |
|-------|----------|--------|-----|---------|
| **Init** | Get Addresses | GET | `/api/customers/{customerId}/addresses` | Lấy danh sách địa chỉ |
| **Init** | Get Cart | GET | `/api/v1/customers/{customerId}/cart` | Lấy giỏ hàng |
| **Load Data** | Get Product Vouchers | GET | `/api/products/view/{productId}/vouchers?type=ALL` | Lấy vouchers của sản phẩm |
| **Load Data** | Get Product Detail | GET | `/api/v1/products/{productId}` | Lấy chi tiết sản phẩm (storeId, weight, address) |
| **Load Data** | Get Store-Wide Vouchers | GET | `/api/shop-vouchers/by-store?storeId={id}&status=ACTIVE&scopeType=ALL_SHOP_VOUCHER` | Lấy vouchers toàn shop |
| **Load Data** | Calculate GHN Fee | POST | `/api/ghn/fee` | Tính phí vận chuyển |
| **User Action** | Delete Cart Item | DELETE | `/api/v1/customers/{customerId}/cart/items` | Xóa item khỏi cart |
| **Checkout** | Checkout COD | POST | `/api/v1/customers/{customerId}/cart/checkout-cod` | Tạo đơn hàng COD |
| **Checkout** | Checkout PayOS | POST | `/api/v1/payos/checkout?customerId={customerId}` | Tạo thanh toán PayOS |

---

### ERROR HANDLING

#### Common Errors

**1. Missing Payload:**
- Error: "Không tìm thấy thông tin giỏ hàng."
- Action: Redirect to `/cart`

**2. Empty Cart:**
- Error: "Giỏ hàng của bạn đang trống."
- Action: Redirect to `/cart`

**3. Selected Items Not Found:**
- Error: "Không tìm thấy sản phẩm đã chọn."
- Action: Redirect to `/cart`

**4. No Address Selected:**
- Error: "Vui lòng chọn địa chỉ nhận hàng."
- Action: Show error, không submit

**5. No Payment Method:**
- Error: "Vui lòng chọn phương thức thanh toán."
- Action: Show error, không submit

**6. Shipping Fee Error:**
- Error: "Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ."
- Action: Show error, không submit

**7. Checkout API Error:**
- Error: Message từ API response
- Action: Show error, giữ user ở checkout page

---

### CHECKLIST ĐỂ CHECKOUT THÀNH CÔNG

**Trước khi submit:**
- [ ] Có ít nhất 1 item trong cart
- [ ] Đã chọn địa chỉ nhận hàng
- [ ] Đã chọn phương thức thanh toán (COD hoặc PayOS)
- [ ] Shipping fee đã được tính thành công (không có error)
- [ ] Tất cả product details đã được load (productCache đầy đủ)

**Khi submit:**
- [ ] Build checkout items payload đúng format
- [ ] Build store vouchers đúng format
- [ ] Build platform vouchers đúng format (fetch nếu thiếu)
- [ ] Build service type IDs đúng format
- [ ] Gọi API checkout với đầy đủ thông tin

**Sau khi thành công:**
- [ ] Clear sessionStorage
- [ ] Show success message
- [ ] Redirect đúng trang (COD: /orders, PayOS: checkoutUrl)

---

### CODE LOCATION

- **Checkout Container**: `src/components/CheckoutOrderComponents/CheckoutOrderContainer.tsx`
- **Cart Service**: `src/services/customer/CartService.ts`
- **Address Service**: `src/services/customer/AddressService.ts`
- **Product Voucher Service**: `src/services/customer/ProductVoucherService.ts`
- **Product List Service**: `src/services/customer/ProductListService.ts`
- **Voucher Service**: `src/services/seller/VoucherService.ts`
- **Shipping Service**: `src/services/customer/ShippingService.ts`
- **Auto Shipping Fee Hook**: `src/hooks/useAutoShippingFee.ts`
- **Service Type Calculator Hook**: `src/hooks/useServiceTypeCalculator.ts`

 