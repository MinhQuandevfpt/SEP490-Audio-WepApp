# 📊 PHÂN TÍCH TOÀN BỘ DỰ ÁN SEP490-Audio-WebApp

> **Tài liệu phân tích chi tiết về cấu trúc, kiến trúc và code của dự án**

---

## 🎯 TỔNG QUAN DỰ ÁN

### Thông Tin Cơ Bản
- **Tên dự án**: SEP490-Audio-WebApp
- **Loại**: E-commerce Multi-vendor Platform (Thiết bị âm thanh)
- **Mô hình**: Marketplace với nhiều người bán (Seller), khách hàng (Customer), nhân viên cửa hàng (Store Staff), và quản trị viên (Admin)

### Tech Stack

#### Frontend Core
- **React**: 19.1.1 (Latest version)
- **TypeScript**: ~5.8.3
- **Vite**: 7.1.7 (Build tool & Dev server)
- **React Router DOM**: 7.9.3 (Routing)

#### UI Framework & Styling
- **Tailwind CSS**: 3.4.17 (Utility-first CSS)
- **Ant Design**: 5.27.6 (Component library)
- **Lucide React**: 0.544.0 (Icons)
- **React Icons**: 5.5.0 (Additional icons)

#### 3D & Visualization
- **Three.js**: 0.180.0 (3D graphics)
- **@react-three/fiber**: 9.4.0 (React renderer for Three.js)
- **@react-three/drei**: 10.7.6 (Helpers for react-three/fiber)
- **@react-three/rapier**: 2.1.0 (Physics engine)

#### Rich Text Editor
- **TinyMCE**: 6.8.6
- **@tinymce/tinymce-react**: 6.3.0

#### Utilities
- **React Toastify**: 10.0.6 (Toast notifications)

### Backend Integration
- **API Base URL**: `http://localhost:8080`
- **Proxy Config**: Tự động proxy `/api` → `http://localhost:8080` (trong `vite.config.ts`)
- **Port Development**: `http://localhost:5173`

---

## 📁 CẤU TRÚC THƯ MỤC CHI TIẾT

### Root Directory Structure

```
SEP490-Audio-WebApp/
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies & npm scripts
│   ├── package-lock.json         # Lock file
│   ├── vite.config.ts            # Vite configuration (proxy, port)
│   ├── tsconfig.json             # TypeScript root config
│   ├── tsconfig.app.json         # TypeScript app config
│   ├── tsconfig.node.json        # TypeScript node config
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── eslint.config.js          # ESLint rules
│   ├── .gitignore                # Git ignore rules
│   ├── index.html                # HTML entry point
│   ├── README.md                  # Basic README
│   └── PROJECT_GUIDE.md           # Hướng dẫn dự án (chi tiết)
│
├── 📂 public/                     # Static assets
│   ├── images/                   # Banner images (6 files)
│   ├── tinymce/                  # TinyMCE editor files
│   ├── oauth2-handler.html        # OAuth2 callback handler
│   ├── See You Again Remix.mp3   # Audio file
│   └── vite.svg                  # Vite logo
│
├── 📂 node_modules/              # Dependencies (auto-generated)
│
└── 📂 src/                        # Source code (MAIN)
    │
    ├── 🎯 Entry Points
    │   ├── main.tsx              # React app entry point
    │   └── App.tsx               # Root component (Router + Toast)
    │
    ├── 🛣️ Routing
    │   └── routes/
    │       └── index.tsx         # ⭐ TẤT CẢ ROUTES ĐỊNH NGHĨA Ở ĐÂY
    │
    ├── 📄 Pages                   # Page components (chia theo role)
    │   ├── HomePage/             # Trang chủ
    │   ├── Customer/             # ⭐ Customer pages (27 files)
    │   │   ├── Login/
    │   │   ├── Register/
    │   │   ├── Profile/
    │   │   ├── ProductDetail/
    │   │   ├── ProductList/
    │   │   ├── Cart/
    │   │   ├── CheckoutOrder/
    │   │   ├── OrderHistory/
    │   │   ├── PaymentSuccess/
    │   │   ├── PaymentFail/
    │   │   ├── StorePage/
    │   │   ├── FlashSaleDetail/
    │   │   └── 3DTrialRoom/
    │   ├── Seller/               # ⭐ Seller pages (32 files)
    │   │   ├── Login/
    │   │   ├── Register/
    │   │   ├── Onboarding/
    │   │   ├── KycStatus/
    │   │   ├── Dashboard/
    │   │   ├── AddNewProduct/
    │   │   ├── OrderManagement/
    │   │   ├── Campaign/
    │   │   ├── Voucher/
    │   │   ├── StaffList/
    │   │   ├── CreateStaff/
    │   │   └── Debug/
    │   ├── Admin/                 # ⭐ Admin pages (23 files)
    │   │   ├── Login/
    │   │   ├── Dashboard/
    │   │   ├── UserManagement/
    │   │   ├── UserDetailandUpdate/
    │   │   ├── KycManagement/
    │   │   ├── Categories/
    │   │   ├── CategoryDetail/
    │   │   └── CampaignManagement/
    │   ├── StoreStaff/            # Store staff pages (5 files)
    │   │   ├── LoginForStaff.tsx
    │   │   ├── RegisterForStaff.tsx
    │   │   └── Dashboard/
    │   ├── OAuth2Callback/        # OAuth handlers
    │   └── OAuth2Success/
    │
    ├── 🧩 Components                 # Reusable UI components
    │   ├── Layout/               # Main layout wrapper
    │   ├── Header/               # Header với cart dropdown
    │   ├── Footer/               # Footer
    │   ├── Sidebar/              # Category sidebar
    │   ├── common/               # ⭐ Common components (dùng nhiều)
    │   │   ├── AuthDebugger.tsx
    │   │   ├── AuthStatus.tsx
    │   │   ├── BankSelector/
    │   │   ├── GoogleLoginButton.tsx
    │   │   ├── ImageWithFallback.tsx
    │   │   ├── InputField.tsx
    │   │   ├── LoadingSkeleton.tsx
    │   │   ├── SocialLoginButton.tsx
    │   │   ├── TinyMCEEditor.tsx
    │   │   └── Toast.tsx
    │   ├── ProductCard/          # Product display card
    │   ├── ProductDetailComponents/  # Product detail sections (18 files)
    │   ├── ProductListComponents/    # Product list UI (7 files)
    │   ├── ShoppingCartComponents/   # Cart UI (11 files)
    │   ├── CheckoutOrderComponents/   # Checkout UI (8 files)
    │   ├── OrderHistoryComponents/    # Order history UI (5 files)
    │   ├── ProfilePageComponents/     # Profile UI (13 files)
    │   ├── Design3DroomComponents/    # 3D room design (18 files)
    │   ├── BannerSlider/          # Banner carousel
    │   ├── FlashSale/             # Flash sale components
    │   ├── TopDeals/              # Top deals section
    │   ├── FeaturedBrands/        # Featured brands
    │   ├── ProductSuggestions/     # Product recommendations
    │   ├── AdminComponents/        # Admin-specific components
    │   │   ├── CategoryComponent/
    │   │   ├── DataTable/
    │   │   ├── KycStatsCards/
    │   │   ├── StatCard/
    │   │   └── UserListComponent/
    │   ├── AdminLayout/           # Admin layout
    │   ├── AuthLayout/               # Auth pages layout
    │   ├── SellerLayout/          # Seller auth layout
    │   ├── SellerDashboardLayout/ # Seller dashboard layout
    │   ├── StaffDashboardLayout/  # Staff dashboard layout
    │   ├── CreateProductForSellerUIComponent/  # Product creation UI
    │   ├── CreateStaffForStoreComponents/      # Staff creation UI
    │   ├── Loginforstorestaffcomponents/       # Staff login layout
    │   ├── StoreOwnerOrderManagementComponents/  # Store order management
    │   └── StoreOwnerVoucherComponents/         # Voucher management
    │
    ├── 🔌 Services               # API communication layer
    │   ├── HttpInterceptor.ts     # ⭐ HTTP client (QUAN TRỌNG)
    │   ├── RefreshTokenService.ts # ⭐ Token refresh logic
    │   ├── FileUploadService.ts    # File upload service
    │   ├── customer/              # Customer API services (13 files)
    │   │   ├── Authcustomer.ts
    │   │   ├── CartService.ts
    │   │   ├── CheckoutService.ts
    │   │   ├── OrderHistoryService.ts
    │   │   ├── ProductListService.ts
    │   │   ├── ProductViewService.ts
    │   │   ├── Profilecustomer.ts
    │   │   ├── AddressService.ts
    │   │   ├── CategoryService.ts
    │   │   ├── FlashSaleService.ts
    │   │   ├── ProductVoucherService.ts
    │   │   ├── ShippingService.ts
    │   │   └── index.ts
    │   ├── seller/                # Seller API services (12 files)
    │   │   ├── AuthSeller.ts
    │   │   ├── ProductService.ts
    │   │   ├── StoreService.ts
    │   │   ├── OrderService.ts
    │   │   ├── CampaignService.ts
    │   │   ├── VoucherService.ts
    │   │   ├── StaffService.ts
    │   │   ├── KycService.ts
    │   │   ├── CategoryService.ts
    │   │   ├── ShippingService.ts
    │   │   ├── GhnService.ts
    │   │   └── README.md
    │   ├── admin/                 # Admin API services (6 files)
    │   │   ├── AdminAuthService.ts
    │   │   ├── AdminUserService.ts
    │   │   ├── AdminKycService.ts
    │   │   ├── CampaignService.ts
    │   │   ├── CampaignProductService.ts
    │   │   └── CategoryService.ts
    │   ├── staff/                 # Staff API services (2 files)
    │   │   └── AuthStaff.ts
    │   ├── audio/                 # Audio service (1 file)
    │   └── cache/                 # Cache service (1 file)
    │
    ├── 🎣 Hooks                   # Custom React hooks
    │   ├── useCart.ts            # Cart operations
    │   ├── useCheckout.ts        # Checkout logic
    │   ├── useProfileData.ts      # Profile data management
    │   ├── useProductList.ts     # Product list management
    │   ├── useOrderHistory.ts    # Order history
    │   ├── useAutoShippingFee.ts # Auto shipping fee calculation
    │   ├── useProvinces.ts       # Vietnam provinces
    │   ├── useDistricts.ts       # Vietnam districts
    │   ├── useWards.ts           # Vietnam wards
    │   ├── useServiceTypeCalculator.ts  # Service type calculation
    │   ├── useStaffAuth.ts       # Staff authentication
    │   ├── useStaffList.ts       # Staff list management
    │   ├── useStoreOrders.ts     # Store orders
    │   └── useUsers.ts           # User management
    │
    ├── 🔄 Contexts               # React Context providers
    │   ├── CartContext.tsx       # Cart state management
    │   └── StaffAuthContext.tsx  # Staff auth state
    │
    ├── 📝 Types                  # TypeScript type definitions
    │   ├── api.ts                # ⭐ API types (Customer, Order, Address, etc.)
    │   ├── cart.ts               # ⭐ Cart types (Cart, Checkout, etc.)
    │   ├── productList.ts        # Product list types
    │   ├── seller.ts             # Seller-specific types
    │   ├── admin.ts              # Admin-specific types
    │   └── flashsale.ts          # Flash sale types
    │
    ├── 🛠️ Utils                   # Utility functions
    │   ├── notification.ts       # Toast notifications
    │   ├── statusCodes.ts        # Status code utils
    │   ├── orderStatus.ts        # Order status helpers
    │   ├── storeOrderStatus.ts   # Store order status helpers
    │   ├── authHelper.ts         # Auth helper functions
    │   ├── errorTranslation.ts   # Error message translation
    │   └── index.ts              # Utils exports
    │
    ├── 📊 data/                  # Mock data (development only)
    │   ├── products.ts
    │   ├── productListData.ts
    │   ├── productdetail.ts
    │   ├── shoppingcart.ts
    │   ├── orderHistory.ts
    │   ├── checkout.ts
    │   ├── profiledata.ts
    │   ├── banners.ts
    │   ├── brands.ts
    │   ├── vietnamBanks.ts
    │   └── datafor3droom.ts
    │
    └── index.css                 # Global CSS styles
```

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### 1. Authentication & Authorization Flow

#### User Types
- **Customer**: `customer_token` + `customer_refresh_token`
- **Seller**: `seller_token` + `seller_refresh_token`
- **Staff**: `staff_token` + `staff_refresh_token`
- **Admin**: `admin_access_token` + `admin_refresh_token`

#### Authentication Flow
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

#### Auto Token Refresh
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

### 2. Routing Architecture

#### Route Protection Levels
- **Public Routes**: Home, Product Detail, Store Page
- **ProtectedRoute**: Yêu cầu customer login
- **ProtectedSellerRoute**: Yêu cầu seller login
- **ProtectedSellerDashboardRoute**: Yêu cầu seller login + store ACTIVE
- **ProtectedAdminRoute**: Yêu cầu admin login
- **ProtectedStaffRoute**: Yêu cầu staff login

#### Route Structure
- **Customer Routes**: `/`, `/product/:id`, `/cart`, `/checkout`, `/orders`, `/account`
- **Seller Routes**: `/seller/login`, `/seller/dashboard/*`, `/seller/onboarding`, `/seller/kyc-status`
- **Admin Routes**: `/admin/login`, `/admin/dashboard/*`, `/admin/users`, `/admin/kyc`
- **Staff Routes**: `/store-staff/login`, `/store-staff/dashboard/*`

### 3. Data Flow Architecture

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

### 4. State Management

#### Context API
- **CartContext**: Quản lý cart state toàn cục
- **StaffAuthContext**: Quản lý staff auth state

#### Custom Hooks
- **useCart**: Cart operations với state management
- **useCheckout**: Checkout logic
- **useProfileData**: Profile data management
- Các hooks khác cho từng feature cụ thể

---

## 🔑 CÁC FILE QUAN TRỌNG

### ⭐ Core Files (Phải đọc trước khi code)

1. **`src/routes/index.tsx`**
   - Định nghĩa tất cả routes
   - Protected route logic
   - Route structure

2. **`src/services/HttpInterceptor.ts`**
   - HTTP client với auto token refresh
   - Token injection
   - Error handling
   - Support GET, POST, PUT, DELETE, PATCH

3. **`src/services/RefreshTokenService.ts`**
   - Token refresh logic
   - Token storage/retrieval
   - Token clearing

4. **`src/types/api.ts`** & **`src/types/cart.ts`**
   - Type definitions
   - Request/Response interfaces

### 📚 Service Files

#### Customer Services
- **Authcustomer.ts**: Customer authentication
- **CartService.ts**: Shopping cart operations
- **CheckoutService.ts**: Checkout (COD & PayOS)
- **OrderHistoryService.ts**: Order history
- **ProductListService.ts**: Product listing
- **Profilecustomer.ts**: Profile management
- **AddressService.ts**: Address management

#### Seller Services
- **AuthSeller.ts**: Seller authentication
- **ProductService.ts**: Product CRUD
- **StoreService.ts**: Store management
- **OrderService.ts**: Order management
- **CampaignService.ts**: Campaign management
- **VoucherService.ts**: Voucher management
- **StaffService.ts**: Staff management
- **KycService.ts**: KYC submission

#### Admin Services
- **AdminAuthService.ts**: Admin authentication
- **AdminUserService.ts**: User management
- **AdminKycService.ts**: KYC approval
- **CampaignService.ts**: Campaign management
- **CategoryService.ts**: Category management

### 🎨 Component Architecture

#### Layout Components
- **Layout.tsx**: Main layout (Header + Footer)
- **AdminLayout**: Admin dashboard layout
- **SellerDashboardLayout**: Seller dashboard layout
- **StaffDashboardLayout**: Staff dashboard layout
- **AuthLayout**: Auth pages layout

#### Feature Components
- **ProductCard**: Product display card
- **ShoppingCartComponents**: Cart UI (11 components)
- **CheckoutOrderComponents**: Checkout UI (8 components)
- **ProductDetailComponents**: Product detail (18 components)
- **Design3DroomComponents**: 3D room design (18 components)

---

## 📋 CHỨC NĂNG CHÍNH

### Customer Features
1. **Authentication**
   - Login/Register
   - OAuth2 (Google)
   - Profile management

2. **Shopping**
   - Product browsing & search
   - Product detail view
   - Shopping cart
   - Checkout (COD & PayOS)
   - Order history

3. **Store Features**
   - Store page view
   - Flash sale participation

4. **3D Features**
   - 3D trial room
   - Furniture placement
   - Audio visualization

### Seller Features
1. **Authentication & Onboarding**
   - Login/Register
   - Store onboarding
   - KYC submission

2. **Product Management**
   - Create/Edit/Delete products
   - Product listing
   - Category management

3. **Order Management**
   - View orders
   - Order status updates
   - Order filtering

4. **Marketing**
   - Voucher creation
   - Campaign participation
   - Flash sale management

5. **Staff Management**
   - Create staff accounts
   - Staff list management

### Admin Features
1. **Authentication**
   - Admin login

2. **User Management**
   - View all users
   - User detail & update
   - User status management

3. **KYC Management**
   - KYC approval/rejection
   - KYC detail view

4. **Category Management**
   - Category CRUD
   - Category detail

5. **Campaign Management**
   - Create/Edit campaigns
   - Campaign product approval

### Staff Features
1. **Authentication**
   - Staff login/register

2. **Order Management**
   - View store orders
   - Order status updates

---

## 🔧 TECHNICAL DETAILS

### HTTP Client (HttpInterceptor)

#### Features
- Automatic token injection
- Auto token refresh on 401
- Error handling
- Support all HTTP methods
- Request/Response interceptors

#### Usage Pattern
```typescript
// GET request
const data = await HttpInterceptor.get('/api/endpoint', {
  userType: 'customer'
});

// POST request
const result = await HttpInterceptor.post('/api/endpoint', requestData, {
  userType: 'customer'
});
```

### Token Management

#### Storage Keys
- Customer: `customer_token`, `customer_refresh_token`
- Seller: `seller_token`, `seller_refresh_token`
- Staff: `staff_token`, `staff_refresh_token`
- Admin: `admin_access_token`, `admin_refresh_token`

#### Token Refresh Flow
1. API call returns 401
2. HttpInterceptor detects 401
3. Calls RefreshTokenService.refreshUserToken()
4. New tokens stored in localStorage
5. Original request retried with new token

### Type Safety

#### Type Definitions
- **api.ts**: Customer, Order, Address, Profile types
- **cart.ts**: Cart, Checkout types
- **seller.ts**: Seller-specific types
- **admin.ts**: Admin-specific types
- **productList.ts**: Product list types

#### Type Usage
- All API requests/responses are typed
- Component props are typed
- Hook returns are typed

### Error Handling

#### Error Types
- API errors (400, 401, 403, 404, 500)
- Network errors
- Validation errors

#### Error Handling Pattern
```typescript
try {
  const data = await Service.getData();
} catch (error) {
  console.error('Error:', error);
  showError('Có lỗi xảy ra');
}
```

### State Management

#### Context API
- **CartContext**: Global cart state
- **StaffAuthContext**: Staff auth state

#### Custom Hooks
- Encapsulate state logic
- Reusable across components
- Type-safe

---

## 📊 STATISTICS

### File Count
- **Total Pages**: 51 files
- **Total Components**: ~100+ files
- **Total Services**: 30+ files
- **Total Hooks**: 14 files
- **Total Types**: 6 files
- **Total Utils**: 7 files

### Code Organization
- **Modular**: Feature-based organization
- **Type-safe**: Full TypeScript coverage
- **Reusable**: Component & hook reusability
- **Maintainable**: Clear separation of concerns

---

## 🎯 DESIGN PATTERNS

### 1. Service Pattern
- Static methods in service classes
- Centralized API calls
- Consistent error handling

### 2. Hook Pattern
- Custom hooks for state management
- Encapsulate business logic
- Reusable across components

### 3. Component Composition
- Small, focused components
- Component composition
- Props drilling minimized

### 4. Type Safety
- Full TypeScript coverage
- Interface-based types
- Type inference where possible

---

## 🚀 DEPLOYMENT & BUILD

### Development
```bash
npm run dev      # Start dev server (port 5173)
```

### Production Build
```bash
npm run build    # Build for production
npm run preview  # Preview production build
```

### Linting
```bash
npm run lint     # Run ESLint
```

---

## 📝 NOTES

### Important Conventions
1. **File Naming**: PascalCase for components, camelCase for hooks/utils
2. **Import Order**: React → Components → Services → Hooks → Types → Utils
3. **Service Pattern**: Always use static methods
4. **Error Handling**: Always handle errors in try-catch
5. **Type Safety**: Avoid `any` type

### Best Practices
1. **Component Structure**: Hooks → Effects → Handlers → Render
2. **Service Methods**: Always specify userType in HttpInterceptor calls
3. **Token Management**: Use RefreshTokenService for token operations
4. **State Management**: Use Context for global state, hooks for local state

---

## 🔍 TROUBLESHOOTING GUIDE

### Common Issues

1. **Token Expired (401)**
   - Check localStorage for tokens
   - Check HttpInterceptor token injection
   - Check userType in service calls

2. **Cannot Find Module**
   - Check import paths
   - Check file existence
   - Check exports

3. **TypeScript Errors**
   - Check type definitions
   - Check props types
   - Use type assertions if needed

4. **API Not Working**
   - Check backend running
   - Check proxy config
   - Check Network tab

---

## ✅ SUMMARY

### Strengths
- ✅ Well-organized code structure
- ✅ Full TypeScript coverage
- ✅ Modular architecture
- ✅ Reusable components & hooks
- ✅ Comprehensive error handling
- ✅ Auto token refresh
- ✅ Type-safe API calls

### Areas for Improvement
- ⚠️ Some mock data still in codebase
- ⚠️ Some components could be further modularized
- ⚠️ Error messages could be more user-friendly
- ⚠️ Loading states could be more consistent

---

**📅 Tài liệu được tạo**: [Ngày hiện tại]
**🔄 Cập nhật lần cuối**: [Ngày hiện tại]

---

*Tài liệu này cung cấp cái nhìn tổng quan về toàn bộ dự án. Để biết chi tiết về cách làm việc, xem `PROJECT_GUIDE.md`*

