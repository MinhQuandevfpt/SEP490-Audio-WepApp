# Admin Panel - Audio Store

Hệ thống quản trị chuyên nghiệp cho Audio Store với thiết kế hiện đại và tách biệt hoàn toàn với các role khác trong hệ thống.

## 🚀 Tính năng chính

### 1. Xác thực và Phân quyền
- **AdminAuthService**: Hệ thống xác thực riêng biệt cho admin
- **Phân quyền**: Hỗ trợ 2 loại admin (Admin và Super Admin)
- **Protected Routes**: Bảo vệ các route admin bằng middleware

### 2. Giao diện Admin
- **AdminLayout**: Layout chuyên nghiệp với sidebar và header
- **AdminSidebar**: Navigation menu có thể thu gọn/mở rộng
- **AdminHeader**: Header với thông báo, tìm kiếm và user menu
- **Responsive Design**: Tương thích mọi thiết bị

### 3. Dashboard & Analytics
- **Thống kê tổng quan**: Doanh thu, đơn hàng, khách hàng, sản phẩm
- **Biểu đồ và chỉ số**: Hiển thị trực quan các KPI quan trọng
- **Đơn hàng gần đây**: Bảng danh sách đơn hàng mới nhất
- **Sản phẩm bán chạy**: Top sản phẩm có doanh số cao

### 4. Quản lý Người dùng
- **Tab-based Interface**: Khách hàng, Người bán, Quản trị viên
- **Tìm kiếm và lọc**: Tìm kiếm nhanh, lọc theo trạng thái
- **Thống kê người dùng**: Tổng quan về các loại tài khoản
- **Hành động hàng loạt**: Xuất dữ liệu, khóa/mở khóa tài khoản

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   ├── AdminLayout/
│   │   ├── AdminLayout.tsx       # Layout chính cho admin
│   │   ├── AdminSidebar.tsx      # Sidebar navigation
│   │   ├── AdminHeader.tsx       # Header với user menu
│   │   └── index.ts
│   └── AdminComponents/
│       ├── StatCard/             # Card hiển thị thống kê
│       └── DataTable/            # Bảng dữ liệu tái sử dụng
├── pages/
│   └── Admin/
│       ├── Login/                # Trang đăng nhập admin
│       ├── Dashboard/            # Dashboard tổng quan
│       └── UserManagement/       # Quản lý người dùng
└── services/
    └── admin/
        └── AdminAuthService.ts   # Service xác thực admin
```

## 🔐 Tài khoản Demo

### Admin
- **Email**: `admin@audiostore.com`
- **Password**: `admin123`
- **Quyền**: Quản lý cơ bản (users, products, orders, reports)

### Super Admin
- **Email**: `superadmin@audiostore.com`
- **Password**: `superadmin123`
- **Quyền**: Toàn quyền + Quản lý hệ thống

## 🛠️ Cách sử dụng

### 1. Đăng nhập Admin
```
URL: /admin/login
- Sử dụng tài khoản demo ở trên
- Hoặc click nút "Admin"/"Super Admin" để auto-fill
```

### 2. Navigation
```
/admin/dashboard              # Dashboard tổng quan
/admin/users                  # Quản lý người dùng
/admin/users/customers        # Quản lý khách hàng
/admin/users/sellers          # Quản lý người bán
/admin/users/admins           # Quản lý admin (Super Admin only)
/admin/products               # Quản lý sản phẩm
/admin/orders                 # Quản lý đơn hàng
/admin/reports                # Báo cáo & thống kê
/admin/settings               # Cài đặt hệ thống (Super Admin only)
```

### 3. Permissions System
```typescript
// Kiểm tra quyền
AdminAuthService.hasPermission('manage_users')
AdminAuthService.isSuperAdmin()

// Các quyền có sẵn
- read, write, delete
- manage_users, manage_products
- manage_system (Super Admin only)
```

## 🎨 Thiết kế

### Color Scheme
- **Primary**: Blue (#3B82F6) - Tin cậy, chuyên nghiệp
- **Success**: Green (#10B981) - Thành công, tăng trưởng
- **Warning**: Yellow (#F59E0B) - Cảnh báo, chờ xử lý
- **Danger**: Red (#EF4444) - Lỗi, khóa tài khoản
- **Neutral**: Gray scale - Nền, text, border

### Typography
- **Headings**: Font weight 600-700, size responsive
- **Body**: Font weight 400-500, line height 1.5
- **UI Text**: Font size 14px, weight 500

### Components
- **Cards**: Shadow subtle, border radius 8px
- **Buttons**: Solid/outline variants, hover states
- **Tables**: Striped rows, sortable headers
- **Forms**: Consistent spacing, clear validation

## 🔄 Tích hợp

### Authentication Flow
```typescript
// Login
const response = await AdminAuthService.login({ email, password });
if (response.success) {
  navigate('/admin/dashboard');
}

// Auto redirect nếu chưa đăng nhập
<ProtectedAdminRoute element={<AdminLayout />} />
```

### Data Fetching
```typescript
// Hiện tại sử dụng mock data
// Có thể dễ dàng thay thế bằng API calls
const mockData = [...];
// TODO: Replace with actual API
// const response = await api.get('/admin/users');
```

## 🚧 Tính năng sắp tới

1. **Product Management**: CRUD sản phẩm, phê duyệt, categories
2. **Order Management**: Xử lý đơn hàng, tracking, refunds  
3. **Reports & Analytics**: Biểu đồ, export, scheduled reports
4. **System Settings**: Cấu hình hệ thống, email templates
5. **Real-time Notifications**: WebSocket cho thông báo realtime
6. **Audit Logs**: Lịch sử thao tác của admin
7. **File Upload**: Quản lý media, images
8. **Advanced Filters**: Lọc nâng cao, saved filters

## 📱 Responsive Design

- **Desktop**: Full sidebar, multi-column layout
- **Tablet**: Collapsible sidebar, responsive grid
- **Mobile**: Hidden sidebar, stack layout, touch-friendly

## 🔧 Maintenance

### Adding New Pages
1. Tạo component trong `pages/Admin/`
2. Thêm route vào `routes/index.tsx`
3. Cập nhật sidebar navigation nếu cần
4. Thêm permission check nếu cần

### Adding New Components
1. Tạo trong `components/AdminComponents/`
2. Export từ `index.ts`
3. Import và sử dụng trong pages

### Extending Permissions
1. Cập nhật `AdminAuthService`
2. Thêm permission vào mock users
3. Sử dụng `hasPermission()` trong components

---

**Admin Panel được thiết kế với tính mở rộng và bảo trì dễ dàng. Mỗi component được tách biệt và có thể tái sử dụng, đảm bảo code quality và developer experience tốt nhất.**