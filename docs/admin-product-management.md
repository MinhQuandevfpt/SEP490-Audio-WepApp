# Admin Product Management - Tài liệu chi tiết

## 📋 Tổng quan

Trang **AdminProductManagement** (`src/pages/Admin/ProductManagement/AdminProductManagement.tsx`) là trang quản lý sản phẩm dành cho Admin, cho phép:
- Xem danh sách tất cả sản phẩm trên hệ thống
- Tìm kiếm và lọc sản phẩm theo nhiều tiêu chí
- Xem chi tiết sản phẩm
- Theo dõi thống kê sản phẩm

---

## 🔌 Các API được sử dụng

### 1. **GET /api/products** - Lấy danh sách sản phẩm

**Service:** `AdminProductService.getAllProducts()`

**Request:**
```typescript
GET /api/products?page=0&size=20&keyword=...&status=...&storeId=...&categoryName=...&minPrice=...&maxPrice=...
```

**Query Parameters:**
- `page` (number): Số trang (0-based)
- `size` (number): Số lượng sản phẩm mỗi trang
- `keyword` (string, optional): Từ khóa tìm kiếm theo tên sản phẩm
- `status` (string, optional): Trạng thái sản phẩm (có thể nhiều, phân cách bằng dấu phẩy)
  - `ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`, `PENDING`, `PENDING_APPROVAL`, `REJECTED`, `REJECT`, `DRAFT`, `DISCONTINUED`, `UNLISTED`, `SUSPENDED`, `DELETED`, `BANNED`
- `storeId` (string, optional): ID cửa hàng
- `categoryName` (string, optional): Tên danh mục (có thể nhiều, phân cách bằng dấu phẩy)
- `minPrice` (number, optional): Giá tối thiểu
- `maxPrice` (number, optional): Giá tối đa

**Response:**
```typescript
{
  status: 200,
  message: string,
  data: ProductResponse[]
}
```

**ProductResponse Interface:**
```typescript
interface ProductResponse {
  productId: string;
  storeId: string;
  storeName: string;
  categories: Array<{
    categoryId: string;
    categoryName: string;
  }>;
  brandName: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  model: string | null;
  color: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | null;
  variants: ProductVariant[];
  images: string[];
  videoUrl: string | null;
  sku: string;
  price: number | null;
  discountPrice: number | null;
  promotionPercent: number | null;
  priceAfterPromotion: number | null;
  priceBeforeVoucher: number | null;
  voucherAmount: number | null;
  finalPrice: number | null;
  platformFeePercent: number | null;
  currency: string;
  stockQuantity: number;
  warehouseLocation: string | null;
  approvalReason: string | null;  // Lý do từ chối (nếu có)
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  shippingAddress: string | null;
  shippingFee: number | null;
  supportedShippingMethodIds: string[];
  bulkDiscounts: any[];
  status: string;
  isFeatured: boolean;
  ratingAverage: number | null;
  reviewCount: number | null;
  viewCount: number | null;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
  lastUpdateIntervalDays: number;
  createdBy: string;
  updatedBy: string;
  [key: string]: any;
}
```

---

---

### 3. **GET /api/stores** - Lấy danh sách cửa hàng

**Service:** `AdminStoreService.getAllStores()`

**Request:**
```typescript
GET /api/stores?page=0&size=1000
```

**Response:**
```typescript
{
  status: 200,
  message: string,
  data: {
    stores: Array<{
      storeId: string;
      storeName: string;
      email?: string;
      phoneNumber?: string;
      status?: string;
    }>;
    pagination: {
      pageNumber: number;
      pageSize: number;
      totalPages: number;
      totalElements: number;
    }
  }
}
```

**Mục đích:** Load danh sách cửa hàng để hiển thị trong dropdown filter.

---

### 4. **GET /api/categories/tree** - Lấy cây danh mục

**Service:** `AdminCategoryService.getCategoryTree()`

**Request:**
```typescript
GET /api/categories/tree
```

**Response:**
```typescript
{
  status: 200,
  message: string,
  data: CategoryTreeNode[]
}
```

**CategoryTreeNode Interface:**
```typescript
interface CategoryTreeNode {
  categoryId: string;
  name: string;
  children?: CategoryTreeNode[];
}
```

**Mục đích:** Load cây danh mục để hiển thị trong dropdown filter (hỗ trợ multi-select).

---

## 🎯 Logic xử lý chính

### 1. **State Management**

#### Loading States
- `isInitialLoading`: Hiển thị spinner khi load lần đầu
- `isFetching`: Hiển thị loading khi user thực hiện action (search, filter, etc.)
- `isBackgroundFetching`: Hiển thị indicator nhỏ khi background refresh (không blocking UI)

#### Filter States
- `searchKeyword`: Từ khóa tìm kiếm
- `selectedStatus`: Mảng các trạng thái đã chọn (multi-select)
- `selectedStoreId`: ID cửa hàng đã chọn
- `selectedCategoryNames`: Mảng tên danh mục đã chọn (multi-select)
- `minPrice`, `maxPrice`: Khoảng giá

#### Pagination State
- `pagination`: Cấu hình phân trang (current, pageSize, total, etc.)

---

### 2. **Data Fetching Flow**

#### Initial Load
```typescript
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    fetchProducts(false); // Show loading spinner
    return;
  }
  fetchProducts(false); // User action - show loading
}, [pagination.current, pagination.pageSize, searchKeyword, selectedStatus, selectedStoreId, selectedCategoryNames, minPrice, maxPrice]);
```

**Flow:**
1. Component mount → `isInitialMount.current = true`
2. `useEffect` trigger → `fetchProducts(false)` với `isInitialLoading = true`
3. Sau khi load xong → `isInitialLoading = false`

#### Background Polling
```typescript
usePolling(
  async () => {
    setIsBackgroundFetching(true);
    try {
      await fetchProducts(true); // Silent mode - no loading spinner
    } finally {
      setTimeout(() => setIsBackgroundFetching(false), 500);
    }
  },
  {
    interval: 10_000,        // 10 seconds
    enabled: true,
    silent: true,            // Background refresh won't show loading spinner
    skipInitialFetch: true,  // Skip initial fetch - useEffect handles it
  }
);
```

**Flow:**
1. Mỗi 10 giây tự động refresh data
2. `fetchProducts(true)` → Silent mode, không hiển thị loading spinner
3. Chỉ hiển thị indicator nhỏ ở góc màn hình (`isBackgroundFetching`)

#### Manual Refresh
- User click "Tìm kiếm" → `handleSearch()` → Reset pagination về trang 1 → `useEffect` trigger → `fetchProducts(false)`
- User thay đổi filter → `useEffect` trigger → `fetchProducts(false)`

---

### 3. **Filter Logic**

#### Build Filters Object
```typescript
const filters: ProductFilters = {
  page: (pagination.current || 1) - 1,
  size: pagination.pageSize || 20,
};

if (searchKeyword.trim()) filters.keyword = searchKeyword.trim();
if (selectedStatus.length > 0) filters.status = selectedStatus.join(',');
if (selectedStoreId) filters.storeId = selectedStoreId;
if (selectedCategoryNames.length > 0) filters.categoryName = selectedCategoryNames.join(',');
if (minPrice !== undefined) filters.minPrice = minPrice;
if (maxPrice !== undefined) filters.maxPrice = maxPrice;
```

**Lưu ý:**
- `status` và `categoryName` có thể là chuỗi phân cách bằng dấu phẩy (multi-select)
- `page` là 0-based (trang 1 → page = 0)

---

### 4. **UI Rendering Logic**

#### Status Badge
```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE': return <Tag color="success">Đang bán</Tag>;
    case 'INACTIVE': return <Tag color="default">Ngừng bán</Tag>;
    case 'OUT_OF_STOCK': return <Tag color="warning">Hết hàng</Tag>;
    case 'PENDING': return <Tag color="processing">Chờ duyệt</Tag>;
    case 'PENDING_APPROVAL': return <Tag color="processing">Chờ phê duyệt</Tag>;
    case 'REJECTED': return <Tag color="error">Bị từ chối</Tag>;
    case 'REJECT': return <Tag color="error">Bị từ chối</Tag>;
    case 'DRAFT': return <Tag color="default">Nháp</Tag>;
    // ... more cases
  }
};
```

**Lưu ý:** Nếu có `approvalReason`, hiển thị trong `Popover` khi hover vào status badge.

#### Price Display
```typescript
const getPriceDisplay = (product: ProductResponse) => {
  // Nếu có variants → hiển thị khoảng giá
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map(v => v.variantPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return formatCurrency(minPrice);
    }
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  }
  // Nếu không có variants → hiển thị giá gốc
  return formatCurrency(product.price);
};
```

#### Category Display
```typescript
// Hiển thị nhiều category dưới dạng Tags
{categories.map((cat) => (
  <Tag key={cat.categoryId} color="blue">
    {cat.categoryName}
  </Tag>
))}
```

---

### 6. **Stats Calculation**

```typescript
const stats = useMemo(() => {
  const total = products.length;
  const active = products.filter(p => p.status === 'ACTIVE').length;
  const inactive = products.filter(p => p.status === 'INACTIVE').length;
  const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
  
  return { total, active, inactive, totalStock };
}, [products]);
```

**Hiển thị:** 4 Statistic Cards ở đầu trang.

---

## 🔧 Dependencies

### Services
- **`AdminProductService`** (`src/services/admin/AdminProductService.ts`)
  - `getAllProducts(filters?: ProductFilters): Promise<ProductResponse[]>`
  
- **`AdminStoreService`** (`src/services/admin/AdminStoreService.ts`)
  - `getAllStores(page: number, size: number): Promise<StoreInfo[]>`
  
- **`AdminCategoryService`** (`src/services/admin/AdminCategoryService.ts`)
  - `getCategoryTree(): Promise<ApiResponse<CategoryTreeNode[]>>`

### Hooks
- **`usePolling`** (`src/hooks/usePolling.ts`)
  - Custom hook để tự động refresh data mỗi 10 giây (background polling)
  - Options: `interval`, `enabled`, `silent`, `skipInitialFetch`

### Types
- **`ProductResponse`** (`src/services/admin/AdminProductService.ts`)
- **`ProductFilters`** (`src/services/admin/AdminProductService.ts`)
- **`CategoryTreeNode`** (`src/types/api.ts`)
- **`ApiResponse`** (`src/types/api.ts`)

### Utils
- **`showError`** (`src/utils/notification.ts`)
  - Hiển thị error notification dạng centered popup

### Components (Ant Design)
- `Table`, `Card`, `Input`, `Button`, `Space`, `Tag`, `Image`, `Typography`, `Row`, `Col`, `Statistic`, `Empty`, `Tooltip`, `Popover`, `Select`, `InputNumber`, `Modal`, `Switch`, `message`

---

## 📊 Component Structure

```
AdminProductManagement
├── Header Section
│   ├── Title: "Quản lý sản phẩm"
│   └── Description
│
├── Background Refresh Indicator (optional)
│   └── Small indicator ở góc màn hình khi background refresh
│
├── Stats Cards (Row)
│   ├── Tổng sản phẩm
│   ├── Đang bán
│   ├── Ngừng bán
│   └── Tổng tồn kho
│
├── Filters Card
│   ├── Search Input (keyword)
│   ├── Store Select (single)
│   ├── Status Select (multiple)
│   ├── Category Select (multiple)
│   ├── Price Range (minPrice, maxPrice)
│   └── Action Buttons (Search, Reset)
│
├── Products Table
│   ├── Columns:
│   │   ├── STT
│   │   ├── Hình ảnh
│   │   ├── Tên sản phẩm (với SKU, ID)
│   │   ├── Cửa hàng
│   │   ├── Danh mục (multiple tags)
│   │   ├── Giá bán
│   │   ├── Tồn kho
│   │   ├── Đánh giá
│   │   ├── Trạng thái (với approvalReason tooltip)
│   │   ├── Lý do từ chối
│   │   └── Thao tác (View Detail button)
│   └── Pagination
```

---

## 🔄 Data Flow

### 1. **Initial Load**
```
Component Mount
  ↓
useEffect (initial mount)
  ↓
fetchProducts(false)
  ↓
AdminProductService.getAllProducts(filters)
  ↓
adminHttpClient.get('/api/products?...')
  ↓
setProducts(result)
  ↓
setIsInitialLoading(false)
  ↓
Render Table
```

### 2. **Background Polling**
```
usePolling hook
  ↓
Every 10 seconds
  ↓
setIsBackgroundFetching(true)
  ↓
fetchProducts(true) [silent]
  ↓
Update products (no loading spinner)
  ↓
setIsBackgroundFetching(false)
```

---

## 🎨 UI Features

### 1. **Loading States**
- **Initial Loading:** Full-page spinner (`isInitialLoading`)
- **User Action Loading:** Button loading state (`isFetching`)
- **Background Refresh:** Small indicator ở góc màn hình (`isBackgroundFetching`)

### 2. **Error Handling**
- Error notification dạng centered popup
- Parse error message từ nhiều nguồn
- Translate specific errors sang tiếng Việt

### 3. **Responsive Design**
- Sử dụng Ant Design Grid (`Row`, `Col`) với breakpoints (`xs`, `sm`, `md`)
- Table có horizontal scroll (`scroll={{ x: 1400 }}`)

### 4. **User Experience**
- Auto-scroll to top khi pagination thay đổi
- Background refresh không làm gián đoạn user
- Tooltip/Popover để hiển thị thông tin chi tiết
- Empty state khi không có data

---

## 🔐 Authentication & Authorization

### Token Management
- Sử dụng `admin_access_token` từ `localStorage`
- Token được gửi trong header: `Authorization: Bearer {token}`
- Tự động refresh token khi nhận 401 (trong `AdminHttpClient`)

### Authorization
- Chỉ Admin mới có quyền truy cập trang này

---

## 🐛 Error Scenarios

### 1. **Token Expired (401)**
- `AdminHttpClient` tự động refresh token
- Retry request một lần
- Nếu refresh fail → throw error với message "Phiên đăng nhập đã hết hạn"

### 2. **Network Error**
- Hiển thị error notification
- User có thể retry bằng cách click "Tìm kiếm" lại

### 3. **Empty Result**
- Hiển thị `Empty` component với message "Không tìm thấy sản phẩm nào"

---

## 📝 Notes

1. **Pagination:** API không trả về `total`, nên dùng `result.length` tạm thời
2. **Category Filter:** Hỗ trợ multi-select, gửi lên API dưới dạng comma-separated string
3. **Status Filter:** Hỗ trợ multi-select, gửi lên API dưới dạng comma-separated string
4. **Price Display:** Nếu có variants, hiển thị khoảng giá (min - max)
5. **Approval Reason:** Hiển thị trong cả status badge (tooltip) và cột riêng
6. **Background Refresh:** Không làm gián đoạn user, chỉ hiển thị indicator nhỏ

---

## 🚀 Future Improvements

1. **Export to Excel:** Cho phép export danh sách sản phẩm ra Excel
2. **Advanced Filters:** Thêm filter theo brand, rating, date range
3. **Real-time Updates:** Sử dụng WebSocket để cập nhật real-time thay vì polling
4. **Caching:** Cache filter results để tăng performance

---

## 📚 Related Files

- **Component:** `src/pages/Admin/ProductManagement/AdminProductManagement.tsx`
- **Services:**
  - `src/services/admin/AdminProductService.ts`
  - `src/services/admin/AdminStoreService.ts`
  - `src/services/admin/AdminCategoryService.ts`
- **Hooks:** `src/hooks/usePolling.ts`
- **Types:** `src/types/api.ts`
- **Utils:** `src/utils/notification.ts`

---

**Last Updated:** 2025-01-11

