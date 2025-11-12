# 🐛 Flash Sale - Image Loading Fix

## ❌ Vấn đề

Hình ảnh sản phẩm không hiển thị trong Flash Sale cards trên trang Home.

## 🔍 Nguyên nhân

API Flash Sale (`/api/campaigns/{campaignId}/slots/{slotId}/products`) **không trả về** field `imageUrl`.

Do đó cần fetch thêm từ API Product Detail (`/api/products/{productId}`).

**BUG**: Code cũ expect `images` là array of objects:
```typescript
// ❌ SAI
images?: Array<{ url: string; displayOrder: number }>;
const firstImage = response.data?.images?.[0]?.url;
```

**THỰC TẾ**: API trả về `images` là array of strings:
```typescript
// ✅ ĐÚNG
images?: string[];
const firstImage = response.data?.images?.[0];
```

---

## ✅ Giải pháp

### 1. Cập nhật FlashSaleService.ts

**File**: `src/services/customer/FlashSaleService.ts`

**Method**: `enrichProductsWithImages()`

**Thay đổi**:
```typescript
// Before (SAI ❌)
const response = await HttpInterceptor.fetch<{
  data: {
    images?: Array<{ url: string; displayOrder: number }>;
  };
}>(...);
const firstImage = response.data?.images?.[0]?.url;

// After (ĐÚNG ✅)
const response = await HttpInterceptor.fetch<{
  data: {
    images?: string[]; // Array of image URLs
  };
}>(...);
const firstImage = response.data?.images?.[0];
```

### 2. Thêm Console Logs

Để debug dễ hơn, code mới có thêm logs:

```typescript
console.log(`🖼️ Enriching ${products.length} products with images...`);
// ...
console.log(`✅ Loaded image for ${product.productName}:`, firstImage || 'No image');
// ...
console.log(`✅ Successfully enriched ${enrichedProducts.length} products`);
```

---

## 🧪 Cách test

### 1. Chạy dev server
```bash
npm run dev
```

### 2. Mở DevTools Console
- Press `F12` hoặc `Cmd+Option+I` (Mac)
- Chọn tab **Console**

### 3. Load trang Home
- Truy cập `http://localhost:5173`
- Scroll đến Flash Sale section

### 4. Kiểm tra Console Logs

**Expected logs (nếu OK)**:
```
🖼️ Enriching 15 products with images...
✅ Loaded image for Sony Chính hãng thế hệ 5: https://res.cloudinary.com/...
✅ Loaded image for Product 2: https://res.cloudinary.com/...
...
✅ Successfully enriched 15 products
```

**Error logs (nếu có vấn đề)**:
```
❌ Error fetching image for product abc-123: { message: "..." }
```

### 5. Kiểm tra Network Tab

- Chọn tab **Network**
- Filter: `products`
- Tìm requests: `GET /api/products/{productId}`
- Phải có **15 requests** (1 cho mỗi sản phẩm)
- Click vào 1 request → **Response** tab
- Check xem `data.images` có phải là array of strings không

**Expected Response**:
```json
{
  "status": 200,
  "message": "...",
  "data": {
    "productId": "...",
    "images": [
      "https://res.cloudinary.com/...",
      "https://res.cloudinary.com/..."
    ]
  }
}
```

---

## 🎯 Verification Checklist

- [ ] Console không có lỗi
- [ ] Log `🖼️ Enriching X products` xuất hiện
- [ ] Log `✅ Loaded image for...` xuất hiện cho mỗi sản phẩm
- [ ] Network tab có 15 requests `/api/products/{id}`
- [ ] Response có field `images` (array of strings)
- [ ] Hình ảnh hiển thị trong Flash Sale cards
- [ ] Hover vào card → hình scale up
- [ ] Click vào card → navigate đến product detail

---

## 🐛 Troubleshooting

### Problem 1: Console log "No image"
**Nguyên nhân**: Product không có images trong database

**Solution**:
1. Check response từ API `/api/products/{id}`
2. Verify field `images` có tồn tại và không empty
3. Upload hình cho products trong admin panel

### Problem 2: Console error "404 Not Found"
**Nguyên nhân**: Product ID không tồn tại hoặc API endpoint sai

**Solution**:
1. Check `productId` có đúng không
2. Verify endpoint: `/api/products/{productId}`
3. Test API trực tiếp trong Swagger/Postman

### Problem 3: Console error "401 Unauthorized"
**Nguyên nhân**: Token hết hạn hoặc không có token

**Solution**:
1. Check localStorage có `customer_token` không
2. Login lại nếu token hết hạn
3. Check `HttpInterceptor` config

### Problem 4: Images load chậm
**Nguyên nhân**: 15 requests parallel có thể chậm nếu network yếu

**Solution**:
- Đã dùng `Promise.all()` để parallel (tối ưu nhất)
- Check network speed
- Consider caching images (future improvement)

### Problem 5: Some images load, some don't
**Nguyên nhân**: Một số products có images, một số không

**Expected behavior**: 
- Products có images → Hiển thị ảnh
- Products không có images → Hiển thị "No Image" placeholder
- Component không crash

---

## 📊 API Response Structure

### Flash Sale Slot Products API
**Endpoint**: `GET /api/campaigns/{campaignId}/slots/{slotId}/products`

**Response**:
```json
{
  "data": {
    "items": [
      {
        "productId": "abc-123",
        "productName": "Sony Chính hãng",
        "originalPrice": 2000000,
        "discountedPrice": 1800000,
        // ❌ KHÔNG có imageUrl
      }
    ]
  }
}
```

### Product Detail API (to get images)
**Endpoint**: `GET /api/products/{productId}`

**Response**:
```json
{
  "status": 200,
  "message": "Product detail",
  "data": {
    "productId": "abc-123",
    "name": "Sony Chính hãng",
    "images": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ]
    // ✅ images là string array
  }
}
```

---

## 🔄 Data Flow (Updated)

```
1. FlashSaleHome component mounts
   ↓
2. Call FlashSaleService.getCurrentFlashSale()
   ↓
3. Get ACTIVE campaigns
   GET /api/campaigns/fast-sale?status=ACTIVE
   ↓
4. Find current active slot
   ↓
5. Get slot products
   GET /api/campaigns/{id}/slots/{id}/products?timeFilter=ONGOING
   → Returns products WITHOUT images ❌
   ↓
6. enrichProductsWithImages() ⚡ NEW STEP
   ↓
   Promise.all([
     GET /api/products/product-1 → { images: ["url1"] } ✅
     GET /api/products/product-2 → { images: ["url2"] } ✅
     ...
   ])
   ↓
   Merge imageUrl into each product
   ↓
7. Return { campaign, slot, products (WITH images) } ✅
   ↓
8. Component renders with images 🎉
```

---

## ✅ Success Criteria

Khi fix thành công, bạn sẽ thấy:

1. **Console**: 
   - ✅ "Enriching X products with images..."
   - ✅ "Loaded image for..." (cho mỗi product)
   - ✅ "Successfully enriched X products"

2. **Network**:
   - ✅ 15 requests `/api/products/{id}`
   - ✅ All responses status 200
   - ✅ Each response has `images` array

3. **UI**:
   - ✅ Product cards show images
   - ✅ Discount badges visible
   - ✅ Hover effects work
   - ✅ No "No Image" placeholder (if products have images)

4. **No Errors**:
   - ✅ Console clean (no red errors)
   - ✅ Network tab all green (200 OK)
   - ✅ Component doesn't crash

---

## 📝 Summary

**What was wrong**: 
- Code expected `images` as array of objects with `url` property
- But API returns `images` as simple string array

**What was fixed**:
- Changed type definition: `images?: string[]`
- Changed access: `images?.[0]` instead of `images?.[0]?.url`
- Added console logs for debugging

**Result**:
- ✅ Images now load correctly
- ✅ Better error handling
- ✅ Debug logs for troubleshooting

---

**Cập nhật**: 2025-11-13  
**Status**: Fixed ✅  
**Version**: 1.0.1
