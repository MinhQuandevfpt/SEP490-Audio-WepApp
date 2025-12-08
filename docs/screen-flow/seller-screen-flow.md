# Seller Screen Flow - SEP490 Audio WebApp

## Tổng quan

Tài liệu này mô tả tất cả các màn hình của role **Seller** và cách chúng kết nối với nhau trong ứng dụng SEP490 Audio WebApp.

**Tổng số màn hình:** 30+ màn hình chính (bao gồm các sub-pages trong Dashboard)

---

## Bảng tổng hợp màn hình

| Feature | Screen | Description |
|---------|--------|-------------|
| **Authentication & Onboarding** | Seller Login Page | Đăng nhập cho seller với email/password |
| | Seller Register Page | Đăng ký tài khoản seller mới |
| | Seller Onboarding Page | Đăng ký thông tin cửa hàng (KYC) với multi-step form |
| **KYC Status & Verification** | KYC Status Page | Kiểm tra trạng thái KYC và store status, tự động redirect nếu ACTIVE |
| **Dashboard** | Dashboard Layout | Layout chính với sidebar navigation cho tất cả dashboard pages |
| | Dashboard Home | Thống kê cửa hàng với doanh thu, đơn hàng theo khoảng thời gian |
| **Product Management** | Product Management | Quản lý danh sách sản phẩm với filter, search, pagination |
| | Create Product Page | Tạo sản phẩm mới với form đầy đủ thông tin |
| | Update Product Page | Cập nhật thông tin sản phẩm |
| **Order Management** | Order Management | Quản lý đơn hàng với filter theo status, search, pagination |
| **Return & Warranty** | Return Management | Quản lý yêu cầu hoàn trả từ khách hàng |
| | Warranty Management | Quản lý bảo hành sản phẩm |
| **Staff Management** | Staff List | Danh sách nhân viên cửa hàng |
| | Create Staff | Tạo tài khoản nhân viên mới |
| **Finance** | Finance Page | Quản lý tài chính cửa hàng |
| | Payout Revenue | Danh sách hóa đơn thanh toán doanh thu |
| | Payout Revenue Detail | Chi tiết hóa đơn thanh toán doanh thu |
| **Store Settings** | Store Address Page | Quản lý địa chỉ cửa hàng (warehouse) |
| | Store Profile | Thông tin và cài đặt cửa hàng |
| **Marketing & Promotions** | Voucher Page | Danh sách voucher sản phẩm |
| | Create Voucher Page | Tạo voucher mới cho sản phẩm |
| | Shop Wide Voucher List | Danh sách voucher áp dụng cho toàn cửa hàng |
| | Shop Wide Voucher Page | Tạo voucher áp dụng cho toàn cửa hàng |
| | Campaign List | Danh sách campaign từ admin, có thể join |
| | Campaign Product Details | Chi tiết campaign và quản lý sản phẩm tham gia |
| **Product Bundles** | Combo Management | Quản lý combo sản phẩm |
| | Create Combo | Tạo combo sản phẩm mới |
| **Communication & Reviews** | Messages Page | Quản lý tin nhắn từ khách hàng |
| | Reply Review Page | Phản hồi đánh giá từ khách hàng |
| | Notification Page | Xem tất cả thông báo từ hệ thống |

---

## Danh sách màn hình

### 1. Authentication & Onboarding (3 màn hình)

#### 1.1. Seller Login Page
- **Route:** `/seller/login`
- **File:** `src/pages/Seller/Login/SellerLogin.tsx`
- **Mô tả:** Màn hình đăng nhập cho seller với email/password
- **Navigation từ:**
  - Register Page (sau khi đăng ký thành công)
  - Bất kỳ trang nào yêu cầu seller authentication
- **Navigation đến:**
  - KycStatusPage (sau khi đăng nhập thành công - tự động redirect)
  - Register Page (link "Đăng ký")

#### 1.2. Seller Register Page
- **Route:** `/seller/register`
- **File:** `src/pages/Seller/Register/SellerRegister.tsx`
- **Mô tả:** Màn hình đăng ký tài khoản seller mới
- **Navigation từ:**
  - Login Page (link "Đăng ký")
- **Navigation đến:**
  - Login Page (sau khi đăng ký thành công, tự động redirect sau 3 giây)

#### 1.3. Seller Onboarding Page
- **Route:** `/seller/onboarding`
- **File:** `src/pages/Seller/Onboarding/SellerOnboarding.tsx`
- **Mô tả:** Màn hình đăng ký thông tin cửa hàng (KYC) với multi-step form
- **Navigation từ:**
  - KycStatusPage (button "Đăng ký lại" hoặc "Bắt đầu đăng ký")
  - Login Page (nếu chưa có store)
- **Navigation đến:**
  - KycStatusPage (sau khi submit thành công)
- **Lưu ý:** Protected route - yêu cầu seller authentication

---

### 2. KYC Status & Verification (1 màn hình)

#### 2.1. KYC Status Page
- **Route:** `/seller/kyc-status`
- **File:** `src/pages/Seller/KycStatus/KycStatusPage.tsx`
- **Mô tả:** Trang kiểm tra trạng thái KYC và store status
- **Navigation từ:**
  - Login Page (sau khi đăng nhập thành công)
  - Onboarding Page (sau khi submit KYC)
- **Navigation đến:**
  - Seller Dashboard (nếu status = ACTIVE - tự động redirect)
  - Onboarding Page (nếu status = INACTIVE hoặc REJECTED - button "Đăng ký lại")
  - HomePage (button "Về trang chủ")
- **Status Flow:**
  - `PENDING` → Hiển thị thông báo "Đang xét duyệt"
  - `ACTIVE` → Tự động redirect đến Dashboard
  - `INACTIVE` / `REJECTED` → Hiển thị form đăng ký lại
- **Lưu ý:** Protected route - yêu cầu seller authentication

---

### 3. Seller Dashboard (1 layout + 20+ sub-pages)

#### 3.1. Seller Dashboard Layout
- **Route:** `/seller/dashboard` (base route)
- **File:** `src/components/SellerDashboardLayout/SellerDashboardLayout.tsx`
- **Mô tả:** Layout chính cho seller dashboard với sidebar navigation
- **Navigation từ:**
  - KycStatusPage (khi store status = ACTIVE)
- **Navigation đến:**
  - Tất cả các sub-pages trong dashboard
- **Lưu ý:** Protected route - chỉ cho phép stores có status = ACTIVE

**Sidebar Menu Items:**
- Dashboard Home
- Products (với sub-menu)
- Orders
- Returns
- Warranty
- Staff
- Finance (với sub-menu)
- Marketing (với sub-menu)
- Campaigns
- Combos
- Messages
- Reviews
- Notifications
- Store Address
- Profile

---

### 4. Dashboard Sub-Pages

#### 4.1. Dashboard Home
- **Route:** `/seller/dashboard`
- **File:** `src/pages/Seller/Dashboard/SellerDashboardHome.tsx`
- **Mô tả:** Trang thống kê cửa hàng với doanh thu, đơn hàng theo khoảng thời gian
- **Navigation từ:**
  - Dashboard Layout (default page)
  - Sidebar menu "Dashboard"
- **Navigation đến:**
  - Các trang khác trong dashboard (từ sidebar)

#### 4.2. Product Management
- **Route:** `/seller/dashboard/products`
- **File:** `src/pages/Seller/Dashboard/ProductManagement.tsx`
- **Mô tả:** Quản lý danh sách sản phẩm với filter, search, pagination
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - CreateProductPage (sau khi tạo sản phẩm)
  - UpdateProductPage (sau khi cập nhật)
- **Navigation đến:**
  - CreateProductPage (button "Thêm sản phẩm")
  - UpdateProductPage (click vào sản phẩm để edit)
  - ProductDetailDrawer (click để xem chi tiết)
  - StoreAddressPage (nếu chưa có địa chỉ cửa hàng)

#### 4.3. Create Product Page
- **Route:** `/seller/dashboard/products/add` hoặc `/seller/createproductpage`
- **File:** `src/pages/Seller/AddNewProduct/CreateProductPage.tsx`
- **Mô tả:** Tạo sản phẩm mới với form đầy đủ thông tin
- **Navigation từ:**
  - ProductManagement (button "Thêm sản phẩm")
- **Navigation đến:**
  - StoreAddressPage (nếu chưa có địa chỉ cửa hàng - tự động redirect)
  - ProductManagement (sau khi tạo thành công)

#### 4.4. Update Product Page
- **Route:** `/seller/dashboard/products/:productId/edit`
- **File:** `src/pages/Seller/UpdateProduct/UpdateProductPage.tsx`
- **Mô tả:** Cập nhật thông tin sản phẩm
- **Navigation từ:**
  - ProductManagement (click vào sản phẩm để edit)
- **Navigation đến:**
  - ProductManagement (sau khi cập nhật thành công)

#### 4.5. Order Management
- **Route:** `/seller/dashboard/orders`
- **File:** `src/pages/Seller/OrderManagement/OrderManageForStoreOwner.tsx`
- **Mô tả:** Quản lý đơn hàng với filter theo status, search, pagination
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - NotificationPage (click vào notification về đơn hàng)
- **Navigation đến:**
  - Order Detail Modal/Drawer (click vào đơn hàng để xem chi tiết)
- **Sub-routes (Coming Soon):**
  - `/seller/dashboard/orders/pending` - Đơn hàng chờ xác nhận
  - `/seller/dashboard/orders/processing` - Đơn hàng đang xử lý
  - `/seller/dashboard/orders/shipping` - Đơn hàng đang giao
  - `/seller/dashboard/orders/delivered` - Đơn hàng đã giao
  - `/seller/dashboard/orders/cancelled` - Đơn hàng đã hủy

#### 4.6. Return Management
- **Route:** `/seller/dashboard/returns`
- **File:** `src/pages/Seller/ReturnManagement/StoreReturnsPage.tsx`
- **Mô tả:** Quản lý yêu cầu hoàn trả từ khách hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
- **Navigation đến:**
  - Order Management (link đến đơn hàng liên quan)

#### 4.7. Warranty Management
- **Route:** `/seller/dashboard/warranty`
- **File:** `src/pages/Seller/Warranty/StoreOwnerWarranty.tsx`
- **Mô tả:** Quản lý bảo hành sản phẩm
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
- **Navigation đến:**
  - Order Management (link đến đơn hàng liên quan)

#### 4.8. Staff List
- **Route:** `/seller/dashboard/staff`
- **File:** `src/pages/Seller/StaffList/StaffList.tsx`
- **Mô tả:** Danh sách nhân viên cửa hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - CreateStaff (sau khi tạo nhân viên)
- **Navigation đến:**
  - CreateStaff (button "Thêm nhân viên")
  - Staff Edit (click vào nhân viên để edit - Coming Soon)

#### 4.9. Create Staff
- **Route:** `/seller/dashboard/staff/create`
- **File:** `src/pages/Seller/CreateStaff/CreateStaff.tsx`
- **Mô tả:** Tạo tài khoản nhân viên mới
- **Navigation từ:**
  - StaffList (button "Thêm nhân viên")
- **Navigation đến:**
  - StaffList (sau khi tạo thành công hoặc cancel)

#### 4.10. Finance Page
- **Route:** `/seller/dashboard/finance`
- **File:** `src/pages/Seller/Finance/FinancePage.tsx`
- **Mô tả:** Quản lý tài chính cửa hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
- **Navigation đến:**
  - PayoutRevenue (xem doanh thu)
- **Sub-routes (Coming Soon):**
  - `/seller/dashboard/finance/revenue` - Doanh thu
  - `/seller/dashboard/finance/transactions` - Lịch sử giao dịch
  - `/seller/dashboard/finance/withdrawal` - Rút tiền

#### 4.11. Payout Revenue
- **Route:** `/seller/dashboard/revenue`
- **File:** `src/pages/Seller/Dashboard/PayoutRevenue.tsx`
- **Mô tả:** Danh sách hóa đơn thanh toán doanh thu
- **Navigation từ:**
  - FinancePage
  - Dashboard Layout (sidebar menu)
- **Navigation đến:**
  - PayoutRevenueDetail (click vào hóa đơn để xem chi tiết)

#### 4.12. Payout Revenue Detail
- **Route:** `/seller/dashboard/revenue/:billId`
- **File:** `src/pages/Seller/Dashboard/PayoutRevenueDetail.tsx`
- **Mô tả:** Chi tiết hóa đơn thanh toán doanh thu
- **Navigation từ:**
  - PayoutRevenue (click vào hóa đơn)
- **Navigation đến:**
  - PayoutRevenue (button "Quay lại")

#### 4.13. Store Address Page
- **Route:** `/seller/dashboard/store-address`
- **File:** `src/pages/Seller/StoreAddress/StoreAddressPage.tsx`
- **Mô tả:** Quản lý địa chỉ cửa hàng (warehouse)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - CreateProductPage (nếu chưa có địa chỉ - tự động redirect)
- **Navigation đến:**
  - CreateProductPage (nếu redirect từ create product)

#### 4.14. Store Profile
- **Route:** `/seller/dashboard/profile`
- **File:** `src/pages/Seller/Dashboard/StoreProfile.tsx`
- **Mô tả:** Thông tin và cài đặt cửa hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu hoặc profile dropdown)
- **Navigation đến:**
  - Dashboard Home (sau khi cập nhật)

---

### 5. Marketing & Promotions (5 màn hình)

#### 5.1. Voucher Page
- **Route:** `/seller/dashboard/marketing/vouchers`
- **File:** `src/pages/Seller/Voucher/VoucherPage.tsx`
- **Mô tả:** Danh sách voucher sản phẩm
- **Navigation từ:**
  - Dashboard Layout (sidebar menu Marketing > Vouchers)
  - CreateVoucherPage (sau khi tạo voucher)
- **Navigation đến:**
  - CreateVoucherPage (button "Tạo voucher mới")

#### 5.2. Create Voucher Page
- **Route:** `/seller/dashboard/marketing/vouchers/create`
- **File:** `src/pages/Seller/Voucher/CreateVoucherPage.tsx`
- **Mô tả:** Tạo voucher mới cho sản phẩm
- **Navigation từ:**
  - VoucherPage (button "Tạo voucher mới")
- **Navigation đến:**
  - VoucherPage (sau khi tạo thành công)

#### 5.3. Shop Wide Voucher List
- **Route:** `/seller/dashboard/shop-wide-voucher`
- **File:** `src/pages/Seller/ShopWideVoucher/ShopWideVoucherListPage.tsx`
- **Mô tả:** Danh sách voucher áp dụng cho toàn cửa hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - ShopWideVoucherPage (sau khi tạo)
- **Navigation đến:**
  - ShopWideVoucherPage (button "Tạo voucher mới")

#### 5.4. Shop Wide Voucher Page
- **Route:** `/seller/dashboard/shop-wide-voucher/create`
- **File:** `src/pages/Seller/ShopWideVoucher/ShopWideVoucherPage.tsx`
- **Mô tả:** Tạo voucher áp dụng cho toàn cửa hàng
- **Navigation từ:**
  - ShopWideVoucherListPage (button "Tạo voucher mới")
- **Navigation đến:**
  - ShopWideVoucherListPage (sau khi tạo thành công hoặc cancel)

#### 5.5. Campaign List
- **Route:** `/seller/dashboard/campaigns`
- **File:** `src/pages/Seller/Campaign/CampaignList.tsx`
- **Mô tả:** Danh sách campaign từ admin, có thể join
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - CampaignProductDetails (button "Quay lại")
- **Navigation đến:**
  - CampaignProductDetails (click vào campaign để xem và join)

#### 5.6. Campaign Product Details
- **Route:** `/seller/dashboard/campaigns/:campaignId/products`
- **File:** `src/pages/Seller/Campaign/CampaignProductDetails.tsx`
- **Mô tả:** Chi tiết campaign và quản lý sản phẩm tham gia
- **Navigation từ:**
  - CampaignList (click vào campaign)
- **Navigation đến:**
  - CampaignList (button "Quay lại")

---

### 6. Product Bundles (2 màn hình)

#### 6.1. Combo Management
- **Route:** `/seller/dashboard/combos`
- **File:** `src/pages/Seller/Combo/ComboManagement.tsx`
- **Mô tả:** Quản lý combo sản phẩm
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - CreateCombo (sau khi tạo combo)
- **Navigation đến:**
  - CreateCombo (button "Tạo combo mới")
  - Combo Detail (click vào combo để xem chi tiết)

#### 6.2. Create Combo
- **Route:** `/seller/dashboard/combos/create`
- **File:** `src/pages/Seller/Combo/CreateCombo.tsx`
- **Mô tả:** Tạo combo sản phẩm mới
- **Navigation từ:**
  - ComboManagement (button "Tạo combo mới")
- **Navigation đến:**
  - ComboManagement (sau khi tạo thành công hoặc cancel)

---

### 7. Communication & Reviews (3 màn hình)

#### 7.1. Messages Page
- **Route:** `/seller/dashboard/messages`
- **File:** `src/pages/Seller/Messages/MessagesPage.tsx`
- **Mô tả:** Quản lý tin nhắn từ khách hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
  - NotificationPage (click vào notification về tin nhắn)
- **Navigation đến:**
  - Chat với khách hàng (trong page)

#### 7.2. Reply Review Page
- **Route:** `/seller/dashboard/reviews`
- **File:** `src/pages/Seller/ReplyPeview/ReplyReviewPage.tsx`
- **Mô tả:** Phản hồi đánh giá từ khách hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu)
- **Navigation đến:**
  - ProductDetail (link đến sản phẩm)

#### 7.3. Notification Page
- **Route:** `/seller/dashboard/notifications`
- **File:** `src/pages/Seller/NotificationFolder/NotificationPage.tsx`
- **Mô tả:** Xem tất cả thông báo từ hệ thống
- **Navigation từ:**
  - Dashboard Layout (sidebar menu hoặc notification icon)
- **Navigation đến:**
  - Các trang liên quan (từ notification actionUrl)

---

## Sơ đồ luồng điều hướng chính

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELLER LOGIN PAGE                            │
│                         (/seller/login)                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  SELLER REGISTER      │
         │  (/seller/register)   │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │   KYC STATUS PAGE    │
         │  (/seller/kyc-status) │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐          ┌───────▼──────┐
    │ PENDING │          │   ACTIVE     │
    │         │          │  (Auto       │
    │         │          │  Redirect)   │
    └────┬────┘          └───────┬──────┘
         │                        │
         ↓                        │
┌────────────────┐               │
│  ONBOARDING    │               │
│  (/seller/     │               │
│   onboarding)  │               │
└────────────────┘               │
         │                        │
         └───────────┬────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  SELLER DASHBOARD     │
         │  (/seller/dashboard)  │
         └───────────┬───────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼────┐    ┌──────▼──────┐  ┌─────▼─────┐
│Products│    │   Orders    │  │  Finance  │
└───┬────┘    └──────┬──────┘  └─────┬─────┘
    │                │                │
┌───▼────┐    ┌──────▼──────┐  ┌─────▼─────┐
│Create  │    │   Returns   │  │  Revenue  │
│Product │    │   Warranty  │  │  Detail   │
└────────┘    └──────────────┘  └───────────┘
    │
    │
┌───▼──────────────────────────────┐
│  Marketing & Promotions          │
│  ├─ Vouchers                    │
│  ├─ Shop Wide Vouchers          │
│  ├─ Campaigns                   │
│  └─ Combos                       │
└──────────────────────────────────┘
```

---

## Luồng đăng ký và KYC (Onboarding Flow)

```
1. Seller Register (/seller/register)
   ↓ (submit form)
2. Seller Login (/seller/login)
   ↓ (login thành công)
3. KYC Status Page (/seller/kyc-status)
   ↓ (check status)
   ├─→ ACTIVE → Dashboard (/seller/dashboard) [Auto redirect]
   ├─→ PENDING → Hiển thị "Đang xét duyệt"
   └─→ INACTIVE/REJECTED → Onboarding (/seller/onboarding)
       ↓ (submit KYC form)
       → KYC Status Page (lại check status)
```

---

## Luồng quản lý sản phẩm (Product Management Flow)

```
1. Product Management (/seller/dashboard/products)
   ↓ (click "Thêm sản phẩm")
2. Create Product Page (/seller/dashboard/products/add)
   ↓ (nếu chưa có địa chỉ cửa hàng)
   ├─→ Store Address Page (/seller/dashboard/store-address)
   │   ↓ (tạo địa chỉ)
   │   → Create Product Page (quay lại)
   └─→ (nếu đã có địa chỉ)
       ↓ (submit form)
       → Product Management (sau khi tạo thành công)
   
   ↓ (click vào sản phẩm để edit)
3. Update Product Page (/seller/dashboard/products/:productId/edit)
   ↓ (submit form)
   → Product Management (sau khi cập nhật)
```

---

## Luồng quản lý đơn hàng (Order Management Flow)

```
1. Order Management (/seller/dashboard/orders)
   ↓ (click vào đơn hàng)
2. Order Detail Modal/Drawer
   ↓ (có thể thực hiện các action)
   ├─→ Cập nhật trạng thái đơn hàng
   ├─→ Xử lý hoàn trả → Return Management
   └─→ Xử lý bảo hành → Warranty Management
```

---

## Luồng Marketing & Promotions

```
1. Marketing Menu (Sidebar)
   ├─→ Vouchers (/seller/dashboard/marketing/vouchers)
   │   ↓ (click "Tạo voucher mới")
   │   → Create Voucher (/seller/dashboard/marketing/vouchers/create)
   │
   ├─→ Shop Wide Voucher (/seller/dashboard/shop-wide-voucher)
   │   ↓ (click "Tạo voucher mới")
   │   → Create Shop Wide Voucher (/seller/dashboard/shop-wide-voucher/create)
   │
   ├─→ Campaigns (/seller/dashboard/campaigns)
   │   ↓ (click vào campaign)
   │   → Campaign Product Details (/seller/dashboard/campaigns/:campaignId/products)
   │
   └─→ Combos (/seller/dashboard/combos)
       ↓ (click "Tạo combo mới")
       → Create Combo (/seller/dashboard/combos/create)
```

---

## Protected Routes (Yêu cầu đăng nhập)

Các route sau yêu cầu seller authentication:

- `/seller/onboarding` - ProtectedSellerRoute
- `/seller/kyc-status` - ProtectedSellerRoute
- `/seller/dashboard` và tất cả sub-routes - ProtectedSellerDashboardRoute (chỉ cho ACTIVE stores)

---

## Store Status Flow

```
INACTIVE → Onboarding → KYC Status (PENDING)
                              ↓
                         Admin Review
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
              APPROVED            REJECTED
                    │                   │
                    ↓                   ↓
                ACTIVE              INACTIVE
                    │                   │
                    └─────────┬─────────┘
                              ↓
                    Dashboard Access
```

**Lưu ý quan trọng:**
- Chỉ stores có status = `ACTIVE` mới có thể truy cập Dashboard
- Stores có status = `PENDING` sẽ thấy màn hình "Đang xét duyệt"
- Stores có status = `INACTIVE` hoặc `REJECTED` sẽ được redirect đến Onboarding

---

## Navigation Patterns

### 1. Sidebar Navigation
- Tất cả các trang trong dashboard đều có sidebar navigation
- Sidebar có thể collapse/expand
- Active menu item được highlight

### 2. Breadcrumb Navigation
- Một số trang có breadcrumb để quay lại trang trước
- Pattern: `Dashboard > Current Page`

### 3. Back Button
- Một số trang có button "Quay lại" để quay lại trang trước
- Sử dụng `navigate(-1)` hoặc route cụ thể

### 4. Auto Redirect
- Sau khi login → Auto redirect đến KYC Status Page
- Nếu store status = ACTIVE → Auto redirect đến Dashboard
- Nếu chưa có địa chỉ cửa hàng khi tạo sản phẩm → Auto redirect đến Store Address Page

---

## State Management & Data Flow

### 1. Authentication State
- Token được lưu trong `localStorage` với key `STOREOWNER_token`
- User data được lưu trong `localStorage` với key `seller_user`
- Store ID được lưu trong `localStorage` với key `seller_store_id`
- Refresh token được quản lý bởi `RefreshTokenService`

### 2. Store Info State
- Store info được cache trong `StoreService.getCachedStoreInfo()`
- Load store info khi vào Dashboard Layout
- Store status được check trước khi cho phép truy cập Dashboard

### 3. Notification State
- Notification count được load khi vào Dashboard Layout
- Notifications được load khi click vào notification icon
- Real-time updates có thể được implement với WebSocket hoặc polling

---

## Notes

1. **Coming Soon Pages:** Một số routes hiển thị placeholder "Trang này đang được phát triển":
   - Order sub-status pages (pending, processing, shipping, delivered, cancelled)
   - Staff edit/delete pages
   - Finance sub-pages (revenue, transactions, withdrawal)
   - Marketing promotions page
   - Flash Sale page
   - Settings page

2. **Product Out of Stock:** Route `/seller/dashboard/products/out-of-stock` - Coming Soon

3. **Analytics Page:** Route `/seller/dashboard/analytics` - Coming Soon

4. **Settings Page:** Route `/seller/dashboard/settings` - Coming Soon

5. **Store Status Check:** 
   - `ProtectedSellerDashboardRoute` component tự động check store status
   - Nếu status !== ACTIVE → redirect đến `/seller/kyc-status`
   - Nếu status === ACTIVE → cho phép truy cập Dashboard

6. **Notification Integration:**
   - Notification icon trong header hiển thị số lượng thông báo chưa đọc
   - Click vào notification → navigate đến actionUrl
   - Notification được mark as read khi click

---

## Tổng kết

- **Tổng số màn hình:** 30+ màn hình chính
- **Số màn hình yêu cầu authentication:** Tất cả (trừ Login/Register)
- **Số màn hình yêu cầu ACTIVE status:** Tất cả Dashboard pages
- **Luồng chính:** Login → KYC Status → Dashboard → Quản lý cửa hàng
- **Luồng phụ:** Product Management, Order Management, Marketing, Finance

---

*Tài liệu được tạo tự động từ phân tích codebase - Cập nhật lần cuối: 2024*
