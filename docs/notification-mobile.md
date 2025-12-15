# Notification APIs - Mobile Implementation Guide

Tài liệu này mô tả chi tiết tất cả các API, request/response schemas, và logic xử lý cho tính năng **Thông báo** của Customer role, phục vụ cho việc phát triển ứng dụng mobile.

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [API: Lấy danh sách thông báo](#1-api-lấy-danh-sách-thông-báo)
3. [API: Đánh dấu đã đọc](#2-api-đánh-dấu-đã-đọc)
4. [API: Lấy số lượng thông báo chưa đọc](#3-api-lấy-số-lượng-thông-báo-chưa-đọc)
5. [Flow xử lý chính](#flow-xử-lý-chính)
6. [Data Models](#data-models)
7. [Notification Types](#notification-types)

---

## Tổng quan

Tính năng Notification cho phép Customer:
- Xem danh sách thông báo với pagination
- Xem số lượng thông báo chưa đọc (badge count)
- Đánh dấu thông báo đã đọc (single hoặc all)
- Navigate đến action URL khi click vào thông báo
- Hiển thị thông báo theo loại (NEW_ORDER, ORDER_SHIPPED, PAYMENT_SUCCESS, etc.)

**Base URL**: `https://audioe-commerce-production.up.railway.app`

**Authentication**: Tất cả API yêu cầu Bearer token trong header:
```
Authorization: Bearer {accessToken}
```

---

## 1. API: Lấy danh sách thông báo

### 1.1. Endpoint

```
GET /api/customer/notifications
```

### 1.2. URL Parameters

Không có

### 1.3. Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 0 | Số trang (0-based indexing) |
| `size` | number | No | 20 | Số lượng thông báo mỗi trang |

### 1.4. Request Example

```http
GET /api/customer/notifications?page=0&size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### 1.5. Response Structure

```json
{
  "content": [
    {
      "id": "notification-123",
      "title": "Đơn hàng đã được giao thành công",
      "message": "Đơn hàng ORD-2025-001 của bạn đã được giao thành công. Vui lòng kiểm tra và đánh giá sản phẩm.",
      "type": "ORDER_DELIVERED",
      "read": false,
      "actionUrl": "/orders/order-123",
      "metadataJson": "{\"orderId\":\"order-123\",\"orderCode\":\"ORD-2025-001\"}",
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "notification-124",
      "title": "Thanh toán thành công",
      "message": "Đơn hàng ORD-2025-002 đã được thanh toán thành công qua PayOS.",
      "type": "PAYMENT_SUCCESS",
      "read": true,
      "actionUrl": "/orders/order-124",
      "metadataJson": null,
      "createdAt": "2025-01-14T15:20:00.000Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "empty": false,
      "sorted": true,
      "unsorted": false
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 45,
  "totalPages": 3,
  "last": false,
  "size": 20,
  "number": 0,
  "sort": {
    "empty": false,
    "sorted": true,
    "unsorted": false
  },
  "numberOfElements": 20,
  "first": true,
  "empty": false
}
```

### 1.6. Response Fields

#### NotificationPageResponse Object

| Field | Type | Description |
|-------|------|-------------|
| `content` | Notification[] | Danh sách thông báo trong trang hiện tại |
| `pageable` | object | Thông tin pagination request |
| `pageable.pageNumber` | number | Số trang hiện tại (0-based) |
| `pageable.pageSize` | number | Số lượng items mỗi trang |
| `pageable.sort` | object | Thông tin sorting |
| `totalElements` | number | Tổng số thông báo |
| `totalPages` | number | Tổng số trang |
| `last` | boolean | Có phải trang cuối cùng không |
| `size` | number | Kích thước trang (giống pageSize) |
| `number` | number | Số trang hiện tại (0-based, giống pageNumber) |
| `first` | boolean | Có phải trang đầu tiên không |
| `empty` | boolean | Trang có rỗng không |
| `numberOfElements` | number | Số lượng items trong trang hiện tại |

#### Notification Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ID thông báo |
| `title` | string | Tiêu đề thông báo |
| `message` | string | Nội dung thông báo |
| `type` | string | Loại thông báo (xem bảng Notification Types) |
| `read` | boolean | Đã đọc chưa (true = đã đọc, false = chưa đọc) |
| `actionUrl` | string \| null | URL để navigate khi click vào thông báo |
| `metadataJson` | string \| null | JSON string chứa metadata bổ sung (có thể parse để lấy orderId, orderCode, etc.) |
| `createdAt` | string \| null | Thời gian tạo thông báo (ISO 8601) |

### 1.7. Error Responses

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized",
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

### 1.8. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/NotificationService.ts
static async getNotifications(page: number = 0, size: number = 20): Promise<NotificationPageResponse> {
  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const url = `${API_URL}/customer/notifications?${queryParams.toString()}`;
  const data = await HttpInterceptor.get<NotificationPageResponse>(url, {
    headers: { 'Accept': 'application/json' },
    userType: 'customer',
  });

  return data;
}
```

**Usage trong Component:**
```typescript
// Load notifications với pagination
const loadNotifications = useCallback(async (pageNum: number = 0) => {
  try {
    setLoading(true);
    setError(null);
    const response = await NotificationService.getNotifications(pageNum, pageSize);
    
    setNotifications(response.content || []);
    setTotalElements(response.totalElements || 0);
    setCurrentPage(pageNum + 1);
    
    // Update unread count sau khi load
    await loadUnreadCount();
  } catch (err: any) {
    console.error('Error loading notifications:', err);
    setError(err?.message || 'Không thể tải thông báo');
    setNotifications([]);
    setTotalElements(0);
  } finally {
    setLoading(false);
  }
}, []);

// Initial load
useEffect(() => {
  loadNotifications(0);
}, [loadNotifications]);
```

---

## 2. API: Đánh dấu đã đọc

### 2.1. Endpoint

```
POST /api/customer/notifications/{id}/read
```

### 2.2. URL Parameters

- `id` (string, required): ID của thông báo cần đánh dấu đã đọc

### 2.3. Query Parameters

Không có

### 2.4. Request Body

Empty body `{}`

### 2.5. Request Example

```http
POST /api/customer/notifications/notification-123/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: */*
Content-Type: application/json

{}
```

### 2.6. Response Structure

**Success (200 OK):**
```json
// No body - chỉ trả về status 200
```

### 2.7. Error Responses

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
  "message": "Notification not found"
}
```

**500 Internal Server Error:**
```json
{
  "status": 500,
  "message": "Internal server error"
}
```

### 2.8. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/NotificationService.ts
static async markAsRead(notificationId: string): Promise<void> {
  const url = `${API_URL}/customer/notifications/${notificationId}/read`;
  await HttpInterceptor.post(url, {}, {
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
    },
    userType: 'customer',
  });
}
```

**Usage với Optimistic Update:**
```typescript
// Handle notification click - mark as read nếu chưa đọc
const handleNotificationClick = async (notification: Notification) => {
  // Mark as read nếu chưa đọc
  if (!notification.read) {
    try {
      // Optimistic update: update local state ngay lập tức
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      
      // Giảm unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Call API để mark as read
      await NotificationService.markAsRead(notification.id);
      
      // Optional: show success message
      showCenterSuccess('Đã đánh dấu đã đọc');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Revert optimistic update nếu có lỗi
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read: false } : n
        )
      );
      
      // Reload unread count để đảm bảo chính xác
      loadUnreadCount();
      
      // Show error message
      showCenterError('Không thể đánh dấu đã đọc');
    }
  }

  // Navigate to action URL nếu có
  if (notification.actionUrl) {
    navigateToActionUrl(notification.actionUrl);
  }
};

// Mark all as read
const handleMarkAllAsRead = async () => {
  try {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) {
      showCenterSuccess('Tất cả thông báo đã được đọc');
      return;
    }

    // Optimistic update: mark all as read trong local state
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(prev => Math.max(0, prev - unreadNotifications.length));

    // Call API để mark all as read (parallel)
    await Promise.all(
      unreadNotifications.map(n => NotificationService.markAsRead(n.id))
    );

    showCenterSuccess('Đã đánh dấu tất cả là đã đọc');
    await loadUnreadCount(); // Reload để đảm bảo chính xác
  } catch (error) {
    console.error('Error marking all as read:', error);
    showCenterError('Không thể đánh dấu tất cả là đã đọc');
    // Reload notifications để revert
    loadNotifications(currentPage - 1);
  }
};
```

---

## 3. API: Lấy số lượng thông báo chưa đọc

### 3.1. Endpoint

```
GET /api/customer/notifications/unread-count
```

### 3.2. URL Parameters

Không có

### 3.3. Query Parameters

Không có

### 3.4. Request Example

```http
GET /api/customer/notifications/unread-count
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### 3.5. Response Structure

Backend có thể trả về 3 format:

**Format 1 (Direct number):**
```json
5
```

**Format 2 (Wrapped with count):**
```json
{
  "count": 5
}
```

**Format 3 (Object):**
```json
{
  "unreadCount": 5
}
```

### 3.6. Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `count` hoặc `unreadCount` hoặc direct number | number | Số lượng thông báo chưa đọc |

### 3.7. Error Responses

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

**500 Internal Server Error:**
```json
{
  "status": 500,
  "message": "Internal server error"
}
```

### 3.8. Frontend Logic

**Service Method:**
```typescript
// src/services/customer/NotificationService.ts
static async getUnreadCount(): Promise<number> {
  const url = `${API_URL}/customer/notifications/unread-count`;
  const data = await HttpInterceptor.get<number>(url, {
    headers: { 'Accept': 'application/json' },
    userType: 'customer',
  });

  // Handle multiple response formats
  if (typeof data === 'number') {
    return data;
  }

  if (typeof (data as any)?.count === 'number') {
    return (data as any).count;
  }

  if (typeof (data as any)?.unreadCount === 'number') {
    return (data as any).unreadCount;
  }

  return Number(data) || 0;
}
```

**Usage:**
```typescript
// Load unread count
const loadUnreadCount = useCallback(async () => {
  try {
    const count = await NotificationService.getUnreadCount();
    setUnreadCount(count ?? 0);
  } catch (err) {
    console.error('Error loading unread notification count:', err);
    // Không throw error để không ảnh hưởng UI
  }
}, []);

// Load unread count khi component mount và khi có thay đổi
useEffect(() => {
  if (isAuthenticated) {
    loadUnreadCount();
    
    // Optional: Polling để update unread count định kỳ (mỗi 30 giây)
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  } else {
    setUnreadCount(0);
  }
}, [isAuthenticated, loadUnreadCount]);
```

**Badge Display:**
```typescript
// Hiển thị badge với số lượng chưa đọc
{isAuthenticated && unreadCount > 0 && (
  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
```

---

## Flow xử lý chính

### Flow 1: Load danh sách thông báo

```
1. User mở trang Notification hoặc click vào notification icon
   ↓
2. Kiểm tra authentication:
   - Nếu chưa đăng nhập: hiển thị empty state hoặc redirect login
   - Nếu đã đăng nhập: tiếp tục
   ↓
3. Gọi API: GET /api/customer/notifications?page=0&size=20
   ↓
4. Nhận response (NotificationPageResponse)
   ↓
5. Hiển thị danh sách thông báo:
   - Unread notifications: highlight (bg-blue-50, font-semibold)
   - Read notifications: normal style
   - Hiển thị title, message, type, createdAt
   ↓
6. (Background) Load unread count:
   - Gọi API: GET /api/customer/notifications/unread-count
   - Update badge count
```

### Flow 2: Click vào thông báo

```
1. User click vào một thông báo
   ↓
2. Kiểm tra read status:
   - Nếu chưa đọc (read === false):
     a. Optimistic update: mark as read trong local state
     b. Giảm unread count
     c. Gọi API: POST /api/customer/notifications/{id}/read
     d. Nếu API success: giữ nguyên optimistic update
     e. Nếu API error: revert optimistic update, reload unread count
   - Nếu đã đọc: bỏ qua bước mark as read
   ↓
3. Kiểm tra actionUrl:
   - Nếu có actionUrl: navigate đến URL đó
   - Map legacy paths:
     * /customer/orders → /orders
     * /customer/orders/{orderId} → /orders (với state { orderId })
   - Nếu không có actionUrl: không làm gì (chỉ mark as read)
```

### Flow 3: Mark all as read

```
1. User click "Đánh dấu tất cả đã đọc"
   ↓
2. Kiểm tra có unread notifications không:
   - Nếu không có: show message "Tất cả thông báo đã được đọc"
   - Nếu có: tiếp tục
   ↓
3. Optimistic update:
   - Mark tất cả notifications trong local state là read: true
   - Set unread count = 0
   ↓
4. Gọi API parallel cho tất cả unread notifications:
   - Promise.all([...unreadNotifications.map(n => markAsRead(n.id))])
   ↓
5. Nếu success:
   - Show success message
   - Reload unread count để đảm bảo chính xác
   ↓
6. Nếu error:
   - Show error message
   - Reload notifications để revert
```

### Flow 4: Pagination

```
1. User click vào trang khác hoặc scroll đến cuối (infinite scroll)
   ↓
2. Tính toán page number:
   - Frontend: 1-based (page 1, 2, 3...)
   - Backend: 0-based (page 0, 1, 2...)
   - Convert: backendPage = frontendPage - 1
   ↓
3. Gọi API: GET /api/customer/notifications?page={backendPage}&size={pageSize}
   ↓
4. Update state:
   - setNotifications(response.content)
   - setTotalElements(response.totalElements)
   - setCurrentPage(frontendPage)
   ↓
5. Hiển thị pagination controls:
   - Current page / Total pages
   - Previous / Next buttons
   - Page numbers
```

### Flow 5: Real-time update (Polling)

```
1. Component mount hoặc user authenticated
   ↓
2. Setup polling interval (mỗi 30 giây):
   - setInterval(() => loadUnreadCount(), 30000)
   ↓
3. Mỗi 30 giây:
   - Gọi API: GET /api/customer/notifications/unread-count
   - Update badge count nếu có thay đổi
   ↓
4. Cleanup khi component unmount:
   - clearInterval(interval)
```

---

## Data Models

### Notification Interface

```typescript
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  metadataJson: string | null;
  createdAt: string | null;
}
```

### NotificationPageResponse Interface

```typescript
export interface NotificationPageResponse {
  content: Notification[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
```

### Metadata Structure (từ metadataJson)

```typescript
// Parse metadataJson để lấy thông tin bổ sung
interface NotificationMetadata {
  orderId?: string;
  orderCode?: string;
  storeId?: string;
  storeName?: string;
  productId?: string;
  productName?: string;
  // ... các fields khác tùy theo loại notification
}

// Usage:
const metadata = notification.metadataJson 
  ? JSON.parse(notification.metadataJson) 
  : null;
```

---

## Notification Types

### Các loại thông báo

| Type | Mô tả | Action URL thường dùng |
|------|-------|------------------------|
| `NEW_ORDER` | Đơn hàng mới | `/orders/{orderId}` |
| `ORDER_CANCELLED` | Đơn hàng đã hủy | `/orders/{orderId}` |
| `ORDER_SHIPPED` | Đơn hàng đang giao | `/orders/{orderId}` |
| `ORDER_DELIVERED` | Đơn hàng đã giao | `/orders/{orderId}` |
| `ORDER_COMPLETED` | Đơn hàng hoàn tất | `/orders/{orderId}` |
| `PAYMENT_SUCCESS` | Thanh toán thành công | `/orders/{orderId}` |
| `PAYMENT_FAILED` | Thanh toán thất bại | `/orders/{orderId}` |
| `VOUCHER` | Mã giảm giá mới | `/profile` hoặc `/vouchers` |
| `PROMOTION` | Khuyến mãi | `/promotions` hoặc `/campaigns` |
| `SYSTEM` | Thông báo hệ thống | `/` hoặc `null` |

### Type Label Mapping

```typescript
const getNotificationTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'NEW_ORDER': 'Đơn hàng mới',
    'ORDER_CANCELLED': 'Đơn hàng hủy',
    'ORDER_SHIPPED': 'Đơn hàng đang giao',
    'ORDER_DELIVERED': 'Đơn hàng đã giao',
    'ORDER_COMPLETED': 'Đơn hàng hoàn tất',
    'PAYMENT_SUCCESS': 'Thanh toán thành công',
    'PAYMENT_FAILED': 'Thanh toán thất bại',
    'VOUCHER': 'Mã giảm giá',
    'PROMOTION': 'Khuyến mãi',
    'SYSTEM': 'Hệ thống',
  };
  return typeMap[type] || type;
};
```

---

## Action URL Mapping

### Legacy Path Mapping

Backend có thể trả về các legacy paths, cần map sang routes mới:

```typescript
const navigateToActionUrl = (actionUrl: string) => {
  if (!actionUrl) return;

  // Map legacy customer order paths to current customer portal routes
  if (actionUrl === '/customer/orders' || actionUrl === '/customer/orders/') {
    navigate('/orders');
    return;
  }

  if (actionUrl.startsWith('/customer/orders/')) {
    const orderId = actionUrl.substring('/customer/orders/'.length);
    if (orderId) {
      navigate('/orders', { state: { orderId } });
    } else {
      navigate('/orders');
    }
    return;
  }

  // Các paths khác navigate trực tiếp
  navigate(actionUrl);
};
```

### Common Action URLs

| Action URL Pattern | Mobile Route | Description |
|-------------------|--------------|-------------|
| `/orders` | `/orders` | Danh sách đơn hàng |
| `/orders/{orderId}` | `/orders/{orderId}` | Chi tiết đơn hàng |
| `/profile` | `/profile` | Trang profile |
| `/vouchers` | `/vouchers` | Danh sách voucher |
| `/campaigns` | `/campaigns` | Danh sách campaign |
| `/returns` | `/returns` | Lịch sử hoàn trả |

---

## Date Formatting

### Relative Time Format

```typescript
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Vừa xong';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    // Nếu > 7 ngày: hiển thị ngày tháng đầy đủ
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Vừa xong';
  }
};
```

---

## Lưu ý quan trọng cho Mobile

1. **Pagination**: 
   - Backend sử dụng 0-based indexing
   - Frontend có thể dùng 1-based và convert khi gọi API
   - Hoặc implement infinite scroll thay vì pagination

2. **Optimistic Update**: 
   - Nên dùng optimistic update khi mark as read để UX mượt mà hơn
   - Nhớ revert nếu API call thất bại

3. **Unread Count Polling**: 
   - Nên polling unread count định kỳ (mỗi 30-60 giây) để update badge
   - Cleanup interval khi component unmount

4. **Error Handling**: 
   - 401: redirect về login
   - 404: notification không tồn tại (có thể đã bị xóa)
   - 500: retry hoặc show error message

5. **Action URL Navigation**: 
   - Parse và map legacy paths
   - Handle deep linking cho mobile
   - Pass state khi navigate (VD: orderId)

6. **Badge Display**: 
   - Hiển thị số lượng chưa đọc trên notification icon
   - Format: hiển thị số hoặc "99+" nếu > 99
   - Ẩn badge nếu count = 0

7. **Read/Unread Visual Distinction**: 
   - Unread: highlight background (bg-blue-50), font-semibold, dot indicator
   - Read: normal background, normal font weight

8. **Metadata Parsing**: 
   - Parse `metadataJson` để lấy thông tin bổ sung (orderId, orderCode, etc.)
   - Handle null/empty metadataJson gracefully

9. **Real-time Updates**: 
   - Có thể implement WebSocket hoặc Server-Sent Events (SSE) để real-time updates
   - Hoặc polling với interval ngắn hơn (10-15 giây) cho critical notifications

10. **Notification Sound/Vibration**: 
    - Mobile có thể play sound hoặc vibrate khi có notification mới
    - Chỉ trigger khi app đang mở và có unread count mới

---

## Example: Complete Notification Component Logic

```typescript
// NotificationPage.tsx - Complete example
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationService, type Notification } from '../services/customer/NotificationService';

const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Load notifications
  const loadNotifications = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await NotificationService.getNotifications(pageNum, pageSize);
      
      setNotifications(response.content || []);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(pageNum + 1);
      
      await loadUnreadCount();
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err?.message || 'Không thể tải thông báo');
      setNotifications([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count ?? 0);
    } catch (err) {
      console.error('Error loading unread notification count:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotifications(0);
  }, [loadNotifications]);

  // Polling unread count
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Vừa xong';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Vừa xong';
    }
  };

  // Navigate to action URL
  const navigateToActionUrl = (actionUrl: string) => {
    if (!actionUrl) return;

    if (actionUrl === '/customer/orders' || actionUrl === '/customer/orders/') {
      navigate('/orders');
      return;
    }

    if (actionUrl.startsWith('/customer/orders/')) {
      const orderId = actionUrl.substring('/customer/orders/'.length);
      if (orderId) {
        navigate('/orders', { state: { orderId } });
      } else {
        navigate('/orders');
      }
      return;
    }

    navigate(actionUrl);
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        await NotificationService.markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: false } : n
          )
        );
        loadUnreadCount();
      }
    }

    if (notification.actionUrl) {
      navigateToActionUrl(notification.actionUrl);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(prev => Math.max(0, prev - unreadNotifications.length));

      await Promise.all(
        unreadNotifications.map(n => NotificationService.markAsRead(n.id))
      );

      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
      loadNotifications(currentPage - 1);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadNotifications(page - 1);
  };

  // Render UI...
  return (
    // ... JSX
  );
};
```

---

## Kết luận

Tài liệu này cung cấp đầy đủ thông tin về các API liên quan đến Notification của Customer role. Mobile app có thể sử dụng các API này để:
- Hiển thị danh sách thông báo với pagination
- Hiển thị badge với số lượng chưa đọc
- Đánh dấu thông báo đã đọc (single hoặc all)
- Navigate đến action URL khi click vào thông báo
- Polling để update unread count real-time

Tất cả các API đều yêu cầu authentication token và có error handling rõ ràng. Nên implement optimistic updates để UX mượt mà hơn.

