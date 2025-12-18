# Shopping Cart V2 - API & Logic Documentation

> **Mục đích**: Tài liệu này mô tả chi tiết API, request/response, và logic của trang Shopping Cart V2 để hỗ trợ phát triển mobile app (TypeScript Expo).

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc Component](#cấu-trúc-component)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Formats](#requestresponse-formats)
5. [State Management](#state-management)
6. [Business Logic](#business-logic)
7. [UI/UX Flow](#uiux-flow)
8. [Authentication](#authentication)
9. [Error Handling](#error-handling)
10. [Implementation Guide for Mobile](#implementation-guide-for-mobile)

---

## 🎯 Tổng quan

### Mô tả
Shopping Cart V2 là trang giỏ hàng mới của hệ thống e-commerce, cho phép khách hàng:
- Xem danh sách sản phẩm trong giỏ hàng (nhóm theo cửa hàng)
- Chọn/bỏ chọn sản phẩm để thanh toán
- Tăng/giảm số lượng sản phẩm
- Xóa sản phẩm khỏi giỏ hàng
- Xem tổng giá (bao gồm giảm giá nền tảng)
- Chuyển sang trang pre-checkout để thanh toán

### Route
- **Web**: `/cartv2`
- **Component**: `src/components/ShopCartv2/ShopCartv2.tsx`
- **Page**: `src/pages/Customer/ShoppingCart_ver2/Cartver2.tsx`

---

## 🏗️ Cấu trúc Component

### Component Hierarchy

```
Cartver2.tsx (Page)
└── Layout
    └── ShopCartV2.tsx (Main Component)
        ├── Left Column: Cart Items (grouped by store)
        │   ├── Header: Select All + Delete All
        │   └── Store Groups
        │       └── Product Items
        │           ├── Checkbox
        │           ├── Product Image
        │           ├── Product Info
        │           ├── Price (with campaign discount)
        │           ├── Quantity Controls (+/-)
        │           └── Delete Button
        └── Right Column: Order Summary
            ├── Base Subtotal
            ├── Platform Discount
            └── Total + Checkout Button
```

### Key Dependencies

```typescript
// Hooks
import useCart from '../../hooks/useCart'

// Services
import { ProductListService } from '../../services/customer/ProductListService'
import { CustomerCartService } from '../../services/customer/CartService'

// Types
import type { CartResponse, CartItem } from '../../types/cart'
import type { Product } from '../../services/customer/ProductListService'
```

---

## 🔌 API Endpoints

### 1. GET Cart - Lấy giỏ hàng hiện tại

**Endpoint**: `GET /api/v1/customers/{customerId}/cart`

**Authentication**: Required (Bearer Token)

**Headers**:
```http
Authorization: Bearer {accessToken}
Accept: */*
Content-Type: application/json
```

**Response**: `CartResponse` (xem chi tiết ở phần Request/Response Formats)

**Service Method**: `CustomerCartService.getCart()`

**Hook Method**: `useCart().loadCart()`

---

### 2. POST Update Quantity - Cập nhật số lượng sản phẩm

**Endpoint**: `POST /api/v1/customers/{customerId}/cart/items/quantity-with-vouchers`

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "cartItemId": "string (UUID)",
  "quantity": 1,
  "storeVouchers": null,
  "platformVouchers": null,
  "serviceTypeIds": null
}
```

**Response**: `CartResponse` (cart đã được cập nhật)

**Service Method**: `CustomerCartService.updateQuantityWithVouchers(request)`

**Hook Method**: `useCart().updateQuantity(cartItemId, newQuantity)`

**Logic**:
- Khi user click nút `+` hoặc `-`, gọi API này với `quantity` mới
- Backend sẽ:
  - Cập nhật quantity
  - Kiểm tra lại `usage_per_user` của platform campaign
  - Tính lại `unitPrice` (có thể quay về `baseUnitPrice` nếu vượt quota)
  - Tính lại tổng giỏ hàng
  - Trả về `CartResponse` với `campaignUsageExceeded` flag nếu cần

---

### 3. DELETE Cart Items - Xóa sản phẩm khỏi giỏ hàng

**Endpoint**: `DELETE /api/v1/customers/{customerId}/cart/items`

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "cartItemIds": ["uuid1", "uuid2", ...]
}
```

**Response**: `CartResponse` (cart sau khi xóa)

**Service Method**: `CustomerCartService.deleteItems(cartItemIds)`

**Hook Method**: `useCart().removeItems(cartItemIds)`

**Use Cases**:
- Xóa 1 sản phẩm: `removeItems([item.cartItemId])`
- Xóa tất cả: `removeItems(items.map(i => i.cartItemId))`

---

### 4. GET Product Detail - Lấy thông tin sản phẩm (để lấy storeId/storeName)

**Endpoint**: `GET /api/products/{productId}`

**Authentication**: Optional (có thể public)

**Response**: 
```json
{
  "status": 200,
  "message": "string",
  "data": {
    "productId": "string",
    "name": "string",
    "price": 0,
    "storeId": "string",
    "store": {
      "id": "string",
      "name": "string"
    },
    // ... other product fields
  }
}
```

**Service Method**: `ProductListService.getProductById(productId)`

**Purpose**: 
- Lấy `storeId` và `storeName` để nhóm sản phẩm theo cửa hàng
- Cache trong `productCache` Map để tránh gọi API nhiều lần

---

## 📦 Request/Response Formats

### CartResponse

```typescript
interface CartResponse {
  cartId: string;                    // UUID của giỏ hàng
  customerId: string;               // UUID của khách hàng
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  subtotal: number;                 // Tổng tiền (đã áp dụng campaign)
  discountTotal: number;            // Tổng giảm giá
  grandTotal: number;               // Tổng thanh toán
  items: CartItem[];               // Danh sách sản phẩm
}
```

### CartItem

```typescript
interface CartItem {
  cartItemId: string;               // UUID của item trong cart
  type: 'PRODUCT' | 'COMBO';        // Loại item
  refId: string;                    // Product ID hoặc Combo ID (UUID)
  name: string;                     // Tên sản phẩm
  image: string;                    // URL ảnh sản phẩm
  quantity: number;                 // Số lượng
  unitPrice: number;                // Giá hiện tại (đã áp dụng platform campaign nếu có)
  lineTotal: number;                // unitPrice * quantity
  originProvinceCode?: string;      // Mã tỉnh nơi sản phẩm xuất phát
  originDistrictCode?: string;      // Mã quận/huyện
  originWardCode?: string;          // Mã phường/xã
  variantId?: string;               // UUID của variant (nếu sản phẩm có variant)
  variantOptionName?: string;        // Tên option (VD: "Màu Sắc")
  variantOptionValue?: string;       // Giá trị option (VD: "Đen")
  variantUrl?: string;              // URL ảnh của variant (ưu tiên dùng thay vì image)
  
  // Platform Campaign Fields
  baseUnitPrice?: number;           // Giá gốc (chưa campaign)
  platformCampaignPrice?: number;   // Giá sau campaign (nếu có)
  inPlatformCampaign?: boolean;     // Có đang nằm trong campaign không
  campaignUsageExceeded?: boolean;  // Đã vượt giới hạn sử dụng campaign chưa
  campaignRemaining?: number;       // Số lượng còn lại trong campaign (0 nếu hết)
}
```

### Example Response

```json
{
  "cartId": "d3092af2-9b31-4227-9e77-942740564704",
  "customerId": "91133c35-1fcf-41d6-a352-b9578889b3e6",
  "status": "ACTIVE",
  "subtotal": 800000,
  "discountTotal": 0,
  "grandTotal": 800000,
  "items": [
    {
      "cartItemId": "9de40361-f46f-43a6-a82e-1a2ceb301a85",
      "type": "PRODUCT",
      "refId": "a023408b-7c5a-4f11-a974-c65015965c1c",
      "name": "JBL chính hãng xuất nhập khẩu",
      "image": "https://res.cloudinary.com/...",
      "quantity": 1,
      "unitPrice": 800000,
      "lineTotal": 800000,
      "originProvinceCode": "206",
      "originDistrictCode": "1699",
      "originWardCode": "520303",
      "variantId": "67b4f9df-0938-4d9e-ae1f-68d148d322fc",
      "variantOptionName": "Màu Sắc",
      "variantOptionValue": "Đen",
      "variantUrl": "https://res.cloudinary.com/...",
      "baseUnitPrice": 1000000,
      "platformCampaignPrice": 800000,
      "inPlatformCampaign": true,
      "campaignUsageExceeded": false,
      "campaignRemaining": 1
    }
  ]
}
```

---

## 🧠 State Management

### Component State

```typescript
// Cart data từ API
const { cart, isLoading, error, loadCart, updateQuantity, removeItems } = useCart();

// Cache thông tin sản phẩm (để lấy storeId/storeName)
const [productCache, setProductCache] = useState<Map<string, Product>>(new Map());

// Selection state
// null = mặc định tất cả được chọn
// Set<string> = tập id do user chọn thủ công
const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
```

### Selection Logic

**Mặc định**: Khi vào trang, `selectedIds = null` → tất cả items được chọn

**Khi user tương tác**:
1. Click checkbox "Chọn tất cả":
   - Nếu đang tất cả được chọn → `setSelectedIds(new Set())` (unselect all)
   - Nếu không → `setSelectedIds(new Set(all cartItemIds))` (select all)

2. Click checkbox store:
   - Nếu `selectedIds === null` → khởi tạo Set với tất cả cartItemIds
   - Toggle tất cả items trong store đó

3. Click checkbox item:
   - Nếu `selectedIds === null` → khởi tạo Set với tất cả cartItemIds
   - Toggle item đó

**Computed Values**:
```typescript
// Items đang được chọn
const selectedItems = useMemo(() => 
  selectedIds === null 
    ? items 
    : items.filter(item => selectedIds.has(item.cartItemId)),
  [items, selectedIds]
);

// Tất cả đã được chọn?
const allSelected = useMemo(() => {
  if (items.length === 0) return false;
  if (selectedIds === null) return true; // Mặc định = true
  return items.every(item => selectedIds.has(item.cartItemId));
}, [items, selectedIds]);
```

---

## 💼 Business Logic

### 1. Grouping by Store

**Mục đích**: Nhóm sản phẩm theo cửa hàng để hiển thị

**Logic**:
```typescript
// Lấy storeId từ productCache
const storeGroups = useMemo(() => {
  const groups = new Map<string, { storeId: string; storeName: string; items: CartItem[] }>();
  
  items.forEach((item) => {
    let storeId = `unknown-${item.refId}`;
    let storeName = 'Cửa hàng';
    
    if (item.type === 'PRODUCT') {
      const product = productCache.get(item.refId);
      if (product?.storeId) {
        storeId = product.storeId;
      }
      if (product?.store?.name || product?.storeName) {
        storeName = product.store?.name || product.storeName || storeName;
      }
    }
    
    if (!groups.has(storeId)) {
      groups.set(storeId, { storeId, storeName, items: [] });
    }
    groups.get(storeId)!.items.push(item);
  });
  
  return Array.from(groups.values());
}, [items, productCache]);
```

**Lưu ý**:
- Cần fetch product detail để lấy `storeId` và `storeName`
- Cache trong `productCache` Map để tránh gọi API nhiều lần
- Chỉ fetch các product chưa có trong cache

---

### 2. Price Calculation

**Base Subtotal** (Giá gốc):
```typescript
const baseSubtotal = selectedItems.reduce((sum, item) => {
  const base = item.baseUnitPrice ?? item.unitPrice;
  return sum + base * item.quantity;
}, 0);
```

**Current Subtotal** (Giá hiện tại - sau campaign):
```typescript
const currentSubtotal = selectedItems.reduce(
  (sum, item) => sum + item.unitPrice * item.quantity,
  0
);
```

**Platform Discount** (Giảm giá nền tảng):
```typescript
const platformDiscountTotal = Math.max(0, baseSubtotal - currentSubtotal);
```

**Display Logic**:
- Nếu `platformCampaignPrice !== baseUnitPrice` và `inPlatformCampaign === true` và `campaignUsageExceeded === false`:
  - Hiển thị `platformCampaignPrice` nổi bật
  - Hiển thị `baseUnitPrice` với strikethrough (gạch ngang)
- Ngược lại: chỉ hiển thị `unitPrice`

---

### 3. Campaign Usage Warning

**Điều kiện hiển thị cảnh báo**:
```typescript
if (item.campaignUsageExceeded) {
  // Hiển thị: "Bạn đã vượt số lượng áp dụng khuyến mãi, 
  // các sản phẩm vượt mức sẽ tính theo giá gốc."
}
```

**Khi nào `campaignUsageExceeded = true`?**
- Khi user tăng quantity vượt quá `campaignRemaining`
- Backend sẽ set flag này trong response của `updateQuantityWithVouchers`

---

### 4. Navigation to Pre-Checkout

**Flow**:
1. User click "Tiến hành thanh toán"
2. Lấy danh sách `selectedCartItemIds`:
   ```typescript
   const selectedCartItemIds = selectedIds === null
     ? items.map(item => item.cartItemId)
     : Array.from(selectedIds);
   ```
3. Lưu vào `sessionStorage`:
   ```typescript
   const payload = {
     selectedCartItemIds,
     storeVouchers: {},
     selectedAddressId: null,
     createdAt: Date.now(),
   };
   sessionStorage.setItem('checkout:payload:v1', JSON.stringify(payload));
   ```
4. Navigate đến `/precheckoutv2`

---

## 🎨 UI/UX Flow

### Loading States

1. **Initial Load**:
   ```typescript
   if (isLoading && !cart) {
     return <LoadingSpinner />;
   }
   ```

2. **Error State**:
   ```typescript
   if (error && !cart) {
     return <ErrorMessage error={error} />;
   }
   ```

3. **Empty Cart**:
   ```typescript
   if (!items.length) {
     return <EmptyCartMessage />;
   }
   ```

### User Interactions

1. **Select All / Unselect All**:
   - Checkbox ở header
   - Toggle tất cả items trong cart

2. **Select Store**:
   - Checkbox ở store header
   - Toggle tất cả items trong store đó

3. **Select Item**:
   - Checkbox ở mỗi item
   - Toggle item đó

4. **Update Quantity**:
   - Click `+` → `updateQuantity(itemId, quantity + 1)`
   - Click `-` → `updateQuantity(itemId, quantity - 1)`
   - Quantity được clamp trong khoảng [1, 99]

5. **Delete Item**:
   - Click icon 🗑 → `removeItems([itemId])`

6. **Delete All**:
   - Click "Xóa tất cả" → `removeItems(allItemIds)`

---

## 🔐 Authentication

### Token Management

**Token Storage**:
- Key: `CUSTOMER_token` (localStorage)
- Format: JWT Bearer Token

**Getting Customer ID**:
```typescript
// From token payload (decoded JWT)
const customerId = getCustomerId(); // From localStorage or JWT payload

// Or from token directly
const token = localStorage.getItem('CUSTOMER_token');
const payload = decodeJwtPayload(token);
const customerId = payload?.customerId || payload?.uid;
```

**API Headers**:
```http
Authorization: Bearer {CUSTOMER_token}
Accept: */*
Content-Type: application/json
```

**Check Authentication**:
```typescript
const isAuthenticated = CustomerCartService.isAuthenticated();
// Returns true if CUSTOMER_token exists
```

---

## ⚠️ Error Handling

### Error Types

1. **401 Unauthorized**:
   - Token expired → Auto refresh (via HttpInterceptor)
   - Refresh failed → Redirect to login

2. **400 Bad Request**:
   - Invalid request body
   - Missing required fields

3. **404 Not Found**:
   - Cart not found
   - Product not found

4. **500 Internal Server Error**:
   - Server error
   - Display generic error message

### Error Format

```typescript
interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
```

### Error Display

```typescript
// Format error message
const errorMessage = CustomerCartService.formatCartError(error);

// Display in UI
if (error && !cart) {
  return (
    <div className="error-message">
      {errorMessage}
    </div>
  );
}
```

---

## 📱 Implementation Guide for Mobile (TypeScript Expo)

### 1. Setup Dependencies

```bash
npm install @react-native-async-storage/async-storage
npm install axios
npm install @react-navigation/native
```

### 2. API Service Structure

```typescript
// services/CartService.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://audioe-commerce-production.up.railway.app';

class CartService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('CUSTOMER_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': '*/*',
    };
  }

  async getCart(): Promise<CartResponse> {
    const customerId = await this.getCustomerId();
    const headers = await this.getAuthHeaders();
    
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/customers/${customerId}/cart`,
      { headers }
    );
    
    return response.data;
  }

  async updateQuantity(
    cartItemId: string,
    quantity: number
  ): Promise<CartResponse> {
    const customerId = await this.getCustomerId();
    const headers = await this.getAuthHeaders();
    
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/customers/${customerId}/cart/items/quantity-with-vouchers`,
      {
        cartItemId,
        quantity,
        storeVouchers: null,
        platformVouchers: null,
        serviceTypeIds: null,
      },
      { headers }
    );
    
    return response.data;
  }

  async deleteItems(cartItemIds: string[]): Promise<CartResponse> {
    const customerId = await this.getCustomerId();
    const headers = await this.getAuthHeaders();
    
    const response = await axios.delete(
      `${API_BASE_URL}/api/v1/customers/${customerId}/cart/items`,
      {
        headers,
        data: { cartItemIds },
      }
    );
    
    return response.data;
  }

  private async getCustomerId(): Promise<string> {
    // Get from AsyncStorage or decode from JWT
    const customerId = await AsyncStorage.getItem('customerId');
    if (customerId) return customerId;
    
    // Fallback: decode from token
    const token = await AsyncStorage.getItem('CUSTOMER_token');
    if (token) {
      const payload = this.decodeJwtPayload(token);
      return payload?.customerId || payload?.uid || '';
    }
    
    throw new Error('Customer ID not found');
  }

  private decodeJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}

export default new CartService();
```

### 3. Custom Hook (React Native)

```typescript
// hooks/useCart.ts
import { useState, useEffect, useCallback } from 'react';
import CartService from '../services/CartService';
import type { CartResponse } from '../types/cart';

export const useCart = () => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CartService.getCart();
      setCart(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải giỏ hàng');
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        setIsLoading(true);
        setError(null);
        const clamped = Math.max(1, Math.min(quantity, 99));
        const updatedCart = await CartService.updateQuantity(cartItemId, clamped);
        setCart(updatedCart);
      } catch (err: any) {
        setError(err?.message || 'Không thể cập nhật số lượng');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeItems = useCallback(async (cartItemIds: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedCart = await CartService.deleteItems(cartItemIds);
      setCart(updatedCart);
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    cart,
    isLoading,
    error,
    loadCart,
    updateQuantity,
    removeItems,
  };
};
```

### 4. Component Structure (React Native)

```typescript
// screens/CartScreen.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useCart } from '../hooks/useCart';
import type { CartItem } from '../types/cart';

const CartScreen: React.FC = () => {
  const { cart, isLoading, error, updateQuantity, removeItems } = useCart();
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);

  const items = cart?.items ?? [];

  const selectedItems = useMemo(() => {
    return selectedIds === null
      ? items
      : items.filter(item => selectedIds.has(item.cartItemId));
  }, [items, selectedIds]);

  const baseSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const base = item.baseUnitPrice ?? item.unitPrice;
      return sum + base * item.quantity;
    }, 0);
  }, [selectedItems]);

  const currentSubtotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }, [selectedItems]);

  const platformDiscountTotal = Math.max(0, baseSubtotal - currentSubtotal);

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('vi-VN')} ₫`;
  };

  if (isLoading && !cart) {
    return <LoadingSpinner />;
  }

  if (error && !cart) {
    return <ErrorMessage error={error} />;
  }

  if (!items.length) {
    return <EmptyCartMessage />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.cartItemId}
        renderItem={({ item }) => (
          <CartItemCard
            item={item}
            isSelected={selectedIds === null || selectedIds.has(item.cartItemId)}
            onToggleSelect={() => {
              // Toggle selection logic
            }}
            onQuantityChange={(newQuantity) => {
              updateQuantity(item.cartItemId, newQuantity);
            }}
            onDelete={() => {
              removeItems([item.cartItemId]);
            }}
          />
        )}
      />
      
      <View style={styles.summary}>
        <Text>Giá gốc: {formatCurrency(baseSubtotal)}</Text>
        {platformDiscountTotal > 0 && (
          <Text>Giảm giá: -{formatCurrency(platformDiscountTotal)}</Text>
        )}
        <Text>Tổng: {formatCurrency(currentSubtotal)}</Text>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => {
            // Navigate to pre-checkout
          }}
        >
          <Text>Tiến hành thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### 5. Type Definitions

```typescript
// types/cart.ts
export interface CartItem {
  cartItemId: string;
  type: 'PRODUCT' | 'COMBO';
  refId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantId?: string;
  variantOptionName?: string;
  variantOptionValue?: string;
  variantUrl?: string;
  baseUnitPrice?: number;
  platformCampaignPrice?: number;
  inPlatformCampaign?: boolean;
  campaignUsageExceeded?: boolean;
  campaignRemaining?: number;
}

export interface CartResponse {
  cartId: string;
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];
}
```

---

## 🔄 Data Flow

### Load Cart Flow

```
User opens Cart Screen
    ↓
useCart().loadCart()
    ↓
CartService.getCart()
    ↓
GET /api/v1/customers/{customerId}/cart
    ↓
Response: CartResponse
    ↓
setCart(cartResponse)
    ↓
Component re-renders with cart data
```

### Update Quantity Flow

```
User clicks + or - button
    ↓
updateQuantity(cartItemId, newQuantity)
    ↓
CartService.updateQuantity(cartItemId, quantity)
    ↓
POST /api/v1/customers/{customerId}/cart/items/quantity-with-vouchers
    ↓
Response: CartResponse (updated)
    ↓
setCart(updatedCart)
    ↓
Component re-renders with new quantities/prices
```

### Delete Item Flow

```
User clicks delete button
    ↓
removeItems([cartItemId])
    ↓
CartService.deleteItems([cartItemId])
    ↓
DELETE /api/v1/customers/{customerId}/cart/items
    ↓
Response: CartResponse (without deleted item)
    ↓
setCart(updatedCart)
    ↓
Component re-renders without deleted item
```

---

## 📝 Key Implementation Notes

### 1. Selection State Management

- **Default State**: `selectedIds = null` → All items selected
- **After User Interaction**: `selectedIds = Set<string>` → Explicit selection
- **When Cart Changes**: Clean up `selectedIds` to remove non-existent items

### 2. Product Cache for Store Grouping

- Fetch product details only for items not in cache
- Cache in Map for O(1) lookup
- Use `productCache.get(item.refId)` to get store info

### 3. Price Display Logic

```typescript
// Check if item has active platform campaign
const hasActiveCampaign = 
  item.baseUnitPrice != null &&
  item.platformCampaignPrice != null &&
  item.platformCampaignPrice !== item.baseUnitPrice &&
  item.inPlatformCampaign &&
  !item.campaignUsageExceeded;

if (hasActiveCampaign) {
  // Show: platformCampaignPrice (bold, orange)
  // Show: baseUnitPrice (strikethrough, gray)
} else {
  // Show: unitPrice only
}
```

### 4. Session Storage for Checkout

```typescript
// Save selected items before navigation
const payload = {
  selectedCartItemIds: string[],
  storeVouchers: {},
  selectedAddressId: null,
  createdAt: number,
};

// In React Native, use AsyncStorage instead
await AsyncStorage.setItem('checkout:payload:v1', JSON.stringify(payload));
```

### 5. Error Handling Best Practices

- Always check `isLoading` before showing data
- Display user-friendly error messages
- Handle network errors gracefully
- Auto-retry on 401 (token refresh)

---

## 🎯 Testing Checklist

### API Testing

- [ ] GET cart returns correct data
- [ ] POST update quantity updates correctly
- [ ] DELETE items removes from cart
- [ ] Error handling for 401, 400, 404, 500

### UI Testing

- [ ] Loading state displays correctly
- [ ] Error state displays correctly
- [ ] Empty cart message shows when no items
- [ ] Selection state works (all, store, item)
- [ ] Quantity controls work (+/-)
- [ ] Delete buttons work
- [ ] Price calculations are correct
- [ ] Campaign discount displays correctly
- [ ] Navigation to pre-checkout works

### Edge Cases

- [ ] Cart with 0 items
- [ ] Cart with items from multiple stores
- [ ] Items with/without variants
- [ ] Items with/without platform campaigns
- [ ] Items exceeding campaign limit
- [ ] Network errors during API calls
- [ ] Token expiration during operation

---

## 📚 Additional Resources

### Related Files

- `src/hooks/useCart.ts` - Cart hook implementation
- `src/services/customer/CartService.ts` - Cart API service
- `src/types/cart.ts` - Type definitions
- `src/services/customer/ProductListService.ts` - Product service
- `src/utils/authHelper.ts` - Authentication utilities

### Related Pages

- `/precheckoutv2` - Pre-checkout page (next step after cart)
- `/checkout` - Final checkout page
- `/orders` - Order history page

---

## 🔗 API Base URL

**Production**: `https://audioe-commerce-production.up.railway.app`

**Environment Variable**: `VITE_API_BASE_URL` (optional, defaults to production)

---

## 📞 Support

Nếu có thắc mắc về API hoặc logic, vui lòng tham khảo:
- Swagger API documentation
- Backend team
- Code comments trong source files

---

**Last Updated**: 2025-01-17
**Version**: 2.0

