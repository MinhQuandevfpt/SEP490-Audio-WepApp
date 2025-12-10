# Shopping Cart (Web) — Guide for Mobile (Expo)

Tài liệu này phân tích logic màn Shopping Cart (`src/pages/Customer/Cart/ShoppingCart.tsx`) để dựng lại trên mobile.

## Luồng tổng quan
- Lấy `cart` từ hook `useCart()` (backend đã áp dụng platform campaign vào giá).
- Lấy địa chỉ giao hàng từ `AddressService`.
- Map dữ liệu cart API → UI items, lưu `items` state.
- Tải voucher cửa hàng/sản phẩm (shop vouchers) cho từng product trong giỏ.
- Tính tạm tính, giảm giá nền tảng, giảm giá voucher, phí ship, grand total.
- Cho phép tăng/giảm số lượng, xóa item, xóa giỏ, áp dụng/bỏ voucher, chọn tất cả.
- Chuẩn bị payload và điều hướng sang checkout.

## API chính
> Backend đã tính sẵn platform campaign trong cart API.

### 1) Lấy giỏ hàng (qua `useCart`)
- **Endpoint**: `GET /api/v1/customers/{customerId}/cart` (chi tiết trong hook/service, không nằm trong file này).
- **Dữ liệu mỗi item (ApiCartItem, tóm tắt)**:
  - `cartItemId`, `refId` (productId), `name`, `image`, `variantUrl`, `variantId`, `variantOptionValue`.
  - Giá: `baseUnitPrice` (gốc), `platformCampaignPrice` (sau campaign), `unitPrice` (giá hiện tại), `inPlatformCampaign`, `campaignUsageExceeded`, `campaignRemaining`.
  - `quantity`, `type` (`PRODUCT`/`COMBO`).

### 2) Cập nhật số lượng với voucher
- **Endpoint**: `POST /api/v1/customers/cart/update-quantity-with-vouchers` (từ `CustomerCartService.updateQuantityWithVouchers`).
- **Payload** (xây từ UI):
  - `cartItemId`, `quantity`
  - `storeVouchers`: mảng `{ storeId, codes[] } | null`
  - `platformVouchers`: mảng `{ campaignProductId, quantity } | null` (nếu item đang trong campaign)
  - `serviceTypeIds`: `{ [storeId]: number } | null` (dùng cân nặng tính service type)
- **Response**: cart summary + `items[]` (cùng schema cart) đã áp dụng thay đổi.

### 3) Xóa item
- **Endpoint**: `POST /api/v1/customers/cart/delete-items` (qua `CustomerCartService.deleteItems`).
- **Body**: `["cartItemId1", ...]`.
- **Response**: cart mới.
  - **Request (sample)**:
    ```
    POST https://audioe-commerce-production.up.railway.app/api/v1/customers/cart/delete-items
    Content-Type: application/json
    Authorization: Bearer <CUSTOMER_token>
    
    ["0b1f0e9c-1b24-4c7d-8b6a-123456789abc"]
    ```
  - **Response (sample, rút gọn)**:
    ```json
    {
      "status": 200,
      "message": "Xóa sản phẩm khỏi giỏ thành công",
      "items": [
        {
          "cartItemId": "c2e5b201-5a18-45a0-9d3e-aaaa1111bbbb",
          "refId": "3888d063-0fd9-4fab-a8de-a69c1dbe8a29",
          "name": "marshall 001 sound max 2000",
          "image": "https://.../thumb.jpg",
          "variantUrl": "https://.../variant.webp",
          "variantId": "4af33932-7da2-4183-a810-8b94ff282dce",
          "variantOptionValue": "Trắng",
          "type": "PRODUCT",
          "baseUnitPrice": 267000,
          "platformCampaignPrice": 240300,
          "unitPrice": 240300,
          "inPlatformCampaign": true,
          "campaignUsageExceeded": false,
          "campaignRemaining": 10,
          "quantity": 2
        }
        // ... các item còn lại
      ],
      "subtotal": 480600,
      "discountTotal": 26700,
      "grandTotal": 453900
    }
    ```

### 4) Xóa toàn bộ
- **Endpoint**: `POST /api/v1/customers/cart/delete`.

### 5) Lấy voucher sản phẩm
- **Endpoint**: `GET /api/products/{productId}/vouchers?type=ALL` (qua `ProductVoucherService.getProductVouchers`).
- Trả về `vouchers.shop[]` và `vouchers.platform[]` (platform dùng cho hiển thị/campaign check).

### 6) Lấy chi tiết sản phẩm (để biết storeId)
- **Endpoint**: `GET /api/products/{productId}` (qua `ProductListService.getProductById`).
- Dùng để map storeId cho voucher và nhóm cửa hàng.

### 7) Địa chỉ giao hàng
- **Endpoint**: `GET /api/v1/customers/addresses` (qua `AddressService.getAddresses`).

## Mapping dữ liệu cart → UI
- Hàm `mapApiItemToUI(apiItem)`:
  - `finalPrice`: nếu `inPlatformCampaign && !campaignUsageExceeded && platformCampaignPrice` thì dùng `platformCampaignPrice`, else `unitPrice`.
  - `originalPrice`: `baseUnitPrice ?? unitPrice`.
  - `image`: ưu tiên `variantUrl`, fallback `image`.
  - `variantId`, `variant` từ `variantOptionValue`.
  - `isSelected`: mặc định true; khi cập nhật giữ nguyên selection nếu cần.

## State chính
- `items`: danh sách cart UI.
- `addresses`, `selectedAddressId`.
- `availableVouchers`: shop vouchers dedup theo code.
- `productVouchersMapState`: Map `productId -> shop vouchers` (chỉ voucher thuộc sản phẩm đó).
- `productVoucherAvailability`: `productId -> boolean` (có shop voucher?).
- `appliedStoreVouchers`: `{ [productId]: AppliedStoreVoucher }` (voucher shop đang áp dụng).
- `productCache`: Map `productId -> product detail` (để lấy storeId, weight).
- `serviceTypeId`, `packageWeight` (từ hook `useServiceTypeCalculator`).
- `shippingFee`.
- `summary`: từ `calcCartSummary(items)` (số lượng chọn, vv).

## Hiển thị giá sản phẩm (campaign / flash sale)
- Cart API đã áp dụng platform campaign vào giá:
  - `baseUnitPrice`: giá gốc.
  - `platformCampaignPrice`: giá sau campaign (nếu còn hiệu lực).
  - `unitPrice`: giá hiện tại (đã tính campaign nếu có).
  - `inPlatformCampaign`, `campaignUsageExceeded`: trạng thái tham gia/đã vượt giới hạn.
- Mapping sang UI:
  - `price` = `platformCampaignPrice` nếu `inPlatformCampaign && !campaignUsageExceeded && platformCampaignPrice` có giá trị, ngược lại `unitPrice`.
  - `originalPrice` = `baseUnitPrice ?? unitPrice`.
- UI đề xuất:
  - Nếu `price < originalPrice`: hiển thị `price` (màu nổi bật) và `originalPrice` gạch ngang.
  - Nếu không: hiển thị `price` bình thường.

## Tải voucher cho các sản phẩm trong giỏ
- Lọc `cart.items` có `type === 'PRODUCT'`, lấy unique `productIds`.
- Với mỗi `productId`:
  - Gọi song song `getProductVouchers(pid, 'ALL')` và `getProductById(pid)`.
  - Lưu shop vouchers vào `productVouchersMapState` (kèm `storeId`), set `availability`.
- `availableVouchers`: gộp tất cả shop vouchers (dedup theo code) để tương thích code cũ.

## Tính toán tổng tiền
- `subtotalBeforePlatformDiscount`: tổng `originalPrice * quantity` (chỉ item được chọn).
- `totalPlatformDiscount`: `(originalPrice - price) * quantity` trên item được chọn.
- `voucherDiscount`: tổng `appliedStoreVouchers[].discountValue`.
- `grandTotal`: `subtotal - platformDiscount - voucherDiscount + shippingFee` (>= 0, làm tròn).

## Vouchers (shop) áp dụng/bỏ
- Áp dụng: kiểm tra code đã dùng cho product khác chưa (map `voucherCodeToProductIdMap`), nếu ok lưu vào `appliedStoreVouchers[productId]`.
- Bỏ: xóa entry `appliedStoreVouchers[productId]`.
- Tự động bỏ voucher khi không đạt `minOrderValue` hoặc voucher không còn hợp lệ cho product/store.

## Nhóm theo cửa hàng
- Dựa trên `productCache.get(item.productId).storeId`.
- `storeGroups`: `{ storeId, storeName, items[], vouchers: storeVoucherMap[storeId], selectedTotal }`.
- Dùng cho UI hiển thị và tính tổng theo store (để check minOrder voucher).

## Cập nhật số lượng (logic quan trọng)
- Nếu item **không** trong campaign hoặc đã vượt giới hạn (`!inPlatformCampaign || campaignUsageExceeded`):
  - Bỏ qua API, cập nhật local `quantity` và giữ giá = `originalPrice`.
- Nếu trong campaign:
  - Xây `storeVouchers` (từ `appliedStoreVouchers`), `platformVouchers` (tìm voucher active theo product), `serviceTypeIds` (dựa trên cân nặng/ store).
  - Gọi API update quantity with vouchers.
  - Áp dụng response vào UI, giữ nguyên selection.
  - Nếu `campaignUsageExceeded` trong response → cảnh báo.

## Xóa item / xóa giỏ
- Gọi API tương ứng, sau đó map response → UI và giữ selection.

## Checkout
- Kiểm tra phải có item được chọn.
- Build payload:
  ```json
  {
    "selectedCartItemIds": [ ... ],
    "storeVouchers": { [productId]: AppliedStoreVoucher },
    "selectedAddressId": "...",
    "createdAt": <timestamp>
  }
  ```
- Lưu vào `sessionStorage` (web), điều hướng `/checkout`. Mobile: có thể lưu trong state hoặc storage và điều hướng màn Checkout.

## UI mapping (gợi ý mobile)
- Danh sách nhóm theo store: hiển thị items, ảnh, tên, giá sau giảm + giá gốc (nếu có).
- Chọn/bỏ chọn item, chọn tất cả.
- Thay đổi số lượng với logic tối ưu (skip API khi không cần).
- Áp dụng/bỏ voucher shop per product; hiển thị voucher availability.
- Sidebar/tóm tắt: subtotal, giảm nền tảng, giảm voucher, phí ship, grand total, nút Checkout.
- Breadcrumb có thể lược bỏ trên mobile; giữ cảnh báo/lỗi qua toast.

## Lưu ý
- Backend đã áp dụng platform campaign giá; UI chỉ hiển thị và tính toán theo giá đã trả về.
- Khi so sánh minOrder voucher, dùng tổng theo store và chỉ tính items được chọn.
- Cân nặng: nếu product không có weight, mặc định 0.5kg (trong logic serviceType).
- Giới hạn quantity: clamp 1..99.

