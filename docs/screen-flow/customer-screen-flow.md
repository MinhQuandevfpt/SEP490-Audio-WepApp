# Customer Screen Flow - SEP490 Audio WebApp

## Tổng quan

Tài liệu này mô tả tất cả các màn hình của role **Customer** và cách chúng kết nối với nhau trong ứng dụng SEP490 Audio WebApp.

**Tổng số màn hình:** 17 màn hình chính + 9 sub-tabs trong Profile

---

## Bảng tổng hợp màn hình

| Feature | Screen | Description |
|---------|--------|-------------|
| **Authentication & Onboarding** | Login Page | Đăng nhập với email/password hoặc Google OAuth |
| | Register Page | Đăng ký tài khoản customer mới |
| **Home & Discovery** | HomePage | Trang chủ với banner slider, flash sale, và sản phẩm gợi ý |
| | Product List Page | Danh sách sản phẩm với filter, sort, pagination, và compare |
| | Product Detail Page | Chi tiết sản phẩm với images, specs, vouchers, reviews |
| | Store Page | Trang cửa hàng với thông tin store và danh sách sản phẩm |
| **Shopping & Checkout** | Shopping Cart | Giỏ hàng với danh sách sản phẩm, voucher, shipping fee calculation |
| | Checkout Order Page | Trang thanh toán với địa chỉ, phương thức thanh toán, tóm tắt đơn hàng |
| | Flash Sale Detail | Chi tiết flash sale với các khung giờ và sản phẩm |
| **Order Management** | Order History Page | Lịch sử đơn hàng với filter theo status, search, pagination |
| | Order Detail Page | Chi tiết đơn hàng với thông tin vận chuyển, thanh toán, items |
| | Return History Page | Lịch sử hoàn trả với thông tin gói hàng và phí vận chuyển |
| **Account & Profile** | Profile Page - Info | Xem và chỉnh sửa thông tin cá nhân |
| | Profile Page - Addresses | Quản lý địa chỉ giao hàng |
| | Profile Page - Orders | Xem lịch sử đơn hàng (trong Profile) |
| | Profile Page - Warranty | Quản lý bảo hành sản phẩm (trong Profile) |
| | Profile Page - Reviews | Xem và chỉnh sửa đánh giá sản phẩm |
| | Profile Page - Returns | Xem lịch sử hoàn trả (hiển thị 1 return mới nhất) |
| | Profile Page - Wallet | Quản lý ví nền tảng, số dư, lịch sử giao dịch |
| | Profile Page - Notifications | Xem thông báo từ hệ thống |
| | Profile Page - Password | Đổi mật khẩu tài khoản |
| **Warranty** | Warranty Page | Quản lý bảo hành với danh sách warranty và logs |
| **Payment Results** | PayOS Success Page | Trang thông báo thanh toán PayOS thành công |
| | PayOS Fail Page | Trang thông báo thanh toán PayOS thất bại |
| **Special Features** | 3D Room Design | Thiết kế phòng 3D với loa, nội thất, và listener avatar |

---

## Danh sách màn hình

### 1. Authentication & Onboarding (2 màn hình)

#### 1.1. Login Page
- **Route:** `/auth/login`
- **File:** `src/pages/Customer/Login/Login.tsx`
- **Mô tả:** Màn hình đăng nhập với email/password hoặc Google OAuth
- **Navigation từ:**
  - Register Page (sau khi đăng ký thành công)
  - HomePage (khi chưa đăng nhập)
  - Bất kỳ trang nào yêu cầu authentication
- **Navigation đến:**
  - HomePage (sau khi đăng nhập thành công)
  - Register Page (link "Đăng ký")
  - Trang trước đó (nếu có `redirectAfterLogin` trong localStorage)

#### 1.2. Register Page
- **Route:** `/auth/register`
- **File:** `src/pages/Customer/Register/Register.tsx`
- **Mô tả:** Màn hình đăng ký tài khoản mới
- **Navigation từ:**
  - Login Page (link "Đăng ký")
- **Navigation đến:**
  - Login Page (sau khi đăng ký thành công, tự động redirect sau 3 giây)

---

### 2. Home & Discovery (4 màn hình)

#### 2.1. HomePage
- **Route:** `/`
- **File:** `src/pages/HomePage/HomePage.tsx`
- **Mô tả:** Trang chủ với banner slider, flash sale, và sản phẩm gợi ý
- **Navigation từ:**
  - Login Page (sau khi đăng nhập)
  - PayOSSuccess (button "Về trang chủ")
  - PayOSFail (button "Về trang chủ")
  - Bất kỳ trang nào (Header logo)
- **Navigation đến:**
  - ProductListPage (từ sidebar categories, search bar)
  - ProductDetail (click vào sản phẩm)
  - FlashSaleDetail (click vào flash sale)
  - StorePage (click vào tên cửa hàng)
  - ShoppingCart (Header cart icon)
  - Profile (Header user icon)
  - Login Page (nếu chưa đăng nhập)

#### 2.2. Product List Page
- **Route:** `/products`
- **File:** `src/pages/Customer/ProductList/ProductListPage.tsx`
- **Mô tả:** Danh sách sản phẩm với filter, sort, pagination, và compare
- **Navigation từ:**
  - HomePage (sidebar categories, search bar)
  - StorePage (xem tất cả sản phẩm của cửa hàng)
- **Navigation đến:**
  - ProductDetail (click vào sản phẩm)
  - StorePage (click vào tên cửa hàng)
  - ShoppingCart (thêm vào giỏ hàng)

#### 2.3. Product Detail Page
- **Route:** `/product/:id`
- **File:** `src/pages/Customer/ProductDetail/ProductDetail.tsx`
- **Mô tả:** Chi tiết sản phẩm với images, specs, vouchers, reviews
- **Navigation từ:**
  - HomePage (click vào sản phẩm)
  - ProductListPage (click vào sản phẩm)
  - StorePage (click vào sản phẩm)
  - FlashSaleDetail (click vào sản phẩm)
  - OrderDetailPage (click vào sản phẩm trong đơn hàng)
- **Navigation đến:**
  - ShoppingCart (button "Thêm vào giỏ hàng")
  - StorePage (click vào tên cửa hàng)
  - CheckoutOrderPage (button "Mua ngay")
  - ProductListPage (breadcrumb, back button)

#### 2.4. Store Page
- **Route:** `/store/:storeId`
- **File:** `src/pages/Customer/StorePage/StorePage.tsx`
- **Mô tả:** Trang cửa hàng với thông tin store và danh sách sản phẩm
- **Navigation từ:**
  - HomePage (click vào tên cửa hàng)
  - ProductDetail (click vào tên cửa hàng)
  - ProductListPage (click vào tên cửa hàng)
- **Navigation đến:**
  - ProductDetail (click vào sản phẩm)
  - ProductListPage (xem tất cả sản phẩm)
  - Login Page (nếu chưa đăng nhập và muốn chat với store)

---

### 3. Shopping & Checkout (3 màn hình)

#### 3.1. Shopping Cart
- **Route:** `/cart`
- **File:** `src/pages/Customer/Cart/ShoppingCart.tsx`
- **Mô tả:** Giỏ hàng với danh sách sản phẩm, voucher, shipping fee calculation
- **Navigation từ:**
  - HomePage (Header cart icon)
  - ProductDetail (button "Thêm vào giỏ hàng")
  - PayOSFail (button "Thử lại thanh toán")
- **Navigation đến:**
  - CheckoutOrderPage (button "Thanh toán")
  - ProductDetail (click vào sản phẩm để xem chi tiết)
  - HomePage (button "Tiếp tục mua sắm")

#### 3.2. Checkout Order Page
- **Route:** `/checkout`
- **File:** `src/pages/Customer/CheckoutOrder/CheckoutOrderPage.tsx`
- **Mô tả:** Trang thanh toán với địa chỉ, phương thức thanh toán, tóm tắt đơn hàng
- **Navigation từ:**
  - ShoppingCart (button "Thanh toán")
  - ProductDetail (button "Mua ngay")
- **Navigation đến:**
  - PayOSSuccess (nếu thanh toán PayOS thành công)
  - PayOSFail (nếu thanh toán PayOS thất bại)
  - OrderHistoryPage (nếu thanh toán COD thành công)
  - ShoppingCart (back button)

#### 3.3. Flash Sale Detail
- **Route:** `/flash-sale/:campaignId`
- **File:** `src/pages/Customer/FlashSaleDetail/FlashSaleDetail.tsx`
- **Mô tả:** Chi tiết flash sale với các khung giờ và sản phẩm
- **Navigation từ:**
  - HomePage (click vào flash sale banner)
- **Navigation đến:**
  - ProductDetail (click vào sản phẩm trong flash sale)

---

### 4. Order Management (3 màn hình)

#### 4.1. Order History Page
- **Route:** `/orders`
- **File:** `src/pages/Customer/OrderHistory/OrderHistoryPage.tsx`
- **Mô tả:** Lịch sử đơn hàng với filter theo status, search, pagination
- **Navigation từ:**
  - Profile Page (tab "Đơn hàng")
  - PayOSSuccess (button "Xem đơn hàng")
  - CheckoutOrderPage (sau khi đặt hàng COD thành công)
- **Navigation đến:**
  - OrderDetailPage (click vào đơn hàng)
  - Profile Page (breadcrumb)

#### 4.2. Order Detail Page
- **Route:** `/orders/:orderId`
- **File:** `src/pages/Customer/OrderHistory/OrderDetailPage.tsx`
- **Mô tả:** Chi tiết đơn hàng với thông tin vận chuyển, thanh toán, items
- **Navigation từ:**
  - OrderHistoryPage (click vào đơn hàng)
  - Profile Page (tab "Đơn hàng" → click vào đơn hàng)
- **Navigation đến:**
  - OrderHistoryPage (button "Quay lại danh sách đơn hàng")
  - ReturnHistoryPage (button "Yêu cầu hoàn trả")
  - ProductDetail (click vào sản phẩm trong đơn hàng)

#### 4.3. Return History Page
- **Route:** `/returns`
- **File:** `src/pages/Customer/ReturnHistory/ReturnHistoryPage.tsx`
- **Mô tả:** Lịch sử hoàn trả với thông tin gói hàng và phí vận chuyển
- **Navigation từ:**
  - Profile Page (tab "Lịch sử hoàn trả" hoặc button "Xem đầy đủ")
  - OrderDetailPage (button "Yêu cầu hoàn trả")
- **Navigation đến:**
  - Profile Page (breadcrumb)
  - OrderDetailPage (click vào đơn hàng liên quan)

---

### 5. Account & Profile (1 màn hình chính + 9 sub-tabs)

#### 5.1. Profile Page
- **Route:** `/account` (với các sub-routes)
- **File:** `src/pages/Customer/Profile/Profile.tsx`
- **Mô tả:** Trang tài khoản với navigation sidebar và các tabs

**Sub-tabs:**

##### 5.1.1. Thông tin cá nhân (Info)
- **Route:** `/account` (default)
- **Tab key:** `info`
- **Component:** `UserInfoCard`
- **Mô tả:** Xem và chỉnh sửa thông tin cá nhân

##### 5.1.2. Sổ địa chỉ (Addresses)
- **Route:** `/account` (tab)
- **Tab key:** `addresses`
- **Component:** `AddressBook`
- **Mô tả:** Quản lý địa chỉ giao hàng

##### 5.1.3. Đơn hàng (Orders)
- **Route:** `/account` (tab)
- **Tab key:** `orders`
- **Component:** `OrderHistory`
- **Mô tả:** Xem lịch sử đơn hàng (tương tự OrderHistoryPage nhưng trong Profile)

##### 5.1.4. Bảo hành (Warranty)
- **Route:** `/account` (tab) hoặc `/warranty`
- **Tab key:** `warranty`
- **Component:** `WarrantyComponent`
- **Mô tả:** Quản lý bảo hành sản phẩm

##### 5.1.5. Đánh giá sản phẩm (Reviews)
- **Route:** `/account/reviews` hoặc `/account` (tab)
- **Tab key:** `reviews`
- **Component:** `ReviewProductPage`
- **Mô tả:** Xem và chỉnh sửa đánh giá sản phẩm

##### 5.1.6. Lịch sử hoàn trả (Returns)
- **Route:** `/account` (tab)
- **Tab key:** `returns`
- **Component:** `ReturnHistoryCard`
- **Mô tả:** Xem lịch sử hoàn trả (hiển thị 1 return mới nhất, có link đến ReturnHistoryPage)

##### 5.1.7. Ví nền tảng (Wallet)
- **Route:** `/account/wallet` hoặc `/account` (tab)
- **Tab key:** `wallet`
- **Component:** `WalletPage`
- **Mô tả:** Quản lý ví nền tảng, số dư, lịch sử giao dịch

##### 5.1.8. Thông báo (Notifications)
- **Route:** `/account/notifications` hoặc `/account` (tab)
- **Tab key:** `notifications`
- **Component:** `NotificationPage`
- **Mô tả:** Xem thông báo từ hệ thống

##### 5.1.9. Đổi mật khẩu (Password)
- **Route:** `/account` (tab)
- **Tab key:** `password`
- **Component:** `ChangePassword`
- **Mô tả:** Đổi mật khẩu tài khoản

**Navigation từ:**
- HomePage (Header user icon)
- Bất kỳ trang nào (Header user icon)
- WarrantyPage (button "Quay lại tài khoản")

**Navigation đến:**
- OrderHistoryPage (từ tab "Đơn hàng" → click "Xem tất cả")
- ReturnHistoryPage (từ tab "Lịch sử hoàn trả" → button "Xem đầy đủ")
- WarrantyPage (từ tab "Bảo hành" hoặc route `/warranty`)

---

### 6. Warranty (1 màn hình)

#### 6.1. Warranty Page
- **Route:** `/warranty`
- **File:** `src/pages/Customer/Warranty/WarrantyPage.tsx`
- **Mô tả:** Quản lý bảo hành với danh sách warranty và logs
- **Navigation từ:**
  - Profile Page (tab "Bảo hành")
- **Navigation đến:**
  - Profile Page (button "Quay lại tài khoản")

---

### 7. Payment Results (2 màn hình)

#### 7.1. PayOS Success Page
- **Route:** `/payment/success`
- **File:** `src/pages/Customer/PaymentSuccess/PayOSSuccess.tsx`
- **Mô tả:** Trang thông báo thanh toán PayOS thành công
- **Navigation từ:**
  - CheckoutOrderPage (sau khi thanh toán PayOS thành công - redirect từ PayOS)
- **Navigation đến:**
  - OrderHistoryPage (button "Xem đơn hàng")
  - HomePage (button "Về trang chủ")

#### 7.2. PayOS Fail Page
- **Route:** `/payment/fail`
- **File:** `src/pages/Customer/PaymentFail/PayOSFail.tsx`
- **Mô tả:** Trang thông báo thanh toán PayOS thất bại
- **Navigation từ:**
  - CheckoutOrderPage (sau khi thanh toán PayOS thất bại - redirect từ PayOS)
- **Navigation đến:**
  - ShoppingCart (button "Thử lại thanh toán")
  - HomePage (button "Về trang chủ")

---

### 8. Special Features (1 màn hình)

#### 8.1. 3D Room Design
- **Route:** `/3d-room`
- **File:** `src/pages/Customer/3DTrialRoom/3DRoom.tsx`
- **Mô tả:** Thiết kế phòng 3D với loa, nội thất, và listener avatar
- **Navigation từ:**
  - Header menu (nếu có link)
  - Direct URL
- **Navigation đến:**
  - HomePage (Header logo)

---

## Sơ đồ luồng điều hướng chính

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME PAGE (/)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Product  │  │  Store   │  │  Flash  │  │   Cart   │          │
│  │  List    │  │   Page   │  │  Sale   │  │          │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │            │             │             │                 │
│       └────────────┴─────────────┴────────────┘                 │
│                    │                                             │
│            ┌───────▼───────┐                                    │
│            │ Product Detail │                                    │
│            └───────┬───────┘                                    │
│                    │                                             │
│         ┌──────────┴──────────┐                                │
│         │                      │                                │
│    ┌────▼────┐          ┌──────▼─────┐                          │
│    │  Cart   │          │  Checkout  │                          │
│    └────┬────┘          └──────┬─────┘                          │
│         │                     │                                 │
│         └──────────┬──────────┘                                │
│                    │                                             │
│         ┌──────────▼──────────┐                                │
│         │   Checkout Order     │                                │
│         └──────┬───────────────┘                                │
│                │                                                 │
│    ┌───────────┴────────────┐                                  │
│    │                        │                                  │
│ ┌──▼──────┐         ┌────────▼──────┐                          │
│ │ PayOS   │         │   PayOS Fail  │                          │
│ │ Success │         └──────────────┘                          │
│ └────┬────┘                                                      │
│      │                                                           │
│      └──────────────┬──────────────────┐                       │
│                     │                  │                        │
│            ┌────────▼──────┐  ┌───────▼──────┐                │
│            │ Order History  │  │  Order Detail│                │
│            └────────┬───────┘  └───────┬──────┘                │
│                     │                  │                        │
│            ┌────────┴──────────────────┴────────┐            │
│            │                                       │            │
│     ┌──────▼──────┐                      ┌────────▼──────┐     │
│     │   Return    │                      │   Warranty    │     │
│     │   History   │                      │     Page      │     │
│     └─────────────┘                      └──────────────┘     │
│                                                                 │
│                         ┌──────────────┐                       │
│                         │   Profile    │                       │
│                         │    Page      │                       │
│                         │  (9 tabs)    │                       │
│                         └──────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Luồng mua hàng chính (Shopping Flow)

```
1. HomePage (/)
   ↓ (click sản phẩm)
2. ProductDetail (/product/:id)
   ↓ (click "Thêm vào giỏ hàng")
3. ShoppingCart (/cart)
   ↓ (click "Thanh toán")
4. CheckoutOrderPage (/checkout)
   ↓ (chọn phương thức thanh toán)
   ├─→ PayOS → PayOSSuccess (/payment/success) → OrderHistoryPage (/orders)
   └─→ COD → OrderHistoryPage (/orders)
```

---

## Luồng quản lý đơn hàng (Order Management Flow)

```
1. OrderHistoryPage (/orders)
   ↓ (click vào đơn hàng)
2. OrderDetailPage (/orders/:orderId)
   ↓ (có thể thực hiện các action)
   ├─→ ReturnHistoryPage (/returns) - Yêu cầu hoàn trả
   ├─→ ProductDetail (/product/:id) - Xem lại sản phẩm
   └─→ OrderHistoryPage (/orders) - Quay lại danh sách
```

---

## Luồng tài khoản (Account Flow)

```
1. Profile Page (/account)
   ├─→ Tab "Thông tin cá nhân" (info)
   ├─→ Tab "Sổ địa chỉ" (addresses)
   ├─→ Tab "Đơn hàng" (orders) → OrderHistoryPage (/orders)
   ├─→ Tab "Bảo hành" (warranty) → WarrantyPage (/warranty)
   ├─→ Tab "Đánh giá" (reviews) → ReviewProductPage
   ├─→ Tab "Lịch sử hoàn trả" (returns) → ReturnHistoryPage (/returns)
   ├─→ Tab "Ví nền tảng" (wallet) → WalletPage
   ├─→ Tab "Thông báo" (notifications) → NotificationPage
   └─→ Tab "Đổi mật khẩu" (password) → ChangePassword
```

---

## Protected Routes (Yêu cầu đăng nhập)

Các route sau yêu cầu authentication (sẽ redirect đến `/auth/login` nếu chưa đăng nhập):

- `/account` và tất cả sub-routes
- `/orders` và `/orders/:orderId`
- `/returns`
- `/warranty`
- `/checkout`
- `/cart` (có thể xem nhưng không thể checkout nếu chưa đăng nhập)

---

## Navigation Patterns

### 1. Header Navigation
- **Logo:** Luôn về HomePage (/)
- **Cart Icon:** Luôn đến ShoppingCart (/cart)
- **User Icon:** 
  - Nếu đã đăng nhập → Profile Page (/account)
  - Nếu chưa đăng nhập → Login Page (/auth/login)

### 2. Breadcrumb Navigation
- Hầu hết các trang có breadcrumb để quay lại trang trước
- Pattern: `Home > Current Page`

### 3. Back Button
- Một số trang có button "Quay lại" để quay lại trang trước
- Sử dụng `navigate(-1)` hoặc route cụ thể

### 4. Redirect After Login
- Nếu user truy cập protected route khi chưa đăng nhập:
  - Lưu URL hiện tại vào `localStorage.redirectAfterLogin`
  - Redirect đến `/auth/login`
  - Sau khi đăng nhập thành công → redirect về URL đã lưu

---

## State Management & Data Flow

### 1. Cart State
- Sử dụng `CartContext` và `useCart` hook
- Cart data được load từ API và cache trong context
- Checkout payload được lưu trong `sessionStorage` với key `checkout:payload:v1`

### 2. Authentication State
- Token được lưu trong `localStorage` với key `CUSTOMER_token`
- User data được lưu trong `localStorage` với key `CUSTOMER_user`
- Refresh token được quản lý bởi `RefreshTokenService`

### 3. Profile State
- Profile data được cache trong `ProfileCache`
- Preload data khi vào Profile Page để tối ưu performance

---

## Notes

1. **ProductListDemo** (`/products/demo`) - Trang demo, không được sử dụng trong production flow chính
2. **OAuth2 Callback** (`/oauth2/callback`) - Xử lý callback từ Google OAuth, không phải màn hình user tương tác trực tiếp
3. **Policies Page** (`/policies`) - Trang chính sách, có thể truy cập từ footer hoặc register page
4. Tất cả các màn hình đều sử dụng `Layout` component (trừ một số trang đặc biệt như Payment Success/Fail)

---

## Tổng kết

- **Tổng số màn hình:** 17 màn hình chính
- **Số màn hình yêu cầu authentication:** 7 màn hình
- **Số sub-tabs trong Profile:** 9 tabs
- **Luồng chính:** Home → Product → Cart → Checkout → Order Management
- **Luồng phụ:** Profile Management, Warranty, Returns, Reviews

---

*Tài liệu được tạo tự động từ phân tích codebase - Cập nhật lần cuối: 2024*
