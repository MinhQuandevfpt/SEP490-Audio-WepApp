# Cấu Trúc Dự Án SEP490-Audio-WebApp

## 📋 Tổng Quan Dự Án

**SEP490-Audio-WebApp** là một ứng dụng e-commerce chuyên về thiết bị âm thanh (Audio Equipment) được xây dựng với:
- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **UI Library:** Ant Design 5 + Tailwind CSS
- **3D Graphics:** React Three Fiber + Three.js
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router DOM v7
- **Backend API:** RESTful API (Railway.app)

## 🏗️ Kiến Trúc Tổng Thể

Dự án được tổ chức theo mô hình **Feature-Based Architecture** kết hợp với **Layered Architecture**, chia thành các module theo vai trò người dùng và chức năng.

```
SEP490-Audio-WebApp/
├── public/              # Static assets
├── src/                 # Source code chính
│   ├── pages/          # Pages theo user role
│   ├── components/     # Reusable components
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── contexts/       # React contexts
│   ├── routes/         # Route configuration
│   ├── config/         # Configuration files
│   └── data/           # Mock/static data
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## 📁 Cấu Trúc Chi Tiết

### 1. **src/pages/** - Pages theo User Role

Tổ chức theo **role-based structure**, mỗi role có folder riêng:

#### 1.1. **Customer/** (24 files)
**Mục đích:** Trang dành cho khách hàng mua hàng

**Cấu trúc:**
```
Customer/
├── 3DTrialRoom/        # Phòng thử 3D với spatial audio
├── AllProducts/         # Danh sách tất cả sản phẩm
├── Cart/                # Giỏ hàng
├── CheckoutOrder/       # Thanh toán đơn hàng
├── FlashSaleDetail/     # Chi tiết flash sale
├── Login/               # Đăng nhập
├── OrderHistory/        # Lịch sử đơn hàng
├── PaymentFail/         # Thanh toán thất bại
├── PaymentSuccess/      # Thanh toán thành công
├── PreCheckoutV2/       # Pre-checkout (chọn voucher, shipping)
├── ProductDetail/       # Chi tiết sản phẩm
├── ProductList/         # Danh sách sản phẩm (có filter)
├── Profile/             # Hồ sơ khách hàng
├── Register/            # Đăng ký
├── ResetPassword/       # Đặt lại mật khẩu
├── ReturnHistory/       # Lịch sử trả hàng
├── ReviewFolder/        # Đánh giá sản phẩm
├── SearchResult/        # Kết quả tìm kiếm
├── ShoppingCart_ver2/   # Giỏ hàng version 2
├── StorePage/           # Trang cửa hàng
├── VerifyRegisterAccount/ # Xác thực tài khoản
└── Warranty/            # Bảo hành
```

**Đặc điểm:**
- Mỗi folder có `index.ts` để export
- Có thể có README.md cho documentation
- Tách biệt logic theo feature

#### 1.2. **Seller/** (32 files)
**Mục đích:** Trang dành cho chủ cửa hàng (store owner)

**Cấu trúc:**
```
Seller/
├── AddNewProduct/       # Tạo sản phẩm mới
├── Campaign/            # Quản lý chiến dịch
├── CreateStaff/        # Tạo nhân viên
├── Dashboard/          # Dashboard chủ cửa hàng
│   ├── DashboardHome.tsx
│   ├── ProductManagement.tsx
│   ├── StoreProfile.tsx
│   ├── PayoutRevenue.tsx
│   └── PayoutRevenueDetail.tsx
├── Finance/            # Tài chính
├── KycStatus/          # Trạng thái KYC
├── Login/              # Đăng nhập seller
├── Messages/            # Tin nhắn
├── NotificationFolder/  # Thông báo
├── Onboarding/         # Onboarding
├── OrderManagement/    # Quản lý đơn hàng
├── Register/           # Đăng ký seller
├── ReplyPeview/        # Trả lời đánh giá
├── ReturnManagement/   # Quản lý trả hàng
├── RiskWarningFol/     # Cảnh báo rủi ro
├── SetupStore/         # Thiết lập cửa hàng
├── ShopWideVoucher/    # Voucher toàn cửa hàng
├── StaffList/          # Danh sách nhân viên
├── StoreAddress/       # Địa chỉ cửa hàng
├── StorePayoutVersion2/ # Thanh toán version 2
├── UpdateProduct/      # Cập nhật sản phẩm
├── Voucher/            # Quản lý voucher
└── Warranty/           # Bảo hành
```

**Đặc điểm:**
- Dashboard phức tạp với nhiều tính năng
- Quản lý sản phẩm, đơn hàng, tài chính
- Hệ thống KYC và risk warning

#### 1.3. **Admin/** (31 files)
**Mục đích:** Trang dành cho admin quản lý platform

**Cấu trúc:**
```
Admin/
├── BannerManagement/    # Quản lý banner
├── CampaignManagement/ # Quản lý chiến dịch
├── CampaignProductApproval/ # Duyệt sản phẩm chiến dịch
├── Categories/          # Quản lý danh mục
├── CategoryDetail/      # Chi tiết danh mục
├── Dashboard/           # Dashboard admin
├── Finance/             # Tài chính (withdraw requests)
├── FlatStaffManagement/ # Quản lý nhân viên platform
├── GhnOrderStatus/      # Trạng thái đơn GHN
├── KycManagement/       # Quản lý KYC
├── Login/              # Đăng nhập admin/flatstaff
├── PayoutManagement/   # Quản lý thanh toán
├── PlatformFeeManagement/ # Quản lý phí nền tảng
├── PlatformWallet/     # Ví nền tảng
├── PolicyManagement/   # Quản lý chính sách
├── ProductManagement/  # Quản lý sản phẩm
├── ReturnDisputes/     # Tranh chấp trả hàng
├── SettlementStatistics/ # Thống kê thanh toán
├── StoreManagement/     # Quản lý cửa hàng
├── UserDetailandUpdate/ # Chi tiết và cập nhật user
└── UserManagement/     # Quản lý người dùng
```

**Đặc điểm:**
- Quản lý toàn bộ platform
- Approval workflows (KYC, products, campaigns)
- Financial management
- Analytics và statistics

#### 1.4. **StoreStaff/** (4 files)
**Mục đích:** Trang dành cho nhân viên cửa hàng

**Cấu trúc:**
```
StoreStaff/
├── Dashboard/          # Dashboard nhân viên
├── Order/              # Quản lý đơn hàng
├── LoginForStaff.tsx  # Đăng nhập
└── RegisterForStaff.tsx # Đăng ký
```

**Đặc điểm:**
- Quyền hạn hạn chế hơn seller
- Chỉ quản lý đơn hàng

#### 1.5. **Shared Pages**
```
HomePage/              # Trang chủ
OAuth2Callback/       # OAuth2 callback handler
OAuth2Success/        # OAuth2 success handler
PoliciesPage/         # Trang chính sách
```

### 2. **src/components/** - Reusable Components

Tổ chức theo **feature-based** và **role-based**:

#### 2.1. **Layout Components**
```
Layout/                # Layout chung cho customer
SellerLayout/          # Layout cho seller
SellerDashboardLayout/ # Dashboard layout cho seller
AdminLayout/          # Layout cho admin
StaffDashboardLayout/  # Layout cho staff
AuthLayout/           # Layout cho auth pages
```

#### 2.2. **Role-Specific Components**
```
AdminComponents/      # Components cho admin
StoreOwnerOrderManagementComponents/ # Quản lý đơn hàng seller
StoreOwnerVoucherComponents/ # Voucher seller
StoreOwnerWarrantyComponents/ # Bảo hành seller
StaffOrderComponents/ # Đơn hàng staff
CustomerReviewProductComponents/ # Đánh giá sản phẩm
CustomerWalletComponents/ # Ví khách hàng
```

#### 2.3. **Feature Components**
```
ProductCard/          # Card sản phẩm
ProductDetailComponents/ # Chi tiết sản phẩm
ProductListComponents/ # Danh sách sản phẩm
ShoppingCartComponents/ # Giỏ hàng
CheckoutOrderComponents/ # Thanh toán
OrderHistoryComponents/ # Lịch sử đơn hàng
PreCheckoutV2Component/ # Pre-checkout
ProfilePageComponents/ # Hồ sơ
Design3DroomComponents/ # Phòng 3D và spatial audio
```

#### 2.4. **Common Components**
```
common/              # Components dùng chung
  ├── AuthStatus.tsx
  ├── BankSelector/
  ├── FirebaseMessagingProvider.tsx
  ├── GoogleLoginButton.tsx
  ├── ImageWithFallback.tsx
  ├── InputField.tsx
  ├── LoadingSkeleton.tsx
  ├── MessageBlockedModal.tsx
  ├── SocialLoginButton.tsx
  ├── TinyMCEEditor.tsx
  └── Toast.tsx
```

#### 2.5. **UI Components**
```
Header/              # Header navigation
Footer/              # Footer
BannerSlider/        # Banner slider
FlashSale/           # Flash sale
FeaturedBrands/      # Thương hiệu nổi bật
TopDeals/            # Deal tốt nhất
NearbyProducts/      # Sản phẩm gần đây
ProductSuggestions/  # Gợi ý sản phẩm
```

#### 2.6. **Specialized Components**
```
AIChatbot/           # AI chatbot
ChatAgent/           # Chat agent
ErrorBoundary.tsx    # Error boundary
ProtectedRoute.tsx   # Protected route wrapper
```

### 3. **src/services/** - API Services Layer

Tổ chức theo **role-based** và **feature-based**:

#### 3.1. **Core Services**
```
HttpInterceptor.ts          # HTTP interceptor với auto token refresh
RefreshTokenService.ts      # Quản lý refresh token
FileUploadService.ts        # Upload file
DeviceTokenService.ts       # Device token cho push notification
FirebaseMessagingService.ts # Firebase Cloud Messaging
FirebaseRealtimeChatService.ts # Firebase Realtime Database chat
FirestoreChatService.ts     # Firestore chat
```

#### 3.2. **Role-Based Services**

**Customer Services** (`services/customer/`):
```
Authcustomer.ts            # Authentication
ProductListService.ts      # Danh sách sản phẩm
ProductViewService.ts      # Xem sản phẩm
CartService.ts            # Giỏ hàng
CheckoutService.ts        # Thanh toán
OrderHistoryService.ts    # Lịch sử đơn hàng
ShippingService.ts        # Vận chuyển
ProductVoucherService.ts  # Voucher sản phẩm
AddressService.ts         # Địa chỉ
Profilecustomer.ts        # Hồ sơ
WalletService.ts          # Ví
NotificationService.ts    # Thông báo
ReviewService.ts          # Đánh giá
ReturnHistoryService.ts   # Trả hàng
WarrantyService.ts        # Bảo hành
ChatService.ts            # Chat
SearchService.ts          # Tìm kiếm
FlashSaleService.ts       # Flash sale
CategoryService.ts        # Danh mục
CustomerBannerService.ts  # Banner
ReturnPackingService.ts   # Đóng gói trả hàng
ProductReviewService.ts   # Đánh giá sản phẩm
StoreService.ts           # Cửa hàng
```

**Seller Services** (`services/seller/`):
```
AuthSeller.ts             # Authentication
StoreService.ts           # Quản lý cửa hàng
ProductService.ts         # Quản lý sản phẩm
OrderService.ts           # Quản lý đơn hàng
StoreReturnService.ts     # Trả hàng
GhnService.ts             # GHN shipping
DashboardService.ts       # Dashboard
FinanceService.ts         # Tài chính
PayoutRevenueService.ts   # Doanh thu
VoucherService.ts         # Voucher
CampaignService.ts        # Chiến dịch
CategoryService.ts        # Danh mục
KycService.ts             # KYC
StaffService.ts           # Nhân viên
StoreAddressService.ts    # Địa chỉ cửa hàng
ShippingService.ts        # Vận chuyển
ReviewService.ts          # Đánh giá
WarrantyService.ts        # Bảo hành
ChatService.ts            # Chat
NotificationService.ts    # Thông báo
ShopStatsService.ts       # Thống kê cửa hàng
```

**Admin Services** (`services/admin/`):
```
AdminAuthService.ts       # Authentication
AdminUserService.ts       # Quản lý user
AdminStoreService.ts      # Quản lý cửa hàng
AdminProductService.ts    # Quản lý sản phẩm
AdminKycService.ts        # Quản lý KYC
AdminCategoryService.ts   # Quản lý danh mục
CampaignService.ts        # Chiến dịch
CampaignProductService.ts # Sản phẩm chiến dịch
AdminBannerService.ts     # Banner
PolicyService.ts          # Chính sách
AdminPayoutService.ts     # Thanh toán
PlatformWalletService.ts  # Ví nền tảng
PlatformWalletOverviewService.ts # Tổng quan ví
AdminPlatformFeeService.ts # Phí nền tảng
SettlementService.ts      # Thanh toán
AdminDashboardService.ts # Dashboard
AdminReturnService.ts     # Trả hàng
AdminGhnOrderService.ts   # GHN orders
FlatStaffAuthService.ts   # FlatStaff auth
AdminFlatStaffService.ts  # Quản lý FlatStaff
```

**Staff Services** (`services/staff/`):
```
AuthStaff.ts              # Authentication
OrdersService.ts          # Quản lý đơn hàng
```

#### 3.3. **Specialized Services**
```
audio/
  └── AudioService.ts     # Audio processing với EQ và effects

ai/
  ├── AIChatService.ts    # AI chat
  └── AIProductSearchService.ts # AI product search

cache/
  └── ProfileCache.ts    # Cache profile data
```

### 4. **src/hooks/** - Custom React Hooks

Tổ chức theo **feature-based**:

#### 4.1. **Data Fetching Hooks**
```
useProductList.ts         # Danh sách sản phẩm
useProductReviews.ts     # Đánh giá sản phẩm
useCategories.ts          # Danh mục
useCart.ts                # Giỏ hàng
useCheckout.ts            # Thanh toán
useOrderHistory.ts        # (đã xóa, logic đã migrate)
useStoreOrders.ts         # Đơn hàng seller
useStoreReturns.ts        # Trả hàng seller
useCustomerReturns.ts    # Trả hàng customer
useWalletInfo.ts          # Thông tin ví
useWalletTransactions.ts  # Giao dịch ví
useUsers.ts               # Quản lý user (admin)
useFinance.ts             # Tài chính
useWithdrawRequests.ts    # Yêu cầu rút tiền
useAdminWithdrawRequests.ts # Admin withdraw requests
useAdminReturnDisputes.ts # Tranh chấp trả hàng (admin)
```

#### 4.2. **Location Hooks**
```
useProvinces.ts           # Tỉnh/thành
useDistricts.ts           # Quận/huyện
useWards.ts               # Phường/xã
```

#### 4.3. **Polling & Refresh Hooks**
```
usePolling.ts             # Polling cơ bản
useSmartPolling.ts        # Polling thông minh
useAutoRefresh.ts         # Auto refresh
useSequentialRefresh.ts   # Sequential refresh
```

#### 4.4. **Feature-Specific Hooks**
```
useSellerProducts.ts      # Sản phẩm seller
useSellerReviews.ts       # Đánh giá seller
useSellerNotifications.ts # Thông báo seller
useStaffAuth.ts           # Auth staff
useStaffList.ts           # Danh sách staff
useStoreAddresses.ts      # Địa chỉ cửa hàng
useProductCompare.ts      # So sánh sản phẩm
useProfileData.ts         # Dữ liệu profile
useServiceTypeCalculator.ts # Tính toán loại dịch vụ
useAutoShippingFee.ts     # Tự động tính phí ship
usePolicyCategories.ts    # Danh mục chính sách
usePolicyItems.ts         # Mục chính sách
```

#### 4.5. **Firebase Hooks**
```
useFirebaseMessaging.ts   # Firebase Cloud Messaging
```

### 5. **src/types/** - TypeScript Type Definitions

Tổ chức theo **domain-based**:

```
api.ts                    # API response types (chung)
seller.ts                 # Seller-specific types
admin.ts                  # Admin-specific types
admin-dashboard.ts        # Admin dashboard types
flatstaff.ts              # FlatStaff types
cart.ts                   # Cart types
dashboard.ts              # Dashboard types
flashsale.ts              # Flash sale types
platform-wallet.ts        # Platform wallet types
policy.ts                 # Policy types
productList.ts            # Product list types
```

**Đặc điểm:**
- `api.ts`: Types chung cho API responses
- Mỗi domain có file types riêng
- Sử dụng interfaces và types

### 6. **src/utils/** - Utility Functions

Tổ chức theo **chức năng**:

```
authHelper.ts             # Authentication helpers
errorTranslation.ts       # Dịch lỗi
notification.ts           # Notification utilities
notificationSound.ts      # Phát âm thanh thông báo
orderStatus.ts            # Xử lý trạng thái đơn hàng
storeOrderStatus.ts       # Trạng thái đơn hàng seller
permissionHelper.ts       # Permission checking
productPriceCalculator.ts # Tính giá sản phẩm
campaignValidation.ts     # Validation chiến dịch
messageFilter.ts          # Lọc tin nhắn
statusCodes.ts            # HTTP status codes
registerServiceWorker.ts  # Service worker registration
index.ts                  # Export utilities
```

### 7. **src/contexts/** - React Contexts

```
CartContext.tsx           # Context cho giỏ hàng
ChatContext.tsx           # Context cho chat
LanguageContext.tsx       # Context cho ngôn ngữ
StaffAuthContext.tsx      # Context cho staff auth
```

### 8. **src/routes/** - Route Configuration

```
index.tsx                 # Route definitions với protected routes
```

**Đặc điểm:**
- Sử dụng `createBrowserRouter`
- Protected routes cho từng role
- Nested routes với layouts

### 9. **src/config/** - Configuration

```
firebase.ts               # Firebase configuration
```

### 10. **src/data/** - Static/Mock Data

```
banners.ts               # Banner data
brands.ts                # Brand data
checkout.ts              # Checkout data
datafor3droom.ts         # 3D room data
orderHistory.ts          # Order history mock
productdetail.ts         # Product detail mock
productListData.ts       # Product list mock
products.ts              # Products mock
profiledata.ts           # Profile mock
shoppingcart.ts          # Shopping cart mock
vietnamBanks.ts          # Vietnam banks list
```

**Lưu ý:** Một số file này có thể là mock data hoặc fallback data.

## 🔄 Data Flow Architecture

### Request Flow

```
User Action
  ↓
Component (Page/Component)
  ↓
Custom Hook (useXXX)
  ↓
Service (XXXService)
  ↓
HttpInterceptor
  ↓
API Backend
  ↓
Response
  ↓
Service (parse response)
  ↓
Hook (update state)
  ↓
Component (re-render)
```

### Authentication Flow

```
Login
  ↓
AuthService.login()
  ↓
Store tokens (RefreshTokenService)
  ↓
HttpInterceptor (auto add token)
  ↓
401 Error → Auto refresh token
  ↓
Retry request
```

### State Management

1. **Local State:** `useState` cho UI state
2. **Server State:** React Query cho API data
3. **Global State:** Context API (Cart, Chat, Language)
4. **URL State:** React Router (query params, path params)

## 🎨 Styling Architecture

### CSS Framework
- **Tailwind CSS:** Utility-first CSS
- **Ant Design:** Component library với custom theme
- **CSS Modules:** (nếu có, trong một số components)

### Theme Configuration
- `tailwind.config.ts`: Tailwind configuration
- Ant Design theme: Custom colors (orange #FF6A00)

## 🔐 Security Architecture

### Authentication
- **Multi-role:** Customer, Seller, Staff, Admin, FlatStaff
- **Token-based:** Access token + Refresh token
- **Auto-refresh:** HttpInterceptor tự động refresh khi 401
- **Role-based routes:** Protected routes theo role

### Authorization
- **Permission-based:** `permissionHelper.ts`
- **Route protection:** ProtectedRoute components
- **API-level:** Backend validation

## 📦 Build & Deployment

### Build Configuration
- **Vite:** Build tool
- **TypeScript:** Type checking
- **ESLint:** Code linting
- **PostCSS:** CSS processing

### Environment Variables
- `VITE_API_BASE_URL`: API base URL
- Default: `https://audioe-commerce-production.up.railway.app`

### Deployment
- **Vercel:** `vercel.json` configuration
- **Production:** Railway.app backend

## 🧩 Design Patterns

### 1. **Service Layer Pattern**
- Tách biệt API calls vào services
- Mỗi service class có methods static
- Consistent error handling

### 2. **Custom Hooks Pattern**
- Encapsulate data fetching logic
- Reusable across components
- Consistent state management

### 3. **Component Composition**
- Small, focused components
- Composition over inheritance
- Props drilling minimized với Context

### 4. **Protected Route Pattern**
- Wrapper components cho route protection
- Role-based access control
- Automatic redirect on unauthorized

### 5. **Error Boundary Pattern**
- `ErrorBoundary.tsx` để catch errors
- Graceful error handling

## 📊 Code Organization Principles

### 1. **Separation of Concerns**
- **Pages:** Route-level components
- **Components:** Reusable UI components
- **Services:** API communication
- **Hooks:** Business logic
- **Utils:** Pure functions

### 2. **Feature-Based Organization**
- Components và pages được nhóm theo feature
- Mỗi feature có folder riêng
- Dễ maintain và scale

### 3. **Role-Based Organization**
- Services, pages, components được tách theo role
- Clear separation giữa Customer, Seller, Admin, Staff

### 4. **Type Safety**
- TypeScript cho type safety
- Types được định nghĩa rõ ràng
- API responses có types

## 🚀 Development Workflow

### Scripts
```json
{
  "dev": "vite",           // Development server
  "build": "tsc -b && vite build", // Production build
  "lint": "eslint .",      // Lint code
  "preview": "vite preview" // Preview production build
}
```

### Development Server
- Port: `5173`
- Proxy: `/api` → `http://localhost:8080`
- HMR: Hot Module Replacement enabled

## 📝 Naming Conventions

### Files
- **Components:** PascalCase (e.g., `ProductCard.tsx`)
- **Services:** PascalCase với suffix "Service" (e.g., `ProductService.ts`)
- **Hooks:** camelCase với prefix "use" (e.g., `useProductList.ts`)
- **Utils:** camelCase (e.g., `authHelper.ts`)
- **Types:** camelCase (e.g., `api.ts`, `seller.ts`)

### Folders
- **Pages:** PascalCase (e.g., `ProductDetail/`)
- **Components:** PascalCase (e.g., `ProductCard/`)
- **Services:** camelCase (e.g., `customer/`, `seller/`)

## 🔍 Key Features

### 1. **Multi-Role System**
- Customer, Seller, Staff, Admin, FlatStaff
- Mỗi role có routes, components, services riêng

### 2. **3D Room Design**
- React Three Fiber + Three.js
- Spatial audio simulation
- Real-time audio processing

### 3. **Real-time Features**
- Firebase Cloud Messaging (push notifications)
- Firebase Realtime Database (chat)
- Polling mechanisms

### 4. **E-commerce Features**
- Product management
- Shopping cart
- Checkout với multiple payment methods
- Order management
- Return/refund system
- Voucher system
- Flash sale
- Campaign management

### 5. **Financial System**
- Wallet management
- Payout system
- Platform fee calculation
- Settlement statistics

### 6. **Admin Features**
- User management
- Store management
- KYC approval
- Product approval
- Campaign approval
- Financial oversight

## 🎯 Best Practices

1. **Type Safety:** Luôn sử dụng TypeScript types
2. **Error Handling:** Consistent error handling qua HttpInterceptor
3. **Code Reusability:** Custom hooks và services để tái sử dụng
4. **Performance:** React Query cho caching và optimization
5. **Security:** Token-based auth với auto-refresh
6. **Scalability:** Feature-based organization dễ scale

## 📚 Dependencies Chính

### Core
- `react`: ^19.2.1
- `react-dom`: ^19.2.1
- `react-router-dom`: ^7.9.3
- `typescript`: ~5.8.3

### UI
- `antd`: ^5.29.1
- `@ant-design/icons`: ^6.1.0
- `lucide-react`: ^0.544.0
- `tailwindcss`: ^3.4.17

### 3D Graphics
- `@react-three/fiber`: ^9.4.0
- `@react-three/drei`: ^10.7.6
- `three`: ^0.180.0

### State Management
- `@tanstack/react-query`: ^5.90.12

### Utilities
- `dayjs`: ^1.11.19
- `react-toastify`: ^10.0.6
- `recharts`: ^3.6.0

### Firebase
- `firebase`: ^12.6.0

### Build Tools
- `vite`: ^7.1.7
- `@vitejs/plugin-react`: ^5.0.3

## 🎓 Kết Luận

Dự án **SEP490-Audio-WebApp** được tổ chức theo kiến trúc **Feature-Based + Role-Based**, với:
- **Clear separation** giữa các layers
- **Reusable components** và services
- **Type-safe** với TypeScript
- **Scalable** structure
- **Maintainable** code organization

Cấu trúc này cho phép:
- Dễ dàng thêm features mới
- Maintain code dễ dàng
- Team collaboration hiệu quả
- Scale application khi cần

