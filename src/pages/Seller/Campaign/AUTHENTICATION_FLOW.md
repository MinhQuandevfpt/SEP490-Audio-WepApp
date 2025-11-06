# 🔐 Campaign Product Selection - Authentication Flow

## Câu hỏi thường gặp

### ❓ Modal hiển thị sản phẩm của cửa hàng nào?

**Trả lời:** Modal chỉ hiển thị sản phẩm của **cửa hàng mà seller đang đăng nhập**.

---

## 🔄 Cơ chế hoạt động

### 1. Authentication Flow

```
Seller Login
    ↓
Backend trả về seller_token (JWT)
    ↓
localStorage.setItem('seller_token', token)
    ↓
Token chứa thông tin: { userId, storeId, role, ... }
```

### 2. Product Fetching Flow

```
JoinCampaignModal.tsx
    ↓
fetchProducts()
    ↓
ProductService.getProducts({ status: 'ACTIVE', userType: 'seller' })
    ↓
HttpInterceptor.fetch(url, { userType: 'seller' })
    ↓
Tự động thêm header: Authorization: Bearer {seller_token}
    ↓
Backend nhận request
    ↓
Decode JWT token → extract storeId
    ↓
Query: SELECT * FROM products WHERE storeId = {extracted_storeId} AND status = 'ACTIVE'
    ↓
Trả về chỉ products thuộc store đó
```

---

## 💡 Tại sao không cần truyền `storeId` parameter?

### ❌ Cách SAI (không cần thiết):
```typescript
ProductService.getProducts({
  storeId: currentStoreId,  // ❌ Không cần!
  status: 'ACTIVE'
});
```

### ✅ Cách ĐÚNG (hiện tại):
```typescript
ProductService.getProducts({
  status: 'ACTIVE',  // ✅ Backend tự extract storeId từ token
});
```

**Lý do:**
- `storeId` đã nằm trong JWT token
- Backend tự động decode token để lấy `storeId`
- Không thể fake/giả mạo vì token được sign bởi backend
- **Security best practice:** Không tin tưởng client-side data

---

## 🛡️ Security Benefits

### 1. Token-based Authorization
- Client không thể xem/sửa sản phẩm của store khác
- JWT token được sign và verify ở backend
- Mỗi request đều được authorize

### 2. Automatic Store Isolation
```typescript
// ❌ Nếu seller A cố gắng hack:
ProductService.getProducts({ 
  storeId: 'store_B_id'  // Vẫn chỉ nhận được products của store A
});

// ✅ Backend luôn override bằng storeId từ token:
const storeIdFromToken = jwt.decode(token).storeId;  // store_A_id
// Bỏ qua storeId từ client, chỉ dùng storeId từ token
```

---

## 📝 Implementation Details

### File: `JoinCampaignModal.tsx`

```typescript
const fetchProducts = async () => {
  setIsLoadingProducts(true);
  try {
    // 🔐 IMPORTANT: API tự động filter sản phẩm theo store của seller
    // HttpInterceptor sẽ gửi seller_token trong Authorization header
    // Backend decode token -> lấy storeId -> chỉ trả về products của store đó
    const response = await ProductService.getProducts({
      status: 'ACTIVE',
      page: 0,
      size: 100,
    });
    
    const fetchedProducts = response.data?.content || [];
    console.log('📦 Fetched products for current store:', fetchedProducts.length);
    
    setProducts(fetchedProducts);
  } catch (error) {
    showTikiNotification(
      'Không thể tải danh sách sản phẩm của cửa hàng',
      'Lỗi',
      'error'
    );
  } finally {
    setIsLoadingProducts(false);
  }
};
```

### File: `HttpInterceptor.ts`

```typescript
private static getToken(userType: UserType): string | null {
  const tokenKeys: Record<UserType, string> = {
    customer: 'customer_token',
    seller: 'seller_token',      // 👈 Lấy seller_token
    staff: 'staff_token',
    admin: 'admin_access_token',
  };
  
  return localStorage.getItem(tokenKeys[userType]);
}

private static async makeRequest(
  url: string,
  config: RequestInit,
  userType?: UserType
): Promise<Response> {
  const headers = new Headers(config.headers);
  
  // Add authorization header if user type is specified
  if (userType) {
    const token = this.getToken(userType);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);  // 👈 Gửi token
    }
  }
  
  return fetch(url, { ...config, headers });
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Seller A đăng nhập
```
Seller A (storeId: store_123) login
→ Opens campaign modal
→ Sees products: [Product 1, Product 2, Product 3] (tất cả thuộc store_123)
```

### Scenario 2: Seller B đăng nhập
```
Seller B (storeId: store_456) login
→ Opens campaign modal
→ Sees products: [Product 4, Product 5] (tất cả thuộc store_456)
```

### Scenario 3: Seller không có sản phẩm
```
Seller C (storeId: store_789) login
→ Opens campaign modal
→ Sees: Empty state với message "Không tìm thấy sản phẩm ACTIVE"
```

---

## ✅ Checklist Verification

Để verify rằng modal hiển thị đúng sản phẩm:

1. [ ] Kiểm tra console log: `📦 Fetched products for current store: X`
2. [ ] Kiểm tra Network tab → Request Headers có `Authorization: Bearer xxx`
3. [ ] Decode JWT token (sử dụng jwt.io) → verify storeId
4. [ ] Kiểm tra response chỉ chứa products của store đó
5. [ ] Thử login nhiều seller khác nhau → verify products khác nhau

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Truyền storeId từ client
```typescript
// WRONG - Redundant và có thể gây confusion
ProductService.getProducts({ 
  storeId: getCurrentStoreId(),  // ❌ Backend sẽ ignore
  status: 'ACTIVE' 
});
```

### ❌ Mistake 2: Tin tưởng client-side filtering
```typescript
// WRONG - Client có thể bypass
const allProducts = await getAllProducts();  // ❌ Security risk
const myProducts = allProducts.filter(p => p.storeId === myStoreId);
```

### ✅ Correct: Trust backend filtering
```typescript
// CORRECT - Backend tự filter dựa trên token
const products = await ProductService.getProducts({ 
  status: 'ACTIVE' 
});
// products đã được filter ở backend, an toàn 100%
```

---

## 📚 References

- HttpInterceptor: `/src/services/HttpInterceptor.ts`
- ProductService: `/src/services/seller/ProductService.ts`
- JoinCampaignModal: `/src/pages/Seller/Campaign/JoinCampaignModal.tsx`
- Authentication: Backend JWT implementation

---

**Last updated:** 2025-01-04
**Author:** MinhQuandevfpt Team
