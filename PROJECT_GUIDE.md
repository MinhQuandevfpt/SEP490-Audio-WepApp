# 📚 Hướng Dẫn Dự Án SEP490-Audio-WebApp

> **Tài liệu này giúp bạn nhanh chóng nắm rõ cấu trúc dự án và quy trình làm việc**

---

## 🎯 Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Setup Ban Đầu](#setup-ban-đầu)
3. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
4. [Quy Trình Làm Việc](#quy-trình-làm-việc)
5. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
6. [Thứ Tự Thao Tác Khi Phát Triển](#thứ-tự-thao-tác-khi-phát-triển)
7. [Conventions & Best Practices](#conventions--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 📋 Tổng Quan Dự Án

### Thông Tin Cơ Bản
- **Tên dự án**: SEP490-Audio-WebApp
- **Loại**: E-commerce Multi-vendor Platform (Audio Equipment)
- **Tech Stack**:
  - Frontend: React 19.1.1 + TypeScript
  - Build Tool: Vite 7.1.7
  - UI Framework: Tailwind CSS + Ant Design
  - 3D: Three.js (@react-three/fiber)
  - Routing: React Router DOM v7
  - State Management: React Context + Custom Hooks

### Backend API
- **URL**: `http://localhost:8080`
- **Proxy**: Tự động proxy `/api` → `http://localhost:8080` (config trong `vite.config.ts`)

### Port Development
- **Frontend**: `http://localhost:5173`

---

## 🚀 Setup Ban Đầu

### Bước 1: Cài Đặt Dependencies

```bash
# Cài đặt node modules
npm install
```

### Bước 2: Cấu Hình Environment Variables (nếu cần)

Tạo file `.env` ở root directory:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Bước 3: Chạy Development Server

```bash
# Start dev server
npm run dev
```

Truy cập: `http://localhost:5173`

### Bước 4: Build Production

```bash
# Build cho production
npm run build

# Preview build
npm run preview
```

---

## 📁 Cấu Trúc Thư Mục

```
SEP490-Audio-WebApp/
│
├── 📄 Configuration Files
│   ├── package.json          # Dependencies & scripts
│   ├── vite.config.ts        # Vite configuration
│   ├── tsconfig.json         # TypeScript config
│   ├── tailwind.config.ts    # Tailwind CSS config
│   └── eslint.config.js      # ESLint rules
│
├── 📂 public/                # Static assets
│   ├── images/              # Banner images
│   ├── tinymce/             # Rich text editor
│   └── oauth2-handler.html   # OAuth2 callback
│
└── 📂 src/                   # Source code
    │
    ├── 🎯 Entry Points
    │   ├── main.tsx         # App entry point
    │   └── App.tsx          # Root component
    │
    ├── 🛣️ Routing
    │   └── routes/
    │       └── index.tsx    # TẤT CẢ ROUTES ĐỊNH NGHĨA Ở ĐÂY
    │
    ├── 📄 Pages              # Page components (chia theo role)
    │   ├── HomePage/        # Trang chủ
    │   ├── Customer/        # ⭐ Customer pages (quan trọng nhất)
    │   ├── Seller/          # ⭐ Seller pages
    │   ├── Admin/           # ⭐ Admin pages
    │   ├── StoreStaff/      # Store staff pages
    │   └── OAuth2Callback/  # OAuth handlers
    │
    ├── 🧩 Components         # Reusable UI components
    │   ├── Layout/          # Layout wrappers
    │   ├── Header/          # Header với cart
    │   ├── Footer/          # Footer
    │   ├── common/          # ⭐ Common components (dùng nhiều)
    │   ├── ProductCard/     # Product display
    │   ├── ProductDetailComponents/  # Product detail sections
    │   ├── ShoppingCartComponents/   # Cart UI
    │   ├── CheckoutOrderComponents/   # Checkout UI
    │   ├── OrderHistoryComponents/    # Order history UI
    │   ├── ProfilePageComponents/    # Profile UI
    │   └── Design3DroomComponents/    # 3D room design
    │
    ├── 🔌 Services          # API communication layer
    │   ├── HttpInterceptor.ts        # ⭐ HTTP client (QUAN TRỌNG)
    │   ├── RefreshTokenService.ts    # ⭐ Token refresh logic
    │   ├── FileUploadService.ts       # File upload
    │   ├── customer/        # Customer API services
    │   ├── seller/          # Seller API services
    │   ├── admin/           # Admin API services
    │   └── staff/           # Staff API services
    │
    ├── 🎣 Hooks             # Custom React hooks
    │   ├── useCart.ts       # Cart operations
    │   ├── useCheckout.ts   # Checkout logic
    │   ├── useProfileData.ts
    │   └── ...
    │
    ├── 🔄 Contexts          # React Context providers
    │   └── CartContext.tsx  # Cart state management
    │
    ├── 📝 Types             # TypeScript type definitions
    │   ├── api.ts           # API types
    │   ├── cart.ts          # Cart types
    │   ├── productList.ts
    │   ├── admin.ts
    │   └── seller.ts
    │
    ├── 🛠️ Utils             # Utility functions
    │   ├── notification.ts  # Toast notifications
    │   └── statusCodes.ts   # Status code utils
    │
    └── 📊 data/             # Mock data (development only)
        ├── products.ts
        ├── banners.ts
        └── ...
```

---

## 🔄 Quy Trình Làm Việc

### 1. Khi Bắt Đầu Feature Mới

#### Bước 1: Xác định loại feature
- **Customer feature** → Làm trong `pages/Customer/` và `services/customer/`
- **Seller feature** → Làm trong `pages/Seller/` và `services/seller/`
- **Admin feature** → Làm trong `pages/Admin/` và `services/admin/`
- **Common component** → Làm trong `components/common/`

#### Bước 2: Tạo Types (nếu cần)
```typescript
// File: src/types/api.ts hoặc types/[feature].ts
export interface MyFeatureRequest {
  // Define types
}
```

#### Bước 3: Tạo Service
```typescript
// File: src/services/[role]/MyFeatureService.ts
import { HttpInterceptor } from '../HttpInterceptor';

export class MyFeatureService {
  static async getData(): Promise<ResponseType> {
    return HttpInterceptor.get('/api/endpoint', {
      userType: 'customer' // hoặc 'seller', 'admin'
    });
  }
}
```

#### Bước 4: Tạo Hook (nếu cần state management)
```typescript
// File: src/hooks/useMyFeature.ts
import { useState, useEffect } from 'react';
import { MyFeatureService } from '../services/...';

export const useMyFeature = () => {
  // Hook logic
};
```

#### Bước 5: Tạo Component
```typescript
// File: src/components/MyFeature/MyComponent.tsx
export const MyComponent = () => {
  // Component logic
};
```

#### Bước 6: Tạo Page (nếu là page mới)
```typescript
// File: src/pages/[Role]/MyFeature/MyPage.tsx
```

#### Bước 7: Thêm Route
```typescript
// File: src/routes/index.tsx
{
  path: '/my-feature',
  element: <MyPage />
}
```

---

### 2. Khi Sửa Bug

#### Bước 1: Xác định vị trí
- Check error message trong console
- Tìm file liên quan dựa trên error
- Check network tab để xem API call nào failed

#### Bước 2: Tìm file liên quan
- **API error** → Check `services/` folder
- **UI bug** → Check `components/` hoặc `pages/`
- **Type error** → Check `types/` folder
- **Routing issue** → Check `routes/index.tsx`

#### Bước 3: Debug
- Thêm `console.log()` để trace
- Check localStorage để xem tokens
- Check Network tab để xem API responses

---

### 3. Khi Thêm API Mới

#### Checklist:
1. ✅ Tạo types trong `types/` (Request & Response interfaces)
2. ✅ Tạo service method trong `services/[role]/[Service].ts`
3. ✅ Sử dụng `HttpInterceptor` với đúng `userType`
4. ✅ Handle errors properly
5. ✅ Test với Postman/Backend trước khi integrate

**Ví dụ:**
```typescript
// 1. Types
export interface GetProductsRequest {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface GetProductsResponse {
  content: Product[];
  totalElements: number;
}

// 2. Service
export class ProductService {
  static async getProducts(
    params: GetProductsRequest
  ): Promise<GetProductsResponse> {
    return HttpInterceptor.get('/api/products', {
      userType: 'customer',
      // params sẽ được append vào query string tự động
    });
  }
}
```

---

## 🏗️ Kiến Trúc Hệ Thống

### 1. Authentication Flow

```
User Login
    ↓
Service Layer (AuthService)
    ↓
Backend API
    ↓
Tokens (access + refresh) → localStorage
    ↓
HttpInterceptor tự động inject token vào headers
```

**Các loại user:**
- `customer` → `customer_token` + `customer_refresh_token`
- `seller` → `seller_token` + `seller_refresh_token`
- `staff` → `staff_token` + `staff_refresh_token`
- `admin` → `admin_access_token` + `admin_refresh_token`

### 2. Auto Token Refresh

```
API Call → 401 Error
    ↓
HttpInterceptor detect
    ↓
RefreshTokenService.refreshUserToken()
    ↓
New tokens → localStorage
    ↓
Retry original request
```

### 3. Protected Routes

- `ProtectedRoute` → Yêu cầu customer login
- `ProtectedSellerRoute` → Yêu cầu seller login
- `ProtectedSellerDashboardRoute` → Yêu cầu seller login + store ACTIVE
- `ProtectedAdminRoute` → Yêu cầu admin login

### 4. Data Flow

```
Component
    ↓
Hook (useCart, useCheckout, etc.)
    ↓
Service (CartService, CheckoutService, etc.)
    ↓
HttpInterceptor
    ↓
Backend API
```

---

## 📝 Thứ Tự Thao Tác Khi Phát Triển

### 🎯 Khi Mở Dự Án Lần Đầu

1. **Đọc file này** (PROJECT_GUIDE.md) ✅
2. **Check `package.json`** để xem dependencies
3. **Chạy `npm install`** nếu chưa có node_modules
4. **Chạy `npm run dev`** để start development server
5. **Mở browser** tại `http://localhost:5173`
6. **Check console** để xem có errors không

### 🆕 Khi Thêm Feature Mới

#### Thứ tự thực hiện:

1. **Plan** (Planning)
   - Xác định feature thuộc role nào (Customer/Seller/Admin)
   - Liệt kê các API endpoints cần thiết
   - Thiết kế UI/UX

2. **Types** (TypeScript Definitions)
   - Tạo interfaces trong `types/` folder
   - Định nghĩa Request & Response types
   - Export types để reuse

3. **Services** (API Layer)
   - Tạo service methods trong `services/[role]/`
   - Sử dụng `HttpInterceptor` với đúng `userType`
   - Handle errors và edge cases

4. **Hooks** (Custom Hooks - Optional)
   - Tạo hook nếu cần state management phức tạp
   - Wrap service calls trong hook
   - Return state và functions

5. **Components** (UI Components)
   - Tạo reusable components trong `components/`
   - Tách components nhỏ, dễ maintain
   - Follow naming conventions

6. **Pages** (Page Components)
   - Tạo page trong `pages/[Role]/[Feature]/`
   - Import và sử dụng components
   - Integrate hooks và services

7. **Routes** (Routing)
   - Thêm route vào `routes/index.tsx`
   - Xác định route có cần protection không
   - Test navigation

8. **Testing** (Testing & Debugging)
   - Test UI flow
   - Test API integration
   - Test error handling
   - Test với different user roles

### 🔧 Khi Debugging

1. **Check Console Errors**
   - Open DevTools Console
   - Tìm error messages
   - Trace stack trace

2. **Check Network Tab**
   - Xem API calls có success không
   - Check request headers (có token không?)
   - Check response data

3. **Check localStorage**
   ```javascript
   // Trong Console
   localStorage.getItem('customer_token')
   localStorage.getItem('customer_refresh_token')
   ```

4. **Check Source Files**
   - Tìm file liên quan dựa trên error message
   - Đọc code trong file đó
   - Check imports và exports

5. **Add Debug Logs**
   ```typescript
   console.log('Debug:', variable);
   console.log('API Response:', response);
   ```

### 🐛 Khi Fix Bug

1. **Reproduce Bug**
   - Xác định steps để reproduce
   - Check điều kiện nào trigger bug

2. **Find Root Cause**
   - Check service layer
   - Check component logic
   - Check API responses
   - Check type definitions

3. **Fix & Test**
   - Apply fix
   - Test lại flow
   - Test edge cases

4. **Document** (nếu cần)
   - Note lại fix trong code comments
   - Update documentation nếu cần

---

## 📐 Conventions & Best Practices

### 1. File Naming

- **Components**: PascalCase - `ProductCard.tsx`
- **Services**: PascalCase - `CartService.ts`
- **Hooks**: camelCase với prefix `use` - `useCart.ts`
- **Types**: camelCase - `api.ts`, `cart.ts`
- **Pages**: PascalCase - `ProductDetail.tsx`

### 2. Folder Structure

- Mỗi feature có folder riêng
- Mỗi folder có `index.ts` để export
- Component files cùng folder với component name

### 3. Import Order

```typescript
// 1. React & External Libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal Components
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';

// 3. Services
import { CartService } from '../../services/customer/CartService';

// 4. Hooks
import { useCart } from '../../hooks/useCart';

// 5. Types
import type { CartResponse } from '../../types/cart';

// 6. Utils
import { showSuccess } from '../../utils/notification';
```

### 4. Service Pattern

```typescript
// ✅ GOOD
export class CartService {
  static async getCart(): Promise<CartResponse> {
    return HttpInterceptor.get('/api/cart', {
      userType: 'customer'
    });
  }
}

// ❌ BAD - Không dùng static
export class CartService {
  async getCart() { ... }  // Không cần instance
}
```

### 5. Component Structure

```typescript
// ✅ GOOD Structure
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState();
  const { data } = useMyHook();

  // 2. Effects
  useEffect(() => {
    // effect logic
  }, [deps]);

  // 3. Handlers
  const handleClick = () => {
    // handler logic
  };

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### 6. Error Handling

```typescript
// ✅ GOOD - Always handle errors
try {
  const data = await Service.getData();
  // success logic
} catch (error) {
  console.error('Error:', error);
  showError('Có lỗi xảy ra');
}
```

### 7. TypeScript

- ✅ Always define types cho props
- ✅ Use interfaces cho objects
- ✅ Use type unions cho enums
- ✅ Export types để reuse
- ❌ Avoid `any` type

---

## 🔍 Các File Quan Trọng Cần Nắm

### ⭐ Files Phải Đọc Trước Khi Code

1. **`src/routes/index.tsx`**
   - Xem tất cả routes
   - Hiểu routing structure
   - Check protected routes

2. **`src/services/HttpInterceptor.ts`**
   - Hiểu cách gọi API
   - Xem token injection
   - Xem auto refresh logic

3. **`src/services/RefreshTokenService.ts`**
   - Hiểu token management
   - Xem cách refresh token

4. **`src/types/api.ts`** & **`src/types/cart.ts`**
   - Xem type definitions
   - Hiểu data structures

### 📚 Files Reference

- **`src/services/customer/Authcustomer.ts`** → Authentication flow
- **`src/contexts/CartContext.tsx`** → Cart state management
- **`src/hooks/useCart.ts`** → Cart hook example
- **`src/components/Layout/Layout.tsx`** → Layout structure

---

## 🚨 Troubleshooting

### Lỗi: "Token expired" hoặc 401

**Nguyên nhân:**
- Token hết hạn
- Token không được inject vào request
- Refresh token không hoạt động

**Giải pháp:**
1. Check localStorage có token không
2. Check `HttpInterceptor` có inject token không
3. Check `userType` có đúng không trong service call
4. Logout và login lại

### Lỗi: "Cannot find module"

**Nguyên nhân:**
- Import path sai
- File không tồn tại
- Export không đúng

**Giải pháp:**
1. Check import path (relative/absolute)
2. Check file có tồn tại không
3. Check export statement trong file

### Lỗi: TypeScript type errors

**Nguyên nhân:**
- Type không match
- Missing type definition
- Wrong type usage

**Giải pháp:**
1. Check type definitions trong `types/`
2. Check props types
3. Use `as` type assertion nếu cần (tạm thời)

### API không hoạt động

**Nguyên nhân:**
- Backend chưa chạy
- CORS issue
- Wrong endpoint URL
- Network error

**Giải pháp:**
1. Check backend có chạy không (`http://localhost:8080`)
2. Check `vite.config.ts` proxy config
3. Check Network tab trong DevTools
4. Check endpoint URL có đúng không

### Component không render

**Nguyên nhân:**
- Route không được add
- Component không được import
- JSX syntax error

**Giải pháp:**
1. Check route có trong `routes/index.tsx` không
2. Check import path
3. Check console có errors không
4. Check component có return JSX không

---

## 📞 Liên Hệ & Hỗ Trợ

### Khi Cần Hỗ Trợ:

1. **Check documentation trước**
   - Đọc file này
   - Check README.md trong các folders
   - Check code comments

2. **Check existing code**
   - Xem similar features đã implement
   - Follow patterns đã có

3. **Debug**
   - Use console.log
   - Use React DevTools
   - Check Network tab

---

## ✅ Checklist Khi Hoàn Thành Feature

- [ ] Types đã được định nghĩa
- [ ] Service methods đã được implement
- [ ] Components đã được tạo và tested
- [ ] Routes đã được add
- [ ] Error handling đã được implement
- [ ] Loading states đã được handle
- [ ] UI responsive trên mobile
- [ ] Code đã được clean up (remove console.logs)
- [ ] Đã test với different user roles
- [ ] Đã test edge cases

---

## 🎓 Tóm Tắt Nhanh

### ⚡ Quick Start
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`

### 📁 Nơi Quan Trọng
- **Routes**: `src/routes/index.tsx`
- **API Calls**: `src/services/`
- **Components**: `src/components/`
- **Pages**: `src/pages/`
- **Types**: `src/types/`

### 🔑 Key Concepts
- **4 User Types**: customer, seller, staff, admin
- **Auto Token Refresh**: Handled by HttpInterceptor
- **Protected Routes**: Check authentication before access
- **Service Pattern**: Static methods in service classes
- **Type Safety**: Always define types

---

**🎉 Chúc bạn code vui vẻ!**

*Cập nhật lần cuối: [Ngày tạo file]*
