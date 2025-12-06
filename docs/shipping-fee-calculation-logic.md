# LOGIC TÍNH PHÍ VẬN CHUYỂN TRƯỚC KHI CHECKOUT COD

## TỔNG QUAN

Hệ thống tính phí vận chuyển sử dụng **GHN API** (Giao Hàng Nhanh) để tính phí dựa trên:
- **Địa chỉ gửi hàng** (từ product/store)
- **Địa chỉ nhận hàng** (từ customer address)
- **Trọng lượng** (weight) của sản phẩm
- **Kích thước** (dimensions) của package
- **Loại dịch vụ** (service type: Hàng nhẹ hoặc Hàng nặng)

---

## 1. FLOW TỔNG QUAN

```
┌─────────────────────────────────────────────────────────┐
│ 1. User chọn địa chỉ nhận hàng                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Hook useAutoShippingFee được trigger                 │
│    - Debounce 500ms để tránh spam API                   │
│    - Filter items đã được chọn (isSelected = true)      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Group items theo storeId                             │
│    - Mỗi store có địa chỉ gửi hàng riêng                │
│    - Mỗi store sẽ tính shipping fee riêng               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Với mỗi store:                                       │
│    a. Lấy địa chỉ gửi từ product đầu tiên của store     │
│    b. Build GHN items (weight, dimensions)              │
│    c. Tính service type (2 hoặc 5)                      │
│    d. Gọi GHN API                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Sum tổng shipping fee từ tất cả stores               │
│    - Hiển thị shipping fee theo từng store               │
│    - Hiển thị tổng shipping fee                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. XỬ LÝ THEO LOẠI SẢN PHẨM

### 2.1. PRODUCT (Không có variant)

**File:** `src/hooks/useAutoShippingFee.ts`

**Logic:**
```typescript
// 1. Lấy product từ productCache
const product = productCache.get(item.productId);

// 2. Lấy weight từ product
const weightKg = product?.weight && product.weight > 0 
  ? product.weight 
  : 0.5; // Default 0.5kg nếu không có

// 3. Convert sang gram
const weightGr = Math.round(weightKg * 1000);

// 4. Build GHN item
const ghnItem = {
  name: item.name,
  quantity: item.quantity,
  length: 1,    // Default 1cm
  width: 1,     // Default 1cm
  height: 1,    // Default 1cm
  weight: weightGr,
};
```

**Ví dụ:**
- Product: "Tai nghe Sony WH-1000XM5"
- `productId`: "abc123"
- `weight`: 0.25 kg (từ product data)
- `quantity`: 2
- → GHN item: `{ name: "Tai nghe Sony...", quantity: 2, weight: 250g }`

---

### 2.2. PRODUCT với VARIANT

**Logic:**
```typescript
// QUAN TRỌNG: Với variant, vẫn dùng productId (product gốc) để lấy thông tin
// Variant không có weight riêng, dùng weight của product gốc

// 1. Lấy product từ productCache (dùng productId, không phải variantId)
const product = productCache.get(item.productId);

// 2. Lấy weight từ product gốc (giống như product không có variant)
const weightKg = product?.weight && product.weight > 0 
  ? product.weight 
  : 0.5;

// 3. Convert sang gram
const weightGr = Math.round(weightKg * 1000);

// 4. Build GHN item (giống như product không có variant)
const ghnItem = {
  name: item.name,  // Tên variant (ví dụ: "Tai nghe Sony - Đen")
  quantity: item.quantity,
  length: 1,
  width: 1,
  height: 1,
  weight: weightGr,  // Weight của product gốc
};
```

**Ví dụ:**
- Product: "Tai nghe Sony WH-1000XM5"
- `productId`: "abc123"
- `variantId`: "var456" (màu đen)
- `weight`: 0.25 kg (từ product gốc, không phải variant)
- `quantity`: 1
- → GHN item: `{ name: "Tai nghe Sony WH-1000XM5 - Đen", quantity: 1, weight: 250g }`

**Lưu ý:**
- Variant **KHÔNG có weight riêng**, luôn dùng weight của product gốc
- Variant chỉ khác về màu sắc, kích thước, nhưng weight giống nhau

---

### 2.3. COMBO

**Logic:**
```typescript
// QUAN TRỌNG: COMBO được xử lý như PRODUCT
// Combo có productId riêng (comboId), có weight riêng

// 1. Lấy combo từ productCache (dùng comboId như productId)
const combo = productCache.get(item.productId); // item.productId = comboId

// 2. Lấy weight từ combo
const weightKg = combo?.weight && combo.weight > 0 
  ? combo.weight 
  : 0.5;

// 3. Convert sang gram
const weightGr = Math.round(weightKg * 1000);

// 4. Build GHN item (giống như product)
const ghnItem = {
  name: item.name,  // Tên combo (ví dụ: "Combo Tai nghe + Loa")
  quantity: item.quantity,
  length: 1,
  width: 1,
  height: 1,
  weight: weightGr,  // Weight của combo
};
```

**Ví dụ:**
- Combo: "Combo Tai nghe + Loa Bluetooth"
- `comboId`: "combo789" (được lưu trong `item.productId`)
- `weight`: 1.2 kg (weight tổng của combo)
- `quantity`: 1
- → GHN item: `{ name: "Combo Tai nghe + Loa Bluetooth", quantity: 1, weight: 1200g }`

**Lưu ý:**
- Combo có `weight` riêng (tổng weight của các sản phẩm trong combo)
- Combo được xử lý giống như PRODUCT, không có logic đặc biệt

---

## 3. TÍNH TOÁN SHIPPING FEE CHO TỪNG STORE

### 3.1. Group Items theo StoreId

```typescript
// Group selected items by storeId
const itemsByStore = new Map<string, { items: CartItem[]; storeName: string }>();

selectedItems.forEach(item => {
  // Lấy product từ productCache (dùng productId cho cả product, variant, combo)
  const product = productCache.get(item.productId);
  
  if (product?.storeId) {
    if (!itemsByStore.has(product.storeId)) {
      itemsByStore.set(product.storeId, {
        items: [],
        storeName: product.storeName || `Cửa hàng ${product.storeId.substring(0, 6)}`
      });
    }
    
    itemsByStore.get(product.storeId)!.items.push(item);
  }
});
```

**Ví dụ:**
- Store A: [Product1, Variant1, Combo1]
- Store B: [Product2, Variant2]
- → 2 stores, mỗi store tính shipping fee riêng

---

### 3.2. Lấy Địa Chỉ Gửi Hàng (Origin Address)

```typescript
// Với mỗi store, lấy địa chỉ gửi từ product đầu tiên của store đó
const firstStoreProduct = productCache.get(storeItems[0].productId);

// Lấy districtCode và wardCode từ product
const fromDistrictId = firstStoreProduct.districtCode 
  ? Number(firstStoreProduct.districtCode) 
  : NaN;

const fromWardCode = firstStoreProduct.wardCode || '';
```

**Ví dụ:**
- Store A: Product đầu tiên có `districtCode: "1442"`, `wardCode: "1A0401"`
- → Địa chỉ gửi: Quận 1, Phường Bến Nghé, TP.HCM

**Lưu ý:**
- Mỗi store có địa chỉ gửi riêng (warehouse khác nhau)
- Lấy từ product đầu tiên của store (có thể là product, variant, hoặc combo)

---

### 3.3. Build GHN Items cho Store

```typescript
// Build GHN items cho store này
const ghnItems = storeItems.map(item => {
  // Lấy product từ cache (dùng productId cho cả product, variant, combo)
  const product = productCache.get(item.productId);
  
  // Lấy weight (giống nhau cho product, variant, combo)
  const weightKg = product?.weight && product.weight > 0 
    ? product.weight 
    : 0.5; // Default 0.5kg
  
  const weightGr = Math.round(weightKg * 1000);
  
  return {
    name: item.name,
    quantity: item.quantity,
    length: 1,    // Default 1cm
    width: 1,     // Default 1cm
    height: 1,    // Default 1cm
    weight: weightGr,
  };
});

// Tính tổng weight của package
const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);
```

**Ví dụ Store A:**
- Product1: weight 0.5kg, quantity 2 → 1000g
- Variant1: weight 0.25kg, quantity 1 → 250g
- Combo1: weight 1.2kg, quantity 1 → 1200g
- → Tổng: 2450g

---

### 3.4. Tính Service Type ID

```typescript
// Service type dựa trên tổng weight
// ≤ 7500 gram → service_type_id = 2 (Hàng nhẹ)
// > 7500 gram → service_type_id = 5 (Hàng nặng)
const storeServiceTypeId: 2 | 5 = pkgWeight <= 7500 ? 2 : 5;
```

**Ví dụ:**
- Store A: 2450g → `service_type_id = 2` (Hàng nhẹ)
- Store B: 8000g → `service_type_id = 5` (Hàng nặng)

---

### 3.5. Gọi GHN API

```typescript
// Build request body
const body = {
  service_type_id: storeServiceTypeId,  // 2 hoặc 5
  from_district_id: fromDistrictId,     // Quận/huyện gửi
  from_ward_code: fromWardCode,         // Phường/xã gửi
  to_district_id: Number(toDistrictId), // Quận/huyện nhận
  to_ward_code: String(toWardCode),     // Phường/xã nhận
  length: 1,                            // Chiều dài (cm)
  width: 1,                             // Chiều rộng (cm)
  height: 1,                            // Chiều cao (cm)
  weight: Number(pkgWeight),            // Tổng weight (gram)
  insurance_value: 0,                   // Giá trị bảo hiểm
  coupon: '',                           // Mã giảm giá GHN
  items: ghnItems,                      // Danh sách items
};

// Gọi GHN API
const resp = await ShippingService.calculateGhnFee(body);

// Lấy shipping fee từ response
const serviceFee = resp.data.service_fee; // VND
```

**API Endpoint:**
- `POST /api/ghn/fee`
- Backend sẽ gọi GHN API và trả về `service_fee`

---

## 4. TÍNH TOÁN TỪ PRODUCT ĐẾN ĐỊA CHỈ NGƯỜI NHẬN

### 4.1. Địa Chỉ Gửi (Origin)

**Lấy từ Product:**
```typescript
const product = productCache.get(item.productId);

// Địa chỉ gửi từ product
const fromDistrictId = product.districtCode;  // Ví dụ: "1442" (Quận 1, TP.HCM)
const fromWardCode = product.wardCode;         // Ví dụ: "1A0401" (Phường Bến Nghé)
```

**Nguồn dữ liệu:**
- `product.districtCode`: Mã quận/huyện (từ database product)
- `product.wardCode`: Mã phường/xã (từ database product)
- Đây là địa chỉ warehouse/kho hàng của store

---

### 4.2. Địa Chỉ Nhận (Destination)

**Lấy từ Customer Address:**
```typescript
const selectedAddress = addresses.find(a => a.id === selectedAddressId);

// Địa chỉ nhận từ customer address
const toDistrictId = selectedAddress.districtId;  // Ví dụ: 1442
const toWardCode = selectedAddress.wardCode;      // Ví dụ: "1A0401"
```

**Nguồn dữ liệu:**
- `address.districtId`: ID quận/huyện (từ customer address)
- `address.wardCode`: Mã phường/xã (từ customer address)
- Đây là địa chỉ giao hàng của khách hàng

---

### 4.3. GHN API Tính Phí

**GHN API sẽ tính phí dựa trên:**
1. **Khoảng cách**: Từ `from_district_id + from_ward_code` đến `to_district_id + to_ward_code`
2. **Trọng lượng**: Tổng weight của package
3. **Kích thước**: length × width × height (hiện tại dùng default 1×1×1 cm)
4. **Service type**: 2 (Hàng nhẹ) hoặc 5 (Hàng nặng)

**Công thức GHN:**
```
Shipping Fee = Base Fee (theo khoảng cách)
             + Weight Fee (theo trọng lượng)
             + Service Fee (theo service type)
             + Remote Area Fee (nếu vùng xa)
```

**Ví dụ:**
- Từ: Quận 1, TP.HCM → Đến: Quận 7, TP.HCM
- Weight: 2450g
- Service type: 2 (Hàng nhẹ)
- → GHN tính: 25.000₫

---

## 5. TỔNG KẾT

### 5.1. So Sánh Product, Variant, Combo

| Loại | productId | variantId | Weight Source | Địa chỉ gửi |
|------|-----------|-----------|---------------|-------------|
| **Product** | ✅ | ❌ | `product.weight` | `product.districtCode`, `product.wardCode` |
| **Variant** | ✅ | ✅ | `product.weight` (product gốc) | `product.districtCode`, `product.wardCode` |
| **Combo** | ✅ (comboId) | ❌ | `combo.weight` | `combo.districtCode`, `combo.wardCode` |

**Kết luận:**
- **Product** và **Variant**: Xử lý giống nhau, dùng weight của product gốc
- **Combo**: Xử lý như product, nhưng có weight riêng (tổng weight của các sản phẩm trong combo)

---

### 5.2. Flow Tính Phí

```
1. User chọn địa chỉ nhận hàng
   ↓
2. Filter items đã chọn (isSelected = true)
   ↓
3. Group items theo storeId
   ↓
4. Với mỗi store:
   a. Lấy địa chỉ gửi từ product đầu tiên
   b. Build GHN items (weight từ product/variant/combo)
   c. Tính service type (2 hoặc 5)
   d. Gọi GHN API với:
      - from_district_id, from_ward_code (từ product)
      - to_district_id, to_ward_code (từ customer address)
      - weight, items, service_type_id
   ↓
5. GHN API trả về service_fee
   ↓
6. Sum tổng shipping fee từ tất cả stores
   ↓
7. Hiển thị shipping fee theo từng store + tổng
```

---

### 5.3. Ví Dụ Thực Tế

**Scenario:**
- Store A: 1 Product (0.5kg) + 1 Variant (0.25kg) → Tổng: 0.75kg
- Store B: 1 Combo (1.2kg) → Tổng: 1.2kg
- Địa chỉ nhận: Quận 7, TP.HCM

**Tính toán:**

**Store A:**
- Địa chỉ gửi: Quận 1, TP.HCM (từ product đầu tiên)
- Weight: 750g → Service type: 2 (Hàng nhẹ)
- GHN API: 25.000₫

**Store B:**
- Địa chỉ gửi: Quận 3, TP.HCM (từ combo)
- Weight: 1200g → Service type: 2 (Hàng nhẹ)
- GHN API: 30.000₫

**Tổng shipping fee:** 25.000₫ + 30.000₫ = **55.000₫**

---

## 6. LƯU Ý QUAN TRỌNG

1. **Variant không có weight riêng**: Luôn dùng weight của product gốc
2. **Combo có weight riêng**: Weight tổng của các sản phẩm trong combo
3. **Mỗi store tính riêng**: Vì mỗi store có địa chỉ gửi khác nhau
4. **Service type tính riêng cho mỗi store**: Dựa trên weight của items trong store đó
5. **Dimensions mặc định**: Tất cả items dùng 1×1×1 cm (có thể cải thiện sau)
6. **Debounce 500ms**: Tránh spam API khi user thay đổi địa chỉ

---

## 7. CODE LOCATION

- **Hook tính shipping fee**: `src/hooks/useAutoShippingFee.ts`
- **Service GHN API**: `src/services/customer/ShippingService.ts`
- **Hook tính service type**: `src/hooks/useServiceTypeCalculator.ts`
- **Component sử dụng**: `src/components/CheckoutOrderComponents/CheckoutOrderContainer.tsx`

