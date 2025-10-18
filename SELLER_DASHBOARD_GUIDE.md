# 🏪 Seller Dashboard - Hướng dẫn sử dụng

## 📋 Tổng quan

Hệ thống Seller Dashboard đã được xây dựng hoàn chỉnh với các tính năng quản lý cửa hàng chuyên nghiệp, tương tự như Shopee, Tiki, Lazada.

## 🔐 Quy trình xác thực và trạng thái Store

### Các trạng thái Store

1. **INACTIVE** (Chưa kích hoạt)
   - Người bán mới đăng ký, chưa điền thông tin KYC
   - ❌ Không được truy cập Dashboard
   - ➡️ Cần điền form KYC tại `/seller/onboarding`

2. **PENDING** (Chờ duyệt)
   - Đã hoàn thành KYC và gửi yêu cầu
   - ❌ Không được truy cập Dashboard
   - ⏳ Chờ Admin xét duyệt (1-3 ngày làm việc)
   - 📱 Hiển thị trang trạng thái tại `/seller/kyc-status`

3. **REJECTED** (Bị từ chối)
   - KYC bị Admin từ chối với lý do cụ thể
   - ❌ Không được truy cập Dashboard
   - 🔄 Có thể cập nhật lại thông tin và gửi lại
   - 📱 Hiển thị lý do từ chối tại `/seller/kyc-status`

4. **ACTIVE** (Đã kích hoạt)
   - KYC đã được Admin phê duyệt
   - ✅ Được truy cập đầy đủ Dashboard
   - 🎉 Có thể bắt đầu bán hàng

## 🚀 Flow hoạt động

### 1. Đăng ký và Đăng nhập
```
Đăng ký (/seller/register)
  ↓
Đăng nhập (/seller/login)
  ↓
Kiểm tra Store Status
  ↓
├─ INACTIVE → Chuyển đến KYC Form (/seller/onboarding)
├─ PENDING → Hiển thị trang chờ (/seller/kyc-status)
├─ REJECTED → Hiển thị lý do + nút gửi lại (/seller/kyc-status)
└─ ACTIVE → Vào Dashboard (/seller/dashboard)
```

### 2. Quy trình KYC

**Bước 1: Thông tin kinh doanh**
- Tên cửa hàng
- Số điện thoại
- Số giấy phép kinh doanh (optional)
- Mã số thuế (optional)

**Bước 2: Thông tin thanh toán**
- Tên ngân hàng
- Số tài khoản
- Tên chủ tài khoản

**Bước 3: Thông tin định danh**
- Ảnh CCCD/CMND mặt trước
- Ảnh CCCD/CMND mặt sau
- Ảnh Giấy phép kinh doanh (optional)

**Bước 4: Hoàn thành**
- Gửi yêu cầu xét duyệt
- Chờ email thông báo kết quả

### 3. Dashboard (Chỉ cho Store ACTIVE)

#### 📊 Trang chủ Dashboard (/seller/dashboard)
- **Thống kê tổng quan:**
  - Doanh thu tháng
  - Tổng đơn hàng
  - Tổng sản phẩm
  - Đơn chờ xử lý
  
- **Cảnh báo & Thông báo:**
  - Sản phẩm hết hàng
  - Sản phẩm sắp hết
  - Đơn hàng chờ xác nhận
  
- **Thao tác nhanh:**
  - Thêm sản phẩm mới
  - Xem đơn hàng
  - Tạo khuyến mãi
  - Xem báo cáo

#### 📦 Quản lý sản phẩm (/seller/dashboard/products)
- Danh sách sản phẩm
- Thêm/Sửa/Xóa sản phẩm
- Quản lý tồn kho
- Sản phẩm hết hàng

#### 🛒 Quản lý đơn hàng (/seller/dashboard/orders)
- Tất cả đơn hàng
- Chờ xác nhận
- Chờ lấy hàng
- Đang giao
- Đã giao
- Đơn hủy

#### 💰 Tài chính (/seller/dashboard/finance)
- Doanh thu
- Lịch sử giao dịch
- Rút tiền

#### 📈 Báo cáo & Phân tích (/seller/dashboard/analytics)
- Biểu đồ doanh thu
- Thống kê sản phẩm
- Phân tích khách hàng

#### 🎯 Marketing (/seller/dashboard/marketing)
- Tạo khuyến mãi
- Quản lý voucher
- Flash Sale

#### 💬 Tin nhắn (/seller/dashboard/messages)
- Trò chuyện với khách hàng
- Thông báo đơn hàng

#### ⭐ Đánh giá (/seller/dashboard/reviews)
- Quản lý đánh giá sản phẩm
- Phản hồi khách hàng

#### ⚙️ Cài đặt (/seller/dashboard/settings)
- Thông tin cửa hàng
- Cài đặt thanh toán
- Cài đặt vận chuyển

## 🎨 Thiết kế UI/UX

### Layout chính
- **Header:** Logo, thông báo, menu người dùng
- **Sidebar:** Menu điều hướng với icon và badge
- **Main Content:** Nội dung chính của từng trang
- **Responsive:** Hỗ trợ mobile, tablet, desktop

### Color Scheme (giống Shopee/Tiki)
- Primary: Orange (#FF6B35) - Red (#EE4D2D)
- Secondary: Blue (#1A94FF)
- Success: Green (#00AB56)
- Warning: Yellow (#FFC107)
- Danger: Red (#F44336)
- Gray Scale: #F5F5F5, #E0E0E0, #757575, #212121

### Components
- **Stat Cards:** Hiển thị thống kê với icon và số liệu
- **Action Buttons:** Nút hành động với gradient
- **Alert Boxes:** Thông báo với các mức độ khác nhau
- **Data Tables:** Bảng dữ liệu với sorting/filtering
- **Charts:** Biểu đồ doanh thu, đơn hàng

## 🔧 Cấu trúc code

### Services
```
src/services/seller/
├── AuthSeller.ts          # Xác thực seller
├── StoreService.ts        # Quản lý store info & status
└── KycService.ts          # Xử lý KYC
```

### Components
```
src/components/
├── SellerDashboardLayout/ # Layout chính của dashboard
│   └── SellerDashboardLayout.tsx
└── SellerLayout/          # Layout cho auth pages
    └── SellerLayout.tsx
```

### Pages
```
src/pages/Seller/
├── Login/                 # Đăng nhập seller
├── Register/              # Đăng ký seller
├── Onboarding/            # Form KYC
├── KycStatus/             # Trang trạng thái KYC
└── Dashboard/             # Trang dashboard chính
```

### Types
```typescript
// src/types/seller.ts
- StoreStatus: 'INACTIVE' | 'PENDING' | 'REJECTED' | 'ACTIVE'
- StoreInfo: Thông tin store
- DashboardStats: Thống kê dashboard
- SellerProduct: Sản phẩm của seller
- SellerOrder: Đơn hàng của seller
```

### Routing
```typescript
// Protected Routes với Store Status Check
ProtectedSellerDashboardRoute:
- Kiểm tra authentication
- Kiểm tra store status
- Chỉ cho phép ACTIVE store vào dashboard
- Redirect đến /seller/kyc-status nếu không phải ACTIVE
```

## 📱 API Integration

### Store API
```typescript
// Get store info
GET /api/stores/{storeId}

// Get store ID
GET /api/stores/me/id

// Update store info
PUT /api/stores/{storeId}
```

### KYC API
```typescript
// Submit KYC
POST /api/stores/{storeId}/kyc

// Admin approve KYC
PATCH /api/stores/{storeId}/kyc/{kycId}/approve

// Admin reject KYC
PATCH /api/stores/{storeId}/kyc/{kycId}/reject?reason=...
```

## 🧪 Testing Flow

### 1. Test Registration & Login
```bash
1. Đăng ký tài khoản seller mới
2. Đăng nhập
3. Verify redirect to /seller/kyc-status (INACTIVE)
```

### 2. Test KYC Submission
```bash
1. Điền form KYC (/seller/onboarding)
2. Upload các file cần thiết
3. Submit form
4. Verify redirect to /seller/kyc-status (PENDING)
```

### 3. Test Admin Approval
```bash
1. Login as Admin
2. Go to /admin/stores/kyc
3. Approve KYC request
4. Seller login again
5. Verify redirect to /seller/dashboard (ACTIVE)
```

### 4. Test Admin Rejection
```bash
1. Login as Admin
2. Reject KYC with reason
3. Seller login again
4. Verify showing rejection reason (REJECTED)
5. Seller can submit KYC again
```

## 🚧 Các trang đang phát triển

Hiện tại các trang sau đã có routing và layout cơ bản, đang chờ implementation chi tiết:

- [ ] Product Management (CRUD operations)
- [ ] Order Management (với các trạng thái)
- [ ] Analytics & Reports
- [ ] Finance Management
- [ ] Marketing Tools
- [ ] Message Center
- [ ] Review Management
- [ ] Store Settings

## 📝 Notes

### Store Status Check
- Store status được cache trong localStorage
- Refresh mỗi 30s ở trang KYC Status
- Kiểm tra lại mỗi khi login

### Security
- JWT token được lưu trong localStorage
- Token được gửi kèm mọi API request
- Auto logout khi token expired

### Performance
- Lazy loading cho images
- Code splitting cho routes
- Cache store info để giảm API calls

## 🎯 Next Steps

1. **Implement Product Management:**
   - CRUD operations cho sản phẩm
   - Upload nhiều ảnh
   - Quản lý variants (size, color, etc.)
   - Bulk actions

2. **Implement Order Management:**
   - Real-time order updates
   - Print invoice
   - Order tracking
   - Refund handling

3. **Implement Analytics:**
   - Revenue charts (daily, weekly, monthly)
   - Best selling products
   - Customer insights
   - Export reports

4. **Implement Marketing:**
   - Create promotions
   - Voucher system
   - Flash sale campaigns
   - Email marketing

## 🆘 Troubleshooting

### Lỗi "Cannot read store status"
```typescript
// Check if seller_token exists
localStorage.getItem('seller_token')

// Clear cache and login again
localStorage.clear()
```

### Lỗi "Không thể upload file"
```typescript
// Check Cloudinary config
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### Lỗi routing
```typescript
// Ensure ProtectedSellerDashboardRoute is used
// Check store status in console
StoreService.getStoreStatus()
```

---

## 👨‍💻 Developer: MinhQuan
## 📅 Date: October 18, 2025
## ✅ Status: Phase 1 Complete - Ready for Testing
