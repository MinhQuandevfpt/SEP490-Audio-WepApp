# 🔧 API Debug Guide - Product List Error

## ❌ Lỗi hiện tại
```
{
    "type": "about:blank",
    "title": "Bad Request",
    "status": 400,
    "detail": "Failed to convert 'productId' with value: 'seller'",
    "instance": "/api/products/seller"
}
```

## 🔍 Phân tích lỗi

### **Nguyên nhân có thể:**
1. **URL Conflict**: Route `/api/products/seller` conflict với `/api/products`
2. **Backend Routing**: Backend đang interpret "seller" như một productId
3. **Query Parameter Issue**: Có vấn đề với cách tạo query parameters

### **URL được tạo:**
- **Expected**: `http://localhost:8080/api/products?page=0&size=20&status=ACTIVE`
- **Actual**: `http://localhost:8080/api/products/seller` (có vẻ như bị redirect)

## 🧪 Cách debug

### **1. Sử dụng Debug Component:**
- Mở HomePage trong browser
- Ở góc phải màn hình sẽ có "ProductList Debug" component
- Click "Test ProductListService" để test API call
- Click "Test Direct Fetch" để test direct fetch
- Xem console logs để debug

### **2. Kiểm tra Console Logs:**
Mở Developer Tools (F12) và xem console để thấy:
```
🔍 Fetching products from URL: http://localhost:8080/api/products?page=0&size=20&status=ACTIVE
📋 Query params: {page: "0", size: "20", status: "ACTIVE"}
📊 Response status: 400
❌ API Error Response: {"type":"about:blank","title":"Bad Request"...}
```

### **3. Test với curl:**
```bash
# Test basic endpoint
curl -X GET "http://localhost:8080/api/products" \
  -H "accept: */*"

# Test with parameters
curl -X GET "http://localhost:8080/api/products?page=0&size=5&status=ACTIVE" \
  -H "accept: */*"

# Test with authentication (if needed)
curl -X GET "http://localhost:8080/api/products?page=0&size=5&status=ACTIVE" \
  -H "accept: */*" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Các bước sửa lỗi

### **Bước 1: Kiểm tra Backend Routes**
Đảm bảo backend có route:
- `GET /api/products` - cho customer
- `GET /api/products/seller` - cho seller (nếu cần)

### **Bước 2: Kiểm tra URL Generation**
Debug component sẽ show URL được tạo. Đảm bảo:
- URL không có "seller" trong path
- Query parameters được encode đúng
- Không có conflict với routing

### **Bước 3: Kiểm tra Authentication**
Có thể API cần authentication header:
```typescript
headers: {
  'Accept': '*/*',
  'Authorization': `Bearer ${token}`
}
```

### **Bước 4: Kiểm tra Backend Logs**
Xem backend logs để hiểu tại sao "seller" được interpret như productId.

## 🎯 Expected Results

### **Success Response:**
```json
{
  "status": 200,
  "message": "📦 Product list filtered successfully",
  "data": [
    {
      "productId": "b2d0f818-de57-40d2-8ea4-f3f6ea8c262d",
      "name": "Sony SRS-XB33 Extra Bass",
      "price": 1500000,
      "status": "ACTIVE",
      // ... other fields
    }
  ]
}
```

### **Debug Component Output:**
- URL được tạo đúng
- Response status 200
- Data array có sản phẩm
- Console logs clean

## 🚀 Next Steps

1. **Test với Debug Component** để xác định nguyên nhân
2. **Kiểm tra Backend Routes** để đảm bảo không conflict
3. **Thêm Authentication** nếu cần
4. **Remove Debug Component** sau khi fix xong

## 📝 Notes

- Debug component chỉ hiển thị trong development
- Console logs sẽ show chi tiết về URL và response
- Có thể cần authentication token từ localStorage
- Backend có thể cần CORS configuration
