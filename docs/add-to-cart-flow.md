# Luồng Select Sản Phẩm Cho Vào Shopping Cart

## 📋 Tổng Quan

Tài liệu này giải thích chi tiết luồng từ khi người dùng chọn sản phẩm đến khi sản phẩm được thêm vào giỏ hàng và hiển thị trong UI.

---

## 🎯 Entry Points (Điểm Bắt Đầu)

### 1. **Product Detail Page** (`src/pages/Customer/ProductDetail/ProductDetail.tsx`)
- **Component chính**: `PurchaseActions` (`src/components/ProductDetailComponents/PurchaseActions/PurchaseActions.tsx`)
- **Nút thêm vào giỏ**: "Thêm vào giỏ" (ShoppingCart icon)
- **Nút mua ngay**: "Mua ngay" (CreditCard icon) - cũng thêm vào cart nhưng navigate ngay đến `/cart`

### 2. **Product List Pages**
- Các trang hiển thị danh sách sản phẩm (HomePage, ProductList, StorePage, etc.)
- **Lưu ý**: `SimpleProductCard` và `ProductCard` hiện tại chỉ có chức năng navigate đến Product Detail page, chưa có nút "Thêm vào giỏ" trực tiếp

---

## 🔄 Luồng Chi Tiết

### **Bước 1: User Click "Thêm vào giỏ"**

**File**: `src/components/ProductDetailComponents/PurchaseActions/PurchaseActions.tsx`

```typescript
const handleAddToCart = async () => {
  // 1. Kiểm tra đăng nhập
  if (!isLoggedIn()) {
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    navigate('/auth/login');
    return;
  }

  // 2. Kiểm tra variant (nếu sản phẩm có biến thể)
  if (variants && variants.length > 0 && !selectedVariant) {
    showCenterError('Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ hàng.');
    return;
  }

  // 3. Kiểm tra item đã tồn tại trong cart
  const currentCart = await CustomerCartService.getCart();
  
  // Tìm item đã tồn tại dựa trên productId và variantId
  const existingItem = currentCart.items.find(item => {
    if (item.type !== 'PRODUCT') return false;
    
    // Nếu có variant: check refId === productId AND variantId === selectedVariant.variantId
    if (selectedVariant?.variantId) {
      return item.refId === productId && item.variantId === selectedVariant.variantId;
    }
    
    // Nếu không có variant: check refId === productId AND không có variantId
    return item.refId === productId && !item.variantId;
  });

  // 4. Xử lý theo trường hợp
  if (existingItem) {
    // Item đã tồn tại → Cập nhật quantity (cộng thêm)
    const newQuantity = existingItem.quantity + qty;
    await CustomerCartService.updateItemQuantity(existingItem.cartItemId, newQuantity);
    showCenterSuccess(`Đã cập nhật số lượng sản phẩm trong giỏ hàng! (${newQuantity} sản phẩm)`);
  } else {
    // Item chưa tồn tại → Thêm mới
    await CustomerCartService.addProductToCart(
      productId, 
      qty, 
      selectedVariant?.variantId
    );
    showCenterSuccess('Đã thêm sản phẩm vào giỏ hàng!');
  }

  // 5. Dispatch event để các component khác cập nhật
  window.dispatchEvent(new CustomEvent('cartUpdated', {
    detail: { productId, productName, productImage, productPrice, quantity: qty }
  }));
}
```

**Các validation:**
- ✅ Kiểm tra đăng nhập (nếu chưa login → redirect `/auth/login`)
- ✅ Kiểm tra variant (nếu sản phẩm có variant nhưng chưa chọn → hiển thị lỗi)
- ✅ Kiểm tra số lượng (quantity ≥ 1)
- ✅ Kiểm tra tồn kho (isInStock)

**Logic Merge/Update Quantity:**
- ✅ **Kiểm tra item đã tồn tại**: Load cart hiện tại và tìm item trùng
  - Với variant: So sánh `item.refId === productId && item.variantId === variantId`
  - Không có variant: So sánh `item.refId === productId && !item.variantId`
- ✅ **Nếu đã tồn tại**: Gọi `updateItemQuantity` để cộng thêm quantity (không tạo item mới)
- ✅ **Nếu chưa tồn tại**: Gọi `addProductToCart` để thêm item mới

---

### **Bước 2: Service Layer - Xây Dựng Request**

**File**: `src/services/customer/CartService.ts`

```typescript
static async addProductToCart(
  productId: string, 
  quantity: number = 1, 
  variantId?: string
): Promise<AddToCartResponse> {
  const item: any = {
    type: 'PRODUCT',
    quantity
  };
  
  // Backend yêu cầu: EITHER productId OR variantId, KHÔNG gửi cả hai
  if (variantId) {
    // Sản phẩm có variant → chỉ gửi variantId
    item.variantId = variantId;
  } else {
    // Sản phẩm không có variant → chỉ gửi productId
    item.productId = productId;
  }
  
  return this.addToCart([item]);
}
```

**Request Body Format:**
```json
{
  "items": [
    {
      "type": "PRODUCT",
      "productId": "uuid-here",     // Nếu không có variant
      "variantId": "uuid-here",     // Nếu có variant (chỉ một trong hai)
      "quantity": 1
    }
  ]
}
```

---

### **Bước 3: API Call**

**File**: `src/services/customer/CartService.ts`

```typescript
static async addToCart(items: AddToCartRequest['items']): Promise<AddToCartResponse> {
  const customerId = this.getCustomerId(); // Lấy từ localStorage
  
  const response = await HttpInterceptor.post<AddToCartResponse>(
    `/api/v1/customers/${customerId}/cart/items`,
    { items },
    { userType: 'customer' }
  );
  
  return response;
}
```

**API Endpoint:**
- **Method**: `POST`
- **URL**: `/api/v1/customers/{customerId}/cart/items`
- **Headers**: 
  - `Authorization: Bearer {accessToken}` (tự động thêm bởi HttpInterceptor)
  - `Content-Type: application/json`
- **Body**: `{ items: AddToCartItem[] }`

**Response Format:**
```typescript
interface CartResponse {
  cartId: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  cartItemId: string;
  refId: string;              // productId hoặc variantId
  name: string;
  image: string;
  variantUrl?: string;
  unitPrice: number;
  quantity: number;
  variantOptionValue?: string; // Giá trị variant (ví dụ: "128GB", "Đỏ")
  type: 'PRODUCT' | 'COMBO';
}
```

---

### **Bước 4: Event Broadcasting**

Sau khi thêm thành công, component dispatch event để các component khác biết cart đã thay đổi:

```typescript
window.dispatchEvent(new CustomEvent('cartUpdated', {
  detail: {
    productId,
    productName,
    productImage,
    productPrice,
    quantity: qty
  }
}));
```

**Các component lắng nghe event này:**
1. **CartDropdown** (`src/components/Header/CartDropdown.tsx`)
   - Reload cart data khi nhận event
   - Cập nhật số lượng items hiển thị trên icon

2. **ShoppingCart** (`src/pages/Customer/Cart/ShoppingCart.tsx`)
   - Reload cart khi có thay đổi

---

### **Bước 5: UI Updates**

#### **5.1. Cart Dropdown (Header)**

**File**: `src/components/Header/CartDropdown.tsx`

```typescript
// Listen for cart updates
useEffect(() => {
  const handleCartUpdate = () => {
    loadCart(); // Reload cart data từ API
  };

  window.addEventListener('cartUpdated', handleCartUpdate);
  return () => window.removeEventListener('cartUpdated', handleCartUpdate);
}, []);
```

**Hiển thị:**
- Số lượng items: `cart?.items?.length || 0`
- Danh sách 5 items đầu tiên
- Tổng giá trị đơn hàng

#### **5.2. Cart Context (Global State)**

**File**: `src/contexts/CartContext.tsx` → `src/hooks/useCart.ts`

```typescript
export const useCart = () => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Auto-load cart count on mount
  useEffect(() => {
    if (CustomerCartService.isAuthenticated()) {
      loadCartCount();
    }
  }, []);
}
```

**Lưu ý**: `CartContext` hiện tại không tự động reload khi có event `cartUpdated`. Các component cần tự reload hoặc sử dụng `CartDropdown` để hiển thị số lượng.

---

## 📊 Sơ Đồ Luồng

```
┌─────────────────────────────────────────────────────────────┐
│  User Click "Thêm vào giỏ" (PurchaseActions)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Validation:                                                 │
│  - Check login?                                              │
│  - Check variant selected? (nếu có)                         │
│  - Check stock?                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Check Existing Item in Cart                                 │
│  - Load current cart from API                               │
│  - Find item by productId + variantId (nếu có)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌────────────┴────────────┐
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│ Item EXISTS?     │    │ Item NOT EXISTS?│
│ (same product/    │    │ (new product/  │
│  variant)        │    │  variant)       │
└────────┬─────────┘    └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│ Update Quantity  │    │ Add New Item     │
│ - PATCH /cart/   │    │ - POST /cart/    │
│   item/quantity  │    │   items          │
│ - newQty = old  │    │ - addProductToCart│
│   + add          │    │                  │
└────────┬─────────┘    └────────┬─────────┘
         │                        │
         └────────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API                                                 │
│  - Validate customer, product/variant                       │
│  - Update quantity OR Add new item                          │
│  - Return updated CartResponse                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Success Response: CartResponse                             │
│  - cartId, items[], totalAmount, totalItems                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Dispatch Event: 'cartUpdated'                             │
│  window.dispatchEvent(new CustomEvent('cartUpdated'))       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  UI Updates:                                                 │
│  - CartDropdown: reload cart, update count                  │
│  - ShoppingCart: reload cart (nếu đang ở trang cart)       │
│  - Show success notification                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Logic Merge/Update Quantity

### **Vấn Đề**

Trước đây, khi user click "Thêm vào giỏ" nhiều lần cho cùng một sản phẩm/variant, hệ thống sẽ tạo ra nhiều items riêng biệt trong cart, dẫn đến:
- Cart có nhiều items giống nhau (ví dụ: 4 items cho cùng 1 variant)
- Khó quản lý và hiển thị
- Tổng tiền có thể bị tính sai

### **Giải Pháp**

Hệ thống hiện tại đã được cải thiện với logic **Merge/Update Quantity**:

1. **Trước khi thêm**: Luôn kiểm tra xem item đã tồn tại trong cart chưa
2. **Nếu đã tồn tại**: Cập nhật quantity (cộng thêm) thay vì tạo item mới
3. **Nếu chưa tồn tại**: Thêm item mới vào cart

### **Cách Xác Định Item Trùng**

```typescript
// Với variant: So sánh cả productId và variantId
item.refId === productId && item.variantId === selectedVariant.variantId

// Không có variant: So sánh productId và đảm bảo không có variantId
item.refId === productId && !item.variantId
```

**Lưu ý quan trọng:**
- `refId` trong `CartItem` là `productId` (hoặc `comboId`), không phải `variantId`
- `variantId` là một field riêng trong `CartItem`
- Vì vậy cần check cả hai điều kiện để xác định item trùng

### **API Endpoints Sử Dụng**

1. **Update Quantity** (khi item đã tồn tại):
   ```
   PATCH /api/v1/customers/{customerId}/cart/item/quantity
   Body: { cartItemId: string, quantity: number }
   ```

2. **Add New Item** (khi item chưa tồn tại):
   ```
   POST /api/v1/customers/{customerId}/cart/items
   Body: { items: [{ type, productId/variantId, quantity }] }
   ```

### **Ví Dụ Thực Tế**

**Scenario**: User thêm sản phẩm "Aiyima T1 PRO" variant "Trắng" 2 lần

- **Lần 1**: 
  - Check cart → Không tìm thấy
  - Gọi `addProductToCart` → Thêm mới với quantity = 1
  - Result: 1 item trong cart

- **Lần 2**: 
  - Check cart → Tìm thấy item với variant "Trắng"
  - Gọi `updateItemQuantity` → Cập nhật quantity = 2
  - Result: Vẫn 1 item trong cart, nhưng quantity = 2

**Trước đây**: 2 items riêng biệt trong cart  
**Bây giờ**: 1 item với quantity = 2 ✅

---

## 🔍 Chi Tiết Các Trường Hợp

### **Case 1: Sản Phẩm Không Có Variant - Thêm Lần Đầu**

**Scenario**: User click "Thêm vào giỏ" lần đầu tiên cho sản phẩm không có variant

```typescript
// 1. Check cart → Không tìm thấy item
// 2. Gọi addProductToCart
// Request
{
  "items": [
    {
      "type": "PRODUCT",
      "productId": "abc-123",
      "quantity": 1
    }
  ]
}
// Result: Item mới được thêm vào cart
```

**Scenario**: User click "Thêm vào giỏ" lần thứ 2 cho cùng sản phẩm

```typescript
// 1. Check cart → Tìm thấy item với refId === productId && !variantId
// 2. Gọi updateItemQuantity
// Request
{
  "cartItemId": "cart-item-uuid",
  "quantity": 2  // oldQuantity (1) + newQuantity (1)
}
// Result: Quantity của item hiện tại được cập nhật từ 1 → 2
```

### **Case 2: Sản Phẩm Có Variant - Thêm Lần Đầu**

**Scenario**: User chọn variant "Trắng" và click "Thêm vào giỏ" lần đầu

```typescript
// 1. Check cart → Không tìm thấy item với variantId này
// 2. Gọi addProductToCart
// Request
{
  "items": [
    {
      "type": "PRODUCT",
      "variantId": "xyz-789",  // Chỉ gửi variantId, KHÔNG gửi productId
      "quantity": 1
    }
  ]
}
// Result: Item mới được thêm vào cart với variant "Trắng"
```

**Scenario**: User chọn variant "Trắng" và click "Thêm vào giỏ" lần thứ 2

```typescript
// 1. Check cart → Tìm thấy item với refId === productId && variantId === "xyz-789"
// 2. Gọi updateItemQuantity
// Request
{
  "cartItemId": "cart-item-uuid",
  "quantity": 2  // oldQuantity (1) + newQuantity (1)
}
// Result: Quantity của variant "Trắng" được cập nhật từ 1 → 2
```

**Scenario**: User chọn variant "Đen" và click "Thêm vào giỏ" (variant khác)

```typescript
// 1. Check cart → Không tìm thấy item với variantId "Đen"
// 2. Gọi addProductToCart
// Request
{
  "items": [
    {
      "type": "PRODUCT",
      "variantId": "abc-456",  // Variant ID khác
      "quantity": 1
    }
  ]
}
// Result: Item mới được thêm vào cart với variant "Đen"
// Cart bây giờ có 2 items: variant "Trắng" (qty=2) và variant "Đen" (qty=1)
```

### **Case 3: Thêm Combo**

```typescript
// Request
{
  "items": [
    {
      "type": "COMBO",
      "comboId": "combo-123",
      "quantity": 1
    }
  ]
}
```

---

## ⚠️ Error Handling

### **1. Chưa Đăng Nhập**
```typescript
if (!isLoggedIn()) {
  localStorage.setItem('redirectAfterLogin', window.location.pathname);
  navigate('/auth/login');
  return;
}
```

### **2. Chưa Chọn Variant**
```typescript
if (variants && variants.length > 0 && !selectedVariant) {
  showCenterError('Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ hàng.');
  return;
}
```

### **3. Hết Hàng**
```typescript
const isInStock = actualStock > 0;
// Button disabled nếu !isInStock
```

### **4. API Error**
```typescript
catch (error: any) {
  if (error.message?.includes('Customer ID')) {
    // Redirect to login
    navigate('/auth/login');
  } else {
    showCenterError(error.message || 'Không thể thêm vào giỏ hàng.');
  }
}
```

---

## 🎨 UI Components Liên Quan

### **1. PurchaseActions Component**
- **Location**: `src/components/ProductDetailComponents/PurchaseActions/PurchaseActions.tsx`
- **Chức năng**: 
  - Hiển thị variant selector
  - Quantity selector
  - Nút "Thêm vào giỏ" và "Mua ngay"
  - Xử lý logic thêm vào cart

### **2. CartDropdown Component**
- **Location**: `src/components/Header/CartDropdown.tsx`
- **Chức năng**:
  - Hiển thị số lượng items trên icon
  - Dropdown hiển thị 5 items đầu tiên
  - Tổng giá trị đơn hàng
  - Link đến trang cart

### **3. ShoppingCart Component**
- **Location**: `src/pages/Customer/Cart/ShoppingCart.tsx`
- **Chức năng**:
  - Hiển thị toàn bộ items trong cart
  - Cho phép update quantity, remove items
  - Apply vouchers
  - Navigate to checkout

---

## 🔧 State Management

### **CartContext**
- **Provider**: `src/contexts/CartContext.tsx`
- **Hook**: `src/hooks/useCart.ts`
- **State**:
  - `cart: CartResponse | null`
  - `cartItemCount: number`
  - `isLoading: boolean`
  - `error: string | null`

### **Local Storage**
- `customerId`: ID của customer (dùng để gọi API)
- `redirectAfterLogin`: URL để redirect sau khi login

---

## 📝 Notes Quan Trọng

1. **Backend Requirement**: Backend yêu cầu **EITHER** `productId` **OR** `variantId`, không gửi cả hai.

2. **Event-Based Updates**: Các component không tự động sync với cart state. Cần dispatch event `cartUpdated` để các component khác reload.

3. **Cart Count**: Cart count được tính từ `cart.items.length` (số lượng items khác nhau), không phải tổng quantity.

4. **Variant Selection**: Nếu sản phẩm có variant, user **BẮT BUỘC** phải chọn variant trước khi thêm vào cart.

5. **Stock Check**: UI disable nút "Thêm vào giỏ" nếu `isInStock === false`.

6. **Merge Logic (Quan Trọng)**: 
   - **Trước khi thêm**: Hệ thống luôn kiểm tra xem item đã tồn tại trong cart chưa
   - **Nếu đã tồn tại**: Cập nhật quantity (cộng thêm) thay vì tạo item mới
   - **Nếu chưa tồn tại**: Thêm item mới vào cart
   - **Cách xác định item trùng**:
     - Với variant: `item.refId === productId && item.variantId === variantId`
     - Không có variant: `item.refId === productId && !item.variantId`
   - **Lợi ích**: Tránh tạo nhiều items giống nhau trong cart, giữ cart gọn gàng và dễ quản lý

---

## 🚀 Future Improvements

1. **Optimistic Updates**: Cập nhật UI ngay lập tức trước khi API response về (UX tốt hơn).

2. **Cart Persistence**: Lưu cart vào localStorage để giữ cart khi refresh page.

3. **Add to Cart từ Product List**: Thêm nút "Thêm vào giỏ" trực tiếp trên `ProductCard` và `SimpleProductCard`.

4. **Cart Context Auto-Sync**: Tự động reload cart context khi nhận event `cartUpdated`.

5. **Error Retry**: Thêm retry mechanism khi API call fail.

6. **Cache Cart State**: Cache cart state trong component để tránh gọi API `getCart()` mỗi lần click "Thêm vào giỏ" (có thể dùng React state hoặc Context).

7. **Batch Updates**: Nếu user click "Thêm vào giỏ" nhiều lần liên tiếp, có thể batch các requests lại để tránh race condition.

---

## 📚 Related Files

- `src/components/ProductDetailComponents/PurchaseActions/PurchaseActions.tsx`
- `src/services/customer/CartService.ts`
- `src/hooks/useCart.ts`
- `src/contexts/CartContext.tsx`
- `src/components/Header/CartDropdown.tsx`
- `src/pages/Customer/Cart/ShoppingCart.tsx`
- `src/types/cart.ts`

