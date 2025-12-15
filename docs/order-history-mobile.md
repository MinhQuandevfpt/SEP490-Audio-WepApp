# Order History APIs - Mobile Implementation Guide

Tài liệu này mô tả chi tiết tất cả các API, request/response schemas, và logic xử lý cho tính năng **Lịch sử đơn hàng** của Customer role, phục vụ cho việc phát triển ứng dụng mobile.

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [API: Lấy danh sách đơn hàng](#1-api-lấy-danh-sách-đơn-hàng)
3. [API: Lấy chi tiết đơn hàng](#2-api-lấy-chi-tiết-đơn-hàng)
4. [API: Hủy đơn hàng](#3-api-hủy-đơn-hàng)
5. [API: Yêu cầu hủy đơn hàng](#4-api-yêu-cầu-hủy-đơn-hàng)
6. [API: Lấy thông tin GHN Order (Tracking)](#5-api-lấy-thông-tin-ghn-order-tracking)
7. [API: Tạo Return Request](#6-api-tạo-return-request)
8. [Flow xử lý chính](#flow-xử-lý-chính)
9. [Data Models](#data-models)

---

## Tổng quan

Tính năng Order History cho phép Customer:
- Xem danh sách đơn hàng với pagination và filter theo status
- Xem chi tiết từng đơn hàng (thông tin sản phẩm, địa chỉ, tổng tiền)
- Hủy đơn hàng (nếu status = PENDING)
- Yêu cầu hủy đơn hàng (nếu status = AWAITING_SHIPMENT)
- Xem mã vận đơn GHN để theo dõi đơn hàng
- Tạo yêu cầu hoàn trả sản phẩm

**Base URL**: `https://audioe-commerce-production.up.railway.app`

**Authentication**: Tất cả API yêu cầu Bearer token trong header:
```
Authorization: Bearer {accessToken}
```

---

## 1. API: Lấy danh sách đơn hàng

### 1.1. Endpoint

```
GET /api/customers/{customerId}/orders
```

### 1.2. URL Parameters

- `customerId` (string, required): ID của customer (lấy từ token hoặc localStorage)

### 1.3. Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 0 | Số trang (0-based indexing) |
| `size` | number | No | 20 | Số lượng đơn hàng mỗi trang |
| `status` | string | No | - | Lọc theo trạng thái đơn hàng. Các giá trị: `PENDING`, `UNPAID`, `AWAITING_SHIPMENT`, `SHIPPING`, `DELIVERY_SUCCESS`, `COMPLETED`, `CANCELLED`, `RETURN_REQUESTED` |

### 1.4. Request Example

```http
GET /api/customers/550e8400-e29b-41d4-a716-446655440000/orders?page=0&size=20&status=SHIPPING
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### 1.5. Response Structure

Backend có thể trả về 2 format:

**Format 1 (Legacy):**
```json
{
  "items": [
    {
      "id": "order-123",
      "orderCode": "ORD-2025-001",
      "externalOrderCode": "PAYOS-123456",
      "status": "SHIPPING",
      "receiverName": "Nguyễn Văn A",
      "phoneNumber": "0901234567",
      "addressLine": "123 Đường ABC",
      "street": "Đường ABC",
      "ward": "Phường 1",
      "district": "Quận 1",
      "province": "TP. Hồ Chí Minh",
      "note": "Giao hàng giờ hành chính",
      "totalAmount": 5000000,
      "discountTotal": 500000,
      "shippingFeeTotal": 30000,
      "grandTotal": 4530000,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "storeOrders": [
        {
          "id": "store-order-123",
          "orderCode": "STORE-ORD-001",
          "storeId": "store-123",
          "storeName": "Cửa hàng Audio",
          "status": "SHIPPING",
          "createdAt": "2025-01-15T10:30:00.000Z",
          "totalAmount": 3000000,
          "discountTotal": 300000,
          "shippingFee": 20000,
          "grandTotal": 2720000,
          "items": [
            {
              "id": "item-123",
              "type": "PRODUCT",
              "refId": "product-123",
              "name": "Tai nghe Sony WH-1000XM5",
              "quantity": 1,
              "unitPrice": 3000000,
              "lineTotal": 3000000,
              "image": "https://example.com/image.jpg",
              "storeId": "store-123",
              "storeOrderId": "store-order-123",
              "storeName": "Cửa hàng Audio",
              "variantId": "variant-123",
              "variantOptionName": "Màu sắc",
              "variantOptionValue": "Đen",
              "variantUrl": "https://example.com/variant-image.jpg"
            }
          ]
        }
      ]
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

**Format 2 (Spring Page Standard):**
```json
{
  "content": [
    {
      "id": "order-123",
      "orderCode": "ORD-2025-001",
      ...
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "number": 0,
  "size": 20,
  "first": true,
  "last": false
}
```

### 1.6. Response Fields

#### CustomerOrder Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ID đơn hàng |
| `orderCode` | string \| null | Mã đơn hàng (hiển thị cho user) |
| `externalOrderCode` | string \| null | Mã đơn hàng từ PayOS (nếu thanh toán online) |
| `status` | string | Trạng thái đơn hàng (xem bảng OrderStatus) |
| `receiverName` | string | Tên người nhận |
| `phoneNumber` | string | Số điện thoại người nhận |
| `addressLine` | string | Địa chỉ chi tiết |
| `street` | string | Đường/Phố |
| `ward` | string | Phường/Xã |
| `district` | string | Quận/Huyện |
| `province` | string | Tỉnh/Thành phố |
| `country` | string | Quốc gia (mặc định: "Việt Nam") |
| `postalCode` | string | Mã bưu điện |
| `note` | string \| null | Ghi chú đơn hàng |
| `totalAmount` | number | Tổng tiền hàng (chưa giảm giá) |
| `discountTotal` | number | Tổng giảm giá |
| `shippingFeeTotal` | number | Tổng phí vận chuyển |
| `grandTotal` | number | Tổng cộng (totalAmount - discountTotal + shippingFeeTotal) |
| `createdAt` | string | Ngày tạo đơn (ISO 8601) |
| `storeOrders` | StoreOrder[] | Danh sách đơn hàng theo cửa hàng |
| `items` | OrderItem[] | (Optional) Danh sách items ở root level (legacy) |

#### StoreOrder Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ID đơn hàng cửa hàng |
| `orderCode` | string \| null | Mã đơn hàng cửa hàng |
| `storeId` | string | ID cửa hàng |
| `storeName` | string | Tên cửa hàng |
| `status` | string | Trạng thái đơn hàng cửa hàng |
| `createdAt` | string | Ngày tạo (ISO 8601) |
| `totalAmount` | number | Tổng tiền hàng của cửa hàng |
| `discountTotal` | number | Giảm giá của cửa hàng |
| `shippingFee` | number | Phí vận chuyển của cửa hàng |
| `grandTotal` | number | Tổng cộng của cửa hàng |
| `items` | OrderItem[] | Danh sách sản phẩm trong đơn hàng cửa hàng |

#### OrderItem Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ID item |
| `type` | string | Loại: "PRODUCT" hoặc "COMBO" |
| `refId` | string | ID tham chiếu (productId hoặc comboId) |
| `name` | string | Tên sản phẩm |
| `quantity` | number | Số lượng |
| `unitPrice` | number | Đơn giá |
| `lineTotal` | number | Thành tiền (unitPrice * quantity) |
| `image` | string \| undefined | URL hình ảnh sản phẩm |
| `storeId` | string | ID cửa hàng |
| `storeOrderId` | string \| null | ID đơn hàng cửa hàng |
| `storeName` | string | Tên cửa hàng |
| `variantId` | string \| null | ID biến thể (nếu có) |
| `variantOptionName` | string \| null | Tên option biến thể (VD: "Màu sắc") |
| `variantOptionValue` | string \| null | Giá trị option biến thể (VD: "Đen") |
| `variantUrl` | string \| null | URL hình ảnh biến thể |

### 1.7. Order Status Values

| Status | Mô tả |
|--------|-------|
| `PENDING` | Đơn hàng đang chờ xử lý |
| `UNPAID` | Đơn hàng chưa thanh toán (PayOS) |
| `AWAITING_SHIPMENT` | Đang chờ cửa hàng giao hàng |
| `SHIPPING` | Đang vận chuyển |
| `DELIVERY_SUCCESS` | Giao hàng thành công |
| `COMPLETED` | Hoàn thành |
| `CANCELLED` | Đã hủy |
| `RETURN_REQUESTED` | Đã yêu cầu hoàn trả |

### 1.8. Error Responses

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized",
  "errors": {}
}
```

**404 Not Found:**
```json
{
  "status": 404,
  "message": "Customer not found",
  "errors": {}
}
```

**500 Internal Server Error:**
```json
{
  "status": 500,
  "message": "Internal server error",
  "errors": {}
}
```

### 1.9. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/OrderHistoryService.ts
static async list(params?: OrderHistoryRequest): Promise<{
  data: CustomerOrder[];
  total: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  const customerId = this.getCustomerId(); // Lấy từ localStorage
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;

  const queryParams = new URLSearchParams();
  queryParams.append('page', String(page));
  queryParams.append('size', String(size));
  
  if (params?.status) {
    queryParams.append('status', params.status);
  }

  const endpoint = `/api/customers/${customerId}/orders?${queryParams.toString()}`;
  
  const response = await HttpInterceptor.get<OrderHistoryResponse | any>(
    endpoint,
    { userType: 'customer' }
  );

  const raw: any = response as any;
  
  // Xử lý cả 2 format response
  const sourceItems: CustomerOrder[] = (raw.items || raw.content || []) as CustomerOrder[];
  const normalizedItems = sourceItems.map((order) => this.normalizeOrder(order));

  // Client-side search (nếu có)
  let filteredItems = normalizedItems;
  if (params?.search) {
    const searchTerm = params.search.toLowerCase();
    filteredItems = filteredItems.filter(order => 
      order.id.toLowerCase().includes(searchTerm) ||
      (order.externalOrderCode && order.externalOrderCode.toLowerCase().includes(searchTerm))
    );
  }

  const totalElements: number = raw.totalElements ?? sourceItems.length ?? 0;
  const totalPages: number = raw.totalPages ?? 0;
  const currentPage: number = raw.page ?? raw.number ?? page;
  const pageSize: number = raw.size ?? size;

  return {
    data: filteredItems,
    total: totalElements,
    totalPages,
    page: currentPage,
    size: pageSize,
  };
}
```

**Hook Usage:**
```typescript
// src/hooks/useOrderHistory.ts
const load = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  
  // Backend uses 0-based indexing, frontend uses 1-based
  const backendPage = page - 1;
  
  const res = await OrderHistoryService.list({
    status: status === 'ALL' ? undefined : status,
    search: search || undefined,
    page: backendPage,
    size: pageSize,
  });
  
  setOrders(res.data);
  setTotal(res.total);
  setTotalPages(res.totalPages);
  
  // Load GHN order data for each storeOrder (parallel)
  const ghnDataPromises: Promise<void>[] = [];
  res.data.forEach((order) => {
    if (!Array.isArray(order.storeOrders)) return;
    order.storeOrders.forEach((storeOrder) => {
      if (!storeOrder.id || storeOrder.id.includes('-store-')) return;
      if (!ghnOrderData[storeOrder.id]) {
        ghnDataPromises.push(
          OrderHistoryService.getGhnOrderByStoreOrderId(storeOrder.id)
            .then((ghnOrder) => {
              if (ghnOrder && ghnOrder.data) {
                setGhnOrderData((prev) => ({
                  ...prev,
                  [storeOrder.id]: ghnOrder.data,
                }));
              }
            })
            .catch((err) => {
              // 404/500 là bình thường (chưa có GHN order)
              if (err?.status !== 404 && err?.status !== 500) {
                console.error(`Error loading GHN order:`, err);
              }
            })
        );
      }
    });
  });
  
  Promise.all(ghnDataPromises).catch(() => {});
}, [status, search, page, pageSize]);
```

---

## 2. API: Lấy chi tiết đơn hàng

### 2.1. Endpoint

```
GET /api/customers/{customerId}/orders/{orderId}
```

### 2.2. URL Parameters

- `customerId` (string, required): ID của customer
- `orderId` (string, required): ID của đơn hàng cần xem chi tiết

### 2.3. Query Parameters

Không có

### 2.4. Request Example

```http
GET /api/customers/550e8400-e29b-41d4-a716-446655440000/orders/order-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### 2.5. Response Structure

Backend có thể trả về 2 format:

**Format 1 (Direct):**
```json
{
  "id": "order-123",
  "orderCode": "ORD-2025-001",
  "externalOrderCode": "PAYOS-123456",
  "status": "SHIPPING",
  "receiverName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "addressLine": "123 Đường ABC",
  "street": "Đường ABC",
  "ward": "Phường 1",
  "district": "Quận 1",
  "province": "TP. Hồ Chí Minh",
  "country": "Việt Nam",
  "postalCode": "700000",
  "note": "Giao hàng giờ hành chính",
  "totalAmount": 5000000,
  "discountTotal": 500000,
  "shippingFeeTotal": 30000,
  "grandTotal": 4530000,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "storeOrders": [
    {
      "id": "store-order-123",
      "orderCode": "STORE-ORD-001",
      "storeId": "store-123",
      "storeName": "Cửa hàng Audio",
      "status": "SHIPPING",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "totalAmount": 3000000,
      "discountTotal": 300000,
      "shippingFee": 20000,
      "grandTotal": 2720000,
      "items": [
        {
          "id": "item-123",
          "type": "PRODUCT",
          "refId": "product-123",
          "name": "Tai nghe Sony WH-1000XM5",
          "quantity": 1,
          "unitPrice": 3000000,
          "lineTotal": 3000000,
          "image": "https://example.com/image.jpg",
          "storeId": "store-123",
          "storeOrderId": "store-order-123",
          "storeName": "Cửa hàng Audio",
          "variantId": "variant-123",
          "variantOptionName": "Màu sắc",
          "variantOptionValue": "Đen",
          "variantUrl": "https://example.com/variant-image.jpg"
        }
      ]
    }
  ],
  "items": [
    {
      "id": "item-123",
      "type": "PRODUCT",
      "refId": "product-123",
      "name": "Tai nghe Sony WH-1000XM5",
      "quantity": 1,
      "unitPrice": 3000000,
      "lineTotal": 3000000,
      "image": "https://example.com/image.jpg",
      "storeId": "store-123",
      "storeOrderId": "store-order-123",
      "storeName": "Cửa hàng Audio",
      "variantId": "variant-123",
      "variantOptionName": "Màu sắc",
      "variantOptionValue": "Đen",
      "variantUrl": "https://example.com/variant-image.jpg"
    }
  ]
}
```

**Format 2 (Wrapped):**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": "order-123",
    "orderCode": "ORD-2025-001",
    ...
  }
}
```

### 2.6. Error Responses

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "status": 404,
  "message": "Order not found"
}
```

### 2.7. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/OrderHistoryService.ts
static async getById(orderId: string): Promise<CustomerOrder | null> {
  const customerId = this.getCustomerId();
  const endpoint = `/api/customers/${customerId}/orders/${orderId}`;
  
  const response = await HttpInterceptor.get<CustomerOrder | { status: number; message: string; data: CustomerOrder }>(
    endpoint,
    { userType: 'customer' }
  );

  let order: CustomerOrder | null = null;
  if (response && typeof response === 'object' && 'data' in response) {
    order = (response as { data: CustomerOrder }).data;
  } else {
    order = response as CustomerOrder;
  }

  if (!order) {
    return null;
  }

  return this.normalizeOrder(order as CustomerOrder & { items?: any[] });
}
```

**Normalize Logic:**
```typescript
// Xử lý mapping items từ root level vào storeOrders
private static normalizeOrder(order: CustomerOrder & { items?: any[] }): CustomerOrder {
  const rootItems = Array.isArray(order.items) ? order.items : [];
  const storeOrders = Array.isArray(order.storeOrders) ? order.storeOrders : [];

  // Nếu có cả storeOrders và root items, map items vào storeOrders
  if (storeOrders.length > 0 && rootItems.length > 0) {
    const hasItemsInStoreOrders = storeOrders.some(so => Array.isArray(so.items) && so.items.length > 0);
    
    if (!hasItemsInStoreOrders) {
      // Map root items to storeOrders based on storeOrderId
      const storeOrdersWithItems = storeOrders.map(storeOrder => {
        const itemsForStoreOrder = rootItems
          .filter(item => item.storeOrderId === storeOrder.id)
          .map((item: any, index: number) => {
            const displayImage = this.getPreferredItemImage(item);
            return {
              id: item.id || `${order.id}-item-${index + 1}`,
              type: item.type || 'PRODUCT',
              refId: item.refId || item.productId || item.id,
              name: item.name || 'Sản phẩm',
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice ?? 0,
              lineTotal: item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 1),
              image: displayImage,
              storeId: item.storeId || storeOrder.storeId,
              storeOrderId: item.storeOrderId ?? storeOrder.id,
              storeName: item.storeName || storeOrder.storeName,
              variantId: item.variantId ?? null,
              variantOptionName: item.variantOptionName ?? null,
              variantOptionValue: item.variantOptionValue ?? null,
              variantUrl: item.variantUrl ?? null,
            } as OrderItem;
          });

        return {
          ...storeOrder,
          items: itemsForStoreOrder,
        };
      });

      return {
        ...order,
        storeOrders: storeOrdersWithItems,
      };
    }
  }

  return order;
}
```

---

## 3. API: Hủy đơn hàng

### 3.1. Endpoint

```
POST /api/v1/customers/{customerId}/orders/{orderId}/cancel
```

### 3.2. URL Parameters

- `customerId` (string, required): ID của customer
- `orderId` (string, required): ID của đơn hàng cần hủy

### 3.3. Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | string | Yes | Lý do hủy đơn. Các giá trị: `CHANGE_OF_MIND`, `FOUND_BETTER_PRICE`, `WRONG_INFO_OR_ADDRESS`, `ORDERED_BY_ACCIDENT`, `OUT_OF_STOCK`, `DELIVERY_TOO_LONG`, `OTHER` |
| `note` | string | No | Ghi chú thêm (optional) |

### 3.4. Request Body

Không có request body (undefined)

### 3.5. Request Example

```http
POST /api/v1/customers/550e8400-e29b-41d4-a716-446655440000/orders/order-123/cancel?reason=CHANGE_OF_MIND&note=Đặt nhầm phiên bản
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 3.6. Response Structure

**Success (200 OK):**
```json
// No body - chỉ trả về status 200
```

### 3.7. Error Responses

**400 Bad Request:**
```json
{
  "status": 400,
  "message": "Cannot cancel order. Order status must be PENDING",
  "errors": {}
}
```

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "status": 404,
  "message": "Order not found"
}
```

### 3.8. Business Rules

- Chỉ có thể hủy đơn hàng khi `status === 'PENDING'`
- Nếu `status === 'AWAITING_SHIPMENT'`, phải dùng API `cancel-request` (xem mục 4)
- Sau khi hủy thành công, status sẽ chuyển thành `CANCELLED`

### 3.9. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/OrderHistoryService.ts
static async cancel(orderId: string, reason: string, note?: string): Promise<void> {
  const customerId = this.getCustomerId();
  const query = new URLSearchParams();
  query.append('reason', reason);
  if (note) {
    query.append('note', note);
  }

  const endpoint = `/api/v1/customers/${customerId}/orders/${orderId}/cancel?${query.toString()}`;

  await HttpInterceptor.post<void>(endpoint, undefined, { userType: 'customer' });
}
```

**Usage:**
```typescript
// Kiểm tra status trước khi gọi API
if (order.status === 'PENDING') {
  await OrderHistoryService.cancel(order.id, cancelReason, cancelNote);
  message.success('Hủy đơn hàng thành công');
  // Reload order list
  loadRecentOrders();
} else if (order.status === 'AWAITING_SHIPMENT') {
  // Dùng requestCancel thay vì cancel
  await OrderHistoryService.requestCancel(order.id, cancelReason, cancelNote);
  message.success('Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng.');
}
```

---

## 4. API: Yêu cầu hủy đơn hàng

### 4.1. Endpoint

```
POST /api/v1/customers/{customerId}/orders/{customerOrderId}/cancel-request
```

### 4.2. URL Parameters

- `customerId` (string, required): ID của customer
- `customerOrderId` (string, required): ID của đơn hàng cần yêu cầu hủy

### 4.3. Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | string | Yes | Lý do hủy đơn (giống như API cancel) |
| `note` | string | No | Ghi chú thêm (optional) |

### 4.4. Request Body

Không có request body (undefined)

### 4.5. Request Example

```http
POST /api/v1/customers/550e8400-e29b-41d4-a716-446655440000/orders/order-123/cancel-request?reason=CHANGE_OF_MIND&note=Đặt nhầm
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 4.6. Response Structure

**Success (200 OK):**
```json
// No body - chỉ trả về status 200
```

### 4.7. Error Responses

**400 Bad Request:**
```json
{
  "status": 400,
  "message": "Cannot request cancellation. Order status must be AWAITING_SHIPMENT",
  "errors": {}
}
```

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

### 4.8. Business Rules

- Chỉ có thể yêu cầu hủy khi `status === 'AWAITING_SHIPMENT'`
- Yêu cầu hủy sẽ được gửi đến cửa hàng để xem xét
- Cửa hàng có thể chấp nhận hoặc từ chối yêu cầu hủy
- Sau khi cửa hàng chấp nhận, status sẽ chuyển thành `CANCELLED`

### 4.9. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/OrderHistoryService.ts
static async requestCancel(orderId: string, reason: string, note?: string): Promise<void> {
  const customerId = this.getCustomerId();
  const query = new URLSearchParams();
  query.append('reason', reason);
  if (note) {
    query.append('note', note);
  }

  const endpoint = `/api/v1/customers/${customerId}/orders/${orderId}/cancel-request?${query.toString()}`;

  await HttpInterceptor.post<void>(endpoint, undefined, { userType: 'customer' });
}
```

---

## 5. API: Lấy thông tin GHN Order (Tracking)

### 5.1. Endpoint

```
GET /api/v1/ghn-orders/by-store-order/{storeOrderId}
```

### 5.2. URL Parameters

- `storeOrderId` (string, required): ID của store order (lấy từ `storeOrder.id`)

### 5.3. Query Parameters

Không có

### 5.4. Request Example

```http
GET /api/v1/ghn-orders/by-store-order/store-order-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### 5.5. Response Structure

**Success (200 OK):**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": "ghn-order-123",
    "storeOrderId": "store-order-123",
    "storeId": "store-123",
    "orderGhn": "GHN123456789",
    "totalFee": 30000,
    "expectedDeliveryTime": "2025-01-20T18:00:00.000Z",
    "status": "SHIPPING",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 5.6. Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ID bản ghi GHN order |
| `storeOrderId` | string | ID store order |
| `storeId` | string | ID cửa hàng |
| `orderGhn` | string | Mã vận đơn GHN (dùng để tracking) |
| `totalFee` | number | Tổng phí vận chuyển |
| `expectedDeliveryTime` | string | Thời gian dự kiến giao hàng (ISO 8601) |
| `status` | string | Trạng thái GHN order |
| `createdAt` | string | Ngày tạo (ISO 8601) |
| `updatedAt` | string | Ngày cập nhật (ISO 8601) |

### 5.7. Error Responses

**404 Not Found:**
```json
{
  "status": 404,
  "message": "GHN order not found for this store order"
}
```

**500 Internal Server Error:**
```json
{
  "status": 500,
  "message": "Internal server error"
}
```

**Lưu ý**: 404 và 500 là bình thường khi đơn hàng chưa có GHN order (chưa được cửa hàng tạo đơn GHN). Frontend nên xử lý gracefully, không hiển thị lỗi.

### 5.8. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/OrderHistoryService.ts
static async getGhnOrderByStoreOrderId(storeOrderId: string): Promise<any | null> {
  try {
    const response = await HttpInterceptor.get<any>(
      `/api/v1/ghn-orders/by-store-order/${storeOrderId}`,
      { userType: 'customer' }
    );
    return response;
  } catch (error: any) {
    // Return null for 404 or 500 - this is normal when order doesn't have GHN tracking yet
    if (error?.status === 404 || error?.status === 500) {
      return null;
    }
    // Only log unexpected errors (network issues, auth errors, etc.)
    console.error('Failed to get GHN order:', error);
    return null; // Return null instead of throwing to prevent UI errors
  }
}
```

**Usage trong Hook:**
```typescript
// Load GHN data cho mỗi storeOrder (parallel, không block UI)
const ghnDataPromises: Promise<void>[] = [];
res.data.forEach((order) => {
  if (!Array.isArray(order.storeOrders)) return;
  order.storeOrders.forEach((storeOrder) => {
    if (!storeOrder.id || storeOrder.id.includes('-store-')) return;
    if (!ghnOrderData[storeOrder.id]) {
      ghnDataPromises.push(
        OrderHistoryService.getGhnOrderByStoreOrderId(storeOrder.id)
          .then((ghnOrder) => {
            if (ghnOrder && ghnOrder.data) {
              setGhnOrderData((prev) => ({
                ...prev,
                [storeOrder.id]: ghnOrder.data,
              }));
            }
          })
          .catch((err) => {
            // 404/500 là bình thường
            if (err?.status !== 404 && err?.status !== 500) {
              console.error(`Unexpected error loading GHN order:`, err);
            }
          })
      );
    }
  });
});

// Load parallel, không await (background loading)
Promise.all(ghnDataPromises).catch(() => {});
```

**Tracking URL:**
```typescript
// Tạo link tracking GHN
const trackingUrl = `https://donhang.ghn.vn/?order_code=${ghnOrderData.orderGhn}`;
```

---

## 6. API: Tạo Return Request

### 6.1. Endpoint

```
POST /api/customers/me/returns
```

### 6.2. URL Parameters

Không có (dùng `/me` để tự động lấy customerId từ token)

### 6.3. Query Parameters

Không có

### 6.4. Request Body

```typescript
interface CreateReturnRequest {
  orderId: string;
  storeOrderId: string;
  orderItemId: string;
  reasonType: 'DEFECTIVE' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'DAMAGED' | 'OTHER';
  reason: string;
  images?: string[];  // Array of image URLs (sau khi upload)
  video?: string;      // Video URL (sau khi upload, optional)
}
```

### 6.5. Request Example

```http
POST /api/customers/me/returns
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "orderId": "order-123",
  "storeOrderId": "store-order-123",
  "orderItemId": "item-123",
  "reasonType": "DEFECTIVE",
  "reason": "Sản phẩm bị lỗi màn hình",
  "images": [
    "https://res.cloudinary.com/.../image1.jpg",
    "https://res.cloudinary.com/.../image2.jpg"
  ],
  "video": "https://res.cloudinary.com/.../video.mp4"
}
```

### 6.6. Response Structure

**Success (200 OK):**
```json
{
  "status": 200,
  "message": "Return request created successfully",
  "data": {
    "id": "return-123",
    "orderId": "order-123",
    "storeOrderId": "store-order-123",
    "orderItemId": "item-123",
    "reasonType": "DEFECTIVE",
    "reason": "Sản phẩm bị lỗi màn hình",
    "status": "PENDING",
    "images": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ],
    "video": "https://res.cloudinary.com/.../video.mp4",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 6.7. Error Responses

**400 Bad Request:**
```json
{
  "status": 400,
  "message": "Cannot create return request. Order status must be DELIVERY_SUCCESS",
  "errors": {}
}
```

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

### 6.8. Business Rules

- Chỉ có thể tạo return request khi `order.status === 'DELIVERY_SUCCESS'`
- Phải upload images/video trước khi gọi API này
- Sau khi tạo thành công, status của return request sẽ là `PENDING`

### 6.9. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/OrderHistoryService.ts
static async requestReturn(payload: CreateReturnRequest): Promise<ReturnRequestResponse> {
  const response = await HttpInterceptor.post<ReturnRequestResponse>(
    '/api/customers/me/returns',
    payload,
    { userType: 'customer' }
  );
  return response;
}
```

**Upload Images/Video trước:**
```typescript
// Upload images (multiple)
const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await HttpInterceptor.post<Array<{ url: string }>>(
    '/api/v1/uploads/images',
    formData,
    { 
      userType: 'customer',
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.map(item => item.url);
};

// Upload video (single)
const uploadVideo = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await HttpInterceptor.post<{ url: string }>(
    '/api/v1/uploads/videos',
    formData,
    { 
      userType: 'customer',
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.url;
};

// Tạo return request
const createReturnRequest = async () => {
  let imageUrls: string[] = [];
  let videoUrl: string | undefined;

  // Upload images
  if (selectedImages.length > 0) {
    imageUrls = await uploadImages(selectedImages);
  }

  // Upload video (nếu có)
  if (selectedVideo) {
    videoUrl = await uploadVideo(selectedVideo);
  }

  // Tạo return request
  const payload: CreateReturnRequest = {
    orderId: order.id,
    storeOrderId: selectedStoreOrder.id,
    orderItemId: selectedItem.id,
    reasonType: reasonType,
    reason: reasonText,
    images: imageUrls.length > 0 ? imageUrls : undefined,
    video: videoUrl,
  };

  await OrderHistoryService.requestReturn(payload);
  message.success('Yêu cầu hoàn trả đã được gửi thành công');
};
```

---

## Flow xử lý chính

### Flow 1: Load danh sách đơn hàng

```
1. User mở trang Order History
   ↓
2. Gọi API: GET /api/customers/{customerId}/orders?page=0&size=20
   ↓
3. Nhận response (format có thể là items[] hoặc content[])
   ↓
4. Normalize response (map items vào storeOrders nếu cần)
   ↓
5. Hiển thị danh sách đơn hàng
   ↓
6. (Background) Load GHN order data cho mỗi storeOrder (parallel)
   - Gọi API: GET /api/v1/ghn-orders/by-store-order/{storeOrderId}
   - Nếu 404/500: bỏ qua (chưa có GHN order)
   - Nếu success: lưu vào state để hiển thị tracking code
```

### Flow 2: Xem chi tiết đơn hàng

```
1. User click vào một đơn hàng
   ↓
2. Gọi API: GET /api/customers/{customerId}/orders/{orderId}
   ↓
3. Nhận response (có thể wrapped hoặc direct)
   ↓
4. Normalize response (map items vào storeOrders)
   ↓
5. Hiển thị chi tiết:
   - Thông tin đơn hàng (orderCode, status, createdAt)
   - Địa chỉ giao hàng
   - Danh sách storeOrders (theo cửa hàng)
   - Tóm tắt đơn hàng (totalAmount, discountTotal, shippingFeeTotal, grandTotal)
   - Các action buttons (Cancel, Return, Track, etc.)
```

### Flow 3: Hủy đơn hàng

```
1. User click "Hủy đơn hàng"
   ↓
2. Kiểm tra status:
   - Nếu status === 'PENDING': hiển thị modal hủy đơn
   - Nếu status === 'AWAITING_SHIPMENT': hiển thị modal yêu cầu hủy
   ↓
3. User chọn lý do hủy và nhập ghi chú (optional)
   ↓
4. Gọi API:
   - Nếu PENDING: POST /api/v1/customers/{customerId}/orders/{orderId}/cancel?reason=...&note=...
   - Nếu AWAITING_SHIPMENT: POST /api/v1/customers/{customerId}/orders/{orderId}/cancel-request?reason=...&note=...
   ↓
5. Nếu success:
   - Hiển thị message success
   - Reload danh sách đơn hàng
   - Đóng modal
```

### Flow 4: Xem tracking GHN

```
1. User click "Theo dõi đơn hàng" (khi status === 'SHIPPING')
   ↓
2. Kiểm tra xem đã có GHN order data chưa:
   - Nếu có: hiển thị mã vận đơn và link tracking
   - Nếu chưa: gọi API GET /api/v1/ghn-orders/by-store-order/{storeOrderId}
   ↓
3. Nếu API trả về 404/500:
   - Hiển thị message "Chưa có mã vận đơn" (chưa được cửa hàng tạo đơn GHN)
   ↓
4. Nếu API success:
   - Hiển thị mã vận đơn: ghnOrderData.orderGhn
   - Hiển thị link tracking: https://donhang.ghn.vn/?order_code={orderGhn}
```

### Flow 5: Tạo Return Request

```
1. User click "Hoàn trả sản phẩm" (khi status === 'DELIVERY_SUCCESS')
   ↓
2. Hiển thị modal form:
   - Chọn storeOrder và orderItem
   - Chọn reasonType (DEFECTIVE, WRONG_ITEM, etc.)
   - Nhập reason (text)
   - Upload images (multiple, optional)
   - Upload video (single, optional, max 30MB)
   ↓
3. Upload media trước:
   - Upload images: POST /api/v1/uploads/images (FormData với files[])
   - Upload video: POST /api/v1/uploads/videos (FormData với file)
   ↓
4. Sau khi upload thành công, lấy URLs
   ↓
5. Gọi API: POST /api/customers/me/returns
   Body: {
     orderId, storeOrderId, orderItemId,
     reasonType, reason,
     images: [url1, url2, ...],
     video: url (optional)
   }
   ↓
6. Nếu success:
   - Hiển thị message success
   - Reload order detail (để cập nhật status)
   - Đóng modal
```

---

## Data Models

### OrderStatus Type

```typescript
export type OrderStatus = 
  | 'PENDING'
  | 'UNPAID'
  | 'AWAITING_SHIPMENT'
  | 'SHIPPING'
  | 'DELIVERY_SUCCESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED';
```

### Cancel Reason Type

```typescript
export type CancelReason = 
  | 'CHANGE_OF_MIND'
  | 'FOUND_BETTER_PRICE'
  | 'WRONG_INFO_OR_ADDRESS'
  | 'ORDERED_BY_ACCIDENT'
  | 'OUT_OF_STOCK'
  | 'DELIVERY_TOO_LONG'
  | 'OTHER';
```

### Return Reason Type

```typescript
export type ReturnReasonType = 
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'DAMAGED'
  | 'OTHER';
```

### CustomerOrder Interface

```typescript
export interface CustomerOrder {
  id: string;
  orderCode: string | null;
  status: OrderStatus;
  message: string | null;
  createdAt: string;
  totalAmount: number;
  discountTotal: number;
  shippingFeeTotal: number;
  grandTotal: number;
  externalOrderCode: string | null;  // PayOS order code
  receiverName: string;
  phoneNumber: string;
  country: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  postalCode: string;
  note: string | null;
  storeOrders: StoreOrder[];
  items?: OrderItem[];  // Optional legacy format
}
```

### StoreOrder Interface

```typescript
export interface StoreOrder {
  id: string;
  orderCode: string | null;
  storeId: string;
  storeName: string;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  items: OrderItem[];
}
```

### OrderItem Interface

```typescript
export interface OrderItem {
  id: string;
  type: 'PRODUCT' | 'COMBO';
  refId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
  storeId: string;
  storeOrderId: string | null;
  storeName: string;
  variantId?: string | null;
  variantOptionName?: string | null;
  variantOptionValue?: string | null;
  variantUrl?: string | null;
}
```

### CreateReturnRequest Interface

```typescript
export interface CreateReturnRequest {
  orderId: string;
  storeOrderId: string;
  orderItemId: string;
  reasonType: ReturnReasonType;
  reason: string;
  images?: string[];
  video?: string;
}
```

---

## Lưu ý quan trọng cho Mobile

1. **Pagination**: Backend sử dụng 0-based indexing, frontend có thể dùng 1-based và convert khi gọi API.

2. **GHN Order Loading**: Nên load GHN order data ở background (parallel), không block UI. 404/500 là bình thường khi chưa có GHN order.

3. **Image/Video Upload**: 
   - Images: multiple files, endpoint `/api/v1/uploads/images`
   - Video: single file, endpoint `/api/v1/uploads/videos`, max 30MB
   - Phải upload trước khi tạo return request

4. **Error Handling**: 
   - 404 cho GHN order: không hiển thị lỗi (chưa có GHN order là bình thường)
   - 400 cho cancel/return: hiển thị message từ server
   - 401: redirect về login

5. **Status Validation**: 
   - Cancel: chỉ cho phép khi `status === 'PENDING'`
   - Request Cancel: chỉ cho phép khi `status === 'AWAITING_SHIPMENT'`
   - Return: chỉ cho phép khi `status === 'DELIVERY_SUCCESS'`

6. **Normalize Response**: Backend có thể trả về items ở root level hoặc trong storeOrders. Frontend cần normalize để đảm bảo consistency.

7. **Tracking URL**: GHN tracking URL format: `https://donhang.ghn.vn/?order_code={orderGhn}`

---

## Kết luận

Tài liệu này cung cấp đầy đủ thông tin về các API liên quan đến Order History của Customer role. Mobile app có thể sử dụng các API này để:
- Hiển thị danh sách đơn hàng với pagination và filter
- Xem chi tiết đơn hàng
- Hủy đơn hàng hoặc yêu cầu hủy
- Theo dõi đơn hàng qua GHN
- Tạo yêu cầu hoàn trả sản phẩm

Tất cả các API đều yêu cầu authentication token và có error handling rõ ràng.

