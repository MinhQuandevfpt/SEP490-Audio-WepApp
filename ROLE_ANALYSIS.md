# PHÂN TÍCH HỆ THỐNG QUẢN LÝ ROLE

## 📋 TỔNG QUAN

Hệ thống quản lý 4 loại role chính:
1. **CUSTOMER** (Khách hàng)
2. **STOREOWNER** (Chủ cửa hàng/Seller)
3. **STAFF** (Nhân viên cửa hàng)
4. **ADMIN** (Quản trị viên)

---

## 🔑 1. ĐỊNH NGHĨA ROLE

### 1.1. UserType Definitions

**File: `src/utils/authHelper.ts`**
```typescript
export type UserType = 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN';
```

**File: `src/services/HttpInterceptor.ts`**
```typescript
export type UserType = 'customer' | 'seller' | 'staff' | 'admin';
type RefreshTokenUserType = 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN';
```

**⚠️ LƯU Ý:** Có sự khác biệt về format:
- `authHelper.ts`: UPPERCASE (CUSTOMER, STOREOWNER, STAFF, ADMIN)
- `HttpInterceptor.ts`: lowercase (customer, seller, staff, admin)
- Mapping được xử lý trong `HttpInterceptor.mapUserTypeToRefreshTokenType()`

### 1.2. Role trong API Response

**File: `src/types/api.ts`**
```typescript
export interface CustomerProfile {
  role: string;  // Role từ backend (string, không phải enum)
  // ...
}

export interface CustomerLoginResponse {
  data: {
    user: {
      role: string;  // Role từ backend
    };
  };
}
```

**File: `src/types/seller.ts`**
```typescript
export interface SellerLoginResponse {
  data: {
    user: {
      role: string;  // Role từ backend
    };
  };
}
```

---

## 🔐 2. AUTHENTICATION SERVICES

### 2.1. Customer Auth Service
**File: `src/services/customer/Authcustomer.ts`**

**Token Storage:**
- Key: `CUSTOMER_token` (UPPERCASE)
- User Data: `customer_user` (JSON)
- Account ID: `accountId` (camelCase)
- Customer ID: `customerId` (camelCase)

**Methods:**
- `login()`: Lưu token và user data
- `logout()`: Clear tất cả data
- `isAuthenticated()`: Check token tồn tại
- `getToken()`: Lấy token từ localStorage
- `getCurrentUser()`: Lấy user data từ localStorage

### 2.2. Seller Auth Service
**File: `src/services/seller/AuthSeller.ts`**

**Token Storage:**
- Key: `seller_token` (lowercase - backward compatibility)
- Key: `STOREOWNER_token` (UPPERCASE - RefreshTokenService)
- User Data: `seller_user` (JSON)
- Store ID: `seller_store_id`

**Methods:**
- `login()`: Lưu token và user data
- `logout()`: Clear tất cả data
- `isAuthenticated()`: Check token và user tồn tại
- `getToken()`: Lấy token từ localStorage
- `getCurrentUser()`: Lấy user data từ localStorage

### 2.3. Admin Auth Service
**File: `src/services/admin/AdminAuthService.ts`**

**Token Storage:**
- Access Token: `admin_access_token`
- Refresh Token: `admin_refresh_token`
- User Data: `admin_user` (JSON)

**Methods:**
- `login()`: Lưu token và user data
- `logout()`: Clear tất cả data
- `isAuthenticated()`: Check token và user tồn tại
- `getAccessToken()`: Lấy access token
- `getCurrentUser()`: Lấy user data từ localStorage

### 2.4. Staff Auth Service
**File: `src/services/staff/AuthStaff.ts`**

**Token Storage:**
- Key: `staff_token` (lowercase - backward compatibility)
- Key: `STAFF_token` (UPPERCASE - RefreshTokenService)
- User Data: `staff_user` (JSON)

**Methods:**
- `login()`: Lưu token và user data
- `logout()`: Clear tất cả data
- `isAuthenticated()`: Check token và user tồn tại
- `getToken()`: Lấy token từ localStorage
- `getCurrentUser()`: Lấy user data từ localStorage

---

## 💾 3. TOKEN STORAGE MANAGEMENT

### 3.1. RefreshTokenService
**File: `src/services/RefreshTokenService.ts`**

**Chức năng:**
- Quản lý refresh token cho tất cả user types
- Standardize token storage format
- Handle token refresh logic

**Token Keys:**
- CUSTOMER: `CUSTOMER_token`, `CUSTOMER_refresh_token`
- STOREOWNER: `STOREOWNER_token`, `STOREOWNER_refresh_token`
- STAFF: `STAFF_token`, `STAFF_refresh_token`
- ADMIN: `admin_access_token`, `admin_refresh_token`

**Methods:**
- `storeTokens(userType, accessToken, refreshToken, tokenType)`: Lưu tokens
- `getRefreshToken(userType)`: Lấy refresh token
- `refreshUserToken(userType)`: Refresh token
- `clearAllData(userType)`: Clear tất cả data
- `clearTokens(userType)`: Chỉ clear tokens (giữ user info)

### 3.2. Storage Keys Pattern

**UPPERCASE Keys (Modern Format):**
- `CUSTOMER_token`, `CUSTOMER_refresh_token`
- `STOREOWNER_token`, `STOREOWNER_refresh_token`
- `STAFF_token`, `STAFF_refresh_token`
- `admin_access_token`, `admin_refresh_token` (ADMIN dùng format khác)

**Lowercase Keys (Backward Compatibility):**
- `seller_token`, `staff_token` (vẫn được sử dụng)

**User Data Keys:**
- `customer_user`, `seller_user`, `staff_user`, `admin_user`

---

## 🛡️ 4. ROUTE PROTECTION

### 4.1. Protected Routes
**File: `src/routes/index.tsx`**

**ProtectedRoute (Customer):**
```typescript
function ProtectedRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = CustomerAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return element;
}
```

**ProtectedSellerRoute:**
```typescript
function ProtectedSellerRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = SellerAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/seller/login" replace />;
  }
  return element;
}
```

**ProtectedSellerDashboardRoute:**
- Check authentication
- Check store status (chỉ ACTIVE stores mới được truy cập)
- Redirect đến `/seller/kyc-status` nếu store không ACTIVE

**ProtectedAdminRoute:**
```typescript
function ProtectedAdminRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = AdminAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return element;
}
```

**ProtectedStaffRoute:**
```typescript
function ProtectedStaffRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = StoreStaffAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/store-staff/login" replace />;
  }
  return element;
}
```

### 4.2. Route Structure

**Customer Routes:**
- `/cart`, `/checkout`, `/orders`, `/account` → ProtectedRoute

**Seller Routes:**
- `/seller/dashboard/*` → ProtectedSellerDashboardRoute (check store status)
- `/seller/onboarding`, `/seller/kyc-status` → ProtectedSellerRoute

**Admin Routes:**
- `/admin/*` → ProtectedAdminRoute

**Staff Routes:**
- `/store-staff/dashboard/*` → ProtectedStaffRoute

---

## 🔄 5. HTTP INTERCEPTOR

### 5.1. Auto Token Refresh
**File: `src/services/HttpInterceptor.ts`**

**Chức năng:**
- Tự động refresh token khi gặp 401 Unauthorized
- Map userType (lowercase) → RefreshTokenUserType (UPPERCASE)
- Retry request sau khi refresh token thành công

**UserType Mapping:**
```typescript
customer → CUSTOMER
seller → STOREOWNER
staff → STAFF
admin → ADMIN
```

---

## 📁 6. COMPONENT STRUCTURE

### 6.1. Layout Components

**Customer Layout:**
- `src/components/Layout/` - Layout chung cho customer pages

**Seller Layout:**
- `src/components/SellerLayout/` - Layout cho seller login/register
- `src/components/SellerDashboardLayout/` - Layout cho seller dashboard

**Admin Layout:**
- `src/components/AdminLayout/` - Layout cho admin pages

**Staff Layout:**
- `src/components/StaffDashboardLayout/` - Layout cho staff dashboard

### 6.2. Pages Structure

**Customer Pages:**
- `src/pages/Customer/` - Cart, Checkout, OrderHistory, Profile, etc.

**Seller Pages:**
- `src/pages/Seller/` - Dashboard, Products, Orders, Campaigns, etc.

**Admin Pages:**
- `src/pages/Admin/` - Dashboard, UserManagement, CampaignManagement, etc.

**Staff Pages:**
- `src/pages/StoreStaff/` - Dashboard, Orders, etc.

---

## ⚠️ 7. VẤN ĐỀ VÀ LƯU Ý

### 7.1. Inconsistencies

1. **Token Key Format:**
   - CUSTOMER: `CUSTOMER_token` (UPPERCASE)
   - SELLER: `seller_token` (lowercase) + `STOREOWNER_token` (UPPERCASE)
   - STAFF: `staff_token` (lowercase) + `STAFF_token` (UPPERCASE)
   - ADMIN: `admin_access_token` (lowercase với prefix)

2. **UserType Format:**
   - `authHelper.ts`: UPPERCASE
   - `HttpInterceptor.ts`: lowercase
   - Cần mapping giữa 2 formats

3. **Role Field:**
   - Role được lưu dưới dạng `string` (không phải enum)
   - Không có validation về role values
   - Role từ backend có thể khác với UserType trong frontend

### 7.2. Best Practices

1. **Sử dụng RefreshTokenService:**
   - Luôn dùng `RefreshTokenService.storeTokens()` để lưu tokens
   - Dùng `RefreshTokenService.clearAllData()` để clear data

2. **Check Authentication:**
   - Dùng `isAuthenticated()` method từ từng AuthService
   - Không check trực tiếp localStorage

3. **Route Protection:**
   - Luôn wrap protected routes với ProtectedRoute components
   - Check store status cho seller dashboard routes

---

## 🔧 8. RECOMMENDATIONS FOR REFACTORING

### 8.1. Standardize Token Keys
- Thống nhất format: UPPERCASE cho tất cả user types
- Hoặc tạo một mapping service để handle backward compatibility

### 8.2. Create Role Enum
```typescript
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STOREOWNER = 'STOREOWNER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}
```

### 8.3. Centralize Auth Logic
- Tạo một `AuthService` base class
- Implement các AuthService cụ thể extend từ base class
- Giảm code duplication

### 8.4. Role-Based Access Control (RBAC)
- Implement RBAC system
- Check permissions dựa trên role
- Middleware cho route protection

---

## 📝 9. FILES TO REVIEW

### Authentication Services:
- `src/services/customer/Authcustomer.ts`
- `src/services/seller/AuthSeller.ts`
- `src/services/admin/AdminAuthService.ts`
- `src/services/staff/AuthStaff.ts`
- `src/services/RefreshTokenService.ts`
- `src/services/HttpInterceptor.ts`

### Types:
- `src/types/api.ts`
- `src/types/seller.ts`
- `src/utils/authHelper.ts`

### Routes:
- `src/routes/index.tsx`

### Components:
- `src/components/Layout/`
- `src/components/SellerLayout/`
- `src/components/SellerDashboardLayout/`
- `src/components/AdminLayout/`
- `src/components/StaffDashboardLayout/`

---

## 🎯 10. SUMMARY

Hệ thống hiện tại quản lý role thông qua:
1. **4 Auth Services riêng biệt** cho từng user type
2. **RefreshTokenService** để quản lý token storage
3. **ProtectedRoute components** để bảo vệ routes
4. **HttpInterceptor** để tự động refresh token

**Điểm mạnh:**
- Tách biệt rõ ràng giữa các user types
- Có token refresh mechanism
- Route protection được implement

**Điểm yếu:**
- Inconsistent token key formats
- Không có role enum/validation
- Code duplication giữa các AuthServices
- Thiếu RBAC system

