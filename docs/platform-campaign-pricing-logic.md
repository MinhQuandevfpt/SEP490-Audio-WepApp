# Platform Campaign Pricing Logic - Giải thích chi tiết

## 📋 Tổng quan

Logic này xử lý việc tính giá sản phẩm khi có **Platform Campaign** (chiến dịch giảm giá của nền tảng). Backend trả về nhiều giá khác nhau, và frontend cần quyết định giá nào để hiển thị và tính toán.

---

## 🔑 Các Field từ Backend (API Response)

Khi gọi `GET /api/v1/customers/{customerId}/cart`, mỗi `CartItem` có các field sau:

```typescript
interface ApiCartItem {
  // Giá từ backend
  baseUnitPrice?: number;              // Giá gốc (chưa campaign)
  platformCampaignPrice?: number;      // Giá sau campaign (nếu có)
  unitPrice?: number;                  // Giá hiện tại (đã áp dụng campaign nếu có)
  
  // Trạng thái campaign
  inPlatformCampaign?: boolean;        // Có đang trong campaign không
  campaignUsageExceeded?: boolean;     // Đã vượt giới hạn sử dụng chưa
  campaignRemaining?: number;           // Số lượng còn lại trong campaign
}
```

### Ý nghĩa từng field:

1. **`baseUnitPrice`**: 
   - Giá gốc của sản phẩm, **KHÔNG** có bất kỳ giảm giá nào
   - Luôn tồn tại (trừ khi sản phẩm miễn phí)
   - Dùng để hiển thị "giá cũ" khi có giảm giá

2. **`platformCampaignPrice`**:
   - Giá sau khi áp dụng platform campaign
   - Chỉ có khi sản phẩm **đang trong campaign** và **chưa vượt giới hạn**
   - Ví dụ: `baseUnitPrice = 1,000,000đ`, campaign giảm 20% → `platformCampaignPrice = 800,000đ`

3. **`unitPrice`**:
   - Giá **thực tế** mà khách hàng phải trả
   - Backend đã tính toán sẵn: nếu có campaign hợp lệ → dùng `platformCampaignPrice`, ngược lại → dùng `baseUnitPrice`
   - **Lưu ý**: Backend có thể đã xử lý logic này, nhưng frontend vẫn cần kiểm tra lại để đảm bảo tính nhất quán

4. **`inPlatformCampaign`**:
   - `true`: Sản phẩm đang nằm trong một platform campaign
   - `false`: Không có campaign hoặc campaign đã hết hạn

5. **`campaignUsageExceeded`**:
   - `true`: Đã vượt quá giới hạn sử dụng campaign (ví dụ: chỉ được mua tối đa 2 sản phẩm với giá khuyến mãi)
   - `false`: Vẫn còn trong giới hạn

6. **`campaignRemaining`**:
   - Số lượng sản phẩm còn lại có thể mua với giá campaign
   - `0` nếu đã hết

---

## 🧮 Logic Tính Giá trong `mapApiItemToUI`

### Code hiện tại (lines 44-88):

```typescript
const mapApiItemToUI = (apiItem: ApiCartItem, ...): UICartItem => {
  // Bước 1: Xác định finalPrice (giá để tính toán)
  const finalPrice = 
    apiItem.inPlatformCampaign &&           // Có trong campaign?
    !apiItem.campaignUsageExceeded &&       // Chưa vượt giới hạn?
    apiItem.platformCampaignPrice !== undefined  // Có giá campaign?
      ? apiItem.platformCampaignPrice       // → Dùng giá campaign
      : apiItem.unitPrice;                  // → Dùng giá thường
  
  // Bước 2: Xác định originalPrice (giá gốc để hiển thị)
  const originalPrice = apiItem.baseUnitPrice ?? apiItem.unitPrice;
  
  return {
    price: finalPrice,           // Giá để tính tổng tiền
    originalPrice: originalPrice, // Giá gốc để hiển thị "giá cũ"
    // ... other fields
  };
};
```

### Giải thích từng bước:

#### **Bước 1: Tính `finalPrice` (giá để tính toán)**

Điều kiện để dùng `platformCampaignPrice`:
1. ✅ `inPlatformCampaign === true` → Sản phẩm đang trong campaign
2. ✅ `campaignUsageExceeded === false` → Chưa vượt giới hạn
3. ✅ `platformCampaignPrice !== undefined` → Có giá campaign hợp lệ

**Nếu cả 3 điều kiện đều đúng** → Dùng `platformCampaignPrice`  
**Nếu bất kỳ điều kiện nào sai** → Dùng `unitPrice` (giá thường)

**Ví dụ:**

| Trường hợp | `inPlatformCampaign` | `campaignUsageExceeded` | `platformCampaignPrice` | `finalPrice` |
|-----------|---------------------|------------------------|------------------------|--------------|
| Có campaign, chưa vượt giới hạn | `true` | `false` | `800,000` | `800,000` ✅ |
| Có campaign, đã vượt giới hạn | `true` | `true` | `800,000` | `unitPrice` (1,000,000) |
| Không có campaign | `false` | `false` | `undefined` | `unitPrice` (1,000,000) |
| Campaign hết hạn | `false` | `false` | `undefined` | `unitPrice` (1,000,000) |

#### **Bước 2: Tính `originalPrice` (giá gốc để hiển thị)**

```typescript
const originalPrice = apiItem.baseUnitPrice ?? apiItem.unitPrice;
```

- Ưu tiên dùng `baseUnitPrice` (giá gốc không có giảm giá)
- Nếu không có → fallback về `unitPrice`

**Mục đích**: Hiển thị "giá cũ" khi có giảm giá:
```
Giá cũ: 1,000,000đ  (originalPrice)
Giá mới: 800,000đ   (price = finalPrice)
Giảm: 20%
```

---

## 💰 Tính Tổng Tiền (Cart Summary)

### 1. Subtotal (Tổng tiền trước giảm giá)

```typescript
const subtotalBeforePlatformDiscount = useMemo(() => {
  return Math.round(items.reduce((sum, item) => {
    if (!item.isSelected) return sum;
    const original = item.originalPrice ?? item.price;  // Dùng giá gốc
    return sum + original * item.quantity;
  }, 0));
}, [items]);
```

**Logic**: Tính tổng dựa trên **giá gốc** (`originalPrice`) để hiển thị tổng tiền "trước khi giảm giá".

**Ví dụ**:
- Sản phẩm A: `originalPrice = 1,000,000đ`, `quantity = 2` → `2,000,000đ`
- Sản phẩm B: `originalPrice = 500,000đ`, `quantity = 1` → `500,000đ`
- **Subtotal = 2,500,000đ**

### 2. Total Platform Discount (Tổng giảm giá nền tảng)

```typescript
const totalPlatformDiscount = useMemo(() => {
  return Math.round(items.reduce((sum, item) => {
    if (!item.isSelected) return sum;
    const original = item.originalPrice ?? item.price;
    const discountPerUnit = Math.max(0, original - item.price);  // Giảm giá = giá gốc - giá sau giảm
    return sum + discountPerUnit * item.quantity;
  }, 0));
}, [items]);
```

**Logic**: 
- Với mỗi sản phẩm: `discountPerUnit = originalPrice - price`
- Tổng giảm = `discountPerUnit * quantity` cho tất cả sản phẩm

**Ví dụ**:
- Sản phẩm A: `originalPrice = 1,000,000đ`, `price = 800,000đ`, `quantity = 2`
  - `discountPerUnit = 1,000,000 - 800,000 = 200,000đ`
  - `discount = 200,000 * 2 = 400,000đ`
- Sản phẩm B: `originalPrice = 500,000đ`, `price = 500,000đ` (không giảm), `quantity = 1`
  - `discountPerUnit = 500,000 - 500,000 = 0đ`
  - `discount = 0đ`
- **Total Platform Discount = 400,000đ**

### 3. Grand Total (Tổng thanh toán)

```typescript
const grandTotal = useMemo(() => {
  const total =
    subtotalBeforePlatformDiscount -    // Tổng giá gốc
    totalPlatformDiscount -              // Trừ giảm giá platform
    voucherDiscount +                    // Trừ voucher shop (nếu có)
    shippingFee;                         // Cộng phí ship
  return Math.max(0, Math.round(total));
}, [subtotalBeforePlatformDiscount, totalPlatformDiscount, voucherDiscount, shippingFee]);
```

**Công thức**:
```
Grand Total = Subtotal - Platform Discount - Voucher Discount + Shipping Fee
```

**Ví dụ**:
- Subtotal: `2,500,000đ`
- Platform Discount: `400,000đ`
- Voucher Discount: `50,000đ`
- Shipping Fee: `30,000đ`
- **Grand Total = 2,500,000 - 400,000 - 50,000 + 30,000 = 2,080,000đ**

---

## ⚡ Optimization: Skip API Call khi không có Campaign

### Code (lines 646-680):

```typescript
const updateQuantity = async (cartItemId: string, nextQty: number) => {
  // ... validation ...
  
  // Kiểm tra xem item có trong campaign không
  const apiItem = cart?.items?.find(item => item.cartItemId === cartItemId);
  const isNotInCampaign = !apiItem?.inPlatformCampaign || apiItem?.campaignUsageExceeded;
  
  // Nếu KHÔNG có campaign → Skip API call, update local
  if (isNotInCampaign) {
    const updatedItems = items.map(item => {
      if (item.id === cartItemId) {
        return {
          ...item,
          quantity: clamped,
          price: item.originalPrice ?? item.price,  // Giữ nguyên giá gốc
        };
      }
      return item;
    });
    setItems(updatedItems);
    return;  // Không gọi API
  }
  
  // Nếu CÓ campaign → Gọi API để backend tính lại giá
  // ... call API ...
};
```

### Tại sao cần optimization này?

1. **Khi không có campaign**: Giá luôn là `baseUnitPrice`, không thay đổi dù quantity là 1, 2, 3, 4...
2. **Khi có campaign**: Giá có thể thay đổi theo quantity (ví dụ: chỉ được mua tối đa 2 sản phẩm với giá khuyến mãi, từ sản phẩm thứ 3 trở đi phải trả giá gốc)
3. **Lợi ích**: Giảm số lượng API calls không cần thiết, tăng performance

### Ví dụ:

**Trường hợp 1: Không có campaign**
- Quantity = 1 → Giá = 1,000,000đ
- Quantity = 2 → Giá = 1,000,000đ (không đổi)
- Quantity = 3 → Giá = 1,000,000đ (không đổi)
- **→ Không cần gọi API, update local**

**Trường hợp 2: Có campaign (giới hạn 2 sản phẩm)**
- Quantity = 1 → Giá = 800,000đ (campaign)
- Quantity = 2 → Giá = 800,000đ (campaign)
- Quantity = 3 → Giá = 800,000đ × 2 + 1,000,000đ × 1 = 2,600,000đ (cần backend tính)
- **→ Phải gọi API để backend tính lại**

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Backend Response (GET /api/v1/customers/{id}/cart)    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  mapApiItemToUI()                                        │
│                                                          │
│  1. Kiểm tra campaign:                                  │
│     - inPlatformCampaign?                                │
│     - campaignUsageExceeded?                             │
│     - platformCampaignPrice có giá trị?                 │
│                                                          │
│  2. Tính finalPrice:                                    │
│     ✅ Cả 3 đúng → platformCampaignPrice               │
│     ❌ Bất kỳ sai → unitPrice                            │
│                                                          │
│  3. Tính originalPrice:                                 │
│     baseUnitPrice ?? unitPrice                           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  UI Display                                             │
│                                                          │
│  - price: finalPrice (để tính tổng)                     │
│  - originalPrice: baseUnitPrice (để hiển thị "giá cũ") │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Cart Summary Calculation                               │
│                                                          │
│  Subtotal = Σ(originalPrice × quantity)                 │
│  Platform Discount = Σ((originalPrice - price) × qty)   │
│  Grand Total = Subtotal - Discounts + Shipping         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Tóm tắt

1. **Backend trả về 3 loại giá**:
   - `baseUnitPrice`: Giá gốc (không giảm)
   - `platformCampaignPrice`: Giá sau campaign (nếu có)
   - `unitPrice`: Giá thực tế (backend đã tính)

2. **Frontend quyết định giá hiển thị**:
   - Kiểm tra 3 điều kiện → Nếu đúng → dùng `platformCampaignPrice`, ngược lại → dùng `unitPrice`

3. **Hiển thị UI**:
   - `price`: Giá để tính tổng (có thể là giá campaign hoặc giá thường)
   - `originalPrice`: Giá gốc để hiển thị "giá cũ" khi có giảm giá

4. **Tính tổng tiền**:
   - Subtotal = Tổng giá gốc
   - Platform Discount = Tổng giảm giá
   - Grand Total = Subtotal - Discounts + Shipping

5. **Optimization**:
   - Nếu không có campaign → Update local, không gọi API
   - Nếu có campaign → Gọi API để backend tính lại giá theo quantity

---

## 🔍 Debug Tips

Khi debug, kiểm tra các giá trị sau:

```typescript
console.log('🔍 Campaign Debug:', {
  baseUnitPrice: apiItem.baseUnitPrice,
  platformCampaignPrice: apiItem.platformCampaignPrice,
  unitPrice: apiItem.unitPrice,
  inPlatformCampaign: apiItem.inPlatformCampaign,
  campaignUsageExceeded: apiItem.campaignUsageExceeded,
  campaignRemaining: apiItem.campaignRemaining,
  finalPrice: finalPrice,  // Giá đã tính
  originalPrice: originalPrice,  // Giá gốc
});
```

**Kết quả mong đợi**:
- Nếu có campaign hợp lệ: `finalPrice < originalPrice`
- Nếu không có campaign: `finalPrice === originalPrice === baseUnitPrice`

