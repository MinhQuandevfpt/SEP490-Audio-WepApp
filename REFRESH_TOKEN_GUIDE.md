# Hướng dẫn sử dụng Refresh Token

## Tổng quan

Hệ thống refresh token đã được triển khai cho tất cả các loại người dùng (trừ Admin):
- ✅ **Customer** (Khách hàng)
- ✅ **Seller** (Người bán)
- ✅ **Store Staff** (Nhân viên cửa hàng)

## Cấu trúc Files

### 1. Services chính

#### `src/services/RefreshTokenService.ts`
Service quản lý refresh token cho tất cả loại user.

**Chức năng:**
- `storeTokens()` - Lưu access token và refresh token vào localStorage
- `clearTokens()` - Xóa tokens khi logout
- `refreshUserToken()` - Gọi API refresh token và cập nhật tokens mới
- `getRefreshToken()` - Lấy refresh token từ localStorage

#### `src/services/HttpInterceptor.ts`
HTTP client với tự động refresh token khi gặp lỗi 401.

**Chức năng:**
- Tự động thêm Authorization header
- Tự động refresh token khi access token hết hạn (401)
- Retry request với token mới
- Redirect đến login nếu refresh thất bại

### 2. Auth Services

#### `src/services/customer/Authcustomer.ts`
- Thêm `refreshToken` vào login response
- Lưu refresh token qua `RefreshTokenService`
- Method `refreshToken()` và `getRefreshToken()`

#### `src/services/seller/AuthSeller.ts`
- Thêm `refreshToken` vào login response
- Lưu refresh token qua `RefreshTokenService`
- Method `refreshToken()` và `getRefreshToken()`

#### `src/services/staff/AuthStaff.ts` ⭐ **MỚI**
- Service mới cho Store Staff authentication
- Hỗ trợ đầy đủ refresh token
- Endpoint: `POST /api/account/login/staff`

### 3. Type Definitions

#### `src/types/api.ts`
```typescript
export interface CustomerLoginResponse {
  data: {
    accessToken: string;
    refreshToken?: string;  // ⭐ Đã thêm
    // ...
  }
}
```

#### `src/types/seller.ts`
```typescript
export interface SellerLoginResponse {
  data: {
    accessToken: string;
    refreshToken?: string;  // ⭐ Đã thêm
    // ...
  }
}
```

## API Endpoint

### Refresh Token
```
POST /api/account/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}

Response:
{
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer"
  }
}
```

## Cách sử dụng

### 1. Login (tự động lưu refresh token)

#### Customer
```typescript
import { CustomerAuthService } from './services/customer/Authcustomer';

const response = await CustomerAuthService.login({
  email: 'customer@example.com',
  password: 'password123'
});
// Refresh token được tự động lưu vào localStorage
```

#### Seller
```typescript
import { SellerAuthService } from './services/seller/AuthSeller';

const response = await SellerAuthService.login({
  email: 'seller@example.com',
  password: 'password123'
});
// Refresh token được tự động lưu vào localStorage
```

#### Store Staff
```typescript
import { StoreStaffAuthService } from './services/staff/AuthStaff';

const response = await StoreStaffAuthService.login({
  email: 'staff@example.com',
  password: 'password123',
  storeCode: 'STORE001'
});
// Refresh token được tự động lưu vào localStorage
```

### 2. Logout (tự động xóa refresh token)

```typescript
// Customer
CustomerAuthService.logout();

// Seller
SellerAuthService.logout();

// Store Staff
StoreStaffAuthService.logout();
```

### 3. Manual Refresh Token

```typescript
// Customer
const newAccessToken = await CustomerAuthService.refreshToken();

// Seller
const newAccessToken = await SellerAuthService.refreshToken();

// Store Staff
const newAccessToken = await StoreStaffAuthService.refreshToken();
```

### 4. Sử dụng HTTP Interceptor (Tự động refresh)

```typescript
import { HttpInterceptor } from './services/HttpInterceptor';

// Customer request với auto-refresh
const data = await HttpInterceptor.get('/api/customer/profile', {
  userType: 'customer'
});

// Seller request với auto-refresh
const products = await HttpInterceptor.get('/api/seller/products', {
  userType: 'seller'
});

// Store Staff request với auto-refresh
const orders = await HttpInterceptor.get('/api/staff/orders', {
  userType: 'staff'
});

// POST request
const result = await HttpInterceptor.post('/api/customer/update', {
  name: 'New Name'
}, {
  userType: 'customer'
});
```

## LocalStorage Keys

### Customer
- `customer_token` - Access token
- `customer_refresh_token` - Refresh token ⭐
- `customer_token_type` - Token type (Bearer)
- `customer_user` - User info

### Seller
- `seller_token` - Access token
- `seller_refresh_token` - Refresh token ⭐
- `seller_token_type` - Token type (Bearer)
- `seller_user` - User info

### Store Staff
- `staff_token` - Access token
- `staff_refresh_token` - Refresh token ⭐
- `staff_token_type` - Token type (Bearer)
- `staff_user` - User info

## Flow tự động refresh token

1. **User login** → Backend trả về `accessToken` và `refreshToken`
2. **Lưu tokens** → Cả 2 tokens được lưu vào localStorage
3. **API request** → Gửi request với access token
4. **Token hết hạn (401)** → HttpInterceptor tự động phát hiện
5. **Call refresh API** → Gọi `/api/account/refresh` với refresh token
6. **Nhận tokens mới** → Cập nhật access token và refresh token mới
7. **Retry request** → Thực hiện lại request ban đầu với token mới
8. **Thành công** → Trả về data cho user

Nếu refresh token cũng hết hạn → Auto redirect đến trang login

## Lưu ý

- ⚠️ **Admin không sử dụng refresh token** (theo yêu cầu)
- ✅ Tự động retry khi access token hết hạn
- ✅ Tự động redirect đến login khi refresh token hết hạn
- ✅ Backward compatible với code cũ (vẫn lưu theo format cũ)
- ✅ Hỗ trợ multiple user types đăng nhập cùng lúc

## Testing

### Test refresh token flow:
1. Login với user bất kỳ
2. Chờ access token hết hạn (hoặc xóa access token khỏi localStorage)
3. Gọi một API bất kỳ
4. Kiểm tra console log - sẽ thấy refresh token được gọi tự động
5. Request sẽ thành công với token mới

### Test logout:
1. Login
2. Kiểm tra localStorage - có refresh token
3. Logout
4. Kiểm tra localStorage - refresh token đã bị xóa

## Troubleshooting

### Refresh token không hoạt động?
- Kiểm tra Backend có trả về `refreshToken` trong login response chưa
- Kiểm tra localStorage có `{userType}_refresh_token` chưa
- Kiểm tra console log xem có lỗi gì khi call refresh API

### Token refresh loop?
- Có thể refresh token cũng đã hết hạn
- Backend cần return new refresh token trong refresh response

### 401 vẫn xuất hiện sau khi refresh?
- Kiểm tra token mới có được lưu vào localStorage chưa
- Kiểm tra retry request có dùng token mới chưa

## Backend Requirements

Backend cần:
1. ✅ Return `refreshToken` trong login response
2. ✅ Implement endpoint `POST /api/account/refresh`
3. ✅ Validate refresh token và return new tokens
4. ✅ Handle refresh token expiration

---

**Tác giả:** GitHub Copilot  
**Ngày tạo:** 27/10/2025  
**Version:** 1.0.0
