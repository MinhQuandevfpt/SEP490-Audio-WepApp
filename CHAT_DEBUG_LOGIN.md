# 🔧 Fix: "Vui lòng đăng nhập để chat với cửa hàng"

## ❌ Vấn đề

Bạn đã đăng nhập customer nhưng khi chat vẫn báo "Vui lòng đăng nhập để chat với cửa hàng"

## 🔍 Nguyên nhân

Function `ChatService.getCurrentUserId()` đang tìm `userInfo` trong localStorage, nhưng customer data được lưu trong key `customer_user` chứ không phải `userInfo`.

## ✅ Giải pháp

Đã sửa `ChatService.getCurrentUserId()` để dùng function `getCustomerId()` từ `authHelper` - function này biết cách lấy đúng customer ID.

---

## 📝 Chi tiết

### Customer data trong localStorage

Sau khi login, customer data được lưu như sau:

```javascript
localStorage.getItem('CUSTOMER_token')     // Token
localStorage.getItem('customerId')         // Customer ID (cache)
localStorage.getItem('customer_user')      // Full user info
```

**Cấu trúc `customer_user`:**
```json
{
  "email": "customer@example.com",
  "full_name": "Nguyen Van A",
  "role": "CUSTOMER",
  "accountId": "account-uuid",
  "customerId": "d48a2ea3-8788-4596-bb8f-5c52092b9e9d"
}
```

### Code cũ (SAI ❌)

```typescript
static getCurrentUserId(): string | null {
  const userInfo = localStorage.getItem('userInfo'); // ❌ Key không tồn tại
  if (userInfo) {
    const parsed = JSON.parse(userInfo);
    return parsed.id || parsed.userId || null;
  }
  return null;
}
```

### Code mới (ĐÚNG ✅)

```typescript
import { getCustomerId } from '../../utils/authHelper';

static getCurrentUserId(): string | null {
  const customerId = getCustomerId(); // ✅ Dùng helper đã có
  
  if (customerId) {
    console.log('✅ Customer ID found:', customerId);
    return customerId;
  }
  
  console.warn('⚠️ Customer ID not found in localStorage');
  return null;
}
```

---

## 🧪 Cách test

### 1. Mở Console (F12)

### 2. Check localStorage
```javascript
// Check customer đã login chưa
console.log('Token:', localStorage.getItem('CUSTOMER_token'));
console.log('Customer ID:', localStorage.getItem('customerId'));
console.log('Customer User:', localStorage.getItem('customer_user'));
```

**Expected output:**
```javascript
Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ✅
Customer ID: "d48a2ea3-8788-4596-bb8f-5c52092b9e9d" ✅
Customer User: '{"email":"...","customerId":"..."}' ✅
```

### 3. Test chat
```
1. Click nút "Trợ lý AI"
2. Chọn tab "Chat Shop"
3. Gửi tin nhắn
4. Check console log
```

**Expected console log:**
```
✅ Customer ID found: d48a2ea3-8788-4596-bb8f-5c52092b9e9d
📤 Sending message to store...
```

---

## 🔄 Flow hoạt động

```
1. Customer đăng nhập
   ↓
2. Login API trả về token + user info
   ↓
3. Store vào localStorage:
   - CUSTOMER_token
   - customerId (cache)
   - customer_user (full info)
   ↓
4. Customer mở chat
   ↓
5. ChatService.getCurrentUserId() được gọi
   ↓
6. getCustomerId() lấy từ:
   - localStorage.customerId (cache) ✅
   - hoặc parse từ customer_user ✅
   ↓
7. Trả về customerId
   ↓
8. Chat thành công! 🎉
```

---

## 🐛 Troubleshooting

### Vẫn báo "Vui lòng đăng nhập"?

**Check 1: Customer đã login chưa?**
```javascript
console.log(localStorage.getItem('CUSTOMER_token'));
// Nếu null → Chưa login, vào /auth/login
```

**Check 2: customerId có trong localStorage không?**
```javascript
console.log(localStorage.getItem('customerId'));
console.log(localStorage.getItem('customer_user'));
// Nếu cả 2 đều null → Có vấn đề với login flow
```

**Check 3: Parse customer_user**
```javascript
const user = JSON.parse(localStorage.getItem('customer_user'));
console.log(user.customerId);
// Phải có customerId
```

### Cách fix nếu vẫn lỗi

**Option 1: Đăng xuất và đăng nhập lại**
```javascript
// Clear localStorage
localStorage.clear();
// Vào /auth/login và login lại
```

**Option 2: Manual set (test only)**
```javascript
// Chỉ dùng để test
localStorage.setItem('customerId', 'd48a2ea3-8788-4596-bb8f-5c52092b9e9d');
```

---

## ✅ Status

- [x] Fixed `getCurrentUserId()` trong ChatService
- [x] Dùng `getCustomerId()` từ authHelper
- [x] Add console logs để debug
- [x] No linter errors
- [x] Ready to test!

---

## 📚 Related Files

```
src/services/customer/ChatService.ts       ← Fixed
src/utils/authHelper.ts                    ← Helper function
src/services/customer/Authcustomer.ts      ← Login flow
```

---

## 🎯 Kết quả mong đợi

Sau khi sửa:
- ✅ Customer login → customerId được lưu đúng
- ✅ Mở chat → getCurrentUserId() lấy được customerId
- ✅ Gửi tin nhắn → Thành công!
- ✅ Console log: "✅ Customer ID found: ..."

---

**Giờ test lại xem nhé! 🚀**

