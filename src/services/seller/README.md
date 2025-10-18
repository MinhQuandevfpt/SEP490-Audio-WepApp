# Seller Services

## KYC Service

Service này được sử dụng để gửi yêu cầu xác minh KYC (Know Your Customer) cho cửa hàng.

### API Endpoint
```
POST /api/stores/{storeId}/kyc
```

### Cách sử dụng

1. **Import service:**
```typescript
import { KycService } from './services/seller/KycService';
```

2. **Chuẩn bị dữ liệu KYC:**
```typescript
const kycData: KycRequest = {
  storeName: "Tên cửa hàng",
  phoneNumber: "0987654321",
  businessLicenseNumber: "123456789",
  taxCode: "0123456789",
  bankName: "Vietcombank",
  bankAccountName: "Tên chủ tài khoản",
  bankAccountNumber: "1234567890",
  idCardFrontUrl: "https://example.com/front.jpg",
  idCardBackUrl: "https://example.com/back.jpg",
  businessLicenseUrl: "https://example.com/license.pdf",
  isOfficial: true
};
```

3. **Gửi yêu cầu KYC:**
```typescript
try {
  const response = await KycService.submitKyc(storeId, kycData);
  console.log('KYC submitted successfully:', response);
} catch (error) {
  console.error('KYC submission failed:', error);
}
```

### Lưu ý quan trọng

1. **Authentication:** Service tự động sử dụng token từ localStorage (`seller_token`)
2. **File Upload:** Hiện tại sử dụng mock URL, cần implement thực tế
3. **Store ID:** Hiện tại sử dụng mock store ID, cần lấy từ authentication response
4. **Error Handling:** Tất cả lỗi đều được throw để component xử lý

### Cần implement thêm

1. **File Upload Service:** Tạo service upload file thực tế
2. **Store ID Management:** Lấy store ID từ authentication response
3. **Status Tracking:** Theo dõi trạng thái KYC request

### Response Schema

```typescript
interface KycResponse {
  id: string;
  version: number;
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  official: boolean;
}
```
