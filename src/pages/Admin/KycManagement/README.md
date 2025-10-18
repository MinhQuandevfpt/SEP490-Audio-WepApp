# Quản lý KYC của Admin

## Tính năng

Trang quản lý KYC cho phép Admin:
- Xem danh sách tất cả yêu cầu KYC từ các cửa hàng
- Lọc theo trạng thái: Tất cả, Chờ duyệt, Đã duyệt, Đã từ chối
- Xem chi tiết thông tin cửa hàng và các tài liệu đính kèm
- Phê duyệt hoặc từ chối yêu cầu KYC
- Xem hình ảnh CMND/CCCD và Giấy phép kinh doanh

## API Endpoints

### 1. Lọc danh sách KYC theo trạng thái
```
GET /api/stores/{storeId}/kyc/filter?status={status}
```
- Parameters:
  - `storeId`: ID của cửa hàng
  - `status`: PENDING | APPROVED | REJECTED

### 2. Phê duyệt KYC
```
PATCH /api/stores/{storeId}/kyc/{kycId}/approve
```
- Parameters:
  - `storeId`: ID của cửa hàng
  - `kycId`: ID của yêu cầu KYC

### 3. Từ chối KYC
```
PATCH /api/stores/{storeId}/kyc/{kycId}/reject?reason={reason}
```
- Parameters:
  - `storeId`: ID của cửa hàng
  - `kycId`: ID của yêu cầu KYC
  - `reason`: Lý do từ chối

## Cấu trúc

### Types (`src/types/admin.ts`)
- `KycStatus`: 'PENDING' | 'APPROVED' | 'REJECTED'
- `KycData`: Thông tin chi tiết yêu cầu KYC
- `KycFilterResponse`: Response khi lọc KYC
- `KycApproveResponse`: Response khi phê duyệt
- `KycRejectResponse`: Response khi từ chối

### Service (`src/services/admin/AdminKycService.ts`)
- `getKycByStatus(storeId, status)`: Lấy danh sách KYC theo trạng thái
- `getAllKyc(storeId)`: Lấy tất cả KYC
- `approveKyc(storeId, kycId)`: Phê duyệt KYC
- `rejectKyc(storeId, kycId, reason)`: Từ chối KYC

### Component (`src/pages/Admin/KycManagement/KycManagement.tsx`)
- Hiển thị danh sách KYC dạng bảng
- Filter tabs theo trạng thái
- Modal từ chối với input lý do
- Modal xem hình ảnh tài liệu

## Lưu ý

1. **StoreID tạm thời**: Hiện tại đang sử dụng `{storeId}` placeholder. Trong production cần:
   - Lấy storeId động từ dropdown chọn cửa hàng
   - Hoặc API trả về tất cả KYC của tất cả cửa hàng

2. **Authentication**: Sử dụng token từ `localStorage.getItem('admin_access_token')`

3. **Permissions**: Kiểm tra quyền `manage_products` để truy cập trang

## Routes

- `/admin/stores` - Trang tổng quan cửa hàng
- `/admin/stores/kyc` - Trang quản lý KYC ⭐
- `/admin/stores/all` - Tất cả cửa hàng
- `/admin/stores/approved` - Cửa hàng đã duyệt
- `/admin/stores/blocked` - Cửa hàng bị khóa

## UI/UX

- Màu chủ đạo: Orange & Blue gradient
- Responsive table với scroll ngang
- Loading state khi fetch data
- Empty state khi không có dữ liệu
- Confirm dialog trước khi phê duyệt
- Modal với form nhập lý do khi từ chối
- Image viewer modal cho tài liệu
