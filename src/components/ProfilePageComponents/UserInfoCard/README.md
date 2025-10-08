# UserInfoCard Component

## Tính năng mới: Upload Avatar

### Cách sử dụng:

1. **Hover vào avatar** → Hiển thị nút camera
2. **Click vào nút camera** → Mở modal upload
3. **Chọn file ảnh** → Preview ngay lập tức
4. **Click "Lưu ảnh"** → Lưu avatar mới
5. **Click "Xóa ảnh đại diện"** → Xóa avatar hiện tại

### Validation:
- ✅ Chỉ chấp nhận file hình ảnh (JPG, PNG, GIF)
- ✅ Kích thước tối đa 5MB
- ✅ Fallback về initials nếu ảnh lỗi
- ✅ Preview real-time

### Props:
```typescript
interface UserInfoCardProps {
  fullName: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  avatar?: string; // NEW: URL của hình ảnh đại diện
  onUpdate?: (nextUser: { 
    fullName: string; 
    email: string; 
    phone: string; 
    gender: 'male' | 'female' | 'other'; 
    dateOfBirth: string; 
    avatar?: string; // NEW
  }) => void;
}
```

### Demo Data:
- Mật khẩu hiện tại: `password123`
- Avatar mặc định: Hiển thị initials
- Lưu trữ: localStorage với key `audioshop_profile_data_v1`
