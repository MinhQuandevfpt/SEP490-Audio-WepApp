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

## API chính
- Cart hiện tại: `CustomerCartService.getCart()` → items (đã có giá sau platform campaign), subtotal, ...
- Update quantity/xóa item: dùng lại service Cart (ở Checkout chỉ dùng xóa item).
- Vouchers sản phẩm: `ProductVoucherService.getProductVouchers(productId, 'ALL', null)`
- Product detail: `ProductListService.getProductById(productId)` (lấy storeId, storeName, weight)
- Voucher toàn shop: `VoucherService.getShopVouchersByStore(storeId, 'ACTIVE', 'ALL_SHOP_VOUCHER')`
- Địa chỉ: `AddressService.getAddresses()`
- Checkout:
  - COD: `CustomerCartService.checkoutCod(request)`
  - PayOS: `CustomerCartService.checkoutPayOS(request)` (trả về `checkoutUrl` để redirect)

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

## Tải vouchers (useEffect)
- Lấy unique `productIds` từ `cartItems`.
- Với mỗi productId: gọi song song `getProductVouchers(pid)` và `getProductById(pid)`.
  - Shop vouchers → gắn `storeId` rồi gộp, dedup theo `code` → `availableVouchers`.
  - Platform: lưu `platformVoucherDiscounts[productId] = { discount, campaignProductId, inPlatformCampaign }`:
    - Ưu tiên voucher ACTIVE; nếu `inPlatformCampaign` từ cart response nhưng không thấy voucher active, lấy `platformVoucherId` đầu tiên để có campaignProductId.
    - Discount tính theo type PERCENT/FIXED, áp dụng `maxDiscountValue`.
  - Lưu `storeMetadata` (storeName) từ product detail.
- Lấy voucher toàn shop: duyệt các storeId trong cart, gọi `VoucherService.getShopVouchersByStore`.
- **Get store-wide vouchers (chi tiết)**:
  - Thu thập `storeIds` từ `productCache` (mỗi item -> storeId).
  - `VoucherService.getShopVouchersByStore(storeId, 'ACTIVE', 'ALL_SHOP_VOUCHER')` cho từng store.
  - Lưu vào `storeWideVouchers: Record<storeId, StoreVoucher[]>`.
  - Khi áp dụng voucher toàn shop: tính discount theo `storeTotal` (sau platform discount) với PERCENT/FIXED + `maxDiscountValue`, lưu vào `appliedStoreWideVouchers[storeId]`.
  - Khi bỏ voucher: xóa key tương ứng trong `appliedStoreWideVouchers`.

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

## Checkout payload
- Build `checkoutItemsPayload`:
  - `type`: `PRODUCT`/`COMBO`.
  - PRODUCT:
    - Nếu có `variantId` → gửi `variantId`, không gửi `productId`.
    - Nếu không có `variantId` → gửi `productId`.
  - COMBO: gửi `comboId` = `productId` (refId).
  - `quantity`.
- `storeVouchers`: từ `appliedStoreVouchers` + `appliedStoreWideVouchers` qua `buildStoreVouchers`.
- `serviceTypeIds`: map storeId → 2|5 (tính từ cân nặng).
- `platformVouchers`:
  - Bảo đảm mỗi productId có `campaignProductId`: fetch bổ sung nếu thiếu.
  - Gom theo `campaignProductId`: cộng dồn `quantity`.
  - Chỉ thêm nếu có `campaignProductId` và (discount>0 hoặc `inPlatformCampaign` true).
- COD request: `CustomerCartService.checkoutCod` với `items`, `addressId`, `message`, `storeVouchers`, `platformVouchers` (null nếu rỗng), `serviceTypeIds`.
- PayOS request: tương tự + `returnUrl`, `cancelUrl`; nếu success redirect `checkoutUrl`.
- Thành công: clear sessionStorage key, toast, điều hướng `/orders` (COD) hoặc redirect PayOS URL.

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

