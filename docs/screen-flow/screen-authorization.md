# Screen Authorization - SEP490 Audio WebApp

## Tổng quan

Bảng này mô tả yêu cầu authentication cho từng màn hình trong hệ thống theo từng role (Customer, Seller, Admin).

**Ký hiệu:**
- **x** = Yêu cầu authentication
- **(blank)** = Không yêu cầu authentication

---

## Bảng Screen Authorization

| Screen | Customer | Seller | Admin |
|--------|----------|--------|-------|
| **Authentication & Onboarding** |
| Login Page | | | |
| Register Page | | | |
| Seller Login Page | | | |
| Seller Register Page | | | |
| Seller Onboarding Page | | x | |
| Admin Login Page | | | |
| **KYC Status & Verification** |
| KYC Status Page | | x | |
| **Home & Discovery** |
| HomePage | | | |
| Product List Page | | | |
| Product Detail Page | | | |
| Store Page | | | |
| Flash Sale Detail | | | |
| **Shopping & Checkout** |
| Shopping Cart | | | |
| Checkout Order Page | x | | |
| **Order Management** |
| Order History Page | x | | |
| Order Detail Page | x | | |
| Return History Page | x | | |
| **Account & Profile** |
| Profile Page - Info | x | | |
| Profile Page - Addresses | x | | |
| Profile Page - Orders | x | | |
| Profile Page - Warranty | x | | |
| Profile Page - Reviews | x | | |
| Profile Page - Returns | x | | |
| Profile Page - Wallet | x | | |
| Profile Page - Notifications | x | | |
| Profile Page - Password | x | | |
| **Warranty** |
| Warranty Page | x | | |
| **Payment Results** |
| PayOS Success Page | | | |
| PayOS Fail Page | | | |
| **Special Features** |
| 3D Room Design | | | |
| **Seller Dashboard** |
| Dashboard Layout | | x | |
| Dashboard Home | | x | |
| **Product Management (Seller)** |
| Product Management | | x | |
| Create Product Page | | x | |
| Update Product Page | | x | |
| **Order Management (Seller)** |
| Order Management | | x | |
| **Return & Warranty (Seller)** |
| Return Management | | x | |
| Warranty Management | | x | |
| **Staff Management** |
| Staff List | | x | |
| Create Staff | | x | |
| **Finance (Seller)** |
| Finance Page | | x | |
| Payout Revenue | | x | |
| Payout Revenue Detail | | x | |
| **Store Settings (Seller)** |
| Store Address Page | | x | |
| Store Profile | | x | |
| **Marketing & Promotions (Seller)** |
| Voucher Page | | x | |
| Create Voucher Page | | x | |
| Shop Wide Voucher List | | x | |
| Shop Wide Voucher Page | | x | |
| Campaign List (Seller) | | x | |
| Campaign Product Details | | x | |
| **Product Bundles (Seller)** |
| Combo Management | | x | |
| Create Combo | | x | |
| **Communication & Reviews (Seller)** |
| Messages Page | | x | |
| Reply Review Page | | x | |
| Notification Page (Seller) | | x | |
| **Admin Dashboard** |
| Admin Dashboard | | | x |
| **User Management** |
| User Management | | | x |
| User Detail Management | | | x |
| Users - Customers | | | x |
| Users - Sellers | | | x |
| Users - Admins | | | x |
| **Store Management (Admin)** |
| Store Management | | | x |
| Store Detail | | | x |
| Stores - All | | | x |
| Stores - KYC | | | x |
| Stores - Approved | | | x |
| Stores - Blocked | | | x |
| **Product Management (Admin)** |
| Admin Product Management | | | x |
| Admin Product Detail | | | x |
| **KYC Management** |
| KYC Management | | | x |
| KYC Detail | | | x |
| **Categories** |
| Categories List | | | x |
| Category Detail | | | x |
| **Campaign Management** |
| Campaign List | | | x |
| Create Campaign | | | x |
| Edit Campaign | | | x |
| Campaign Product Approval | | | x |
| **Banner Management** |
| Banner Management | | | x |
| Banner Detail | | | x |
| **Policy Management** |
| Policy Management | | | x |
| **Order Management (Admin)** |
| Orders - All | | | x |
| Orders - Pending | | | x |
| Orders - Shipping | | | x |
| Orders - Completed | | | x |
| Orders - Cancelled | | | x |
| **Reports & Analytics** |
| Reports | | | x |
| Reports - Revenue | | | x |
| Reports - Payout | | | x |
| Payout Bill Detail | | | x |
| Reports - Best Sellers | | | x |
| Reports - Customers | | | x |
| Reports - Sellers | | | x |
| **System Settings** |
| Settings | | | x |
| Settings - General | | | x |
| Settings - Payment | | | x |
| Settings - Shipping | | | x |
| Settings - Email | | | x |
| **Profile** |
| Admin Profile | | | x |

---

## Thống kê

### Customer Screens
- **Tổng số màn hình:** 26 màn hình
- **Màn hình yêu cầu authentication:** 12 màn hình
- **Màn hình không yêu cầu authentication:** 14 màn hình

### Seller Screens
- **Tổng số màn hình:** 30+ màn hình
- **Màn hình yêu cầu authentication:** Tất cả (trừ Login/Register)
- **Màn hình yêu cầu ACTIVE status:** Tất cả Dashboard pages

### Admin Screens
- **Tổng số màn hình:** 40+ màn hình
- **Màn hình yêu cầu authentication:** Tất cả (trừ Login)

---

## Lưu ý đặc biệt

### Customer
1. **Shopping Cart:** Có thể xem giỏ hàng khi chưa đăng nhập, nhưng không thể checkout
2. **PayOS Success/Fail Pages:** Public pages, không yêu cầu authentication
3. **Profile Page:** Tất cả sub-tabs đều yêu cầu authentication

### Seller
1. **KYC Status Page:** Yêu cầu authentication nhưng không yêu cầu ACTIVE status
2. **Onboarding Page:** Yêu cầu authentication
3. **Dashboard Pages:** Yêu cầu cả authentication VÀ store status = ACTIVE
4. **Login/Register:** Không yêu cầu authentication

### Admin
1. **Login Page:** Không yêu cầu authentication
2. **Tất cả routes khác:** Yêu cầu authentication
3. **Permission System:** Một số routes yêu cầu permission cụ thể (chưa implement đầy đủ)

---

*Tài liệu được tạo tự động từ phân tích codebase - Cập nhật lần cuối: 2024*
