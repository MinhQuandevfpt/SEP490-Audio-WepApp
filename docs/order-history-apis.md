# Order History APIs Documentation

Tài liệu này liệt kê tất cả các API, request body và response body được sử dụng trong `OrderHistoryPage.tsx` và các component trong `OrderHistoryComponents`.

---

## 1. Order History APIs

### 1.1. GET Order List
**Endpoint:** `GET /api/customers/{customerId}/orders`

**Query Parameters:**
- `page` (number, 0-based): Số trang (mặc định: 0)
- `size` (number): Số lượng đơn hàng mỗi trang (mặc định: 20)
- `status` (string, optional): Lọc theo trạng thái đơn hàng

**Request Example:**
```
GET /api/customers/{customerId}/orders?page=0&size=20&status=SHIPPING
```

**Response Body:**
```json
{
  "content": [
    {
      "id": "string",
      "orderCode": "string",
      "externalOrderCode": "string",
      "status": "PENDING | UNPAID | AWAITING_SHIPMENT | SHIPPING | DELIVERY_SUCCESS | COMPLETED | CANCELLED",
      "receiverName": "string",
      "phoneNumber": "string",
      "addressLine": "string",
      "street": "string",
      "ward": "string",
      "district": "string",
      "province": "string",
      "note": "string | null",
      "totalAmount": 0,
      "discountTotal": 0,
      "shippingFeeTotal": 0,
      "grandTotal": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "storeOrders": [
        {
          "id": "string",
          "orderCode": "string | null",
          "storeId": "string",
          "storeName": "string",
          "status": "string",
          "createdAt": "2025-01-01T00:00:00.000Z",
          "totalAmount": 0,
          "discountTotal": 0,
          "shippingFee": 0,
          "grandTotal": 0,
          "items": [
            {
              "id": "string",
              "type": "PRODUCT | COMBO",
              "refId": "string",
              "name": "string",
              "quantity": 0,
              "unitPrice": 0,
              "lineTotal": 0,
              "image": "string | null",
              "storeId": "string",
              "storeOrderId": "string | null",
              "storeName": "string",
              "variantId": "string | null",
              "variantOptionName": "string | null",
              "variantOptionValue": "string | null",
              "variantUrl": "string | null"
            }
          ]
        }
      ],
      "items": [] // Legacy format (optional)
    }
  ],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 20,
  "first": true,
  "last": true
}
```

**Alternative Response Format (Legacy):**
```json
{
  "items": [ /* CustomerOrder[] */ ],
  "totalElements": 0,
  "totalPages": 0,
  "page": 0,
  "size": 20
}
```

---

### 1.2. GET Order Detail
**Endpoint:** `GET /api/customers/{customerId}/orders/{orderId}`

**Request Example:**
```
GET /api/customers/{customerId}/orders/abc123
```

**Response Body:**
```json
{
  "id": "string",
  "orderCode": "string",
  "externalOrderCode": "string",
  "status": "string",
  "receiverName": "string",
  "phoneNumber": "string",
  "addressLine": "string",
  "street": "string",
  "ward": "string",
  "district": "string",
  "province": "string",
  "note": "string | null",
  "totalAmount": 0,
  "discountTotal": 0,
  "shippingFeeTotal": 0,
  "grandTotal": 0,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "storeOrders": [ /* StoreOrder[] */ ],
  "items": [] // Optional legacy format
}
```

**Alternative Response Format:**
```json
{
  "status": 200,
  "message": "string",
  "data": { /* CustomerOrder */ }
}
```

---

### 1.3. POST Cancel Order
**Endpoint:** `POST /api/v1/customers/{customerId}/orders/{orderId}/cancel`

**Query Parameters:**
- `reason` (string, required): Lý do hủy đơn
  - `CHANGE_OF_MIND`: Đổi ý
  - `FOUND_BETTER_PRICE`: Tìm giá tốt hơn
  - `WRONG_INFO_OR_ADDRESS`: Sai thông tin/địa chỉ
  - `ORDERED_BY_ACCIDENT`: Đặt nhầm
  - `OTHER`: Khác
- `note` (string, optional): Ghi chú thêm

**Request Example:**
```
POST /api/v1/customers/{customerId}/orders/{orderId}/cancel?reason=CHANGE_OF_MIND&note=Đặt nhầm phiên bản
```

**Request Body:** `undefined` (no body)

**Response Body:**
```json
// Success: 200 OK (no body)
// Error: Error response with message
```

---

### 1.4. POST Request Cancel Order (AWAITING_SHIPMENT)
**Endpoint:** `POST /api/v1/customers/{customerId}/orders/{customerOrderId}/cancel-request`

**Query Parameters:**
- `reason` (string, required): Lý do hủy đơn (same as above)
- `note` (string, optional): Ghi chú thêm

**Request Example:**
```
POST /api/v1/customers/{customerId}/orders/{customerOrderId}/cancel-request?reason=CHANGE_OF_MIND&note=Đặt nhầm
```

**Request Body:** `undefined` (no body)

**Response Body:**
```json
// Success: 200 OK (no body)
// Error: Error response with message
```

---

### 1.5. GET GHN Order by Store Order ID
**Endpoint:** `GET /api/v1/ghn-orders/by-store-order/{storeOrderId}`

**Request Example:**
```
GET /api/v1/ghn-orders/by-store-order/{storeOrderId}
```

**Response Body (Success):**
```json
{
  "data": {
    "orderGhn": "string", // GHN order code
    // ... other GHN order fields
  }
}
```

**Response Body (Not Found):**
- Status: `404` hoặc `500`
- Returns `null` (handled gracefully by frontend)

---

### 1.6. POST Create Return Request
**Endpoint:** `POST /api/customers/me/returns`

**Request Body:**
```json
{
  "orderItemId": "string", // ID của order item cần hoàn trả
  "productId": "string", // ID sản phẩm (refId từ order item)
  "itemPrice": 0, // Giá trị hoàn trả (lineTotal hoặc unitPrice)
  "reasonType": "CUSTOMER_FAULT | SHOP_FAULT",
  "reason": "string", // Lý do chi tiết
  "customerImageUrls": ["string"], // Optional: Array of image URLs
  "customerVideoUrl": "string" // Optional: Video URL
}
```

**Response Body:**
```json
{
  "id": "string",
  "customerId": "string",
  "shopId": "string",
  "orderItemId": "string",
  "productId": "string",
  "productName": "string",
  "itemPrice": 0,
  "reasonType": "CUSTOMER_FAULT | SHOP_FAULT",
  "reason": "string",
  "customerImageUrls": ["string"],
  "customerVideoUrl": "string | null",
  "status": "PENDING",
  "faultType": "UNKNOWN | CUSTOMER | SHOP",
  "packageWeight": null,
  "packageLength": null,
  "packageWidth": null,
  "packageHeight": null,
  "shippingFee": null,
  "ghnOrderCode": null,
  "trackingStatus": null,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

## 2. Review APIs

### 2.1. POST Create Review
**Endpoint:** `POST /api/reviews`

**Request Body:**
```json
{
  "customerOrderItemId": "string", // ID của order item
  "rating": 5, // 1-5 sao
  "content": "string", // Nội dung đánh giá
  "media": [ // Optional
    {
      "type": "image | video",
      "url": "string"
    }
  ]
}
```

**Response Body:**
```json
{
  "id": "string",
  "customerId": "string",
  "productId": "string",
  "orderItemId": "string",
  "rating": 5,
  "content": "string",
  "media": [
    {
      "type": "image | video",
      "url": "string"
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### 2.2. GET Product Review Status
**Endpoint:** `GET /api/reviews/product/{productId}/me/status?orderId={orderId}`

**Request Example:**
```
GET /api/reviews/product/{productId}/me/status?orderId={orderId}
```

**Response Body:**
```json
{
  "hasReviewed": true,
  "review": { /* ReviewResponse */ }, // Optional
  "message": "string" // Optional
}
```

---

## 3. File Upload APIs

### 3.1. POST Upload Image
**Endpoint:** `POST /api/v1/uploads/images` (fallback: `/api/uploads/images`)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers:
  - `Authorization: Bearer {token}`
- Body (FormData):
  - `files`: File (image file)

**Request Example:**
```
POST /api/v1/uploads/images
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
  files: [File]
```

**Response Body:**
```json
[
  {
    "url": "https://res.cloudinary.com/...",
    "resourceType": "image",
    "publicId": "string | null"
  }
]
```

**Note:** Service trả về array, frontend lấy phần tử đầu tiên.

---

### 3.2. POST Upload Multiple Images
**Endpoint:** `POST /api/v1/uploads/images` (fallback: `/api/uploads/images`)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers:
  - `Authorization: Bearer {token}`
- Body (FormData):
  - `files`: File[] (multiple image files)

**Request Example:**
```
POST /api/v1/uploads/images
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
  files: [File, File, ...]
```

**Response Body:**
```json
[
  {
    "url": "https://res.cloudinary.com/...",
    "resourceType": "image",
    "publicId": "string | null"
  },
  {
    "url": "https://res.cloudinary.com/...",
    "resourceType": "image",
    "publicId": "string | null"
  }
]
```

---

### 3.3. POST Upload Video
**Endpoint:** `POST /api/v1/uploads/videos` (fallback: `/api/uploads/videos`)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers:
  - `Authorization: Bearer {token}`
- Body (FormData):
  - `file`: File (video file, max 30MB)

**Request Example:**
```
POST /api/v1/uploads/videos
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
  file: [File]
```

**Response Body:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "resourceType": "video",
  "publicId": "string | null"
}
```

---

## 4. API Flow Summary

### 4.1. Order History Page Load
1. `GET /api/customers/{customerId}/orders?page=0&size=20` → Load danh sách đơn hàng
2. Với mỗi `storeOrder` trong response:
   - `GET /api/v1/ghn-orders/by-store-order/{storeOrderId}` → Load GHN order code (nếu có)

### 4.2. View Order Detail
1. `GET /api/customers/{customerId}/orders/{orderId}` → Load chi tiết đơn hàng

### 4.3. Cancel Order
- Nếu `status === 'AWAITING_SHIPMENT'`:
  - `POST /api/v1/customers/{customerId}/orders/{orderId}/cancel-request?reason=...&note=...`
- Nếu `status === 'PENDING'`:
  - `POST /api/v1/customers/{customerId}/orders/{orderId}/cancel?reason=...&note=...`

### 4.4. Create Return Request
1. Upload images (nếu có):
   - `POST /api/v1/uploads/images` (multiple files)
2. Upload video (nếu có):
   - `POST /api/v1/uploads/videos` (single file)
3. `POST /api/customers/me/returns` → Tạo yêu cầu hoàn trả

### 4.5. Submit Review
1. Check review status:
   - `GET /api/reviews/product/{productId}/me/status?orderId={orderId}`
2. Upload review media (nếu có):
   - `POST /api/v1/uploads/images` (for each image)
3. `POST /api/reviews` → Tạo đánh giá

---

## 5. Error Handling

### Common Error Responses
```json
{
  "status": 400 | 401 | 403 | 404 | 500,
  "message": "string",
  "errors": ["string"] // Optional
}
```

### Special Cases
- **GHN Order Not Found**: `404` hoặc `500` → Frontend trả về `null` (không block UI)
- **Review Already Exists**: `400` với message chứa "đã review" → Frontend disable button
- **File Upload Failed**: Retry với fallback endpoint

---

## 6. Authentication

Tất cả API đều yêu cầu authentication token trong header:
```
Authorization: Bearer {token}
```

Token được lấy từ:
- `localStorage.getItem('CUSTOMER_token')` (cho customer APIs)
- `localStorage.getItem('STOREOWNER_token')` (cho seller APIs)
- `localStorage.getItem('STAFF_token')` (cho staff APIs)
- `localStorage.getItem('admin_access_token')` (cho admin APIs)

---

## 7. Notes

1. **Pagination**: Backend sử dụng 0-based indexing cho `page`, frontend convert từ 1-based.
2. **Legacy Support**: Service hỗ trợ cả format mới (`content`) và format cũ (`items`).
3. **GHN Order Loading**: Load bất đồng bộ, không block UI nếu không tìm thấy.
4. **File Upload**: Hỗ trợ fallback endpoint nếu primary endpoint fail.
5. **Review Status**: Pre-load status cho tất cả items trong order để optimize UX.
6. **storeOrderId**: Mỗi `OrderItem` trong response có thuộc tính `storeOrderId` để liên kết item với `StoreOrder` tương ứng. Thuộc tính này có thể là `null` trong một số trường hợp legacy.

