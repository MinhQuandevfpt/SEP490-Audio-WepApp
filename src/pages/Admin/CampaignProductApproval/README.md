# Campaign Product Approval - Admin Feature

## 📋 Tổng quan
Tính năng duyệt sản phẩm chiến dịch cho phép Admin xem xét và phê duyệt các sản phẩm mà cửa hàng đăng ký tham gia chiến dịch khuyến mãi (Mega Sale / Flash Sale).

## 🎯 Chức năng chính

### 1. **Xem danh sách sản phẩm**
- Hiển thị tất cả sản phẩm đã được đăng ký vào các chiến dịch
- Thông tin chi tiết: tên sản phẩm, hình ảnh, giá gốc, giảm giá, giá sau giảm
- Thông tin chiến dịch và cửa hàng
- Trạng thái voucher (Chờ duyệt, Đã duyệt, Đang hoạt động, etc.)

### 2. **Bộ lọc nâng cao**
- **Loại chiến dịch**: Mega Sale / Flash Sale
- **Trạng thái**: DRAFT (Chờ duyệt), APPROVE (Đã duyệt), ACTIVE, EXPIRED, DISABLED
- **Chiến dịch cụ thể**: Chọn từ dropdown danh sách chiến dịch
- **Cửa hàng**: Lọc theo storeId (nếu cần)

### 3. **Duyệt sản phẩm**
- **Chọn nhiều**: Checkbox để chọn nhiều sản phẩm cùng lúc
- **Duyệt hàng loạt**: Duyệt tất cả sản phẩm đã chọn trong một lần
- **Xác nhận**: Modal xác nhận trước khi duyệt
- **Auto-group**: Tự động nhóm sản phẩm theo campaignId để gọi API đúng

### 4. **Thống kê**
- Tổng số sản phẩm
- Số sản phẩm chờ duyệt
- Số sản phẩm đã duyệt
- Số cửa hàng tham gia

## 🔧 API Integration

### GET /api/campaigns/overview
**Parameters:**
- `type`: MEGA_SALE | FAST_SALE
- `status`: DRAFT | APPROVE | ACTIVE | EXPIRED | DISABLED
- `storeId`: UUID (optional)
- `campaignId`: UUID (optional)
- `page`: number (0-based)
- `size`: number

**Response:**
```json
{
  "status": 200,
  "message": "✅ Danh sách sản phẩm theo loại chiến dịch (filtered)",
  "data": {
    "page": 0,
    "totalCampaigns": 1,
    "size": 10,
    "data": [
      {
        "campaignId": "uuid",
        "campaignName": "MG1",
        "campaignType": "MEGA_SALE",
        "products": [...]
      }
    ]
  }
}
```

### PUT /api/campaigns/{campaignId}/approve-products
**Body:**
```json
["campaignProductId1", "campaignProductId2", ...]
```

**Response:**
```json
{
  "status": 200,
  "message": "✅ Đã duyệt sản phẩm thành công"
}
```

## 📁 Files Created/Modified

### New Files
1. **Types**: `/src/types/admin.ts` (added campaign product types)
2. **Service**: `/src/services/admin/CampaignProductService.ts`
3. **Page**: `/src/pages/Admin/CampaignProductApproval/CampaignProductApproval.tsx`
4. **Index**: `/src/pages/Admin/CampaignProductApproval/index.ts`

### Modified Files
1. **Sidebar**: `/src/components/AdminLayout/AdminSidebar.tsx`
   - Added "Duyệt sản phẩm chiến dịch" menu item
2. **Routes**: `/src/routes/index.tsx`
   - Added route: `/admin/campaigns/products/approval`

## 🎨 UI/UX Design

### Layout
- **Header**: Tiêu đề + mô tả trang
- **Stats Cards**: 4 cards hiển thị thống kê tổng quan
- **Filters**: Bộ lọc theo loại, trạng thái, chiến dịch
- **Action Bar**: Hiện khi có sản phẩm được chọn
- **Table**: Danh sách sản phẩm với pagination

### Table Columns
1. Sản phẩm (hình ảnh + tên)
2. Chiến dịch (tên + loại)
3. Cửa hàng (tên + ID)
4. Giá gốc
5. Giảm giá (tag màu đỏ)
6. Giá sau giảm (màu đỏ, bold)
7. Trạng thái (tag màu)
8. Thời gian (start - end)

### Color Scheme
- **Status colors**: Orange (Draft), Green (Approve), Blue (Active), Default (Expired), Red (Disabled)
- **Campaign type**: Purple (Mega Sale), Orange (Flash Sale)
- **Discount**: Red tag
- **Final price**: Red bold text

## 🔐 Access Control
- Chỉ Admin đã đăng nhập mới truy cập được
- Protected route: `ProtectedAdminRoute`

## 🚀 Usage

1. **Truy cập trang**: 
   - Sidebar → Chiến dịch khuyến mãi → Duyệt sản phẩm chiến dịch
   - URL: `/admin/campaigns/products/approval`

2. **Lọc sản phẩm**: 
   - Chọn bộ lọc phù hợp (mặc định: status = DRAFT)
   - Click "Xóa bộ lọc" để reset

3. **Duyệt sản phẩm**:
   - Tick checkbox các sản phẩm cần duyệt
   - Click "Duyệt đã chọn"
   - Xác nhận trong modal

4. **Xem chi tiết**:
   - Hover vào hình ảnh để preview
   - Xem thông tin đầy đủ trong bảng

## 💡 Best Practices

1. **Luôn kiểm tra trạng thái** trước khi duyệt
2. **Xem thông tin chiến dịch** để đảm bảo sản phẩm phù hợp
3. **Duyệt theo batch** để tiết kiệm thời gian
4. **Kiểm tra giá giảm** có hợp lý không

## 🐛 Error Handling

- Network errors: Hiển thị notification lỗi
- Empty state: Hiển thị empty component với hướng dẫn
- Invalid filters: Auto-fallback to default
- API errors: Caught và hiển thị message từ backend

## 📝 Notes

- Sản phẩm chỉ chuyển từ DRAFT → APPROVE khi admin duyệt
- APPROVE → ACTIVE tự động khi chiến dịch/slot bắt đầu (scheduler backend)
- Chỉ có thể chọn sản phẩm có status = DRAFT để duyệt
- Pagination: Default 20 items/page, có thể thay đổi (10/20/50/100)
