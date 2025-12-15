# Phân Tích Chi Tiết Component ReturnHistoryCard

## Tổng Quan

`ReturnHistoryCard` là component hiển thị thông tin yêu cầu hoàn trả mới nhất của khách hàng trên trang Profile. Component này cung cấp giao diện card đơn giản để xem nhanh trạng thái và thông tin chi tiết của một yêu cầu hoàn trả, đồng thời cho phép khách hàng thực hiện đóng gói khi yêu cầu đã được duyệt.

**File Location:** `src/components/ProfilePageComponents/ReturnHistory/ReturnHistoryCard.tsx`

---

## 1. Component Structure

### 1.1. Props Interface

```typescript
export interface ReturnHistoryCardProps {
  data: ReturnRequestResponse | null;  // Dữ liệu yêu cầu hoàn trả
  isLoading: boolean;                  // Trạng thái loading
  error?: string | null;               // Lỗi nếu có
  onReload?: () => void;               // Callback reload dữ liệu
}
```

### 1.2. State Management

Component sử dụng các state sau:

```typescript
// Modal state
const [packingModalOpen, setPackingModalOpen] = useState(false);
const [selectedReturn, setSelectedReturn] = useState<ReturnRequestResponse | null>(null);

// Form state
const [packingInitialValues, setPackingInitialValues] = useState<Partial<PackingFormValues>>({});
const [packingLoading, setPackingLoading] = useState(false);
const [submitLoading, setSubmitLoading] = useState(false);

// Product info state
const [productWeight, setProductWeight] = useState<number | null>(null);
const [productDimensions, setProductDimensions] = useState<string | null>(null);

// Preview state
const [imagePreview, setImagePreview] = useState<{ visible: boolean; urls: string[]; current: number }>({...});
const [videoPreview, setVideoPreview] = useState<{ visible: boolean; url: string }>({...});
```

---

## 2. Status Mapping

### 2.1. Status Color Map

Component định nghĩa mapping màu sắc cho các trạng thái:

```typescript
const statusColorMap: Record<string, string> = {
  PENDING: 'gold',                    // Chờ shop phản hồi
  APPROVED: 'green',                  // Đã duyệt
  REJECTED: 'red',                    // Từ chối
  CANCELLED: 'gray',                  // Đã hủy
  CANCELED: 'gray',                   // Alias cho CANCELLED
  AUTO_REFUNDED: 'blue',              // Tự động hoàn tiền
  SHIPPING: 'blue',                   // Đang vận chuyển
  RECEIVED: 'cyan',                   // Đã nhận hàng
  DISPUTE: 'orange',                  // Đang khiếu nại
  DISPUTE_ESCALATED: 'purple',        // Khiếu nại đã được đưa lên
  DISPUTE_RESOLVED_SHOP: 'red',       // Khiếu nại giải quyết có lợi shop
  DISPUTE_RESOLVED_CUSTOMER: 'green', // Khiếu nại giải quyết có lợi khách
  REFUNDED: 'green',                  // Đã hoàn tiền
  RETURN_DONE: 'blue',                // Hoàn tất
};
```

### 2.2. Status Label Map

Mapping nhãn hiển thị tiếng Việt:

```typescript
const statusLabelMap: Record<string, string> = {
  PENDING: 'Chờ shop phản hồi',
  APPROVED: 'Đã duyệt yêu cầu – Vui lòng gửi hàng',
  REJECTED: 'Từ chối yêu cầu',
  CANCELLED: 'Đã huỷ (khách không gửi hàng)',
  AUTO_REFUNDED: 'Đã hoàn tiền (tự động)',
  SHIPPING: 'GHN đang vận chuyển',
  // ... các status khác
};
```

---

## 3. Core Functionality

### 3.1. Handle Open Packing Modal

**Function:** `handleOpenPackingModal`

**Mục đích:** Mở modal đóng gói và preload dữ liệu cần thiết

**Flow:**

```typescript
const handleOpenPackingModal = async (record: ReturnRequestResponse) => {
  // 1. Set selected return và mở modal
  setSelectedReturn(record);
  setPackingModalOpen(true);
  setPackingLoading(true);
  
  // 2. Reset product info
  setProductWeight(null);
  setProductDimensions(null);
  
  try {
    // 3. Fetch addresses và product info song song
    const [addresses, productInfo] = await Promise.all([
      ReturnPackingService.getDefaultAddressesForReturn(record),
      ProductListService.getProductById(record.productId).catch(() => null),
    ]);

    // 4. Set initial values cho form
    setPackingInitialValues({
      customerAddressId: addresses.customerAddressId || '',
      storeAddressId: addresses.storeAddressId || '',
    });

    // 5. Extract weight và dimensions từ product
    if (productInfo?.data) {
      if (productInfo.data.weight) {
        setProductWeight(productInfo.data.weight);
      }
      if (productInfo.data.dimensions) {
        setProductDimensions(productInfo.data.dimensions);
      }
    }
  } catch (e: any) {
    message.error(e?.message || 'Không thể tự động lấy địa chỉ mặc định...');
  } finally {
    setPackingLoading(false);
  }
};
```

**Chi tiết:**

1. **Parallel API Calls:** Sử dụng `Promise.all()` để fetch addresses và product info đồng thời, tối ưu performance
2. **Error Handling:** Product info fetch có `.catch(() => null)` để không block flow nếu lỗi
3. **Default Addresses:** 
   - Customer address: Lấy địa chỉ mặc định hoặc địa chỉ đầu tiên
   - Store address: Lấy địa chỉ mặc định của store hoặc địa chỉ đầu tiên
4. **Product Info Extraction:**
   - `weight`: Dùng để validate và set max weight trong form
   - `dimensions`: Parse từ string format "L x W x H cm/mm" để validate

### 3.2. Handle Submit Packing

**Function:** `handleSubmitPacking`

**Mục đích:** Submit thông tin đóng gói lên server

**Flow:**

```typescript
const handleSubmitPacking = async (values: PackingFormValues) => {
  if (!selectedReturn) {
    message.error('Không tìm thấy thông tin yêu cầu hoàn trả.');
    return;
  }

  try {
    setSubmitLoading(true);
    
    // Call API submit package info
    const shippingFee = await ReturnPackingService.submitPackageInfo(
      selectedReturn.id, 
      values
    );

    // Show success message với shipping fee
    if (typeof shippingFee === 'number') {
      message.success('Xác nhận đóng gói thành công... Phí vận chuyển: ' + formatCurrency(shippingFee));
    } else {
      message.success('Xác nhận đóng gói thành công...');
    }

    // Close modal và reload data
    setPackingModalOpen(false);
    onReload?.();
  } catch (e: any) {
    message.error(e?.message || 'Không thể xác nhận đóng gói...');
  } finally {
    setSubmitLoading(false);
  }
};
```

**API Call:**

- **Endpoint:** `POST /api/customers/me/returns/{returnId}/package-info`
- **Request Body:**
  ```typescript
  {
    weight: number,              // Khối lượng (kg)
    length: number,              // Chiều dài (cm)
    width: number,               // Chiều rộng (cm)
    height: number,              // Chiều cao (cm)
    customerAddressId: string,   // ID địa chỉ khách hàng
    storeAddressId: string       // ID địa chỉ cửa hàng
  }
  ```
- **Response:** `{ shippingFee?: number }` - Phí vận chuyển được tính tự động

---

## 4. UI Rendering Logic

### 4.1. Loading State

```typescript
if (isLoading) {
  return (
    <Card>
      <div className="py-12 text-center">
        <Spin size="large" />
        <p>Đang tải thông tin hoàn trả...</p>
      </div>
    </Card>
  );
}
```

### 4.2. Error State

```typescript
if (error) {
  return (
    <Card>
      <div className="py-12 text-center">
        <Text type="danger">{error}</Text>
      </div>
    </Card>
  );
}
```

### 4.3. Empty State

```typescript
if (!data) {
  return (
    <Card>
      <div className="py-12 text-center">
        <Empty description="Bạn chưa có yêu cầu hoàn trả nào" />
      </div>
    </Card>
  );
}
```

### 4.4. Content Rendering

#### 4.4.1. Header Section

- **Title:** "Yêu cầu hoàn trả mới nhất"
- **Status Tag:** Hiển thị với màu và label tương ứng

#### 4.4.2. Status Messages

Component hiển thị các thông báo đặc biệt dựa trên status:

**APPROVED với autoApproved:**
```typescript
{data.status === 'APPROVED' && data.autoApproved && (
  <Text type="secondary" className="text-xs">
    Yêu cầu trả hàng đã được hệ thống tự duyệt do shop không phản hồi.
  </Text>
)}
```

**SHIPPING với trackingStatus='delivered':**
```typescript
{data.status === 'SHIPPING' && data.trackingStatus === 'delivered' && (
  <Text type="secondary" className="text-xs text-orange-600">
    Shop đã nhận hàng – đang chờ xử lý (tối đa 48 giờ)...
  </Text>
)}
```

**CANCELLED:**
```typescript
{data.status === 'CANCELLED' && (
  <Text type="secondary" className="text-xs">
    Yêu cầu trả hàng đã bị huỷ do bạn không gửi hàng trong thời hạn quy định.
  </Text>
)}
```

**AUTO_REFUNDED:**
```typescript
{data.status === 'AUTO_REFUNDED' && (
  <>
    <Text type="secondary" className="text-xs">
      Shop không phản hồi trong 48 giờ sau khi nhận hàng...
    </Text>
    {/* Hiển thị thông tin về phí vận chuyển dựa trên faultType */}
  </>
)}
```

#### 4.4.3. Product Information

- **Product Name:** `data.productName`
- **Refund Price:** `formatCurrency(data.itemPrice)`
- **Created Date:** `formatDate(data.createdAt)`

#### 4.4.4. Images/Video Preview

**Image Filtering:**
```typescript
const filteredImages = Array.isArray(data.customerImageUrls)
  ? data.customerImageUrls.filter((url) => url && url !== 'string')
  : [];
```

**Video Check:**
```typescript
const hasRealVideo = data.customerVideoUrl && data.customerVideoUrl !== 'string';
```

**Image Grid:**
- Hiển thị tối đa 3 ảnh đầu tiên
- Click để mở modal preview với navigation
- Hiển thị "+N ảnh" nếu có nhiều hơn 3

**Video Thumbnail:**
- Hover để play preview
- Click để mở modal video player

#### 4.4.5. Package Information

**Check Package Info:**
```typescript
const hasPackageInfo =
  data.packageWeight != null &&
  data.packageLength != null &&
  data.packageWidth != null &&
  data.packageHeight != null &&
  data.shippingFee != null;
```

**Nếu có package info:**
- Hiển thị weight, dimensions, shipping fee trong card thông tin

**Nếu chưa có:**
- Hiển thị "Chưa đóng gói"

#### 4.4.6. Action Buttons

**APPROVED + chưa có package info:**
```typescript
<Button
  type="primary"
  onClick={() => handleOpenPackingModal(data)}
>
  Thực hiện đóng gói và hoàn đơn
</Button>
```

**APPROVED + đã có package info:**
```typescript
<Button type="primary" disabled>
  Đã đóng gói
</Button>
```

**CANCELLED:**
```typescript
<Button type="primary" disabled>
  Đã huỷ yêu cầu (quá hạn gửi hàng)
</Button>
```

**AUTO_REFUNDED:**
```typescript
<Button type="primary" disabled>
  Đã hoàn tiền (tự động)
</Button>
```

---

## 5. Related Components

### 5.1. ReturnPackingModal

**File:** `src/components/ReturnPackingModal/ReturnPackingModal.tsx`

**Props:**
```typescript
interface ReturnPackingModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: PackingFormValues) => Promise<void> | void;
  initialValues?: Partial<PackingFormValues>;
  loading?: boolean;
  productWeight?: number | null;
  productDimensions?: string | null;
}
```

**Features:**
- Form nhập weight, length, width, height
- Validation dựa trên product weight và dimensions
- Auto-fill customer và store address IDs
- Hiển thị thông tin sản phẩm và giới hạn nhập

**Validation Rules:**

1. **Weight Validation:**
   - Phải lớn hơn 0
   - Không được nhỏ hơn product weight
   - Nếu product ≤ 5kg: max = productWeight + 0.3kg
   - Nếu product > 5kg: max = productWeight * 1.15

2. **Dimensions Validation:**
   - Phải lớn hơn 0
   - Không được nhỏ hơn product dimensions
   - Max = product dimensions + 2cm mỗi chiều

### 5.2. ReturnPackingService

**File:** `src/services/customer/ReturnPackingService.ts`

**Methods:**

1. **getDefaultAddressesForReturn:**
   - Fetch customer addresses và store addresses song song
   - Tìm địa chỉ mặc định hoặc địa chỉ đầu tiên
   - Return `{ customerAddressId, storeAddressId }`

2. **submitPackageInfo:**
   - POST `/api/customers/me/returns/{returnId}/package-info`
   - Submit package info và nhận shipping fee
   - Return `number | null` (shipping fee)

### 5.3. ProductListService

**File:** `src/services/customer/ProductListService.ts`

**Method:** `getProductById(productId: string)`

- GET `/api/products/{productId}`
- Return product info với weight và dimensions
- Có cache mechanism (5 minutes)

---

## 6. Data Flow

### 6.1. Initial Load Flow

```
Parent Component
  ↓
Pass data prop (ReturnRequestResponse | null)
  ↓
ReturnHistoryCard
  ↓
Check loading/error/empty states
  ↓
Render content based on data.status
```

### 6.2. Packing Modal Flow

```
User clicks "Thực hiện đóng gói"
  ↓
handleOpenPackingModal(record)
  ↓
Parallel API calls:
  - ReturnPackingService.getDefaultAddressesForReturn()
  - ProductListService.getProductById()
  ↓
Set initial values:
  - customerAddressId
  - storeAddressId
  - productWeight
  - productDimensions
  ↓
Open ReturnPackingModal
  ↓
User fills form and submits
  ↓
handleSubmitPacking(values)
  ↓
ReturnPackingService.submitPackageInfo()
  ↓
Show success message with shipping fee
  ↓
Close modal + onReload()
```

### 6.3. Image/Video Preview Flow

```
User clicks image/video
  ↓
Set preview state (visible: true, urls/url, current index)
  ↓
Open Modal with preview
  ↓
User navigates (for images) or closes
  ↓
Update preview state
```

---

## 7. Status-Based UI Logic

### 7.1. Status: PENDING

- **Tag Color:** Gold
- **Label:** "Chờ shop phản hồi"
- **Action:** Không có button (chờ shop duyệt)

### 7.2. Status: APPROVED

- **Tag Color:** Green
- **Label:** "Đã duyệt yêu cầu – Vui lòng gửi hàng"
- **Special Message:** Nếu `autoApproved === true` → hiển thị thông báo tự duyệt
- **Action:**
  - Nếu chưa có package info → Button "Thực hiện đóng gói và hoàn đơn"
  - Nếu đã có package info → Button disabled "Đã đóng gói"

### 7.3. Status: SHIPPING

- **Tag Color:** Blue
- **Label:** "GHN đang vận chuyển"
- **Special Message:** 
  - Nếu `trackingStatus === 'delivered'` → Hiển thị "Shop đã nhận hàng – đang chờ xử lý..."
- **Action:** Không có button

### 7.4. Status: CANCELLED

- **Tag Color:** Gray
- **Label:** "Đã huỷ (khách không gửi hàng)"
- **Special Message:** "Yêu cầu trả hàng đã bị huỷ do bạn không gửi hàng trong thời hạn quy định."
- **Action:** Button disabled "Đã huỷ yêu cầu (quá hạn gửi hàng)"

### 7.5. Status: AUTO_REFUNDED

- **Tag Color:** Blue
- **Label:** "Đã hoàn tiền (tự động)"
- **Special Messages:**
  - "Shop không phản hồi trong 48 giờ sau khi nhận hàng..."
  - Nếu `faultType === 'CUSTOMER'` → "Do lỗi phát sinh từ phía khách, phí vận chuyển trả hàng không được hoàn lại."
  - Nếu `faultType === 'SHOP'` → "Lỗi phát sinh từ phía shop. Phí vận chuyển được xử lý theo chính sách..."
- **Action:** Button disabled "Đã hoàn tiền (tự động)"

---

## 8. Image/Video Preview Features

### 8.1. Image Preview Modal

**Features:**
- Full-screen modal với image viewer
- Navigation buttons (prev/next) nếu có nhiều hơn 1 ảnh
- Counter hiển thị "current / total"
- Click outside để đóng

**Implementation:**
```typescript
<Modal
  open={imagePreview.visible}
  onCancel={() => setImagePreview({ visible: false, urls: [], current: 0 })}
  footer={null}
  width="90vw"
  centered
>
  {/* Image với navigation */}
</Modal>
```

### 8.2. Video Preview Modal

**Features:**
- Video player với controls
- Auto-play khi mở
- Responsive sizing

**Implementation:**
```typescript
<Modal
  open={videoPreview.visible}
  onCancel={() => setVideoPreview({ visible: false, url: '' })}
  footer={null}
  width="90vw"
  centered
>
  <video src={videoPreview.url} controls autoPlay />
</Modal>
```

---

## 9. Package Info Display

### 9.1. Package Info Card

**Condition:** Hiển thị khi có đầy đủ:
- `packageWeight`
- `packageLength`
- `packageWidth`
- `packageHeight`
- `shippingFee`

**Content:**
- Package icon
- Weight (kg)
- Dimensions (L x W x H cm)
- Shipping fee (formatted currency)

### 9.2. Empty Package Info

**Condition:** Khi chưa có package info

**Display:** "Chưa đóng gói" trong gray box

---

## 10. Error Handling

### 10.1. API Error Handling

**getDefaultAddressesForReturn:**
```typescript
try {
  // API calls
} catch (e: any) {
  message.error(e?.message || 'Không thể tự động lấy địa chỉ mặc định...');
}
```

**submitPackageInfo:**
```typescript
try {
  // API call
} catch (e: any) {
  message.error(e?.message || 'Không thể xác nhận đóng gói đơn hoàn trả');
}
```

### 10.2. Validation Errors

- Form validation được handle bởi Ant Design Form
- Custom validators trong ReturnPackingModal
- Error messages hiển thị dưới mỗi field

---

## 11. Performance Optimizations

### 11.1. Parallel API Calls

```typescript
const [addresses, productInfo] = await Promise.all([
  ReturnPackingService.getDefaultAddressesForReturn(record),
  ProductListService.getProductById(record.productId).catch(() => null),
]);
```

### 11.2. Conditional Rendering

- Chỉ render image/video preview khi có data
- Chỉ render package info khi có đầy đủ fields
- Lazy load modal content

### 11.3. Image Filtering

```typescript
const filteredImages = Array.isArray(data.customerImageUrls)
  ? data.customerImageUrls.filter((url) => url && url !== 'string')
  : [];
```

Filter out invalid URLs trước khi render.

---

## 12. Dependencies

### 12.1. External Libraries

- **antd:** Card, Tag, Typography, Spin, Empty, Button, Modal, message
- **lucide-react:** Video, Package, Calendar icons
- **react:** useState hook

### 12.2. Internal Dependencies

- `ReturnRequestResponse` type từ `src/types/api.ts`
- `formatCurrency`, `formatDate` từ `src/utils/orderStatus.ts`
- `ReturnPackingModal` component
- `ReturnPackingService` service
- `ProductListService` service

---

## 13. Testing Considerations

### 13.1. Unit Tests Should Cover

1. **Status Mapping:**
   - Verify correct color và label cho mỗi status
   - Test edge cases (unknown status)

2. **handleOpenPackingModal:**
   - Test successful API calls
   - Test error handling
   - Test với missing product info

3. **handleSubmitPacking:**
   - Test successful submission
   - Test error handling
   - Test với missing selectedReturn

4. **Image/Video Preview:**
   - Test image navigation
   - Test video playback
   - Test với empty arrays

5. **Package Info Display:**
   - Test với đầy đủ info
   - Test với missing info
   - Test với partial info

### 13.2. Integration Tests

1. Test flow từ click button → open modal → submit → reload
2. Test với different status values
3. Test với different data states (loading, error, empty)

---

## 14. Potential Improvements

### 14.1. Code Improvements

1. **Extract Status Config:**
   - Move `statusColorMap` và `statusLabelMap` ra file riêng để reuse
   - Có thể dùng chung với `ReturnHistory.tsx`

2. **Memoization:**
   - Memoize filtered images và video check
   - Memoize package info check

3. **Type Safety:**
   - Define strict type cho status thay vì `string`
   - Use enum hoặc union types

### 14.2. UX Improvements

1. **Loading States:**
   - Show skeleton loader thay vì spinner
   - Show loading state khi fetch addresses

2. **Error Recovery:**
   - Add retry button cho failed API calls
   - Show more detailed error messages

3. **Accessibility:**
   - Add ARIA labels cho buttons
   - Keyboard navigation cho image preview

---

## 15. Related Documentation

- **Return Flow Documentation:** `docs/return-refund-flow.md`
- **Return History Component:** `src/components/ProfilePageComponents/ReturnHistory/ReturnHistory.tsx`
- **Return Packing Modal:** `src/components/ReturnPackingModal/ReturnPackingModal.tsx`
- **Return Packing Service:** `src/services/customer/ReturnPackingService.ts`

---

## 16. Summary

`ReturnHistoryCard` là một component đơn giản nhưng đầy đủ chức năng để hiển thị và quản lý yêu cầu hoàn trả. Component này:

✅ **Hiển thị thông tin đầy đủ:** Status, product info, images/videos, package info  
✅ **Tích hợp đóng gói:** Cho phép khách hàng nhập thông tin đóng gói khi đã được duyệt  
✅ **User-friendly:** Preview images/videos, status messages rõ ràng  
✅ **Error handling:** Xử lý lỗi gracefully với user-friendly messages  
✅ **Performance:** Parallel API calls, conditional rendering  

Component này là một phần quan trọng trong flow hoàn trả, cung cấp entry point cho khách hàng để xem và xử lý yêu cầu hoàn trả của họ.

