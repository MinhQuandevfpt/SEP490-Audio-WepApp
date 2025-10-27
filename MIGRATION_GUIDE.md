# 🔄 Migration Guide: Nâng cấp lên Refresh Token

## Cho Developers đang có code cũ

### ❌ Code CŨ (Không dùng nữa)

```typescript
// Login cũ - chỉ lưu access token
const response = await fetch('/api/account/login/customer', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem('customer_token', data.data.accessToken);
```

### ✅ Code MỚI (Nên dùng)

```typescript
// Login mới - tự động lưu cả refresh token
import { CustomerAuthService } from './services/customer/Authcustomer';

const response = await CustomerAuthService.login({ email, password });
// Access token và refresh token đã tự động được lưu!
```

---

## Thay đổi API calls

### ❌ Code CŨ

```typescript
// Gọi API thủ công
const token = localStorage.getItem('customer_token');
const response = await fetch('/api/customer/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Nếu 401 → phải tự xử lý
if (response.status === 401) {
  // Redirect to login manually
  window.location.href = '/login';
}
```

### ✅ Code MỚI (Tự động refresh)

```typescript
import { HttpInterceptor } from './services/HttpInterceptor';

// Gọi API với auto refresh
const profile = await HttpInterceptor.get('/api/customer/profile', {
  userType: 'customer'
});

// Nếu 401 → tự động refresh token và retry
// Nếu refresh fail → tự động redirect to login
```

---

## Migration Steps

### Bước 1: Import services mới
```typescript
// Thêm vào đầu file
import { HttpInterceptor } from '../services/HttpInterceptor';
import { CustomerAuthService } from '../services/customer/Authcustomer';
```

### Bước 2: Thay thế Login logic
```typescript
// ❌ Before
const login = async () => {
  const res = await fetch('/api/login', ...);
  localStorage.setItem('token', res.token);
};

// ✅ After
const login = async () => {
  await CustomerAuthService.login({ email, password });
  // Tokens auto saved!
};
```

### Bước 3: Thay thế Logout logic
```typescript
// ❌ Before
const logout = () => {
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');
};

// ✅ After
const logout = () => {
  CustomerAuthService.logout();
  // Both tokens cleared!
};
```

### Bước 4: Thay thế API calls
```typescript
// ❌ Before
const fetchData = async () => {
  const token = localStorage.getItem('customer_token');
  const res = await fetch('/api/data', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// ✅ After
const fetchData = async () => {
  return await HttpInterceptor.get('/api/data', {
    userType: 'customer'
  });
};
```

---

## Quick Migration Checklist

- [ ] Replace `fetch()` calls với `HttpInterceptor`
- [ ] Replace manual login với `AuthService.login()`
- [ ] Replace manual logout với `AuthService.logout()`
- [ ] Remove manual 401 error handling
- [ ] Remove manual token refresh logic
- [ ] Test login flow
- [ ] Test API calls với expired token
- [ ] Test logout flow

---

## Tương thích ngược

✅ **Code cũ vẫn hoạt động!**

Service mới vẫn lưu tokens theo format cũ:
- `customer_token` - vẫn có
- `seller_token` - vẫn có
- `staff_token` - vẫn có

Nhưng thêm:
- `customer_refresh_token` - **MỚI**
- `seller_refresh_token` - **MỚI**
- `staff_refresh_token` - **MỚI**

➡️ Code cũ vẫn đọc được `customer_token` như trước!

---

## Cần giúp đỡ?

📖 Đọc file: `REFRESH_TOKEN_GUIDE.md`  
💡 Xem ví dụ: `src/examples/RefreshTokenExamples.tsx`

**Có câu hỏi?** → Check console logs, tất cả đều có emoji dễ nhìn:
- 🚀 Starting...
- ✅ Success
- ❌ Error
- 🔄 Refreshing...
- 👋 Logged out
