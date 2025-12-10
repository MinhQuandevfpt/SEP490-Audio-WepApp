# Product Detail (Web) — Guide for Mobile (Expo)

Tài liệu này tóm tắt luồng dữ liệu, API, và logic hiển thị của màn Product Detail (`src/pages/Customer/ProductDetail/ProductDetail.tsx`) để dựng lại trên mobile (Expo).

## Luồng tổng quan
- Nhận `productId` từ route params.
- Khi vào trang: reset state, scroll top (web), gọi song song:
  - **Product detail**: `ProductListService.getProductById(productId)`
  - **Product vouchers**: `ProductViewService.getProductVouchers(productId)`
- Lưu vào state: `product`, `vouchers` (shop), `platformCampaigns` (platform/flash sale), `selectedVariant`, `hoveredVariantImage`.
- Tính giá hiển thị (giá gốc, giá sau giảm, badge) dựa trên platform vouchers + biến thể.
- Render:
  - Hình ảnh: `ImageGallery` (ảnh chính + override khi hover/chọn variant).
  - Tiêu đề & giá: `TitlePrice` (tên, brand, rating, giá, badge).
  - Vouchers: `ProductVouchers` (shop vouchers).
  - Mua hàng: `PurchaseActions` (chọn biến thể, tồn kho, thêm giỏ).
  - Thông tin cửa hàng: `StoreInfo`.
  - Mô tả/thông số: `ProductTabs`.

## API chi tiết

### 1) Lấy chi tiết sản phẩm
- **Endpoint**: `GET /api/products/{productId}`
- **Sample request**:
```
GET https://audioe-commerce-production.up.railway.app/api/products/3888d063-0fd9-4fab-a8de-a69c1dbe8a29
Accept: */*
```
- **Sample response (rút gọn)**:
```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "productId": "3888d063-0fd9-4fab-a8de-a69c1dbe8a29",
    "name": "marshall 001 sound max 2000",
    "brandName": "marshal",
    "price": null,
    "discountPrice": null,
    "finalPrice": null,
    "category": "Loa",
    "categoryId": "6ebd0cf5-a882-4bd2-8ab2-f1d591f1a910",
    "ratingAverage": null,
    "reviewCount": null,
    "thumbnailUrl": "https://.../image.jpg",
    "variants": [
      { "variantId": "...", "optionName": "Màu sắc", "optionValue": "Trắng", "variantSku": "martrang02", "price": 267000, "stock": 0, "imageUrl": "https://.../image.webp" }
      // ...
    ],
    "store": { "id": "5a42acaf-7846-45b9-b6c5-3f4298b1b744", "name": "Eimi Fukada", "status": "ACTIVE" },
    "vouchers": {
      "platformVouchers": [
        {
          "campaignId": "4d12e153-bfba-4f83-992d-b3368d85a89c",
          "campaignType": "MEGA_SALE",
          "badgeLabel": "",
          "badgeColor": "#FF6600",
          "badgeIconUrl": "https://.../icon.webp",
          "status": "ACTIVE",
          "startTime": "2025-12-07T05:06:55",
          "endTime": "2025-12-14T05:04:03",
          "vouchers": [
            { "platformVoucherId": "033b01f2-805c-4417-b0f3-20a5e78d0339", "type": "PERCENT", "discountPercent": 10, "maxDiscountValue": null, "startTime": "...", "endTime": "...", "status": "ACTIVE" }
          ]
        }
      ]
    }
  }
}
```

### 2) Lấy vouchers (shop & platform/flash sale)
- **Endpoint**: `GET /api/products/view/{productId}/vouchers`
- **Params tùy chọn**: `type`, `campaignType`
- **Sample request**:
```
GET https://audioe-commerce-production.up.railway.app/api/products/view/3888d063-0fd9-4fab-a8de-a69c1dbe8a29/vouchers
Accept: */*
```
- **Sample response (rút gọn)**:
```json
{
  "status": 200,
  "message": "OK",
  "data": {
    "product": {
      "productId": "3888d063-0fd9-4fab-a8de-a69c1dbe8a29",
      "name": "marshall 001 sound max 2000",
      "price": null,
      "discountPrice": null,
      "finalPrice": null,
      "brandName": "marshal",
      "category": "Loa",
      "thumbnailUrl": "https://.../image.jpg"
    },
    "vouchers": {
      "shop": [ /* mảng shop voucher */ ],
      "platform": [
        {
          "campaignId": "...",
          "campaignType": "MEGA_SALE" | "FLASH_SALE",
          "badgeLabel": "",
          "badgeColor": "#FF6600",
          "badgeIconUrl": "https://.../icon.webp",
          "status": "ACTIVE",
          "startTime": "...",
          "endTime": "...",
          "vouchers": [
            {
              "platformVoucherId": "...",
              "type": "PERCENT" | "FIXED",
              "discountPercent": 10,
              "discountValue": null,
              "maxDiscountValue": null,
              "startTime": "...",
              "endTime": "...",
              "status": "ACTIVE",
              // Flash Sale slot (nếu có):
              "slotOpenTime": "...",
              "slotCloseTime": "...",
              "slotStatus": "ACTIVE"
            }
          ]
        }
      ]
    }
  }
}
```

## Logic tính giá (platform/flash sale + biến thể)
- **Giá gốc (`originalPrice`)**:
  - Nếu có biến thể: lấy min `variants.price`.
  - Nếu không: dùng `product.price` (fallback 0 nếu null).
- **Xác định voucher active**:
  - Nếu có `slotOpenTime/slotCloseTime`: active khi `slotOpenTime <= now <= slotCloseTime` và `slotStatus == ACTIVE`.
  - Ngược lại: active khi `startTime <= now <= endTime` và `status == ACTIVE`.
- **Tính giảm**:
  - `PERCENT`: `discount = original * (discountPercent/100)`, áp dụng `maxDiscountValue` nếu có → `discounted = original - min(discount, maxDiscount)`.
  - `FIXED`: `discounted = max(0, original - discountValue)`.
  - `hasDiscount` nếu `discounted < original`.
- **Giá hiển thị**:
  - Có giảm: hiển thị `discounted` (đỏ) + `original` gạch ngang (xám); badge từ campaign (`badgeLabel`, `badgeColor`, `badgeIconUrl`).
  - Không giảm: hiển thị `original` (cam).
- **Biến thể**:
  - Nếu người dùng chọn biến thể → dùng giá của biến thể đó để tính giảm.
  - Nếu chưa chọn và có nhiều giá → hiển thị range `min-max` cho giá gốc; nếu có voucher → hiển thị thêm range giá sau giảm.

## State & hành vi chính
- `product`: dữ liệu sản phẩm từ API detail.
- `vouchers`: mảng shop vouchers (từ API vouchers).
- `platformCampaigns`: mảng platform/flash sale (từ API vouchers).
- `selectedVariant`: biến thể đang chọn; ảnh và giá sẽ theo biến thể.
- `hoveredVariantImage`: ảnh override khi hover/chọn biến thể (web); mobile có thể dùng chọn để đổi ảnh chính.
- `loading` / `error`: hiển thị skeleton hoặc thông báo lỗi; nút "back" khi không tìm thấy.
- `totalStock`: dùng `product.stockQuantity ?? 0`; xác định `inStock`.

## Thành phần UI (web) và mapping mobile
- `ImageGallery`: danh sách ảnh; main image có thể override bởi biến thể. Mobile: carousel + thumbnails; khi chọn biến thể đổi ảnh chính (nếu có).
- `TitlePrice`: hiển thị tên, brand, rating, reviews, giá gốc/giảm, badge. Mobile: dùng cùng logic giá ở trên.
- `ProductVouchers`: hiển thị shop vouchers. Mobile: render list/collapsible.
- `PurchaseActions`: chọn biến thể, hiển thị tồn kho, hành động mua/thêm giỏ với `finalPrice`. Mobile: nút chọn biến thể, nút thêm giỏ/mua.
- `StoreInfo`: tên cửa hàng, id (có thể mở trang store). Mobile: card thông tin cửa hàng.
- `ProductTabs`: mô tả và thông số (`specs` từ product, lọc null). Mobile: tabs/accordion.

## Checklist triển khai mobile
- Nhận `productId` từ navigation params.
- Gọi song song 2 API trên; handle loading/error.
- Tính giá với cùng rules platform/flash sale + biến thể.
- Render:
  - Ảnh chính + carousel; đổi ảnh khi chọn biến thể có `imageUrl`.
  - Giá: discounted (đỏ) + original gạch ngang (xám) + badge nếu có; nếu không giảm → original (cam).
  - Vouchers: hiển thị shop vouchers; platform vouchers hiển thị badge + mô tả giảm giá.
  - Variants: list chọn; khi chọn cập nhật giá/ảnh.
  - Tồn kho: `inStock = totalStock > 0`; disable mua khi hết.
  - Store info & mô tả/thông số.
- Lưu ý timezone khi so sánh `startTime/endTime` và `slotOpenTime/slotCloseTime`.

