# 🔧 Store Debug Guide

## Vấn đề hiện tại
Khi tạo sản phẩm, API trả về lỗi: `❌ Store not found for logged-in account`

## Các bước debug

### 1. Sử dụng Store Debugger
- Mở trang tạo sản phẩm
- Ở góc phải màn hình sẽ có component "Store Debugger"
- Click "Test Store ID" để kiểm tra việc lấy storeId
- Click "Test All Endpoints" để test các API endpoints

### 2. Kiểm tra Console Logs
Mở Developer Tools (F12) và xem console để theo dõi:
- `🔍 Getting store ID...`
- `✅ Store ID obtained: [storeId]`
- `📦 Creating product with data: {...}`

### 3. Các API endpoints được test
- `/api/seller/store`
- `/api/seller/me`
- `/api/seller/profile`
- `/api/stores/me`
- `/api/stores`
- `/api/seller/dashboard`

### 4. Cách sửa lỗi

#### Option 1: Sử dụng Store ID thật từ backend
1. Đăng nhập seller account
2. Kiểm tra response từ API để lấy storeId thật
3. Thay thế hardcoded storeId trong `ProductService.ts` line 203:
```typescript
const hardcodedStoreId = 'your-real-store-id-here';
```

#### Option 2: Sử dụng Environment Variable
1. Tạo file `.env` trong root project
2. Thêm dòng:
```
VITE_DEFAULT_STORE_ID=your-real-store-id-here
```

#### Option 3: Sử dụng StoreService
1. Đảm bảo StoreService.getStoreInfo() trả về đúng storeId
2. Kiểm tra response format của StoreService

### 5. Kiểm tra Backend
Đảm bảo backend có:
- API endpoint để lấy store info của seller
- Store được tạo và liên kết với seller account
- Authentication header được gửi đúng

### 6. Test với Postman/curl
```bash
# Test lấy store info
curl -X GET "http://localhost:8080/api/seller/store" \
  -H "accept: */*" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test tạo sản phẩm với storeId
curl -X POST "http://localhost:8080/api/products" \
  -H "accept: */*" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "your-store-id",
    "categoryName": "Loa",
    "brandName": "Test Brand",
    "name": "Test Product",
    ...
  }'
```

## Kết quả mong đợi
- Store ID được lấy thành công
- Product được tạo với storeId đúng
- Không còn lỗi "Store not found for logged-in account"
