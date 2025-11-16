# 🐛 Backend Bug Report: Add to Cart with Product Variants

## Vấn đề (Issue)

Khi thêm sản phẩm có biến thể (product variants) vào giỏ hàng, backend trả về lỗi **500 Internal Server Error** với message:
```
Product out of stock: Loa JBL Flip 7...
```

Mặc dù biến thể đó **CÓ TỒN KHO** (`variantStock > 0`), nhưng sản phẩm chính có `stockQuantity = 0`.

---

## API Endpoint
```
POST /api/v1/customers/{customerId}/cart/items
```

---

## Request Payload Hiện Tại

### Cách 1: Gửi `variant_id` (đã thử - KHÔNG WORK)
```json
{
  "items": [
    {
      "type": "PRODUCT",
      "id": "7d4a2757-4b42-4749-b295-806ef4d3dcfd",
      "quantity": 1,
      "variant_id": "8f6d6ccc-33b3-4f22-9a3e-ab2aada795da"
    }
  ]
}
```
**Kết quả:** Backend vẫn check `stockQuantity` của product chính → Lỗi "out of stock"

### Cách 2: Gửi `variantId` làm `id` chính (đã thử - KHÔNG WORK)
```json
{
  "items": [
    {
      "type": "PRODUCT",
      "id": "8f6d6ccc-33b3-4f22-9a3e-ab2aada795da",
      "quantity": 1
    }
  ]
}
```
**Kết quả:** Vẫn lỗi tương tự

---

## Nguyên nhân (Root Cause)

Backend đang kiểm tra stock như sau:
```
if (product.stockQuantity < quantity) {
    throw "Product out of stock"
}
```

**Đúng phải là:**
- Nếu product có variants → Check `variantStock` của variant được chọn
- Nếu product KHÔNG có variants → Check `stockQuantity` của product

---

## Yêu cầu Backend Fix (Required Changes)

### 1. Hỗ trợ field `variantId` trong request
```json
{
  "items": [
    {
      "type": "PRODUCT",
      "id": "product-uuid",        // Product ID
      "quantity": 1,
      "variantId": "variant-uuid"  // Optional: Variant ID
    }
  ]
}
```

### 2. Sửa logic kiểm tra stock

```java
// BACKEND CODE CẦN SỬA
public void addToCart(CartItem item) {
    Product product = productRepository.findById(item.getId());
    
    // Check if product has variants
    if (product.getVariants() != null && !product.getVariants().isEmpty()) {
        // Product có variants
        
        if (item.getVariantId() == null) {
            throw new BadRequestException("Please select a product variant");
        }
        
        // Tìm variant được chọn
        ProductVariant variant = product.getVariants().stream()
            .filter(v -> v.getVariantId().equals(item.getVariantId()))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("Variant not found"));
        
        // CHECK STOCK CỦA VARIANT
        if (variant.getVariantStock() < item.getQuantity()) {
            throw new OutOfStockException("Product variant out of stock: " + product.getName());
        }
        
        // Add variant to cart
        cartItem.setVariantId(variant.getVariantId());
        cartItem.setPrice(variant.getVariantPrice());
        cartItem.setImage(variant.getVariantUrl());
        // ...
        
    } else {
        // Product KHÔNG có variants
        
        // CHECK STOCK CỦA PRODUCT
        if (product.getStockQuantity() < item.getQuantity()) {
            throw new OutOfStockException("Product out of stock: " + product.getName());
        }
        
        // Add product to cart
        cartItem.setPrice(product.getPrice());
        // ...
    }
    
    cartRepository.save(cartItem);
}
```

---

## Database Schema Reference

### Product Table
```sql
- productId (UUID)
- name
- price
- stockQuantity  -- CHỈ dùng khi product KHÔNG có variants
```

### Product Variant Table
```sql
- variantId (UUID)
- productId (FK)
- optionName   (vd: "Màu sắc", "Kích thước")
- optionValue  (vd: "Đỏ", "XL")
- variantPrice
- variantStock  -- DÙNG CÁI NÀY khi product có variants
- variantUrl
- variantSku
```

---

## Test Cases Backend Cần Kiểm Tra

### Case 1: Product KHÔNG có variants
```json
POST /cart/items
{
  "items": [
    {
      "type": "PRODUCT",
      "id": "product-without-variants",
      "quantity": 2
    }
  ]
}
```
✅ **Expected:** Check `product.stockQuantity >= 2`

### Case 2: Product CÓ variants - Chưa chọn variant
```json
{
  "items": [
    {
      "type": "PRODUCT",
      "id": "product-with-variants",
      "quantity": 1
    }
  ]
}
```
❌ **Expected:** Return error `400 Bad Request: Please select a product variant`

### Case 3: Product CÓ variants - Đã chọn variant
```json
{
  "items": [
    {
      "type": "PRODUCT",
      "id": "product-with-variants",
      "quantity": 1,
      "variantId": "selected-variant-uuid"
    }
  ]
}
```
✅ **Expected:** Check `variant.variantStock >= 1`

---

## Response Expected

### Success Response (200 OK)
```json
{
  "cartId": "cart-uuid",
  "customerId": "customer-uuid",
  "status": "ACTIVE",
  "items": [
    {
      "cartItemId": "item-uuid",
      "type": "PRODUCT",
      "refId": "product-uuid",
      "variantId": "variant-uuid",  // Nếu có variant
      "name": "Loa JBL Flip 7",
      "variantName": "Màu Đỏ",      // Nếu có variant
      "image": "variant-image-url",  // Ảnh của variant
      "quantity": 1,
      "unitPrice": 2500000,
      "lineTotal": 2500000
    }
  ],
  "subtotal": 2500000,
  "discountTotal": 0,
  "grandTotal": 2500000
}
```

---

## Console Logs từ Frontend (Để Backend Debug)

```
🔍 Debug - Adding to cart: 
{
  productId: '7d4a2757-4b42-4749-b295-806ef4d3dcfd',
  qty: 1,
  hasVariants: true,
  selectedVariant: {
    variantId: '8f6d6ccc-33b3-4f22-9a3e-ab2aada795da',
    optionName: 'Màu sắc',
    optionValue: 'Đỏ',
    variantPrice: 2500000,
    variantStock: 50,  ← CÓ STOCK!
    variantUrl: 'https://...'
  },
  variantId: '8f6d6ccc-33b3-4f22-9a3e-ab2aada795da'
}

📦 Request payload sent:
{
  "items": [
    {
      "type": "PRODUCT",
      "id": "7d4a2757-4b42-4749-b295-806ef4d3dcfd",
      "quantity": 1,
      "variant_id": "8f6d6ccc-33b3-4f22-9a3e-ab2aada795da"
    }
  ]
}

❌ Backend Response: 500 Internal Server Error
{
  "message": "Product out of stock: Loa JBL Flip 7..."
}
```

---

## Priority: 🔴 HIGH

Đây là bug blocking vì:
- Tất cả sản phẩm có variants không thể thêm vào giỏ hàng
- Ảnh hưởng trực tiếp đến doanh thu
- Khách hàng không thể mua hàng

---

## Related Files (Frontend đã làm đúng)

Frontend đã implement đầy đủ:
- ✅ User phải chọn variant trước khi add to cart
- ✅ Hiển thị stock đúng của variant (`variantStock`)
- ✅ Gửi `variantId` trong request
- ✅ Validation đầy đủ

**→ Bug hoàn toàn ở backend!**

---

## Contact
- Frontend Developer: [Your Name]
- Date Reported: 16/11/2025
- Severity: Critical
- Status: Waiting for Backend Fix

---

## Notes for Backend Team

1. Kiểm tra log backend khi nhận request - `variantId` có được nhận không?
2. Debug xem đoạn code nào đang check `product.stockQuantity`
3. Có thể cần update entity/DTO để map field `variantId` từ request
4. Test kỹ với cả 2 cases: product có/không có variants

