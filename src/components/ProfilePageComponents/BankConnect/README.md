# BankConnect Component

## Tính năng: Quản lý thẻ ngân hàng

### Cách sử dụng:

1. **Thêm thẻ mới** → Click "Thêm thẻ mới" → Điền form → Click "Thêm thẻ"
2. **Chỉnh sửa thẻ** → Click "Sửa" trên thẻ → Chỉnh sửa → Click "Lưu thay đổi"
3. **Xóa thẻ** → Click "Xóa" → Xác nhận
4. **Đặt mặc định** → Click "Mặc định" trên thẻ
5. **Xem số thẻ** → Click icon mắt để hiển thị/ẩn số thẻ

### Tính năng chính:

#### **Form thêm/chỉnh sửa thẻ:**
- ✅ Dropdown chọn ngân hàng (8 ngân hàng phổ biến)
- ✅ Chọn loại thẻ (Debit/Credit)
- ✅ Nhập số thẻ (tự động format và giới hạn 16 số)
- ✅ Tên chủ thẻ (tự động uppercase)
- ✅ Ngày hết hạn (format MM/YY)
- ✅ Checkbox đặt làm thẻ mặc định

#### **Hiển thị thẻ:**
- 🏦 **Card Design**: Thiết kế thẻ ngân hàng đẹp mắt
- 👁️ **Privacy**: Ẩn/hiện số thẻ với icon mắt
- ✅ **Verification**: Hiển thị trạng thái verified
- 🎯 **Default**: Đánh dấu thẻ mặc định
- 🎨 **Bank Colors**: Màu sắc theo từng ngân hàng

#### **Actions:**
- ✏️ **Edit**: Chỉnh sửa thông tin thẻ
- 🗑️ **Delete**: Xóa thẻ với confirmation
- ⭐ **Set Default**: Đặt làm thẻ mặc định
- 🔒 **Security**: Thông báo bảo mật PCI DSS

### Validation:
- ✅ Tên ngân hàng bắt buộc
- ✅ Số thẻ 16 chữ số
- ✅ Tên chủ thẻ bắt buộc
- ✅ Ngày hết hạn format MM/YY
- ✅ Chỉ một thẻ mặc định

### Props:
```typescript
interface BankConnectProps {
  bankCards: BankCard[];
  onAddCard?: (card: Omit<BankCard, 'id'>) => void;
  onEditCard?: (id: string, card: Omit<BankCard, 'id'>) => void;
  onDeleteCard?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  isDefault: boolean;
  isVerified: boolean;
  cardType: 'debit' | 'credit';
}
```

### Demo Data:
- **3 thẻ mẫu**: Vietcombank (debit), BIDV (credit), Techcombank (debit)
- **Trạng thái**: 2 thẻ verified, 1 thẻ chưa verify
- **Mặc định**: Vietcombank là thẻ mặc định
- **Lưu trữ**: localStorage với key `audioshop_profile_data_v1`

### Security Features:
- 🔒 **PCI DSS Compliance**: Thông báo bảo mật
- 👁️ **Privacy**: Ẩn số thẻ mặc định
- ⚠️ **Confirmation**: Xác nhận trước khi xóa
- 🛡️ **Validation**: Kiểm tra dữ liệu đầu vào
