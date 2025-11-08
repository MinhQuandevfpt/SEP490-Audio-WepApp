# Flash Sale Feature

## 📦 Tổng quan

Tính năng Flash Sale hiển thị các chiến dịch giảm giá theo khung giờ trên trang chủ và trang detail.

## 🗂️ Cấu trúc file

```
src/
├── types/
│   └── flashsale.ts                    # Type definitions
├── services/
│   └── customer/
│       └── FlashSaleService.ts         # API service layer
├── components/
│   └── FlashSale/
│       └── FlashSaleHome.tsx           # Component cho trang Home
└── pages/
    └── Customer/
        └── FlashSaleDetail/
            └── FlashSaleDetail.tsx     # Trang chi tiết Flash Sale
```

## 🔌 API Endpoints

### 1. Lấy danh sách Flash Sale
```
GET /api/campaigns/fast-sale?status=ACTIVE
```

**Response:**
```json
{
  "status": 200,
  "message": "📦 Fast Sale campaigns",
  "data": [
    {
      "id": "uuid",
      "code": "FLASH_SALE_12_12",
      "name": "Flash Sale 12.12",
      "status": "ACTIVE",
      "slots": [
        {
          "id": "uuid",
          "openTime": "2025-11-01T01:00:00",
          "closeTime": "2025-12-12T18:00:00",
          "status": "ACTIVE"
        }
      ]
    }
  ]
}
```

### 2. Lấy sản phẩm theo slot
```
GET /api/campaigns/{campaignId}/slots/{slotId}/products?timeFilter=ONGOING
```

**Response:**
```json
{
  "status": 200,
  "message": "🧾 Slot products",
  "data": {
    "campaignId": "uuid",
    "slotId": "uuid",
    "items": [
      {
        "campaignProductId": "uuid",
        "productId": "uuid",
        "productName": "Sony SRS-XB33",
        "brandName": "Sony",
        "originalPrice": 1500000,
        "discountedPrice": 1350000,
        "discountPercent": 10,
        "status": "ACTIVE"
      }
    ]
  }
}
```

## 🎯 Các tính năng chính

### Trang Home (`/`)
- ✅ Tự động lấy Flash Sale đang ACTIVE
- ✅ Tìm slot hiện tại (openTime <= now <= closeTime)
- ✅ Hiển thị 15 sản phẩm đầu tiên
- ✅ Đồng hồ đếm ngược thời gian còn lại
- ✅ Nút "Xem tất cả" → Navigate đến trang detail
- ✅ Auto-reload khi slot kết thúc

### Trang Detail (`/flash-sale/:campaignId`)
- ✅ Hiển thị tất cả slots của campaign
- ✅ Phân nhóm slots: Hôm nay / Ngày mai
- ✅ Tabs chọn slot (Highlight slot đang active)
- ✅ Hiển thị tất cả sản phẩm của slot được chọn
- ✅ Countdown cho slot đang active
- ✅ Click sản phẩm → Navigate đến product detail

## 🔧 Service Methods

### `FlashSaleService`

#### Core Methods
- `getAllFlashSales(filters?)` - Lấy danh sách campaigns
- `getSlotProducts(campaignId, slotId, timeFilter?)` - Lấy products của slot
- `getCurrentFlashSale()` - Lấy Flash Sale hiện tại (campaign + slot + 15 products)

#### Helper Methods
- `findCurrentActiveSlot(campaigns)` - Tìm slot đang active
- `calculateTimeRemaining(closeTime)` - Tính thời gian còn lại
- `formatTimeRemaining(closeTime)` - Format HH:MM:SS
- `formatSlotTime(timeString)` - Format giờ slot (VD: "09:00")
- `isSlotActive(slot)` - Check slot có đang active không
- `isSlotUpcoming(slot)` - Check slot sắp diễn ra
- `isSlotTomorrow(slot)` - Check slot có phải ngày mai không
- `getSlotStatusLabel(slot)` - Lấy label trạng thái

## 🎨 UI Components

### FlashSaleHome
```tsx
<FlashSaleHome />
```
- Header: Tiêu đề + Countdown + Nút "Xem tất cả"
- Grid: 15 sản phẩm, responsive (2/3/4/5 columns)
- Product Card: Hình ảnh, tên, giá, discount badge, progress bar

### FlashSaleDetail
```tsx
<FlashSaleDetail />
```
- Breadcrumb navigation
- Campaign header với countdown
- Slot tabs (Hôm nay / Ngày mai)
- Products grid (6 columns desktop, responsive)

## 🚀 Usage

### Import vào HomePage
```tsx
import FlashSaleHome from '../../components/FlashSale/FlashSaleHome';

function HomePage() {
  return (
    <Layout>
      <FlashSaleHome />
    </Layout>
  );
}
```

### Routing
```tsx
{
  path: '/flash-sale/:campaignId',
  element: <FlashSaleDetail />
}
```

## ⚠️ Lưu ý

### 1. Auto-reload
- Khi countdown về 00:00:00, trang Home sẽ tự động reload để lấy slot tiếp theo
- Sử dụng `window.location.reload()` sau 1 giây

### 2. State Management
- Sử dụng React hooks: useState, useEffect, useMemo
- Không có global state (Zustand/Redux)
- Data được fetch mỗi lần component mount

### 3. Image Handling
- API hiện tại chưa trả về `imageUrl` cho products
- Component đã handle trường hợp không có ảnh (hiển thị placeholder)
- Có thể cần gọi thêm API product detail để lấy ảnh

### 4. Error Handling
- Tất cả API calls đều có try-catch
- Console.error để debug
- Component không crash khi API lỗi (hiển thị Empty state)

## 📱 Responsive Design

- **Mobile (< 640px)**: 2 columns
- **Tablet (640-768px)**: 3 columns
- **Desktop (768-1024px)**: 4-5 columns
- **Large Desktop (> 1024px)**: 5-6 columns

## 🔄 Data Flow

```
User visits Home
    ↓
FlashSaleHome mounted
    ↓
Call FlashSaleService.getCurrentFlashSale()
    ↓
API 1: GET /api/campaigns/fast-sale?status=ACTIVE
    ↓
Find current active slot (openTime <= now <= closeTime)
    ↓
API 2: GET /api/campaigns/{campaignId}/slots/{slotId}/products
    ↓
Display 15 products + countdown
    ↓
User clicks "Xem tất cả"
    ↓
Navigate to /flash-sale/:campaignId (with slotId in state)
    ↓
FlashSaleDetail mounted → Load full campaign + products
```

## 🐛 Troubleshooting

### Không hiển thị Flash Sale
- Check console logs
- Verify API trả về campaign với status = "ACTIVE"
- Verify slot có openTime <= now <= closeTime và status = "ACTIVE"

### Countdown không chạy
- Check `closeTime` format (ISO 8601)
- Verify `useEffect` cleanup function

### Sản phẩm không có ảnh
- API chưa trả imageUrl → Hiển thị "No Image" placeholder
- Cần gọi thêm API `/api/products/{productId}` để lấy ảnh chi tiết

## 🎯 TODO / Improvements

- [ ] Thêm skeleton loading
- [ ] Cache Flash Sale data (5-10 phút)
- [ ] Lazy load images
- [ ] Add animations (AOS/Framer Motion)
- [ ] Thêm filter/sort sản phẩm
- [ ] Pagination cho trang detail
- [ ] Share Flash Sale (social media)
- [ ] Wishlist/Favorite products
