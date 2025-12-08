# Admin Screen Flow - SEP490 Audio WebApp

## Tổng quan

Tài liệu này mô tả tất cả các màn hình của role **Admin** và cách chúng kết nối với nhau trong ứng dụng SEP490 Audio WebApp.

**Tổng số màn hình:** 40+ màn hình chính (bao gồm các sub-pages trong Dashboard và các trang Coming Soon)

---

## Bảng tổng hợp màn hình

| Feature | Screen | Description |
|---------|--------|-------------|
| **Authentication** | Admin Login Page | Đăng nhập cho admin với email/password |
| **Dashboard** | Admin Dashboard | Trang tổng quan hệ thống với thống kê, đơn hàng gần đây, sản phẩm bán chạy |
| **User Management** | User Management | Quản lý danh sách người dùng (customers) với filter, search, pagination |
| | User Detail Management | Chi tiết và cập nhật thông tin người dùng |
| | Users - Customers | Xem danh sách khách hàng (sub-route) |
| | Users - Sellers | Xem danh sách người bán (Coming Soon) |
| | Users - Admins | Quản lý admin khác (Coming Soon) |
| **Store Management** | Store Management | Quản lý danh sách cửa hàng với filter, search, pagination |
| | Store Detail | Chi tiết cửa hàng với thông tin đầy đủ |
| | Stores - All | Xem tất cả cửa hàng (sub-route) |
| | Stores - KYC | Quản lý yêu cầu KYC từ cửa hàng |
| | Stores - Approved | Cửa hàng đã duyệt (Coming Soon) |
| | Stores - Blocked | Cửa hàng bị khóa (Coming Soon) |
| **Product Management** | Admin Product Management | Quản lý danh sách sản phẩm từ tất cả cửa hàng |
| | Admin Product Detail | Chi tiết sản phẩm với thông tin đầy đủ |
| **KYC Management** | KYC Management | Quản lý yêu cầu KYC với filter theo status, approve/reject |
| | KYC Detail | Chi tiết yêu cầu KYC với documents và thông tin cửa hàng |
| **Categories** | Categories List | Quản lý danh mục sản phẩm |
| | Category Detail | Chi tiết và chỉnh sửa danh mục |
| **Campaign Management** | Campaign List | Danh sách chiến dịch khuyến mãi với filter, search |
| | Create Campaign | Tạo chiến dịch khuyến mãi mới |
| | Edit Campaign | Chỉnh sửa chiến dịch khuyến mãi |
| | Campaign Product Approval | Duyệt sản phẩm tham gia chiến dịch từ sellers |
| **Banner Management** | Banner Management | Quản lý banner hiển thị trên trang chủ |
| | Banner Detail | Tạo hoặc chỉnh sửa banner |
| **Policy Management** | Policy Management | Quản lý các chính sách của hệ thống |
| **Order Management** | Orders - All | Tất cả đơn hàng (Coming Soon) |
| | Orders - Pending | Đơn hàng chờ xử lý (Coming Soon) |
| | Orders - Shipping | Đơn hàng đang giao (Coming Soon) |
| | Orders - Completed | Đơn hàng hoàn thành (Coming Soon) |
| | Orders - Cancelled | Đơn hàng đã hủy (Coming Soon) |
| **Reports & Analytics** | Reports | Báo cáo & Thống kê tổng quan (Coming Soon) |
| | Reports - Revenue | Báo cáo doanh thu (Coming Soon) |
| | Reports - Payout | Quản lý thanh toán doanh thu cho cửa hàng |
| | Payout Bill Detail | Chi tiết hóa đơn thanh toán |
| | Reports - Best Sellers | Báo cáo sản phẩm bán chạy (Coming Soon) |
| | Reports - Customers | Báo cáo khách hàng (Coming Soon) |
| | Reports - Sellers | Báo cáo người bán (Coming Soon) |
| **System Settings** | Settings | Cài đặt hệ thống (Coming Soon) |
| | Settings - General | Cấu hình chung (Coming Soon) |
| | Settings - Payment | Cài đặt thanh toán (Coming Soon) |
| | Settings - Shipping | Cài đặt giao hàng (Coming Soon) |
| | Settings - Email | Email Templates (Coming Soon) |
| **Profile** | Admin Profile | Thông tin tài khoản admin (Coming Soon) |

---

## Danh sách màn hình

### 1. Authentication (1 màn hình)

#### 1.1. Admin Login Page
- **Route:** `/admin/login`
- **File:** `src/pages/Admin/Login/AdminLogin.tsx`
- **Mô tả:** Màn hình đăng nhập cho admin với email/password
- **Navigation từ:**
  - Bất kỳ trang nào yêu cầu admin authentication (tự động redirect)
- **Navigation đến:**
  - Admin Dashboard (sau khi đăng nhập thành công - tự động redirect)
- **Lưu ý:** Không yêu cầu authentication

---

### 2. Dashboard (1 màn hình)

#### 2.1. Admin Dashboard
- **Route:** `/admin/dashboard`
- **File:** `src/pages/Admin/Dashboard/AdminDashboard.tsx`
- **Mô tả:** Trang tổng quan hệ thống với thống kê, đơn hàng gần đây, sản phẩm bán chạy
- **Navigation từ:**
  - Login Page (sau khi đăng nhập thành công - tự động redirect)
  - Admin Layout (default page khi vào `/admin`)
- **Navigation đến:**
  - Tất cả các trang khác trong dashboard (từ sidebar)
- **Features:**
  - Statistics cards: Tổng doanh thu, Đơn hàng mới, Khách hàng mới, Sản phẩm bán chạy
  - Recent orders table
  - Top products list
  - Quick actions buttons
- **Lưu ý:** Protected route - yêu cầu admin authentication

---

### 3. User Management (5 màn hình)

#### 3.1. User Management
- **Route:** `/admin/users` hoặc `/admin/users/customers`
- **File:** `src/pages/Admin/UserManagement/UserManagement.tsx`
- **Mô tả:** Quản lý danh sách người dùng (customers) với filter, search, pagination
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý người dùng")
  - User Detail Management (button "Quay lại")
- **Navigation đến:**
  - User Detail Management (click vào user để xem chi tiết)
- **Features:**
  - Statistics: Tổng khách hàng, Khách hàng hoạt động, Khách hàng mới hôm nay, Tài khoản bị khóa
  - Filter theo status (ACTIVE, SUSPENDED, ALL)
  - Search by keyword
  - Pagination
  - View user detail

#### 3.2. User Detail Management
- **Route:** `/admin/users/:id`
- **File:** `src/pages/Admin/UserDetailandUpdate/UserDetailManagement.tsx`
- **Mô tả:** Chi tiết và cập nhật thông tin người dùng
- **Navigation từ:**
  - User Management (click vào user)
- **Navigation đến:**
  - User Management (button "Quay lại")

#### 3.3. Users - Sellers
- **Route:** `/admin/users/sellers`
- **Mô tả:** Xem danh sách người bán (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý người dùng > Người bán")

#### 3.4. Users - Admins
- **Route:** `/admin/users/admins`
- **Mô tả:** Quản lý admin khác (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý người dùng > Admin")
- **Lưu ý:** Yêu cầu permission `manage_system`

---

### 4. Store Management (6 màn hình)

#### 4.1. Store Management
- **Route:** `/admin/stores` hoặc `/admin/stores/all`
- **File:** `src/pages/Admin/StoreManagement/StoreManagement.tsx`
- **Mô tả:** Quản lý danh sách cửa hàng với filter, search, pagination
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý cửa hàng > Tất cả cửa hàng")
  - Store Detail (button "Quay lại")
- **Navigation đến:**
  - Store Detail (click vào cửa hàng để xem chi tiết)
- **Features:**
  - Statistics: Tổng cửa hàng, Cửa hàng hoạt động, Cửa hàng mới, Cửa hàng bị khóa
  - Filter theo status
  - Search by keyword
  - Pagination
  - View store detail

#### 4.2. Store Detail
- **Route:** `/admin/stores/:storeId`
- **File:** `src/pages/Admin/StoreManagement/StoreDetail.tsx`
- **Mô tả:** Chi tiết cửa hàng với thông tin đầy đủ
- **Navigation từ:**
  - Store Management (click vào cửa hàng)
- **Navigation đến:**
  - Store Management (button "Quay lại")

#### 4.3. Stores - KYC
- **Route:** `/admin/stores/kyc` hoặc `/admin/kyc`
- **File:** `src/pages/Admin/KycManagement/KycManagement.tsx`
- **Mô tả:** Quản lý yêu cầu KYC từ cửa hàng (xem chi tiết ở phần KYC Management)

#### 4.4. Stores - Approved
- **Route:** `/admin/stores/approved`
- **Mô tả:** Cửa hàng đã duyệt (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý cửa hàng > Cửa hàng đã duyệt")

#### 4.5. Stores - Blocked
- **Route:** `/admin/stores/blocked`
- **Mô tả:** Cửa hàng bị khóa (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý cửa hàng > Cửa hàng bị khóa")

---

### 5. Product Management (2 màn hình)

#### 5.1. Admin Product Management
- **Route:** `/admin/products`
- **File:** `src/pages/Admin/ProductManagement/AdminProductManagement.tsx`
- **Mô tả:** Quản lý danh sách sản phẩm từ tất cả cửa hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý cửa hàng > Quản lý sản phẩm")
  - Admin Product Detail (button "Quay lại")
- **Navigation đến:**
  - Admin Product Detail (click vào sản phẩm để xem chi tiết)

#### 5.2. Admin Product Detail
- **Route:** `/admin/products/:productId`
- **File:** `src/pages/Admin/ProductManagement/AdminProductDetail.tsx`
- **Mô tả:** Chi tiết sản phẩm với thông tin đầy đủ
- **Navigation từ:**
  - Admin Product Management (click vào sản phẩm)
- **Navigation đến:**
  - Admin Product Management (button "Quay lại")

---

### 6. KYC Management (2 màn hình)

#### 6.1. KYC Management
- **Route:** `/admin/kyc` hoặc `/admin/stores/kyc`
- **File:** `src/pages/Admin/KycManagement/KycManagement.tsx`
- **Mô tả:** Quản lý yêu cầu KYC với filter theo status, approve/reject
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý cửa hàng > Yêu cầu KYC")
  - KYC Detail (button "Quay lại")
- **Navigation đến:**
  - KYC Detail (click vào KYC request để xem chi tiết)
- **Features:**
  - Filter theo status (PENDING, APPROVED, REJECTED, ALL)
  - Statistics: Tổng yêu cầu, Chờ duyệt, Đã duyệt, Đã từ chối
  - Approve/Reject KYC requests
  - View KYC documents
  - Pagination

#### 6.2. KYC Detail
- **Route:** `/admin/kyc/:kycId`
- **File:** `src/pages/Admin/KycManagement/KycDetail.tsx`
- **Mô tả:** Chi tiết yêu cầu KYC với documents và thông tin cửa hàng
- **Navigation từ:**
  - KYC Management (click vào KYC request)
- **Navigation đến:**
  - KYC Management (button "Quay lại")
- **Features:**
  - View all KYC documents
  - Approve/Reject with reason
  - Store information

---

### 7. Categories (2 màn hình)

#### 7.1. Categories List
- **Route:** `/admin/categories`
- **File:** `src/pages/Admin/Categories/CategoriesList.tsx`
- **Mô tả:** Quản lý danh mục sản phẩm
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý cửa hàng > Mục lục sản phẩm")
  - Category Detail (button "Quay lại")
- **Navigation đến:**
  - Category Detail (click vào category để xem chi tiết)

#### 7.2. Category Detail
- **Route:** `/admin/categories/:id`
- **File:** `src/pages/Admin/CategoryDetail/CategoryDetail.tsx`
- **Mô tả:** Chi tiết và chỉnh sửa danh mục
- **Navigation từ:**
  - Categories List (click vào category)
- **Navigation đến:**
  - Categories List (button "Quay lại")

---

### 8. Campaign Management (4 màn hình)

#### 8.1. Campaign List
- **Route:** `/admin/campaigns`
- **File:** `src/pages/Admin/CampaignManagement/CampaignList.tsx`
- **Mô tả:** Danh sách chiến dịch khuyến mãi với filter, search
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Chiến dịch khuyến mãi > Tất cả chiến dịch")
  - Create Campaign (sau khi tạo thành công)
  - Edit Campaign (sau khi cập nhật)
- **Navigation đến:**
  - Create Campaign (button "Tạo chiến dịch mới")
  - Edit Campaign (click vào campaign để edit)
  - Campaign Product Approval (sidebar menu)

#### 8.2. Create Campaign
- **Route:** `/admin/campaigns/create`
- **File:** `src/pages/Admin/CampaignManagement/CreateCampaign.tsx`
- **Mô tả:** Tạo chiến dịch khuyến mãi mới
- **Navigation từ:**
  - Campaign List (button "Tạo chiến dịch mới")
  - Dashboard Layout (sidebar menu "Chiến dịch khuyến mãi > Tạo chiến dịch mới")
- **Navigation đến:**
  - Campaign List (sau khi tạo thành công hoặc cancel)

#### 8.3. Edit Campaign
- **Route:** `/admin/campaigns/:id/edit`
- **File:** `src/pages/Admin/CampaignManagement/EditCampaign.tsx`
- **Mô tả:** Chỉnh sửa chiến dịch khuyến mãi
- **Navigation từ:**
  - Campaign List (click vào campaign để edit)
- **Navigation đến:**
  - Campaign List (sau khi cập nhật thành công hoặc cancel)

#### 8.4. Campaign Product Approval
- **Route:** `/admin/campaigns/products/approval`
- **File:** `src/pages/Admin/CampaignProductApproval/CampaignProductApproval.tsx`
- **Mô tả:** Duyệt sản phẩm tham gia chiến dịch từ sellers
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Chiến dịch khuyến mãi > Duyệt sản phẩm chiến dịch")
- **Navigation đến:**
  - Campaign List (có thể có link)

---

### 9. Banner Management (2 màn hình)

#### 9.1. Banner Management
- **Route:** `/admin/banners`
- **File:** `src/pages/Admin/BannerManagement/BannerManagement.tsx`
- **Mô tả:** Quản lý banner hiển thị trên trang chủ
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý Banner > Tất cả banner")
  - Banner Detail (sau khi tạo/cập nhật)
- **Navigation đến:**
  - Banner Detail (button "Tạo banner mới" hoặc click vào banner để edit)
- **Features:**
  - View all banners
  - Create new banner
  - Edit existing banner
  - Delete banner

#### 9.2. Banner Detail
- **Route:** `/admin/banners/create` hoặc `/admin/banners/:id` hoặc `/admin/banners/:id/edit`
- **File:** `src/pages/Admin/BannerManagement/BannerDetail.tsx`
- **Mô tả:** Tạo hoặc chỉnh sửa banner
- **Navigation từ:**
  - Banner Management (button "Tạo banner mới" hoặc click vào banner)
- **Navigation đến:**
  - Banner Management (sau khi tạo/cập nhật thành công hoặc cancel)

---

### 10. Policy Management (1 màn hình)

#### 10.1. Policy Management
- **Route:** `/admin/policies`
- **File:** `src/pages/Admin/PolicyManagement/PolicyManagement.tsx`
- **Mô tả:** Quản lý các chính sách của hệ thống
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý Chính Sách")
- **Features:**
  - Create/Edit/Delete policies
  - Manage policy categories

---

### 11. Order Management (5 màn hình - Coming Soon)

#### 11.1. Orders - All
- **Route:** `/admin/orders` hoặc `/admin/orders/all`
- **Mô tả:** Tất cả đơn hàng (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý đơn hàng > Tất cả đơn hàng")

#### 11.2. Orders - Pending
- **Route:** `/admin/orders/pending`
- **Mô tả:** Đơn hàng chờ xử lý (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý đơn hàng > Chờ xử lý")

#### 11.3. Orders - Shipping
- **Route:** `/admin/orders/shipping`
- **Mô tả:** Đơn hàng đang giao (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý đơn hàng > Đang giao")

#### 11.4. Orders - Completed
- **Route:** `/admin/orders/completed`
- **Mô tả:** Đơn hàng hoàn thành (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý đơn hàng > Hoàn thành")

#### 11.5. Orders - Cancelled
- **Route:** `/admin/orders/cancelled`
- **Mô tả:** Đơn hàng đã hủy (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Quản lý đơn hàng > Đã hủy")

---

### 12. Reports & Analytics (7 màn hình)

#### 12.1. Reports
- **Route:** `/admin/reports`
- **Mô tả:** Báo cáo & Thống kê tổng quan (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Báo cáo & Thống kê")

#### 12.2. Reports - Revenue
- **Route:** `/admin/reports/revenue`
- **Mô tả:** Báo cáo doanh thu (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Báo cáo & Thống kê > Doanh thu")

#### 12.3. Reports - Payout
- **Route:** `/admin/reports/payout`
- **File:** `src/pages/Admin/PayoutManagement/PayoutManagement.tsx`
- **Mô tả:** Quản lý thanh toán doanh thu cho cửa hàng
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Báo cáo & Thống kê > Thanh toán cửa hàng")
  - Payout Bill Detail (button "Quay lại")
- **Navigation đến:**
  - Payout Bill Detail (click vào hóa đơn để xem chi tiết)
- **Features:**
  - View all payout bills
  - Filter by status
  - Generate new payout bill
  - View payout detail

#### 12.4. Payout Bill Detail
- **Route:** `/admin/reports/payout/:billId`
- **File:** `src/pages/Admin/PayoutManagement/PayoutBillDetail.tsx`
- **Mô tả:** Chi tiết hóa đơn thanh toán
- **Navigation từ:**
  - Payout Management (click vào hóa đơn)
- **Navigation đến:**
  - Payout Management (button "Quay lại")

#### 12.5. Reports - Best Sellers
- **Route:** `/admin/reports/bestsellers`
- **Mô tả:** Báo cáo sản phẩm bán chạy (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Báo cáo & Thống kê > Sản phẩm bán chạy")

#### 12.6. Reports - Customers
- **Route:** `/admin/reports/customers`
- **Mô tả:** Báo cáo khách hàng (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Báo cáo & Thống kê > Khách hàng")

#### 12.7. Reports - Sellers
- **Route:** `/admin/reports/sellers`
- **Mô tả:** Báo cáo người bán (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Báo cáo & Thống kê > Người bán")

---

### 13. System Settings (5 màn hình - Coming Soon)

#### 13.1. Settings
- **Route:** `/admin/settings`
- **Mô tả:** Cài đặt hệ thống (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Cài đặt hệ thống")
- **Lưu ý:** Yêu cầu permission `manage_system`

#### 13.2. Settings - General
- **Route:** `/admin/settings/general`
- **Mô tả:** Cấu hình chung (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Cài đặt hệ thống > Cấu hình chung")

#### 13.3. Settings - Payment
- **Route:** `/admin/settings/payment`
- **Mô tả:** Cài đặt thanh toán (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Cài đặt hệ thống > Thanh toán")

#### 13.4. Settings - Shipping
- **Route:** `/admin/settings/shipping`
- **Mô tả:** Cài đặt giao hàng (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Cài đặt hệ thống > Giao hàng")

#### 13.5. Settings - Email
- **Route:** `/admin/settings/email`
- **Mô tả:** Email Templates (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (sidebar menu "Cài đặt hệ thống > Email Templates")

---

### 14. Profile (1 màn hình - Coming Soon)

#### 14.1. Admin Profile
- **Route:** `/admin/profile`
- **Mô tả:** Thông tin tài khoản admin (Coming Soon)
- **Navigation từ:**
  - Dashboard Layout (có thể từ header profile dropdown)

---

## Sơ đồ luồng điều hướng chính

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN LOGIN PAGE                              │
│                         (/admin/login)                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ (login thành công)
         ┌───────────────────────┐
         │  ADMIN DASHBOARD      │
         │  (/admin/dashboard)   │
         └───────────┬───────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼────┐    ┌──────▼──────┐  ┌─────▼─────┐
│ Users  │    │   Stores    │  │ Products  │
└───┬────┘    └──────┬──────┘  └─────┬─────┘
    │                │                │
┌───▼────┐    ┌──────▼──────┐  ┌─────▼─────┐
│User    │    │ Store       │  │ Product   │
│Detail  │    │ Detail      │  │ Detail    │
└────────┘    └─────────────┘  └───────────┘
    │
    │
┌───▼──────────────────────────────────────┐
│  KYC Management                          │
│  ├─ KYC List                            │
│  └─ KYC Detail                          │
└──────────────────────────────────────────┘
    │
    │
┌───▼──────────────────────────────────────┐
│  Campaign Management                     │
│  ├─ Campaign List                       │
│  ├─ Create Campaign                     │
│  ├─ Edit Campaign                       │
│  └─ Campaign Product Approval           │
└──────────────────────────────────────────┘
    │
    │
┌───▼──────────────────────────────────────┐
│  Banner Management                       │
│  ├─ Banner List                         │
│  └─ Banner Detail (Create/Edit)          │
└──────────────────────────────────────────┘
    │
    │
┌───▼──────────────────────────────────────┐
│  Reports & Analytics                     │
│  ├─ Payout Management                   │
│  └─ Payout Bill Detail                  │
└──────────────────────────────────────────┘
```

---

## Luồng đăng nhập (Login Flow)

```
1. Admin Login (/admin/login)
   ↓ (submit form)
2. Admin Dashboard (/admin/dashboard) [Auto redirect]
   ↓ (check authentication)
   ├─→ Authenticated → Access Dashboard
   └─→ Not Authenticated → Redirect to Login
```

---

## Luồng quản lý KYC (KYC Management Flow)

```
1. KYC Management (/admin/kyc)
   ↓ (click vào KYC request)
2. KYC Detail (/admin/kyc/:kycId)
   ↓ (review documents)
   ├─→ Approve → Store status = ACTIVE
   └─→ Reject → Store status = REJECTED (cần nhập lý do)
       ↓
   → KYC Management (refresh list)
```

---

## Luồng quản lý Campaign (Campaign Management Flow)

```
1. Campaign List (/admin/campaigns)
   ↓ (click "Tạo chiến dịch mới")
2. Create Campaign (/admin/campaigns/create)
   ↓ (submit form)
   → Campaign List (sau khi tạo thành công)
   
   ↓ (click vào campaign để edit)
3. Edit Campaign (/admin/campaigns/:id/edit)
   ↓ (submit form)
   → Campaign List (sau khi cập nhật)
   
   ↓ (sidebar menu)
4. Campaign Product Approval (/admin/campaigns/products/approval)
   → Duyệt sản phẩm từ sellers tham gia campaign
```

---

## Luồng quản lý Banner (Banner Management Flow)

```
1. Banner Management (/admin/banners)
   ↓ (click "Tạo banner mới" hoặc click vào banner)
2. Banner Detail (/admin/banners/create hoặc /admin/banners/:id/edit)
   ↓ (submit form)
   → Banner Management (sau khi tạo/cập nhật)
```

---

## Luồng quản lý Payout (Payout Management Flow)

```
1. Payout Management (/admin/reports/payout)
   ↓ (click vào hóa đơn)
2. Payout Bill Detail (/admin/reports/payout/:billId)
   ↓ (view detail)
   → Payout Management (button "Quay lại")
   
   ↓ (generate new bill)
   → Payout Bill Detail (auto navigate to new bill)
```

---

## Protected Routes (Yêu cầu đăng nhập)

Các route sau yêu cầu admin authentication:

- `/admin` và tất cả sub-routes - ProtectedAdminRoute
- Tất cả routes trong AdminLayout đều được bảo vệ

**Lưu ý:** Route `/admin/login` KHÔNG yêu cầu authentication.

---

## Permission System

Một số routes yêu cầu permission cụ thể:

- `manage_users` - Quản lý người dùng
- `manage_products` - Quản lý sản phẩm
- `manage_system` - Quản lý hệ thống (Settings, Admin Management)

**Lưu ý:** Hiện tại permission system chưa được implement đầy đủ, tất cả admin đều có thể truy cập tất cả routes.

---

## Navigation Patterns

### 1. Sidebar Navigation
- Tất cả các trang trong dashboard đều có sidebar navigation
- Sidebar có thể collapse/expand với sub-menus
- Active menu item được highlight
- Sidebar có user info và logout button

### 2. Breadcrumb Navigation
- Một số trang có breadcrumb để quay lại trang trước
- Pattern: `Dashboard > Current Page`

### 3. Back Button
- Một số trang có button "Quay lại" để quay lại trang trước
- Sử dụng `navigate(-1)` hoặc route cụ thể

### 4. Auto Redirect
- Sau khi login → Auto redirect đến Dashboard
- Nếu chưa authenticated → Auto redirect đến Login

---

## State Management & Data Flow

### 1. Authentication State
- Token được lưu trong `localStorage` với key `ADMIN_token`
- User data được lưu trong `localStorage` với key `admin_user`
- Refresh token được quản lý bởi `RefreshTokenService`

### 2. Admin Info State
- Admin info được load khi vào Dashboard Layout
- Admin info được cache trong `AdminAuthService.getCurrentUser()`

### 3. Data Fetching
- Sử dụng custom hooks (`useUsers`, `useCustomerStats`) cho data fetching
- Sử dụng services (`AdminStoreService`, `AdminKycService`, etc.) cho API calls
- Pagination được quản lý ở component level

---

## Notes

1. **Coming Soon Pages:** Một số routes hiển thị placeholder "Trang này đang được phát triển":
   - Order Management sub-pages (all, pending, shipping, completed, cancelled)
   - Users sub-pages (sellers, admins)
   - Stores sub-pages (approved, blocked)
   - Reports sub-pages (revenue, bestsellers, customers, sellers)
   - Settings sub-pages (general, payment, shipping, email)
   - Admin Profile

2. **Permission System:** 
   - Permission system được định nghĩa trong `AdminSidebar.tsx` nhưng chưa được implement đầy đủ
   - Hiện tại tất cả admin đều có thể truy cập tất cả routes

3. **KYC Approval Flow:**
   - Admin có thể approve/reject KYC requests
   - Khi approve → Store status = ACTIVE
   - Khi reject → Cần nhập lý do từ chối

4. **Campaign Product Approval:**
   - Sellers có thể submit sản phẩm để tham gia campaign
   - Admin cần duyệt sản phẩm trước khi hiển thị trong campaign

5. **Payout Management:**
   - Admin có thể generate payout bills cho stores
   - Mỗi bill chứa danh sách orders và tổng doanh thu

6. **Banner Management:**
   - Banner được hiển thị trên trang chủ customer
   - Admin có thể create/edit/delete banners

7. **Policy Management:**
   - Admin quản lý các chính sách của hệ thống
   - Policies được hiển thị cho customers

---

## Tổng kết

- **Tổng số màn hình:** 40+ màn hình chính
- **Số màn hình yêu cầu authentication:** Tất cả (trừ Login)
- **Số màn hình Coming Soon:** ~20 màn hình
- **Luồng chính:** Login → Dashboard → Quản lý hệ thống
- **Luồng phụ:** User Management, Store Management, KYC Management, Campaign Management, Banner Management, Reports

---

*Tài liệu được tạo tự động từ phân tích codebase - Cập nhật lần cuối: 2024*
