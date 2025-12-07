# Tổng Quan Luồng Hoàn Trả / Hoàn Tiền (SEP490-Audio-WepApp)

Tài liệu này tóm tắt luồng xử lý hoàn trả/hoàn tiền từ phía khách hàng và người bán, các điểm UI, và các API liên quan.

---

## 1. Luồng Khách Hàng (Customer Flow)

### 1.1. Tạo Yêu Cầu Hoàn Trả
- **UI Component**: `ReturnRequestModal.tsx` (mở từ order history card/modal)
- **Input**: 
  - Chọn order item cần hoàn trả
  - `reasonType`: `CUSTOMER_FAULT` hoặc `SHOP_FAULT`
  - `reason`: Lý do chi tiết (text)
  - `customerImageUrls`: Mảng URL ảnh (tùy chọn, upload)
  - `customerVideoUrl`: URL video (tùy chọn, upload)
  - `itemPrice`: Giá trị hoàn trả (tự động lấy từ `lineTotal` hoặc `unitPrice`)
- **API Call**: 
  ```typescript
  OrderHistoryService.requestReturn({
    orderItemId: string,
    productId: string,
    itemPrice: number,
    reasonType: 'CUSTOMER_FAULT' | 'SHOP_FAULT',
    reason: string,
    customerImageUrls?: string[],
    customerVideoUrl?: string
  })
  ```
  - **Endpoint**: `POST /api/customers/me/returns`
  - **Response**: `ReturnRequestResponse` với `status: 'PENDING'`
- **Sau khi thành công**: Hiển thị thông báo + điều hướng đến `/returns`

### 1.2. Xem Danh Sách Yêu Cầu Hoàn Trả
- **UI Components**: 
  - `ReturnHistory.tsx` (trang danh sách đầy đủ)
  - `ReturnHistoryCard.tsx` (card hiển thị item mới nhất trên profile)
- **Data Source**: 
  ```typescript
  ReturnHistoryService.list({ page, size })
  ```
  - **Endpoint**: `GET /api/customers/me/returns?page={page}&size={size}`
  - **Response**: `{ data: ReturnRequestResponse[], total, totalPages, page, size }`
- **Status Labels**: 
  - `PENDING`: "Chờ shop phản hồi"
  - `APPROVED`: "Shop đã duyệt"
  - `REJECTED`: "Từ chối"
  - `SHIPPING`: "Đang hoàn trả"
  - `REFUNDED`: "Đã hoàn tiền"
  - `CANCELLED`: "Đã huỷ"
  - `AUTO_REFUNDED`: "AUTO REFUND – Hệ thống hoàn tiền"
- **Media Preview**: 
  - Ảnh: Grid hiển thị với modal preview (zoom)
  - Video: Player với preview modal

### 1.3. Bước Đóng Gói (Chỉ khi status=APPROVED và chưa có package info)
- **UI Component**: `ReturnPackingModal` (mở từ `ReturnHistory`)
- **Preload Data**:
  - **Địa chỉ khách hàng**: 
    ```typescript
    AddressService.getAddresses() // Lấy default address
    ```
  - **Địa chỉ cửa hàng**: 
    ```typescript
    CustomerStoreService.getStoreDetailWithAddresses(shopId) // Lấy default store address
    ```
  - **Thông tin sản phẩm**: 
    ```typescript
    ProductListService.getProductById(productId) // Lấy weight và dimensions
    ```
- **Validation Rules**:
  - **Trọng lượng**: 
    - Nếu `productWeight ≤ 5kg`: `max = productWeight + 0.3kg`
    - Nếu `productWeight > 5kg`: `max = productWeight * 1.15`
  - **Kích thước**: Mỗi cạnh `≤ productDimension + 2cm`
  - **UI**: Không prefill giá trị số; ẩn InputNumber arrows
- **Submit Package Info**:
  ```typescript
  ReturnPackingService.submitPackageInfo(returnId, {
    weight: number,        // gram
    length: number,       // cm
    width: number,        // cm
    height: number,       // cm
    customerAddressId: string,
    storeAddressId: string
  })
  ```
  - **Endpoint**: `POST /api/customers/me/returns/{id}/package-info`
  - **Response**: `{ shippingFee: number }`
  - **Effect**: 
    - Backend cập nhật `packageWeight`, `packageLength`, `packageWidth`, `packageHeight`, `shippingFee`
    - UI disable nút "Đóng gói"
    - Hiển thị thông tin gói hàng trong danh sách

### 1.4. Trạng Thái và Hiển Thị Sau Đóng Gói
- Nếu đã có package info: Nút "Đóng gói" bị disable; hiển thị thông tin gói hàng trong `ReturnHistory`
- **GHN Tracking** (phía khách hàng): 
  - Hiển thị trong order history (`OrderCard`, `OrderDetailModal`) khi có GHN code
  - API: `OrderHistoryService.getGhnOrderByStoreOrderId(storeOrderId)`
  - Link tracking: `https://donhang.ghn.vn/?order_code={ghnOrderCode}`

---

## 2. Luồng Người Bán (Seller Flow)

### 2.1. Xem Danh Sách Yêu Cầu Hoàn Trả
- **UI Component**: `StoreReturnList.tsx` (bảng với pagination)
- **Data Source**: 
  ```typescript
  StoreReturnService.list({ page, size })
  ```
  - **Endpoint**: `GET /api/store/returns?page={page}&size={size}`
  - **Response**: `{ data: ReturnRequestResponse[], total, totalPages, page, size }`
- **Columns**: 
  - Sản phẩm, Giá hoàn trả, Loại lý do, Lý do chi tiết
  - Trạng thái (với badge màu)
  - Hình ảnh/Video (preview grid)
  - Thông tin gói hàng (weight, dimensions, shippingFee)
  - GHN/Tracking (mã đơn, link tracking)
  - Ngày tạo
  - Thao tác (approve/reject/GHN actions)

### 2.2. Quyết Định Duyệt/Từ Chối

#### 2.2.1. Duyệt Yêu Cầu (Approve)
```typescript
StoreReturnService.approve(returnId)
```
- **Endpoint**: `POST /api/store/returns/{id}/approve`
- **Request Body**: Không có (empty body)
- **Response**: `200 OK` (no body)
- **Effect**: 
  - Status: `PENDING` → `APPROVED`
  - Khách hàng có thể nhập thông tin gói hàng

#### 2.2.2. Từ Chối Yêu Cầu (Reject)
```typescript
StoreReturnService.reject(returnId, shopRejectReason)
```
- **Endpoint**: `POST /api/store/returns/{id}/reject`
- **Request Body**: 
  ```json
  {
    "shopRejectReason": "string" // Lý do từ chối (bắt buộc)
  }
  ```
- **Response**: `200 OK` (no body)
- **Effect**: 
  - Status: `PENDING` → `REJECTED`
  - Terminal state (không thể thay đổi)

### 2.3. Tạo Đơn GHN Lấy Hàng Trả (Khi đã có package info và status=APPROVED)

#### 2.3.1. Chọn Ca Lấy Hàng
- **UI Component**: `PickShiftModal.tsx`
- **Load Pick Shifts**:
  ```typescript
  GhnService.getPickShifts()
  ```
  - **Endpoint**: `GET /api/ghn/pick-shifts`
  - **Response**: 
    ```json
    {
      "code": 200,
      "message": "success",
      "data": [
        {
          "id": 1,
          "title": "Ca sáng (8:00 - 12:00)",
          "from_time": 28800,
          "to_time": 43200
        },
        ...
      ]
    }
    ```
- **UI**: Dropdown hiển thị `title` của mỗi ca

#### 2.3.2. Xác Nhận Ca Lấy Hàng và Tạo Đơn GHN
```typescript
StoreReturnService.createGhnOrder(returnId, pickShiftId)
```
- **Endpoint**: `POST /api/store/returns/{id}/create-ghn-order`
- **Request Body**: 
  ```json
  {
    "pickShiftId": 1
  }
  ```
- **Response**: `ReturnRequestResponse` với `ghnOrderCode` đã được populate
- **Effect**: 
  - Status vẫn là `APPROVED` nhưng có `ghnOrderCode`
  - Backend tự động tạo đơn GHN với thông tin:
    - Địa chỉ lấy hàng: Địa chỉ khách hàng (từ `customerAddressId`)
    - Địa chỉ giao hàng: Địa chỉ cửa hàng (từ `storeAddressId`)
    - Thông tin gói hàng: `packageWeight`, `packageLength`, `packageWidth`, `packageHeight`
    - Ca lấy hàng: `pickShiftId`
  - UI hiển thị GHN code + link "Theo dõi đơn" → `https://donhang.ghn.vn/?order_code={ghnOrderCode}`

### 2.4. Hủy Đơn GHN
- **UI**: Nút "Hủy đơn GHN" phía trên bảng
- **Modal**: Nhập mã đơn GHN cần hủy
- **API Call**:
  ```typescript
  GhnService.cancelOrder([orderCode])
  ```
  - **Endpoint**: `POST /api/ghn/cancel-order`
  - **Request Body**: 
    ```json
    {
      "order_codes": ["GYNP9EWK"]
    }
    ```
  - **Response**: `{ code: 200, message: "success" }`
- **Sau khi hủy**: Refresh danh sách yêu cầu hoàn trả

### 2.5. Theo Dõi Đơn GHN
- GHN code hiển thị trong bảng `StoreReturnList`
- Link "Theo dõi đơn" mở tab mới: `https://donhang.ghn.vn/?order_code={ghnOrderCode}`
- Tracking status được cập nhật từ backend (webhook từ GHN)

---

## 3. Mô Hình Dữ Liệu (Data Models)

### 3.1. ReturnRequestResponse
```typescript
interface ReturnRequestResponse {
  // IDs
  id: string;                    // ID yêu cầu hoàn trả
  customerId: string;            // ID khách hàng
  shopId: string;                // ID cửa hàng
  orderItemId: string;          // ID order item
  productId: string;             // ID sản phẩm
  
  // Product Info
  productName: string;          // Tên sản phẩm
  itemPrice: number;            // Giá trị hoàn trả
  faultType: 'UNKNOWN' | 'CUSTOMER' | 'SHOP'; // Phân loại lỗi
  reasonType: 'CUSTOMER_FAULT' | 'SHOP_FAULT'; // Loại lý do
  reason: string;               // Lý do chi tiết
  
  // Media
  customerImageUrls: string[];   // Mảng URL ảnh
  customerVideoUrl: string | null; // URL video
  
  // Status
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPING' | 'REFUNDED' | 'CANCELLED' | 'AUTO_REFUNDED';
  autoApproved?: boolean;        // Flag tự động duyệt (nếu có)
  
  // Package Info
  packageWeight: number | null;  // Trọng lượng (kg)
  packageLength: number | null; // Chiều dài (cm)
  packageWidth: number | null;  // Chiều rộng (cm)
  packageHeight: number | null; // Chiều cao (cm)
  shippingFee: number | null;   // Phí vận chuyển
  
  // Logistics
  ghnOrderCode: string | null;  // Mã đơn GHN
  trackingStatus: string | null; // Trạng thái tracking (delivered, ready_to_pick, ...)
  
  // Timestamps
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}
```

---

## 4. Điểm Vào UI (UI Entry Points)

### 4.1. Khách Hàng
- **Tạo yêu cầu**: Order history card/modal → `ReturnRequestModal`
- **Quản lý đóng gói**: Return history list → "Thực hiện đóng gói và hoàn đơn" → `ReturnPackingModal`
- **Xem lịch sử**: 
  - `/returns` (`ReturnHistoryPage`) - Trang danh sách đầy đủ
  - Profile page → `ReturnHistoryCard` - Card item mới nhất

### 4.2. Người Bán
- **Quản lý hoàn trả**: `StoreReturnList` (bảng với actions)
- **Chọn ca lấy hàng**: `PickShiftModal` (mở từ StoreReturnList)
- **Hủy GHN**: Nút phía trên bảng `StoreReturnList`

---

## 5. Tóm Tắt API

### 5.1. Customer APIs

#### 5.1.1. POST Tạo Yêu Cầu Hoàn Trả
- **Endpoint**: `POST /api/customers/me/returns`
- **Request Body**:
  ```json
  {
    "orderItemId": "string",
    "productId": "string",
    "itemPrice": 0,
    "reasonType": "CUSTOMER_FAULT | SHOP_FAULT",
    "reason": "string",
    "customerImageUrls": ["string"],  // Optional
    "customerVideoUrl": "string"      // Optional
  }
  ```
- **Response**: `ReturnRequestResponse` với `status: 'PENDING'`
- **Status Code**: `201 Created`

#### 5.1.2. GET Danh Sách Yêu Cầu Hoàn Trả
- **Endpoint**: `GET /api/customers/me/returns?page={page}&size={size}`
- **Response**: 
  ```json
  {
    "content": [ReturnRequestResponse],
    "totalElements": 0,
    "totalPages": 0,
    "page": 0,
    "size": 20
  }
  ```
- **Status Code**: `200 OK`

#### 5.1.3. POST Gửi Thông Tin Gói Hàng
- **Endpoint**: `POST /api/customers/me/returns/{id}/package-info`
- **Request Body**:
  ```json
  {
    "weight": 0,        // gram
    "length": 0,        // cm
    "width": 0,         // cm
    "height": 0,        // cm
    "customerAddressId": "string",
    "storeAddressId": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "shippingFee": 0
  }
  ```
- **Effect**: 
  - Cập nhật `packageWeight`, `packageLength`, `packageWidth`, `packageHeight`, `shippingFee`
  - Disable nút "Đóng gói" trong UI
- **Status Code**: `200 OK`

#### 5.1.4. Support APIs
- `GET /api/customers/me/addresses` - Lấy danh sách địa chỉ khách hàng
- `GET /api/store/{shopId}` - Lấy thông tin cửa hàng (bao gồm địa chỉ)
- `GET /api/products/{productId}` - Lấy thông tin sản phẩm (weight, dimensions)

### 5.2. Seller APIs

#### 5.2.1. GET Danh Sách Yêu Cầu Hoàn Trả
- **Endpoint**: `GET /api/store/returns?page={page}&size={size}`
- **Response**: Tương tự Customer API
- **Status Code**: `200 OK`

#### 5.2.2. POST Duyệt Yêu Cầu
- **Endpoint**: `POST /api/store/returns/{id}/approve`
- **Request Body**: Không có (empty body)
- **Response**: `200 OK` (no body)
- **Effect**: Status `PENDING` → `APPROVED`

#### 5.2.3. POST Từ Chối Yêu Cầu
- **Endpoint**: `POST /api/store/returns/{id}/reject`
- **Request Body**:
  ```json
  {
    "shopRejectReason": "string"
  }
  ```
- **Response**: `200 OK` (no body)
- **Effect**: Status `PENDING` → `REJECTED`

#### 5.2.4. POST Tạo Đơn GHN Lấy Hàng Trả
- **Endpoint**: `POST /api/store/returns/{id}/create-ghn-order`
- **Request Body**:
  ```json
  {
    "pickShiftId": 1
  }
  ```
- **Response**: `ReturnRequestResponse` với `ghnOrderCode` đã được populate
- **Effect**: 
  - Backend tự động tạo đơn GHN với thông tin từ package info
  - Status vẫn là `APPROVED` nhưng có `ghnOrderCode`
- **Status Code**: `200 OK`

#### 5.2.5. POST Hoàn Tiền Không Cần Trả Hàng
- **Endpoint**: `POST /api/store/returns/{id}/refund-without-return`
- **Request Body**: Không có (empty body)
- **Response**: `200 OK` (no body)
- **Effect**: 
  - Status `PENDING` → `REFUNDED`
  - Không tạo đơn GHN
  - Khách hàng không cần gửi lại hàng
- **Status Code**: `200 OK`

#### 5.2.6. GHN APIs
- **GET Danh Sách Ca Lấy Hàng**: 
  - `GET /api/ghn/pick-shifts`
  - Response: `{ code: 200, data: PickShift[] }`
- **POST Hủy Đơn GHN**: 
  - `POST /api/ghn/cancel-order`
  - Request: `{ order_codes: string[] }`
  - Response: `{ code: 200, message: "success" }`

---

## 6. Máy Trạng Thái (Status State Machine)

### 6.1. PENDING
- **Vào**: Khách hàng tạo yêu cầu hoàn trả
- **Ra**:
  - `APPROVED` (người bán duyệt hoặc auto-approve sau 48h)
  - `REJECTED` (người bán từ chối với lý do)
  - `REFUNDED` (người bán hoàn tiền không cần trả hàng)

### 6.2. APPROVED
- **Vào**: Người bán duyệt hoặc auto-approve sau 48h
- **Hành động khách hàng**: Gửi thông tin gói hàng (`POST /package-info`) → cập nhật package fields + `shippingFee`
- **Hành động người bán**: Tạo đơn GHN (`POST /create-ghn-order`) → populate `ghnOrderCode`
- **Ra**: 
  - `SHIPPING` (khi logistics bắt đầu - server-driven)
  - `CANCELLED` (auto-cancel nếu khách không gửi hàng sau 72h)

### 6.3. SHIPPING
- **Vào**: Logistics bắt đầu (server-driven, khi GHN bắt đầu vận chuyển)
- **Tracking**: Theo dõi qua `ghnOrderCode` và `trackingStatus`
- **Ra**: 
  - `REFUNDED` (hoàn tiền thành công)
  - `AUTO_REFUNDED` (shop không xử lý sau 48h khi nhận hàng)

### 6.4. REJECTED
- **Vào**: Người bán từ chối với lý do
- **Ra**: Terminal state (không thể thay đổi)

### 6.5. REFUNDED
- **Vào**: 
  - Hoàn tiền thành công sau khi nhận hàng
  - Hoàn tiền không cần trả hàng (`refund-without-return`)
- **Ra**: Terminal state

### 6.6. CANCELLED
- **Vào**: Auto-cancel nếu khách không gửi hàng sau 72h (từ `APPROVED`)
- **Ra**: Terminal state

### 6.7. AUTO_REFUNDED
- **Vào**: Auto refund nếu shop không xử lý sau 48h khi nhận hàng (từ `SHIPPING` với `trackingStatus='delivered'`)
- **Ra**: Terminal state

---

## 7. Vai Trò và Trách Nhiệm Theo Từng Bước

### 7.1. Khách Hàng
- **Tạo yêu cầu**: `POST /api/customers/me/returns`
- **Gửi thông tin gói hàng**: `POST /api/customers/me/returns/{id}/package-info` (sau khi `APPROVED`)
- **Xem lịch sử**: `GET /api/customers/me/returns`

### 7.2. Người Bán
- **Duyệt/Từ chối**: `POST /api/store/returns/{id}/approve` hoặc `/reject`
- **Tạo đơn GHN**: `POST /api/store/returns/{id}/create-ghn-order` (sau khi có package info)
- **Hủy GHN**: `POST /api/ghn/cancel-order` (nếu cần)
- **Hoàn tiền không cần trả hàng**: `POST /api/store/returns/{id}/refund-without-return`

### 7.3. Hệ Thống/Logistics
- **Tính phí vận chuyển**: Response từ `POST /package-info`
- **Cập nhật trạng thái**: 
  - `APPROVED` → `SHIPPING` (khi GHN bắt đầu vận chuyển)
  - `SHIPPING` → `REFUNDED` (khi hoàn tiền thành công)
  - Auto-approve sau 48h nếu shop không phản hồi
  - Auto-cancel sau 72h nếu khách không gửi hàng
  - Auto-refund sau 48h nếu shop không xử lý sau khi nhận hàng

---

## 8. Các Trường Hợp Đặc Biệt (Special Cases)

### 8.1. Case 4.1 – Tự Động Duyệt Sau 48h (Shop Không Phản Hồi)

#### 8.1.1. Business Rule (Backend)
- Nếu yêu cầu hoàn trả ở trạng thái `PENDING` > 48h mà shop không có hành động, hệ thống tự động chuyển sang `APPROVED`.

#### 8.1.2. Hành Vi UI Khách Hàng
- **Trước auto-approve** (`PENDING`):
  - Status chip: "Chờ shop phản hồi"
  - Buttons disabled: edit request, enter package weight, cancel
- **Sau auto-approve** (`APPROVED` với `autoApproved: true`):
  - Hiển thị thông báo: "Yêu cầu trả hàng đã được hệ thống tự duyệt do shop không phản hồi."
  - Status label: "Shop đã duyệt (tự động)"
  - Enable: "Nhập thông tin gói hàng" / "Tạo phiếu gửi" (packing modal)

#### 8.1.3. Hành Vi UI Người Bán
- **Trước auto-approve** (`PENDING`):
  - Status text: "Yêu cầu mới – Chờ xử lý"
  - Actions enabled: "Chấp nhận trả hàng" (approve), "Từ chối" (reject)
  - (Optional) Countdown: "Tự động duyệt sau XX giờ…"
- **Sau auto-approve** (`APPROVED` với `autoApproved: true`):
  - Banner/status: "Yêu cầu đã được hệ thống tự duyệt do quá 48 giờ không phản hồi."
  - Disable/Hide: "Chấp nhận", "Từ chối" với tooltip "Yêu cầu đã được hệ thống auto-approve, không thể thay đổi."
  - Vẫn cho phép: Tạo đơn GHN lấy hàng trả (create GHN return order)

#### 8.1.4. Frontend Implications
- **Cách phát hiện auto-approve**:
  - Lý tưởng: Backend trả về flag `autoApproved: true` hoặc `autoApprovedAt` trong `ReturnRequestResponse`
  - Nếu không có flag: Có nguy cơ nhầm lẫn; yêu cầu backend thêm field rõ ràng. Tránh suy luận chỉ dựa trên timestamps.
- **Điều chỉnh rendering**:
  - Khách hàng: Hiển thị thông báo có điều kiện + override status label khi `autoApproved`
  - Người bán: Disable approve/reject, hiển thị banner và tooltip, vẫn cho phép tạo GHN

### 8.2. Case 4.2 – Tự Động Hủy Sau 72h (Khách Không Gửi Hàng)
- **Rule**: `APPROVED` → `CANCELLED` nếu khách không gửi hàng (backend có thể rút ngắn thời gian để test)
- **Khách hàng**: 
  - Trạng thái `CANCELLED`, note "bị huỷ do không gửi hàng"
  - Ẩn mọi action
- **Người bán**: 
  - `CANCELLED`, note "Khách không gửi hàng"
  - Ẩn Approve/Reject/GHN actions

### 8.3. Case 4.3 – Shop Không Xử Lý 48h Sau Khi Nhận Hàng → AUTO_REFUNDED
- **Rule**: `SHIPPING` + `trackingStatus='delivered'`, quá 48h không gọi `shopReceiveOrDispute` → `AUTO_REFUNDED`, refund `itemPrice` (không phí ship), `faultType` theo `reasonType` (CUSTOMER/SHOP)
- **Khách hàng**:
  - `SHIPPING` + delivered: Cảnh báo "Shop đã nhận hàng – chờ xử lý 48h, nếu không sẽ tự hoàn tiền (không hoàn phí trả hàng)."
  - `AUTO_REFUNDED`: Badge, mô tả theo `faultType` (CUSTOMER: không hoàn phí trả hàng; SHOP: phí theo chính sách KM); ẩn action
- **Người bán**:
  - `AUTO_REFUNDED`: Thông báo "Hệ thống đã tự hoàn tiền do shop không xử lý trong thời hạn." Ẩn action

### 8.4. Case 4.4 – GHN Không Pickup 48h → Tạo Lại GHN
- **Rule**: Backend reset về `APPROVED`, đã có package + `shippingFee`, nhưng `ghnOrderCode=null` (đơn GHN cũ timeout/hủy)
- **Người bán**: 
  - Banner "GHN không lấy hàng, vui lòng tạo lại đơn GHN"
  - Nút pick-shift đổi thành "Tạo lại đơn GHN trả hàng"
- **Khách hàng**: Optional note "Shop sẽ tạo lại đơn lấy hàng mới."

### 8.5. Case 8 – Hoàn Tiền Không Cần Trả Hàng (Refund Without Return)
- **Người bán**:
  - Nút "Hoàn tiền không cần trả hàng" chỉ hiển thị khi `status=PENDING` và `ghnOrderCode=null`
  - Modal xác nhận: 
    - Số tiền hoàn = `itemPrice`
    - Nhắc: Không tạo GHN, khách không cần gửi hàng
    - Phí ship không hoàn
  - API: `POST /api/store/returns/{id}/refund-without-return`
  - Thành công: 
    - Status → `REFUNDED`
    - Toast "Hoàn tiền thành công. Khách không cần gửi lại hàng."
    - Ẩn mọi action khác
  - Lỗi: Hiển thị message từ backend
- **Khách hàng**:
  - Xử lý như `REFUNDED`
  - Nếu backend trả `refundWithoutReturn=true` có thể hiển thị note "Shop đã hoàn tiền, bạn không cần gửi lại hàng. Phí vận chuyển ban đầu không được hoàn."

---

## 9. Luồng Trạng Thái Điển Hình (Typical Status Flow)

1. **Khách hàng tạo yêu cầu** → `PENDING`
2. **Người bán duyệt** (hoặc auto-approve sau 48h) → `APPROVED`
3. **Khách hàng nhập thông tin gói hàng** → Tính `shippingFee`; disable nút đóng gói
4. **Người bán chọn ca lấy hàng** → Tạo đơn GHN, populate `ghnOrderCode`
5. **Logistics tiến hành** → `SHIPPING`
6. **Hoàn tiền thành công** → `REFUNDED`

---

## 10. UX/Validation Đáng Chú Ý

- **Giới hạn trọng lượng/kích thước sản phẩm**: Được enforce trong `ReturnPackingModal`
- **Input không prefill**: Up/down arrows bị ẩn trên các trường số
- **Thông báo thành công**: Sau khi gửi package info, hiển thị `shippingFee`
- **Media preview modals**: Cho ảnh/video trong cả UI khách hàng và người bán
- **GHN tracking link**: Hiển thị khi có GHN code (cả view khách hàng và người bán)

---

## 11. Các File Tham Khảo

### 11.1. Customer UI Components
- `ReturnRequestModal.tsx` - Modal tạo yêu cầu hoàn trả
- `ReturnHistory.tsx` - Trang danh sách yêu cầu hoàn trả
- `ReturnHistoryCard.tsx` - Card hiển thị item mới nhất trên profile
- `ReturnPackingModal.tsx` - Modal nhập thông tin gói hàng
- `ReturnHistoryPage.tsx` - Trang chính hiển thị return history

### 11.2. Seller UI Components
- `StoreReturnList.tsx` - Bảng quản lý yêu cầu hoàn trả (người bán)
- `PickShiftModal.tsx` - Modal chọn ca lấy hàng
- `GhnTransferModal.tsx` - Modal tạo đơn GHN cho đơn hàng thông thường (KHÔNG phải return)
- `StoreOrderCard.tsx` - Card hiển thị đơn hàng (có nút "Chuyển nhượng GHN")
- `AssignDeliveryModal.tsx` - Modal phân công nhân viên giao hàng
- `StoreOrderDetailModal.tsx` - Modal chi tiết đơn hàng

### 11.3. Services
- `OrderHistoryService.ts` - Service xử lý order history (khách hàng)
- `ReturnHistoryService.ts` - Service xử lý return history (khách hàng)
- `ReturnPackingService.ts` - Service xử lý đóng gói
- `StoreReturnService.ts` - Service xử lý return (người bán)
- `GhnService.ts` - Service tích hợp GHN API
- `ProductListService.ts` - Service lấy thông tin sản phẩm
- `AddressService.ts` - Service quản lý địa chỉ
- `CustomerStoreService.ts` - Service lấy thông tin cửa hàng
- `StoreOrderService.ts` - Service quản lý đơn hàng (người bán)

---

## 12. Phân Tích Chi Tiết Luồng API Logic

### 12.1. Luồng Tạo Yêu Cầu Hoàn Trả (Customer)

```
1. Khách hàng mở ReturnRequestModal từ OrderCard/OrderDetailModal
   ↓
2. Chọn order item cần hoàn trả
   ↓
3. Nhập reasonType, reason, upload images/videos (optional)
   ↓
4. Gọi API: POST /api/customers/me/returns
   Request Body: {
     orderItemId: string,
     productId: string,
     itemPrice: number,
     reasonType: 'CUSTOMER_FAULT' | 'SHOP_FAULT',
     reason: string,
     customerImageUrls?: string[],
     customerVideoUrl?: string
   }
   ↓
5. Backend tạo ReturnRequest với status='PENDING'
   ↓
6. Response: ReturnRequestResponse
   ↓
7. UI: Hiển thị thông báo thành công + navigate to /returns
```

### 12.2. Luồng Đóng Gói (Customer)

```
1. Khách hàng mở ReturnPackingModal từ ReturnHistory
   ↓
2. Preload data:
   - AddressService.getAddresses() → customer default address
   - CustomerStoreService.getStoreDetailWithAddresses(shopId) → store default address
   - ProductListService.getProductById(productId) → weight, dimensions
   ↓
3. Khách hàng nhập:
   - weight (gram): validate ≤ productWeight + 0.3kg (nếu ≤5kg) hoặc ≤ productWeight * 1.15 (nếu >5kg)
   - length, width, height (cm): validate ≤ productDimension + 2cm mỗi cạnh
   - customerAddressId, storeAddressId
   ↓
4. Gọi API: POST /api/customers/me/returns/{id}/package-info
   Request Body: {
     weight: number,
     length: number,
     width: number,
     height: number,
     customerAddressId: string,
     storeAddressId: string
   }
   ↓
5. Backend:
   - Validate package info
   - Tính shippingFee (dựa trên weight, dimensions, addresses)
   - Cập nhật packageWeight, packageLength, packageWidth, packageHeight, shippingFee
   ↓
6. Response: { shippingFee: number }
   ↓
7. UI: 
   - Hiển thị thông báo thành công với shippingFee
   - Disable nút "Đóng gói"
   - Hiển thị thông tin gói hàng trong ReturnHistory
```

### 12.3. Luồng Duyệt/Từ Chối (Seller)

```
1. Người bán xem StoreReturnList
   ↓
2. Chọn action: "Duyệt hoàn trả" hoặc "Từ chối"
   ↓
3a. Nếu Duyệt:
   Gọi API: POST /api/store/returns/{id}/approve
   Request Body: (empty)
   ↓
   Backend: status PENDING → APPROVED
   ↓
   Response: 200 OK
   ↓
   UI: Refresh list, hiển thị status mới

3b. Nếu Từ Chối:
   Mở modal nhập lý do từ chối
   ↓
   Gọi API: POST /api/store/returns/{id}/reject
   Request Body: { shopRejectReason: string }
   ↓
   Backend: status PENDING → REJECTED
   ↓
   Response: 200 OK
   ↓
   UI: Refresh list, hiển thị status REJECTED
```

### 12.4. Luồng Tạo Đơn GHN Lấy Hàng Trả (Seller)

```
1. Người bán xem StoreReturnList
   ↓
2. Kiểm tra: status=APPROVED và đã có package info (packageWeight, shippingFee)
   ↓
3. Click "Xác nhận ca lấy hàng" → Mở PickShiftModal
   ↓
4. Load danh sách ca lấy hàng:
   Gọi API: GET /api/ghn/pick-shifts
   Response: { code: 200, data: PickShift[] }
   ↓
5. Người bán chọn ca lấy hàng (pickShiftId)
   ↓
6. Gọi API: POST /api/store/returns/{id}/create-ghn-order
   Request Body: { pickShiftId: number }
   ↓
7. Backend:
   - Lấy thông tin từ ReturnRequest:
     * customerAddressId → địa chỉ lấy hàng
     * storeAddressId → địa chỉ giao hàng
     * packageWeight, packageLength, packageWidth, packageHeight
   - Gọi GHN API để tạo đơn lấy hàng trả
   - Cập nhật ghnOrderCode vào ReturnRequest
   ↓
8. Response: ReturnRequestResponse với ghnOrderCode đã được populate
   ↓
9. UI:
   - Hiển thị GHN code
   - Hiển thị link "Theo dõi đơn" → https://donhang.ghn.vn/?order_code={ghnOrderCode}
   - Refresh list
```

### 12.5. Luồng Hoàn Tiền Không Cần Trả Hàng (Seller)

```
1. Người bán xem StoreReturnList
   ↓
2. Kiểm tra: status=PENDING và ghnOrderCode=null
   ↓
3. Click "Hoàn tiền không cần trả hàng" → Mở modal xác nhận
   ↓
4. Modal hiển thị:
   - Số tiền hoàn: itemPrice
   - Lưu ý: Không tạo GHN, khách không cần gửi hàng, phí ship không hoàn
   ↓
5. Xác nhận → Gọi API: POST /api/store/returns/{id}/refund-without-return
   Request Body: (empty)
   ↓
6. Backend:
   - Status PENDING → REFUNDED
   - Refund itemPrice cho khách hàng
   - Không tạo đơn GHN
   ↓
7. Response: 200 OK
   ↓
8. UI:
   - Toast "Hoàn tiền thành công. Khách không cần gửi lại hàng."
   - Refresh list
   - Ẩn mọi action khác
```

---

## 13. GhnTransferModal - Tạo Đơn GHN Cho Đơn Hàng Thông Thường

**LƯU Ý**: `GhnTransferModal` KHÔNG phải cho return/refund flow. Nó được sử dụng để tạo đơn GHN cho đơn hàng thông thường (giao hàng từ shop đến khách hàng).

### 13.1. Mục Đích
- Tạo đơn GHN để giao hàng từ cửa hàng đến khách hàng
- Sử dụng khi đơn hàng ở trạng thái `AWAITING_SHIPMENT`

### 13.2. Entry Point
- **UI Component**: `StoreOrderCard.tsx`
- **Trigger**: Nút "Chuyển nhượng GHN" (chỉ hiển thị khi `status='AWAITING_SHIPMENT'`)

### 13.3. Luồng Xử Lý

```
1. Người bán click "Chuyển nhượng GHN" từ StoreOrderCard
   ↓
2. Mở GhnTransferModal với orderId
   ↓
3. Preload data:
   a. Load pick shifts:
      GET /api/ghn/pick-shifts
   b. Load order details:
      StoreOrderService.getOrderById(orderId)
      - Lấy customer info: shipReceiverName, shipPhoneNumber
      - Lấy customer addresses: StoreOrderService.getCustomerAddresses(customerId)
      - Lấy order items để map thành GHN items
   c. Load store info:
      StoreService.getStoreInfo()
      - Lấy storeName, phoneNumber
   d. Load store addresses:
      StoreAddressService.getStoreAddresses()
      - Lấy default address làm "from address"
   ↓
4. Auto-fill form:
   - From address: Store address (from_name, from_phone, from_address)
   - To address: Customer shipping address (to_name, to_phone, to_address, to_ward_code, to_district_id)
   - Items: Map từ order items, fetch product SKU từ ProductService.getProductById()
   - COD amount: Tự động = tổng giá trị sản phẩm
   ↓
5. Người bán điền thông tin:
   - service_type_id (1: Express, 2: Standard)
   - required_note (CHOTHUHANG, CHOXEMHANGKHONGTHU, KHONGCHOXEMHANG)
   - Package info: weight, length, width, height
   - Item details: length, width, height, weight, category cho từng item
   - pick_shift: Chọn ca lấy hàng
   - Optional: note, coupon, insurance_value, service_id
   ↓
6. Validation:
   - Package weight/dimensions phải ≥ tổng items
   - COD amount phải ≤ tổng giá trị sản phẩm
   - Tất cả fields bắt buộc phải có giá trị
   ↓
7. Submit → Gọi API: POST /api/ghn/create-order
   Request Body: GhnCreateOrderRequest {
     payment_type_id: 1, // Shop trả phí ship
     required_note: string,
     from_name, from_phone, from_address, from_ward_name, from_district_name, from_province_name,
     to_name, to_phone, to_address, to_ward_code, to_district_id,
     weight, length, width, height,
     service_type_id: number,
     pick_shift: [number],
     items: GhnItem[],
     cod_amount?: number,
     return_phone?, return_address?, return_district_id?, return_ward_code?,
     note?, coupon?, insurance_value?, service_id?
   }
   ↓
8. Backend gọi GHN API để tạo đơn
   ↓
9. Response: {
     code: 200,
     data: {
       order_code: string,
       expected_delivery_time: string,
       total_fee: number,
       fee: { main_service, insurance, station_do, station_pu }
     }
   }
   ↓
10. Tự động tạo GHN order record trong database:
    POST /api/v1/ghn-orders
    Request Body: {
      storeOrderId: string,
      storeId: string,
      orderGhn: string, // order_code từ GHN
      totalFee: number,
      expectedDeliveryTime: string,
      status: 'READY_PICKUP'
    }
   ↓
11. UI:
    - Hiển thị thông báo thành công với order_code, expected_delivery_time, total_fee
    - Đóng modal
    - Refresh order list
```

### 13.4. API Endpoints Liên Quan

#### 13.4.1. POST Tạo Đơn GHN
- **Endpoint**: `POST /api/ghn/create-order`
- **Request Body**: `GhnCreateOrderRequest` (xem chi tiết trong `GhnService.ts`)
- **Response**: `GhnCreateOrderResponse` với `order_code`, `expected_delivery_time`, `total_fee`

#### 13.4.2. POST Tạo GHN Order Record
- **Endpoint**: `POST /api/v1/ghn-orders`
- **Request Body**: 
  ```json
  {
    "storeOrderId": "string",
    "storeId": "string",
    "orderGhn": "string",
    "totalFee": 0,
    "expectedDeliveryTime": "string",
    "status": "READY_PICKUP"
  }
  ```
- **Response**: `{ status: 200, data: { id, ... } }`

### 13.5. Khác Biệt Với Return Flow

| Aspect | GhnTransferModal (Đơn hàng thông thường) | Return Flow |
|--------|------------------------------------------|-------------|
| **Mục đích** | Giao hàng từ shop → khách | Lấy hàng trả từ khách → shop |
| **From address** | Địa chỉ cửa hàng | Địa chỉ khách hàng |
| **To address** | Địa chỉ khách hàng | Địa chỉ cửa hàng |
| **COD amount** | Tổng giá trị đơn hàng | Không có (hoàn trả) |
| **API endpoint** | `POST /api/ghn/create-order` | `POST /api/store/returns/{id}/create-ghn-order` |
| **Status trigger** | `AWAITING_SHIPMENT` | `APPROVED` + có package info |
| **Pick shift** | Người bán chọn trong modal | Người bán chọn trong PickShiftModal |

---

## 14. Tổng Kết

### 14.1. Customer Flow Summary
1. Tạo yêu cầu hoàn trả → `PENDING`
2. Chờ shop duyệt (hoặc auto-approve sau 48h) → `APPROVED`
3. Nhập thông tin gói hàng → Tính shippingFee
4. Chờ shop tạo đơn GHN → Có `ghnOrderCode`
5. Theo dõi đơn GHN → `SHIPPING`
6. Nhận hoàn tiền → `REFUNDED`

### 14.2. Seller Flow Summary
1. Xem danh sách yêu cầu hoàn trả
2. Duyệt/Từ chối yêu cầu
3. Sau khi khách nhập package info → Tạo đơn GHN lấy hàng trả
4. Theo dõi đơn GHN
5. Nhận hàng trả → Xác nhận hoặc khiếu nại
6. Hoàn tiền cho khách → `REFUNDED`

### 14.3. Key APIs
- **Customer**: `POST /api/customers/me/returns`, `POST /api/customers/me/returns/{id}/package-info`
- **Seller**: `POST /api/store/returns/{id}/approve`, `POST /api/store/returns/{id}/reject`, `POST /api/store/returns/{id}/create-ghn-order`, `POST /api/store/returns/{id}/refund-without-return`
- **GHN**: `GET /api/ghn/pick-shifts`, `POST /api/ghn/create-order`, `POST /api/ghn/cancel-order`

---

**Tài liệu này được cập nhật lần cuối: 2025-01-XX**
