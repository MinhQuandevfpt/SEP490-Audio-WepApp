# Quản lý Nhân viên Hệ thống (FlatStaff)

## Tổng quan

Module quản lý tài khoản nhân viên hệ thống (FlatStaff) cho phép admin tạo và quản lý tài khoản nhân viên quản trị viên với quyền hạn hạn chế.

## Các thay đổi đã thực hiện

### 1. Cập nhật Menu Admin
- ✅ Đổi tên menu "Khách hàng" → "Tài khoản" trong sidebar
- ✅ Thêm menu mới "Nhân viên hệ thống" trong "Quản lý người dùng"

**File:** `src/components/AdminLayout/AdminSidebar.tsx`

### 2. Tạo Types & Interfaces
Tạo các interface TypeScript cho FlatStaff:
- `FlatStaffAccount` - Thông tin tài khoản nhân viên
- `CreateFlatStaffRequest` - Request tạo tài khoản mới
- `CreateFlatStaffResponse` - Response sau khi tạo
- `FlatStaffListResponse` - Response danh sách
- `FlatStaffListParams` - Query parameters

**File:** `src/types/flatstaff.ts`

### 3. Tạo Service Layer
Service xử lý API calls cho FlatStaff:
- `createFlatStaff()` - Tạo tài khoản mới (API: POST `/api/account/register/flatstaff`)
- `getFlatStaffList()` - Lấy danh sách (API: GET `/api/admin/flatstaff`)
- `updateFlatStaffStatus()` - Cập nhật trạng thái
- `deleteFlatStaff()` - Xóa tài khoản

**File:** `src/services/admin/AdminFlatStaffService.ts`

### 4. Tạo UI Components
Trang quản lý FlatStaff với đầy đủ tính năng:
- ✅ Danh sách nhân viên với pagination
- ✅ Tìm kiếm theo tên, email, số điện thoại
- ✅ Modal tạo tài khoản mới với validation
- ✅ Xóa tài khoản với confirm
- ✅ Hiển thị thống kê tổng số nhân viên
- ✅ Responsive design

**File:** `src/pages/Admin/FlatStaffManagement/FlatStaffManagement.tsx`

### 5. Cập nhật Routes
Thêm route `/admin/flatstaff` cho trang quản lý

**File:** `src/routes/index.tsx`

## API Integration

### Endpoint đã tích hợp:
```
POST /api/account/register/flatstaff
```

**Request Body:**
```json
{
  "name": "string",
  "password": "string",
  "email": "string",
  "phone": "string"
}
```

**Response:**
```json
{
  "status": 0,
  "message": "string",
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "createdAt": "string",
    "status": "ACTIVE"
  }
}
```

### Endpoints dự kiến (cần backend hỗ trợ):
- `GET /api/admin/flatstaff` - Lấy danh sách
- `PUT /api/admin/flatstaff/{id}/status` - Cập nhật trạng thái
- `DELETE /api/admin/flatstaff/{id}` - Xóa tài khoản

## Cách sử dụng

### 1. Truy cập trang quản lý
- Đăng nhập với quyền Admin
- Vào menu "Quản lý người dùng" → "Nhân viên hệ thống"

### 2. Tạo tài khoản mới
1. Click nút "Tạo tài khoản mới"
2. Điền thông tin:
   - Tên (bắt buộc)
   - Email (bắt buộc, định dạng email)
   - Số điện thoại (bắt buộc, 10-11 số)
   - Mật khẩu (bắt buộc, tối thiểu 6 ký tự)
3. Click "Tạo tài khoản"

### 3. Tìm kiếm
- Nhập từ khóa vào ô tìm kiếm
- Tìm kiếm theo tên, email, hoặc số điện thoại

### 4. Xóa tài khoản
- Click icon Trash trên hàng tương ứng
- Xác nhận xóa

## Validation Rules

### Tên
- Không được để trống

### Email
- Không được để trống
- Phải đúng định dạng email

### Số điện thoại
- Không được để trống
- Phải có 10-11 chữ số

### Mật khẩu
- Không được để trống
- Tối thiểu 6 ký tự

## UI Features

### 1. Dashboard Stats
- Hiển thị tổng số nhân viên hệ thống

### 2. Search & Filter
- Tìm kiếm real-time
- Nút làm mới danh sách

### 3. Table
- Hiển thị STT, Tên, Email, Số điện thoại, Ngày tạo, Trạng thái
- Avatar với chữ cái đầu tiên của tên
- Badge trạng thái (Hoạt động/Không hoạt động)

### 4. Pagination
- Hiển thị số trang và tổng số bản ghi
- Nút Trước/Sau
- Tùy chọn số lượng bản ghi trên trang

### 5. Create Modal
- Form validate real-time
- Hiển thị/ẩn mật khẩu
- Icons cho các trường input

## Security

- ✅ Authorization header với Bearer token
- ✅ Protected route (chỉ admin có quyền truy cập)
- ✅ Form validation client-side
- ✅ Confirm trước khi xóa

## Notes

1. **API Backend**: Một số endpoint như `getFlatStaffList`, `updateFlatStaffStatus`, `deleteFlatStaff` có thể cần được triển khai ở backend.

2. **Error Handling**: Service đã xử lý lỗi và hiển thị thông báo cho người dùng.

3. **Loading States**: UI có loading states khi gọi API.

4. **Responsive**: Giao diện responsive, hoạt động tốt trên mobile và desktop.

## Testing

Để test chức năng:

1. Build project: `npm run build`
2. Chạy dev server: `npm run dev`
3. Đăng nhập với tài khoản admin
4. Truy cập `/admin/flatstaff`
5. Test các chức năng: tạo, tìm kiếm, xóa

## Future Enhancements

- [ ] Edit tài khoản nhân viên
- [ ] Reset mật khẩu
- [ ] Phân quyền chi tiết hơn
- [ ] Export danh sách ra Excel
- [ ] Bulk actions (xóa nhiều, active/inactive nhiều)
- [ ] Activity logs
- [ ] Email notification khi tạo tài khoản
