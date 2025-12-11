# Shopping Cart APIs Documentation

Tài liệu này mô tả tất cả các API được sử dụng trong trang `ShoppingCart.tsx`.

## 📋 Tổng quan

Trang Shopping Cart sử dụng các API sau:
1. **GET Cart** - Lấy giỏ hàng hiện tại
2. **POST Update Quantity with Vouchers** - Cập nhật số lượng sản phẩm kèm vouchers
3. **DELETE Cart Items** - Xóa một hoặc nhiều items khỏi giỏ hàng
4. **DELETE Cart** - Xóa toàn bộ giỏ hàng
5. **GET Addresses** - Lấy danh sách địa chỉ của customer
6. **GET Product Vouchers** - Lấy vouchers của sản phẩm
7. **GET Product Detail** - Lấy chi tiết sản phẩm

---

## 1. GET Cart - Lấy giỏ hàng

### API URL
```
GET /api/v1/customers/{customerId}/cart
```

### Request Headers
```
Authorization: Bearer {CUSTOMER_token}
Content-Type: application/json
Accept: */*
```

### Request Body
Không có (GET request)

### Response Body
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
```

### CartItem Attributes
```typescript
interface CartItem {
  cartItemId: string;           // UUID của cart item
  type: 'PRODUCT' | 'COMBO';   // Loại item
  refId: string;               // Product ID hoặc Combo ID
  name: string;                 // Tên sản phẩm/combo
  image: string;                // URL ảnh
  quantity: number;             // Số lượng
  unitPrice: number;            // Giá hiện tại (đã áp dụng platform campaign nếu có)
  lineTotal: number;            // Tổng tiền = unitPrice * quantity
  originProvinceCode?: string;  // Mã tỉnh/thành nơi sản phẩm
  originDistrictCode?: string;  // Mã quận/huyện
  originWardCode?: string;      // Mã phường/xã
  variantId?: string;           // Variant ID (nếu có)
  variantOptionName?: string;   // Tên option (VD: "Color")
  variantOptionValue?: string;  // Giá trị option (VD: "Black")
  variantUrl?: string;          // URL ảnh variant (nếu có)
  
  // Platform campaign fields (từ backend)
  baseUnitPrice?: number;       // Giá gốc (chưa campaign)
  platformCampaignPrice?: number; // Giá sau campaign (nếu có)
  inPlatformCampaign?: boolean;   // Có đang nằm trong campaign không
  campaignUsageExceeded?: boolean; // Đã vượt giới hạn sử dụng campaign chưa
  campaignRemaining?: number;      // Số lượng còn lại trong campaign (0 nếu hết)
}
```

### Service/Hook
- **Service**: `CustomerCartService.getCart()`
- **Hook**: `useCart()` → `loadCart()`

---

## 2. POST Update Quantity with Vouchers

### API URL
```
POST /api/v1/customers/{customerId}/cart/items/quantity-with-vouchers
```

### Request Headers
```
Authorization: Bearer {CUSTOMER_token}
Content-Type: application/json
Accept: */*
```

### Request Body
```typescript
{
  cartItemId: string;           // UUID của cart item cần cập nhật
  quantity: number;             // Số lượng mới (1-99)
  storeVouchers?: Array<{      // Vouchers của shop (optional)
    storeId: string;            // UUID của shop
    codes: string[];            // Mã voucher codes
  }> | null;
  platformVouchers?: Array<{   // Vouchers của platform (optional)
    campaignProductId: string; // UUID của platform voucher
    quantity: number;           // Số lượng áp dụng
  }> | null;
  serviceTypeIds?: Record<string, number> | null; // Service type IDs theo storeId
}
```

### Response Body
```typescript
{
  cartId: string;
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];  // Danh sách items đã được cập nhật
}
```

### Service
- **Service**: `CustomerCartService.updateQuantityWithVouchers(request)`

### Ghi chú
- API này được gọi khi user thay đổi số lượng sản phẩm trong giỏ hàng
- Backend sẽ tự động tính lại giá dựa trên vouchers và platform campaigns
- Nếu item không trong campaign, có thể skip API call và update local để tối ưu

---

## 3. DELETE Cart Items - Xóa items

### API URL
```
DELETE /api/v1/customers/{customerId}/cart/items
```

### Request Headers
```
Authorization: Bearer {CUSTOMER_token}
Content-Type: application/json
Accept: */*
```

### Request Body
```typescript
{
  cartItemIds: string[];  // Mảng UUID của các cart items cần xóa
}
```

### Response Body
```typescript
{
  cartId: string;
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];  // Danh sách items còn lại sau khi xóa
}
```

### Service
- **Service**: `CustomerCartService.deleteItems(cartItemIds)`

---

## 4. DELETE Cart - Xóa toàn bộ giỏ hàng

### API URL
```
DELETE /api/v1/customers/{customerId}/cart
```

### Request Headers
```
Authorization: Bearer {CUSTOMER_token}
Content-Type: application/json
Accept: */*
```

### Request Body
Không có (DELETE request)

### Response Body
```typescript
{
  cartId: string;
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];  // Mảng rỗng []
}
```

### Service
- **Service**: `CustomerCartService.deleteCart()`

---

## 5. GET Addresses - Lấy danh sách địa chỉ

### API URL
```
GET /api/customers/{customerId}/addresses
```

### Request Headers
```
Authorization: Bearer {CUSTOMER_token}
Content-Type: application/json
Accept: */*
```

### Request Body
Không có (GET request)

### Response Body
```typescript
CustomerAddressApiItem[]
```

### CustomerAddressApiItem Attributes
```typescript
interface CustomerAddressApiItem {
  id: string;                    // UUID của address
  customerId: string;            // UUID của customer
  receiverName: string;          // Tên người nhận
  phoneNumber: string;           // Số điện thoại
  label: 'HOME' | 'WORK' | 'OTHER';
  country: string;               // Quốc gia
  province: string;              // Tỉnh/thành
  district: string;              // Quận/huyện
  ward: string;                  // Phường/xã
  street: string;                // Đường
  addressLine: string;           // Địa chỉ đầy đủ
  postalCode: string;            // Mã bưu điện
  note?: string | null;          // Ghi chú
  default: boolean;              // Địa chỉ mặc định
  provinceCode: string | null;   // Mã tỉnh/thành
  districtId: number | null;     // ID quận/huyện
  wardCode: string | null;       // Mã phường/xã
}
```

### Service
- **Service**: `AddressService.getAddresses()`

---

## 6. GET Product Vouchers - Lấy vouchers của sản phẩm

### API URL
```
GET /api/products/view/{productId}/vouchers?type={type}&campaignType={campaignType}
```

### Request Headers
```
Authorization: Bearer {CUSTOMER_token}
Content-Type: application/json
Accept: */*
```

### Query Parameters
- `type` (optional): `'ALL'` | `'SHOP'` | `'PLATFORM'`
- `campaignType` (optional): Loại campaign (VD: `'FAST_SALE'`)

### Request Body
Không có (GET request)

### Response Body
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
        discountValue: number | null;
        discountPercent: number | null;
        maxDiscountValue: number | null;
        minOrderValue: number | null;
        startTime: string;
        endTime: string;
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
        status: string;
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

### Service
- **Service**: `ProductVoucherService.getProductVouchers(productId, type, campaignType)`

### Ghi chú
- API này được gọi để load vouchers cho tất cả products trong giỏ hàng
- Chỉ load vouchers cho PRODUCT items (không phải COMBO)
- Vouchers được group theo productId để mỗi product chỉ có vouchers của chính nó

---

## 7. GET Product Detail - Lấy chi tiết sản phẩm

### API URL
```
GET /api/products/{productId}
```

### Request Headers
```
Authorization: Bearer {CUSTOMER_token}  // Optional
Content-Type: application/json
Accept: */*
```

### Request Body
Không có (GET request)

### Response Body
```typescript
{
  status: number;
  message: string;
  data: Product;  // Xem ProductListService.ts để biết chi tiết Product type
}
```

### Product Attributes (chính)
```typescript
interface Product {
  productId: string;
  storeId: string;
  storeName: string;
  name: string;
  price: number;
  // ... nhiều fields khác
  weight: number;  // Trọng lượng (kg) - dùng để tính service type
}
```

### Service
- **Service**: `ProductListService.getProductById(productId)`

### Ghi chú
- API này được gọi để lấy thông tin chi tiết sản phẩm (đặc biệt là `weight` và `storeId`)
- Dùng để tính toán service type ID (≤7500g → 2, >7500g → 5)
- Có cache để tránh gọi API nhiều lần cho cùng một product

---

## 📊 Data Flow trong ShoppingCart.tsx

### 1. Initial Load
```
useCart() → CustomerCartService.getCart()
         → GET /api/v1/customers/{customerId}/cart
         → Response: CartResponse với items
         → Map items → UI items
```

### 2. Load Vouchers
```
useEffect → ProductVoucherService.getProductVouchers() (cho mỗi product)
         → GET /api/products/view/{productId}/vouchers
         → Response: ProductVoucherResponse
         → Extract shop vouchers → availableVouchers
```

### 3. Load Addresses
```
useEffect → AddressService.getAddresses()
         → GET /api/customers/{customerId}/addresses
         → Response: CustomerAddressApiItem[]
         → Set default address
```

### 4. Update Quantity
```
updateQuantity() → buildStoreVouchers()
                → buildPlatformVouchers()
                → buildServiceTypeIds()
                → CustomerCartService.updateQuantityWithVouchers()
                → POST /api/v1/customers/{customerId}/cart/items/quantity-with-vouchers
                → Response: CartResponse
                → Apply to UI
```

### 5. Delete Item
```
removeItem() → CustomerCartService.deleteItems([cartItemId])
            → DELETE /api/v1/customers/{customerId}/cart/items
            → Response: CartResponse
            → Apply to UI
```

### 6. Delete All
```
handleDeleteAll() → CustomerCartService.deleteCart()
                 → DELETE /api/v1/customers/{customerId}/cart
                 → Response: CartResponse (empty items)
                 → Apply to UI
```

---

## 🔑 Key Attributes từ API Response

### Từ CartResponse (GET Cart)
- `items[].cartItemId` - ID của cart item
- `items[].unitPrice` - Giá hiện tại (đã áp dụng campaign)
- `items[].baseUnitPrice` - Giá gốc (chưa campaign)
- `items[].platformCampaignPrice` - Giá sau platform campaign
- `items[].inPlatformCampaign` - Có trong campaign không
- `items[].campaignUsageExceeded` - Đã vượt giới hạn chưa
- `items[].campaignRemaining` - Số lượng còn lại trong campaign
- `subtotal` - Tổng tiền trước giảm giá
- `discountTotal` - Tổng giảm giá
- `grandTotal` - Tổng tiền cuối cùng

### Từ ProductVoucherResponse
- `data.vouchers.shop[]` - Shop vouchers
  - `code` - Mã voucher
  - `type` - Loại (FIXED/PERCENT)
  - `discountValue` / `discountPercent` - Giá trị giảm giá
  - `minOrderValue` - Giá trị đơn hàng tối thiểu
- `data.vouchers.platform[]` - Platform campaigns
  - `vouchers[].platformVoucherId` - ID của platform voucher
  - `vouchers[].status` - Trạng thái voucher
  - `vouchers[].slotStatus` - Trạng thái slot (cho Flash Sale)

### Từ CustomerAddressApiItem[]
- `id` - ID của address
- `default` - Địa chỉ mặc định
- `addressLine` - Địa chỉ đầy đủ
- `provinceCode`, `districtId`, `wardCode` - Mã địa chỉ

### Từ Product (getProductById)
- `productId` - ID sản phẩm
- `storeId` - ID của shop
- `storeName` - Tên shop
- `weight` - Trọng lượng (kg) - dùng để tính service type
- `price` - Giá sản phẩm

---

## 📝 Notes

1. **Platform Campaign**: Backend tự động xử lý platform campaigns, frontend chỉ cần hiển thị giá từ `unitPrice` hoặc `platformCampaignPrice`

2. **Vouchers**: 
   - Shop vouchers được apply theo productId (mỗi product có vouchers riêng)
   - Platform vouchers được apply theo campaignProductId và quantity

3. **Service Type IDs**: 
   - Tính dựa trên tổng trọng lượng của items trong mỗi store
   - ≤7500g → serviceTypeId = 2 (Hàng nhẹ)
   - >7500g → serviceTypeId = 5 (Hàng nặng)

4. **Optimization**: 
   - Nếu item không trong campaign, có thể skip API call khi update quantity
   - Product details được cache để tránh gọi API nhiều lần

5. **Error Handling**: 
   - Tất cả API calls đều có try-catch
   - Errors được format qua `CustomerCartService.formatCartError()`

