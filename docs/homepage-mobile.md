# Homepage (Web) — Guide for Mobile (Expo) Integration

Trang `HomePage.tsx` kết hợp nhiều khối hiển thị. Dưới đây là logic, luồng dữ liệu và các API cần để dựng tương tự trên mobile (Expo).

## Thành phần và luồng dữ liệu

- **Layout**: khung chung (header/footer). Mobile có thể bỏ hoặc dùng layout riêng.
- **Sidebar**: danh sách danh mục (category) cho bộ lọc sản phẩm.
- **BannerSlider**: carousel banner (hiện tại không gọi API trong file này, thường dùng dữ liệu tĩnh).
- **FlashSaleHome**: khối Flash Sale (gọi API flash sale – không được mô tả chi tiết tại đây, cần tra thêm trong `FlashSaleHome`/`FlashSaleService` nếu muốn tái sử dụng).
- **ProductSuggestions**: khối “Gợi ý sản phẩm hôm nay”, gọi API `/api/products/view` để lấy danh sách sản phẩm đang ACTIVE.
- **Welcome toast**: đọc `sessionStorage.welcomeMessage` và hiển thị thông báo (có thể bỏ trên mobile).

## API cần dùng

### 1) Danh mục (Sidebar)
- **Endpoint**: `GET /api/categories`
- **Mục đích**: Lấy danh sách category để hiển thị filter.
- **Request (sample)**:
  ```
  GET https://audioe-commerce-production.up.railway.app/api/categories
  Accept: */*
  ```
- **Response (sample)**:
  ```json
  {
    "status": 200,
    "message": "Danh sách category",
    "data": [
      {
        "categoryId": "21a0c8d3-5e6f-4c40-8974-e16864b49c07",
        "name": "Amp",
        "slug": "amp",
        "description": "Danh mục thiết bị: Amp",
        "iconUrl": null,
        "sortOrder": 0
      }
      // ...
    ]
  }
  ```

### 2) Danh sách sản phẩm gợi ý / product list
- **Endpoint**: `GET /api/products/view`
- **Tham số** (query):
  - `status` (ví dụ: `ACTIVE`)
  - `categoryId` (tùy chọn, khi người dùng chọn danh mục)
  - `keyword`, `minPrice`, `maxPrice`, `page` (0-based), `size`
- **Request (sample)**:
  ```
  GET https://audioe-commerce-production.up.railway.app/api/products/view
    ?status=ACTIVE
    &categoryId=6ebd0cf5-a882-4bd2-8ab2-f1d591f1a910
    &keyword=a
    &minPrice=1
    &maxPrice=5000000000
    &page=0
    &size=10
  Accept: */*
  ```
- **Response (sample, rút gọn)**:
  ```json
  {
    "status": 200,
    "message": "✅ Lấy danh sách thumbnail thành công",
    "data": {
      "data": [
        {
          "productId": "3888d063-0fd9-4fab-a8de-a69c1dbe8a29",
          "name": "marshall 001 sound max 2000",
          "brandName": "marshal",
          "price": null,
          "discountPrice": null,
          "finalPrice": null,
          "category": "Loa",
          "ratingAverage": null,
          "reviewCount": null,
          "thumbnailUrl": "https://.../image.jpg",
          "variants": [
            {
              "variantId": "...",
              "optionName": "Màu sắc",
              "optionValue": "Trắng",
              "variantSku": "martrang02",
              "price": 267000,
              "stock": 0,
              "imageUrl": "https://.../image.webp"
            }
            // ...
          ],
          "store": {
            "id": "5a42acaf-7846-45b9-b6c5-3f4298b1b744",
            "name": "Eimi Fukada",
            "status": "ACTIVE",
            "provinceCode": "64",
            "districtCode": "5201",
            "wardCode": "520112"
          },
          "vouchers": {
            "platformVouchers": [
              {
                "campaignId": "4d12e153-bfba-4f83-992d-b3368d85a89c",
                "code": "MEGAHAHAHA",
                "name": "akhvkhabvdvkjba",
                "description": "mệt quá thức quài code quài",
                "campaignType": "MEGA_SALE",
                "badgeLabel": "",
                "badgeColor": "#FF6600",
                "badgeIconUrl": "https://.../icon.webp",
                "status": "ACTIVE",
                "startTime": "2025-12-07T05:06:55",
                "endTime": "2025-12-14T05:04:03",
                "vouchers": [
                  {
                    "platformVoucherId": "033b01f2-805c-4417-b0f3-20a5e78d0339",
                    "campaignId": "4d12e153-bfba-4f83-992d-b3368d85a89c",
                    "type": "PERCENT",
                    "discountValue": null,
                    "discountPercent": 10,
                    "maxDiscountValue": null,
                    "minOrderValue": null,
                    "totalVoucherIssued": 100,
                    "totalUsageLimit": 100,
                    "usagePerUser": 1,
                    "status": "ACTIVE",
                    "startTime": "2025-12-07T05:06:55",
                    "endTime": "2025-12-14T05:04:03"
                  }
                ]
              }
            ]
          }
        }
        // ...
      ],
      "page": {
        "totalElements": 5,
        "pageNumber": 0,
        "pageSize": 10,
        "totalPages": 1
      }
    }
  }
  ```

### 3) Tính giá hiển thị (ProductSuggestions & Product List)
- Lấy **giá gốc** từ:
  - Nếu có biến thể: giá nhỏ nhất trong mảng `variants.price`
  - Nếu không: `price`
- Tính **giá sau giảm** từ **platform vouchers** (chỉ xét voucher đầu tiên, bỏ qua shop voucher):
  - `type = PERCENT`: `discountedPrice = originalPrice * (1 - discountPercent/100)`, áp dụng `maxDiscountValue` nếu có
  - `type = FIXED`: `discountedPrice = max(0, originalPrice - discountValue)`
  - Flash sale slot: kiểm tra `slotOpenTime/slotCloseTime` và `slotStatus == ACTIVE`; nếu không có slot thì kiểm tra `startTime/endTime` và `status == ACTIVE`.
  - `hasDiscount = discountedPrice < originalPrice`
- UI hiển thị:
  - Nếu `hasDiscount`: giá giảm (đỏ) + giá gốc gạch ngang (xám)
  - Nếu không: giá gốc (cam)

## Mapping lên Mobile (Expo)

1) **Danh mục**:
   - Call `GET /api/categories`
   - Render list filter; khi chọn, set `categoryId` và gọi lại `/api/products/view`.

2) **Gợi ý / Product list**:
   - Call `GET /api/products/view` với `status=ACTIVE`, `page/size`, kèm `categoryId`, `keyword`, `minPrice`, `maxPrice` nếu có.
   - Parse `data.data` và `data.page`.
   - Tính giá (original + discounted) như logic trên.
   - Render grid/list sản phẩm với:
     - Ảnh: `thumbnailUrl` hoặc `images[0]`
     - Tên, giá gốc, giá giảm (nếu có), badge flash sale (có thể dùng `campaign.badgeLabel/color/icon`).

3) **FlashSaleHome**:
   - Cần xem chi tiết trong component/service tương ứng (không nằm trong `HomePage.tsx`), nhưng nhiều khả năng cũng dựa trên `/api/products/view` với bộ lọc flash sale hoặc API flash sale riêng.

4) **BannerSlider**:
   - Hiện không gọi API trong file này; có thể thay bằng dữ liệu tĩnh hoặc thêm API banner nếu cần (check `AdminBannerService` nếu muốn động).

5) **Welcome toast**:
   - Web dùng `sessionStorage.welcomeMessage`; trên mobile có thể bỏ hoặc dùng AsyncStorage + toast tương tự.

## Request tóm tắt

- Categories:
  - `GET /api/categories`
- Products:
  - `GET /api/products/view?status=ACTIVE&categoryId={id}&keyword={k}&minPrice={min}&maxPrice={max}&page=0&size=10`

## Response tóm tắt (products)

```
status: number
message: string
data:
  data: Product[]
  page: { totalElements, pageNumber, pageSize, totalPages }
```

**Product** (rút gọn cho mobile):
- `productId`, `name`, `brandName`
- `price`, `discountPrice`, `finalPrice`
- `category`, `thumbnailUrl`
- `ratingAverage`, `reviewCount`
- `variants[]`: `variantId`, `price`, `stock`, `imageUrl`
- `store`: `id`, `name`, `status`, `provinceCode`, `districtCode`, `wardCode`
- `vouchers.platformVouchers[]`: chứa `vouchers[]` (type, discountPercent/discountValue, thời gian, slot…)

## Gợi ý triển khai trên Mobile (Expo)

- Tạo hooks:
  - `useCategories` → fetch categories, expose `categories`, `loading`.
  - `useProductList` → fetch `/products/view` với filters, tính giá giảm bằng util `calculateProductDiscount`.
- Component mobile:
  - `CategoryFilter`: list danh mục, chọn → set `categoryId` → refetch.
  - `ProductGrid`: hiển thị ảnh, tên, giá gốc/giá giảm.
  - `ProductCard`: tái dùng logic hiển thị giá giống web (giá giảm đỏ + giá gốc gạch ngang).
  - **Hiển thị campaign/flash sale**:
    - Badge: dùng `campaign.badgeLabel`, `campaign.badgeColor`, `campaign.badgeIconUrl` (từ `vouchers.platformVouchers[0]`).
    - Giá hiển thị:
      - Nếu có voucher active → hiển thị `finalPrice` (đỏ) và giá gốc `originalPrice` (gạch ngang xám).
      - Nếu không có voucher → hiển thị `originalPrice` (cam).
    - Điều kiện active voucher:
      - Flash Sale slot: `slotOpenTime <= now <= slotCloseTime` và `slotStatus == ACTIVE`.
      - Hoặc thời gian voucher: `startTime <= now <= endTime` và `status == ACTIVE`.
    - Tính giá:
      - Lấy `originalPrice` từ min(`variants.price`) hoặc `price`.
      - Voucher `PERCENT`: `discounted = original * (1 - discountPercent/100)`, áp dụng `maxDiscountValue` nếu có.
      - Voucher `FIXED`: `discounted = max(0, original - discountValue)`.
      - `hasDiscount` khi `discounted < original`.
- Đảm bảo timezone khi so sánh `startTime/endTime` và slot time (dùng `Date` hoặc `dayjs`).

