# 🐛 Debug Guide - Store Not Found Error

## ❌ Lỗi hiện tại

```json
{
    "status": "INTERNAL_SERVER_ERROR",
    "message": "Store not found",
    "errors": ["error occurred"],
    "timestamp": "2025-10-18T13:41:00.527171"
}
```

## 🔍 Nguyên nhân có thể

1. **Store ID không được cache đúng cách**
2. **API endpoint `/stores/me/id` trả về sai format**
3. **Token không hợp lệ hoặc đã hết hạn**
4. **Store chưa được tạo trong database**

## ✅ Đã thực hiện

### 1. Thêm logging chi tiết
- ✅ Added console logs trong `KycService.getCurrentStoreId()`
- ✅ Added console logs trong `KycService.submitKyc()`
- ✅ Hiển thị rõ ràng từng bước của quá trình

### 2. Sửa StoreService
- ✅ Thay đổi từ `/stores/${storeId}` sang `/stores/me`
- ✅ Cache store ID khi lấy store info
- ✅ Added proper error handling

### 3. Clear cache khi login
- ✅ Xóa `seller_store_id` và `seller_store_info` mỗi khi login mới
- ✅ Đảm bảo không sử dụng cache cũ

### 4. Tạo Debug Page
- ✅ Trang debug tại `/seller/debug`
- ✅ Test các API endpoint
- ✅ Check localStorage
- ✅ Clear cache button

## 🧪 Cách Debug

### Bước 1: Truy cập Debug Page
```
http://localhost:5173/seller/debug
```

### Bước 2: Check LocalStorage
1. Click "Check LocalStorage"
2. Xem console log để kiểm tra:
   - ✅ `seller_token` có tồn tại không
   - ✅ `seller_store_id` có giá trị gì
   - ✅ `seller_store_info` có data gì

### Bước 3: Test Get Store ID
1. Click "Test Get Store ID"
2. Xem kết quả:
   - ✅ Nếu thành công → Store ID được lưu
   - ❌ Nếu lỗi → Kiểm tra console log

### Bước 4: Test Get Store Info
1. Click "Test Get Store Info"
2. Xem store info có đúng không

### Bước 5: Test Get Store Status
1. Click "Test Get Store Status"
2. Xem status hiện tại

## 📋 Console Logs để kiểm tra

Khi submit KYC, bạn sẽ thấy các log này trong console:

```
🔍 Getting store ID for KYC submission...
✅ Using cached store ID: [id] 
   HOẶC
🔍 Fetching store ID from API: http://localhost:8080/api/stores/me/id
📥 Store ID API response status: 200
📦 Store data received: { ... }
✅ Store ID cached: [id]

📤 Submitting KYC to: http://localhost:8080/api/stores/[id]/kyc
📋 KYC Data: { ... }
📥 Response status: 200
✅ KYC submitted successfully
```

Nếu có lỗi:
```
❌ Store ID Error Response: { ... }
❌ Error getting store ID: ...
❌ KYC Error Response: { ... }
```

## 🔧 Giải pháp

### Nếu "Store not found"

#### Giải pháp 1: Kiểm tra API endpoint
```typescript
// Kiểm tra xem API này có hoạt động không:
GET /api/stores/me/id
Header: Authorization: Bearer [token]

// Response mong đợi:
{
  "data": "store-id-here",
  "status": 200
}
```

#### Giải pháp 2: Clear cache và login lại
```javascript
// Trong console browser:
localStorage.clear()
// Sau đó login lại
```

#### Giải pháp 3: Kiểm tra database
```sql
-- Kiểm tra xem store có tồn tại không
SELECT * FROM stores WHERE account_id = [your_account_id];
```

#### Giải pháp 4: Tạo store tự động khi đăng ký
Có thể backend cần tạo store ngay khi seller đăng ký:

```java
// In SellerRegistrationService
public void registerSeller(SellerRegisterRequest request) {
    // Create account
    Account account = accountService.create(request);
    
    // Auto create store for seller
    Store store = new Store();
    store.setAccount(account);
    store.setStatus(StoreStatus.INACTIVE);
    storeRepository.save(store);
}
```

## 📱 API Endpoints cần kiểm tra

### 1. Get Store ID
```http
GET /api/stores/me/id
Authorization: Bearer {token}

Response:
{
  "data": "uuid-string",
  "status": 200
}
```

### 2. Get Store Info
```http
GET /api/stores/me
Authorization: Bearer {token}

Response:
{
  "data": {
    "id": "uuid",
    "name": "Store name",
    "status": "INACTIVE|PENDING|REJECTED|ACTIVE",
    ...
  },
  "status": 200
}
```

### 3. Submit KYC
```http
POST /api/stores/{storeId}/kyc
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "storeName": "...",
  "phoneNumber": "...",
  ...
}

Response:
{
  "data": { ... },
  "status": 200
}
```

## 🎯 Next Steps

1. **Test với Debug Page** (`/seller/debug`)
2. **Kiểm tra console logs** chi tiết
3. **Verify API endpoints** ở backend
4. **Kiểm tra database** xem store có tồn tại không
5. **Clear cache** và thử lại

## 📞 Contact Backend Team

Nếu vẫn lỗi, cần hỏi backend team:

1. **Store có được tự động tạo khi seller đăng ký không?**
2. **API endpoint `/api/stores/me/id` có hoạt động không?**
3. **Format response của API có đúng như docs không?**
4. **Có cần thêm API endpoint nào không?**

## 🔄 Modified Files

1. `/src/services/seller/StoreService.ts` - Sửa endpoint từ `/stores/${id}` → `/stores/me`
2. `/src/services/seller/KycService.ts` - Thêm logging chi tiết
3. `/src/pages/Seller/Login/SellerLogin.tsx` - Clear cache khi login
4. `/src/pages/Seller/Debug/SellerDebugPage.tsx` - NEW - Debug tools
5. `/src/routes/index.tsx` - Added `/seller/debug` route

---

**Sau khi test với Debug Page, hãy cho tôi biết console logs để tôi có thể giúp thêm!** 🚀
