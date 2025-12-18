# KYC Service Documentation - Seller Onboarding

## 📋 Tổng quan

`KycService` là service xử lý quy trình KYC (Know Your Customer) cho seller onboarding trong hệ thống e-commerce. Service này quản lý việc xác thực thông tin cửa hàng, bao gồm thông tin doanh nghiệp, giấy phép kinh doanh, thông tin ngân hàng, và các tài liệu cần thiết.

**File Location:** `src/services/seller/KycService.ts`

---

## 🏗️ Kiến trúc Service

### Class Structure

```typescript
export class KycService {
  // Static methods - không cần khởi tạo instance
  static async submitKyc(kycData: KycRequest): Promise<KycResponse>
  static async uploadFile(file: File): Promise<string>
  static async getKycStatus(): Promise<KycResponse | null>
  static async getCurrentStoreId(): Promise<string>
  static async checkBusinessLicense(businessLicenseNumber: string): Promise<boolean>
}
```

### Dependencies

- **API Base URL:** Lấy từ `import.meta.env.VITE_API_BASE_URL` hoặc mặc định `https://audioe-commerce-production.up.railway.app`
- **Authentication:** Sử dụng `localStorage` để lấy seller token
- **Store ID:** Tự động lấy từ JWT token hoặc cache trong `localStorage`

---

## 🔌 API Endpoints

### 1. Submit KYC Request

**Endpoint:** `POST /api/stores/{storeId}/kyc`

**Mục đích:** Gửi thông tin KYC để xác thực cửa hàng

**Authentication:** Required (Bearer Token)

**Request Headers:**
```typescript
{
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Authorization': 'Bearer {seller_token}'
}
```

**Request Body (KycRequest):**
```typescript
{
  storeName: string;              // Tên cửa hàng
  phoneNumber: string;           // Số điện thoại
  businessLicenseNumber: string; // Số giấy phép kinh doanh
  taxCode: string;               // Mã số thuế
  bankName: string;              // Tên ngân hàng
  bankAccountName: string;       // Tên chủ tài khoản
  bankAccountNumber: string;      // Số tài khoản ngân hàng
  idCardFrontUrl: string;        // URL mặt trước CMND/CCCD
  idCardBackUrl: string;         // URL mặt sau CMND/CCCD
  businessLicenseUrl: string;    // URL giấy phép kinh doanh
  isOfficial: boolean;           // Có phải cửa hàng chính thức không
}
```

**Response (KycResponse):**
```typescript
{
  id: string;                    // KYC ID
  version: number;               // Phiên bản KYC
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Trạng thái xét duyệt
  reviewNote: string | null;     // Ghi chú từ admin (nếu bị từ chối)
  submittedAt: string;           // Thời gian gửi (ISO 8601)
  reviewedAt: string | null;     // Thời gian xét duyệt (ISO 8601)
  createdAt: string;             // Thời gian tạo (ISO 8601)
  updatedAt: string;             // Thời gian cập nhật (ISO 8601)
  official: boolean;             // Có phải cửa hàng chính thức
}
```

**Error Handling:**
- `401 Unauthorized`: Token không hợp lệ hoặc hết hạn
- `400 Bad Request`: Dữ liệu không hợp lệ
- `409 Conflict`: KYC đã tồn tại hoặc giấy phép đã được sử dụng

---

### 2. Get KYC Status

**Endpoint:** `GET /api/stores/{storeId}/kyc`

**Mục đích:** Lấy trạng thái KYC hiện tại của cửa hàng

**Authentication:** Required (Bearer Token)

**Request Headers:**
```typescript
{
  'Accept': '*/*',
  'Authorization': 'Bearer {seller_token}'
}
```

**Response:**
- **200 OK:** Trả về `KycResponse` hoặc array `KycResponse[]`
- **404 Not Found:** Chưa có KYC (trả về `null`)
- **401 Unauthorized:** Token không hợp lệ

**Logic xử lý Response:**
```typescript
// Backend có thể trả về:
// 1. Object trực tiếp: { id, status, ... }
// 2. Wrapped trong data: { data: { id, status, ... } }
// 3. Array: { data: [{ id, status, ... }] }

// Service xử lý:
const kycData = data.data || data;
if (Array.isArray(kycData)) {
  return kycData[0] || null; // Lấy phần tử đầu tiên
}
return kycData;
```

---

### 3. Check Business License

**Endpoint:** `GET /api/stores/{storeId}/kyc/check-license?businessLicenseNumber={number}`

**Mục đích:** Kiểm tra xem số giấy phép kinh doanh đã được sử dụng chưa

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `businessLicenseNumber` (string, required): Số giấy phép kinh doanh cần kiểm tra

**Request Headers:**
```typescript
{
  'Accept': '*/*',
  'Authorization': 'Bearer {seller_token}'
}
```

**Response:**
```typescript
{
  status: 200,
  message: "warning" | "success",
  data: boolean  // true = đã tồn tại, false = chưa tồn tại
}
```

**Return Value:**
- `true`: Giấy phép đã được sử dụng (không thể dùng)
- `false`: Giấy phép chưa được sử dụng (có thể dùng) hoặc có lỗi

---

### 4. Get Current Store ID

**Endpoint:** `GET /api/stores/me/id`

**Mục đích:** Lấy Store ID của seller hiện tại từ JWT token

**Authentication:** Required (Bearer Token)

**Request Headers:**
```typescript
{
  'Accept': '*/*',
  'Authorization': 'Bearer {seller_token}'
}
```

**Response:**
```typescript
{
  data: string  // Store ID (UUID)
}
```

**Caching Strategy:**
1. Kiểm tra `localStorage.getItem('seller_store_id')` trước
2. Nếu có cache → trả về ngay (không gọi API)
3. Nếu không có cache → gọi API và lưu vào cache
4. Cache được lưu trong `localStorage` với key `seller_store_id`

---

### 5. Upload File (Placeholder)

**Method:** `static async uploadFile(file: File): Promise<string>`

**Mục đích:** Upload file (CMND, giấy phép kinh doanh) lên server

**Status:** ⚠️ **PLACEHOLDER** - Chưa implement thực tế

**Current Implementation:**
```typescript
// TODO: Implement actual file upload logic
// Hiện tại chỉ return mock URL sau 1 giây
return new Promise((resolve) => {
  setTimeout(() => {
    const mockUrl = `https://cdn.example.com/${file.name}`;
    resolve(mockUrl);
  }, 1000);
});
```

**Note:** Cần implement thực tế để upload file lên CDN/storage service.

---

## 🔄 Logic Flow Chi Tiết

### Flow 1: Submit KYC Request

```
1. User điền form KYC
   ↓
2. Upload các file (CMND, giấy phép) → uploadFile()
   ↓
3. Lấy URLs của các file đã upload
   ↓
4. Gọi submitKyc() với đầy đủ thông tin
   ↓
5. Service xử lý:
   a. Lấy token từ localStorage
   b. Lấy storeId (cache hoặc API)
   c. Gọi POST /api/stores/{storeId}/kyc
   ↓
6. Backend xử lý và trả về KycResponse
   ↓
7. KYC status = 'PENDING' → chờ admin duyệt
```

### Flow 2: Check KYC Status

```
1. User vào trang KYC Status
   ↓
2. Gọi getKycStatus()
   ↓
3. Service xử lý:
   a. Lấy token từ localStorage
   b. Lấy storeId (cache hoặc API)
   c. Gọi GET /api/stores/{storeId}/kyc
   ↓
4. Xử lý response:
   - 404 → null (chưa có KYC)
   - 200 → KycResponse (có KYC)
   - Array → lấy phần tử đầu tiên
   ↓
5. Hiển thị status:
   - null → "Chưa nộp KYC"
   - PENDING → "Đang chờ duyệt"
   - APPROVED → "Đã được duyệt"
   - REJECTED → "Bị từ chối" + reviewNote
```

### Flow 3: Check Business License

```
1. User nhập số giấy phép kinh doanh
   ↓
2. Gọi checkBusinessLicense(number)
   ↓
3. Service xử lý:
   a. Lấy token từ localStorage
   b. Lấy storeId (cache hoặc API)
   c. Gọi GET /api/stores/{storeId}/kyc/check-license?businessLicenseNumber={number}
   ↓
4. Xử lý response:
   - result.data === true → "Đã được sử dụng"
   - result.data === false → "Có thể sử dụng"
   - Error → return false (an toàn)
```

### Flow 4: Get Store ID (Caching)

```
1. Service cần storeId
   ↓
2. Kiểm tra localStorage.getItem('seller_store_id')
   ↓
3. Nếu có cache:
   → Return cache (không gọi API)
   ↓
4. Nếu không có cache:
   a. Lấy token từ localStorage
   b. Gọi GET /api/stores/me/id
   c. Lấy storeId từ response.data
   d. Lưu vào localStorage.setItem('seller_store_id', storeId)
   e. Return storeId
```

---

## 🔐 Authentication & Authorization

### Token Management

**Token Sources (theo thứ tự ưu tiên):**
1. `localStorage.getItem('seller_token')`
2. `localStorage.getItem('accessToken')` (fallback)

**Error khi không có token:**
```typescript
throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
```

### Store ID Resolution

**Caching Strategy:**
- **Cache Key:** `seller_store_id`
- **Cache Location:** `localStorage`
- **Cache Lifetime:** Vô thời hạn (cho đến khi logout)
- **Invalidation:** Khi seller logout hoặc token thay đổi

**API Endpoint:**
- `GET /api/stores/me/id` - Lấy storeId từ JWT token

---

## 📊 Data Types

### KycRequest

```typescript
interface KycRequest {
  storeName: string;              // Tên cửa hàng
  phoneNumber: string;            // Số điện thoại (format: +84...)
  businessLicenseNumber: string;  // Số giấy phép kinh doanh
  taxCode: string;                // Mã số thuế
  bankName: string;               // Tên ngân hàng
  bankAccountName: string;        // Tên chủ tài khoản
  bankAccountNumber: string;      // Số tài khoản
  idCardFrontUrl: string;         // URL ảnh CMND mặt trước
  idCardBackUrl: string;          // URL ảnh CMND mặt sau
  businessLicenseUrl: string;     // URL giấy phép kinh doanh
  isOfficial: boolean;            // Có phải cửa hàng chính thức
}
```

### KycResponse

```typescript
interface KycResponse {
  id: string;                      // KYC ID (UUID)
  version: number;                // Phiên bản (tăng khi update)
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;      // Ghi chú từ admin (khi REJECTED)
  submittedAt: string;            // ISO 8601 format
  reviewedAt: string | null;      // ISO 8601 format
  createdAt: string;              // ISO 8601 format
  updatedAt: string;              // ISO 8601 format
  official: boolean;              // Có phải cửa hàng chính thức
}
```

### Status Flow

```
INACTIVE (chưa nộp)
    ↓
PENDING (đã nộp, chờ duyệt)
    ↓
APPROVED (đã duyệt) hoặc REJECTED (bị từ chối)
```

---

## ⚠️ Error Handling

### Common Errors

1. **Token không tồn tại:**
   ```typescript
   throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
   ```

2. **Store ID không tìm thấy:**
   ```typescript
   throw new Error('Không tìm thấy store ID trong response.');
   ```

3. **API Error:**
   ```typescript
   const errorData = await response.json().catch(() => ({}));
   throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
   ```

4. **404 Not Found (getKycStatus):**
   - Trả về `null` (không throw error)
   - Được coi là trạng thái hợp lệ (chưa có KYC)

5. **checkBusinessLicense Error:**
   - Trả về `false` (an toàn) khi có lỗi
   - Không throw error để tránh break UI

### Error Logging

Tất cả errors đều được log ra console với prefix:
- `❌ KYC submission error:`
- `❌ Error getting KYC status:`
- `❌ Error getting store ID:`
- `❌ Error checking business license:`

---

## 🎯 Business Logic

### 1. KYC Submission Rules

- **Một store chỉ có thể có một KYC active tại một thời điểm**
- **Khi submit KYC mới, version sẽ tăng lên**
- **Status mặc định là `PENDING` sau khi submit**
- **Admin sẽ review và approve/reject**

### 2. Business License Validation

- **Số giấy phép kinh doanh phải unique trong hệ thống**
- **Check trước khi submit để tránh duplicate**
- **Nếu đã tồn tại → không cho phép submit**

### 3. Store ID Caching

- **Cache storeId để tối ưu performance**
- **Chỉ gọi API khi không có cache**
- **Cache được lưu trong localStorage (persist across sessions)**

### 4. File Upload (TODO)

- **Cần implement thực tế để upload file lên CDN**
- **Các file cần upload:**
  - CMND/CCCD mặt trước
  - CMND/CCCD mặt sau
  - Giấy phép kinh doanh
- **Sau khi upload thành công → lấy URL và gửi vào KYC request**

---

## 📱 Implementation Guide cho Mobile

### 1. Setup Service

```typescript
// KycService.ts (Mobile - React Native / Expo)
const API_BASE_URL = 'https://audioe-commerce-production.up.railway.app';
const API_URL = `${API_BASE_URL}/api`;

export class KycService {
  // Tương tự như web version
  // Sử dụng AsyncStorage thay vì localStorage
  // Sử dụng fetch API hoặc axios
}
```

### 2. Token Management (Mobile)

```typescript
// Sử dụng AsyncStorage hoặc SecureStore (Expo)
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lấy token
const token = await AsyncStorage.getItem('seller_token');

// Lưu token
await AsyncStorage.setItem('seller_token', token);
```

### 3. File Upload (Mobile)

```typescript
// Sử dụng expo-image-picker hoặc react-native-image-picker
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToServer } from './fileUploadService';

// Pick image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.8,
});

// Upload to server
const imageUrl = await uploadFileToServer(result.uri);
```

### 4. API Calls (Mobile)

```typescript
// Sử dụng fetch hoặc axios
const response = await fetch(`${API_URL}/stores/${storeId}/kyc`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(kycData),
});
```

### 5. Error Handling (Mobile)

```typescript
// Sử dụng toast hoặc alert
import { Alert } from 'react-native';
// hoặc
import { showMessage } from 'react-native-flash-message';

try {
  await KycService.submitKyc(kycData);
  showMessage({
    message: 'Gửi KYC thành công!',
    type: 'success',
  });
} catch (error) {
  Alert.alert('Lỗi', error.message);
}
```

---

## 🔍 Debugging & Logging

### Console Logs

Service sử dụng console.log với emoji để dễ debug:

- `🔍 Getting KYC status for store: {storeId}`
- `📥 KYC status response: {status}`
- `✅ KYC status received: {data}`
- `ℹ️ No KYC found (INACTIVE)`
- `✅ Using cached store ID: {storeId}`
- `🔍 Fetching store ID from API: {url}`
- `📦 Store data received: {data}`
- `✅ Store ID cached: {storeId}`

### Debug Tips

1. **Kiểm tra token:**
   ```javascript
   console.log('Token:', localStorage.getItem('seller_token'));
   ```

2. **Kiểm tra storeId cache:**
   ```javascript
   console.log('Cached Store ID:', localStorage.getItem('seller_store_id'));
   ```

3. **Kiểm tra API response:**
   - Mở Network tab trong DevTools
   - Filter: `/api/stores/*/kyc`
   - Xem Request/Response details

---

## 📝 Notes & Best Practices

### 1. Store ID Caching

- ✅ **Nên:** Cache storeId để giảm số lượng API calls
- ✅ **Nên:** Invalidate cache khi logout
- ❌ **Không nên:** Hardcode storeId trong code

### 2. Error Handling

- ✅ **Nên:** Handle tất cả error cases
- ✅ **Nên:** Show user-friendly error messages
- ❌ **Không nên:** Throw error trong checkBusinessLicense (return false thay vì throw)

### 3. File Upload

- ⚠️ **TODO:** Implement actual file upload
- ✅ **Nên:** Validate file size và format trước khi upload
- ✅ **Nên:** Show upload progress cho user

### 4. Security

- ✅ **Nên:** Validate tất cả input trước khi gửi API
- ✅ **Nên:** Sử dụng HTTPS cho tất cả API calls
- ✅ **Nên:** Không log sensitive data (token, account number)

---

## 🔗 Related Files

- **Types:** `src/types/seller.ts` (KycRequest, KycResponse)
- **UI Components:**
  - `src/pages/Seller/KycStatus/KycStatusPage.tsx` - Trang xem KYC status
  - `src/pages/Admin/KycManagement/KycManagement.tsx` - Admin quản lý KYC
- **Services:**
  - `src/services/seller/StoreService.ts` - Store management
  - `src/services/seller/AuthService.ts` - Seller authentication

---

## 📚 API Reference Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/stores/{storeId}/kyc` | Submit KYC request | ✅ |
| GET | `/api/stores/{storeId}/kyc` | Get KYC status | ✅ |
| GET | `/api/stores/{storeId}/kyc/check-license` | Check business license | ✅ |
| GET | `/api/stores/me/id` | Get current store ID | ✅ |

---

## ✅ Checklist cho Implementation

- [x] Submit KYC request
- [x] Get KYC status
- [x] Check business license
- [x] Get store ID with caching
- [ ] Upload file (TODO - placeholder)
- [x] Error handling
- [x] Token management
- [x] Response parsing (array/object handling)

---

**Last Updated:** 2025-01-17
**Version:** 1.0.0

