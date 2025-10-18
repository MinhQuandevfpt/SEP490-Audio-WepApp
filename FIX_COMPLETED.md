# 🔧 FIX COMPLETED - Store Status Check

## ✅ Vấn đề đã giải quyết

### Lỗi gặp phải:
```
GET http://localhost:8080/api/stores/me 400 (Bad Request)
```

### Nguyên nhân:
- API endpoint `/stores/me` không tồn tại hoặc không hoạt động
- Backend có thể chưa implement endpoint này

## 🛠️ Giải pháp đã áp dụng

### 1. Sửa StoreService.getStoreInfo()
```typescript
// ❌ TRƯỚC: Sử dụng /stores/me (không hoạt động)
GET /api/stores/me

// ✅ SAU: Sử dụng store ID
GET /api/stores/{storeId}  // storeId từ cache hoặc /stores/me/id
```

### 2. Thêm Fallback Strategy
```
getStoreStatus()
  ↓
  Try: getStoreInfo() → GET /stores/{id}
  ↓ (if fails)
  Fallback: getKycStatus() → GET /stores/{id}/kyc
  ↓ (if fails)  
  Default: INACTIVE
```

### 3. Thêm KycService.getKycStatus()
- GET `/stores/{storeId}/kyc`
- Return null nếu 404 (chưa submit KYC)
- Map KYC status → Store status:
  - `PENDING` → `PENDING`
  - `APPROVED` → `ACTIVE`
  - `REJECTED` → `REJECTED`
  - Not found → `INACTIVE`

### 4. Thêm logging chi tiết
- Console log mọi bước
- Dễ dàng debug

### 5. Cập nhật Debug Page
- Added "Test Get KYC Status" button
- Test riêng KYC endpoint

## 🧪 Cách test

### Bước 1: Clear cache và refresh
```javascript
localStorage.clear()
// Reload page
```

### Bước 2: Login lại
```
/seller/login
```

### Bước 3: Test trên Debug Page
```
/seller/debug
```

### Bước 4: Click các button theo thứ tự:
1. ✅ **Check LocalStorage** - Xem có token & store ID không
2. ✅ **Test Get Store ID** - Phải thành công
3. ✅ **Test Get KYC Status** - Xem status KYC hiện tại
4. ✅ **Test Get Store Status** - Xem logic tổng hợp

### Expected Results:

#### Nếu chưa submit KYC:
```json
{
  "success": true,
  "data": null,
  "message": "No KYC (INACTIVE)"
}
```

#### Nếu đã submit KYC (PENDING):
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "PENDING",
    ...
  }
}
```

#### Nếu đã duyệt (APPROVED/ACTIVE):
```json
{
  "success": true,
  "data": {
    "status": "ACTIVE",
    "canAccessDashboard": true
  }
}
```

## 📊 Console Logs mong đợi

### Test Get Store ID:
```
✅ Using cached store ID: a4e36e4c-24e8-4e4b-bfac-c8122947b6e4
```

### Test Get Store Info:
```
🔍 Getting store info for ID: a4e36e4c-24e8-4e4b-bfac-c8122947b6e4
📥 Store info response status: 200 hoặc 400
```

**Nếu 400:** Logic sẽ fallback sang KYC status

### Test Get KYC Status:
```
🔍 Getting KYC status for store: a4e36e4c-24e8-4e4b-bfac-c8122947b6e4
📥 KYC status response: 200 (có KYC) hoặc 404 (chưa có)
✅ KYC status received: { status: "PENDING" }
```

### Test Get Store Status:
```
⚠️ Could not get store info, trying KYC status: Error...
🔍 Getting KYC status...
✅ KYC status from API: PENDING
```

## 🎯 Flow hoàn chỉnh

### Scenario 1: Chưa submit KYC
```
Login → Store ID cached
  ↓
Check Status:
  /stores/{id} → 400 Failed
  /stores/{id}/kyc → 404 Not Found
  → Result: INACTIVE
  → Redirect: /seller/kyc-status
```

### Scenario 2: Đã submit, đang chờ duyệt
```
Login → Store ID cached
  ↓
Check Status:
  /stores/{id} → 400 Failed
  /stores/{id}/kyc → 200 { status: "PENDING" }
  → Result: PENDING
  → Redirect: /seller/kyc-status (pending page)
```

### Scenario 3: Đã được duyệt
```
Login → Store ID cached
  ↓
Check Status:
  /stores/{id}/kyc → 200 { status: "APPROVED" }
  → Result: ACTIVE
  → Redirect: /seller/dashboard ✅
```

### Scenario 4: Bị từ chối
```
Login → Store ID cached
  ↓
Check Status:
  /stores/{id}/kyc → 200 { status: "REJECTED" }
  → Result: REJECTED
  → Redirect: /seller/kyc-status (rejected page)
```

## 📁 Files Modified

1. ✅ `/src/services/seller/StoreService.ts`
   - Sửa getStoreInfo() dùng store ID
   - Thêm getKycStatus() fallback
   - Enhanced logging

2. ✅ `/src/services/seller/KycService.ts`
   - Thêm getKycStatus() method
   - Enhanced logging

3. ✅ `/src/pages/Seller/Debug/SellerDebugPage.tsx`
   - Thêm button "Test Get KYC Status"

## 🚀 Next Steps

1. **Test với Debug Page** - Xem console logs
2. **Submit KYC** - Test flow hoàn chỉnh
3. **Verify redirects** - Check routing logic

## 💡 Lưu ý

### Nếu vẫn gặp lỗi khi submit KYC:
Kiểm tra backend có:
- ✅ Store được tạo khi seller register
- ✅ API `/stores/{id}/kyc` POST hoạt động
- ✅ API `/stores/{id}/kyc` GET hoạt động

### API Endpoints cần có:
```
✅ POST /api/account/register/store
✅ POST /api/account/login/store
✅ GET  /api/stores/me/id
✅ GET  /api/stores/{id}/kyc
✅ POST /api/stores/{id}/kyc
```

---

**Bây giờ hãy test lại trên Debug Page và cho tôi biết kết quả!** 🎉
