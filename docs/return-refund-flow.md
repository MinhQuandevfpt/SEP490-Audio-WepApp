## Return / Refund Flow Overview (SEP490-Audio-WepApp)

This document summarizes the customer and seller flows, UI points, and API calls involved in the return/refund process.

### 1) Customer Flow
- **Create return request**
  - UI: `ReturnRequestModal.tsx` (opened from order history card/modal).
  - Input: select order item, reasonType, reason, optional images/videos (uploaded), derived itemPrice.
  - API: `OrderHistoryService.requestReturn` → `POST /api/customers/me/returns` (payload includes `orderItemId`, `productId`, `itemPrice`, `reasonType`, `reason`, `customerImageUrls`, `customerVideoUrl`).
  - After success: message + navigate to `/returns`.

- **View return list**
  - UI: `ReturnHistory.tsx` (full list) and `ReturnHistoryCard.tsx` (latest item on profile).
  - Data source: `ReturnHistoryService.list` → `GET /api/customers/me/returns?page&size`.
  - Status labels: `PENDING`, `APPROVED`, `REJECTED`, `SHIPPING`, `REFUNDED`.
  - Media preview: images/videos in grid with modal preview.

- **Packing step (only when status=APPROVED and package info missing)**
  - UI: `ReturnPackingModal` launched from `ReturnHistory`.
  - Preload defaults:
    - Addresses: `ReturnPackingService.getDefaultAddressesForReturn` → fetches customer default address and store default address (via `AddressService.getAddresses` and `CustomerStoreService.getStoreDetailWithAddresses`).
    - Product info: `ProductListService.getProductById(productId)` to show `weight` and `dimensions`.
  - Validation rules in modal:
    - Weight limit: if productWeight ≤ 5kg, max input = productWeight + 0.3kg; if >5kg, max = productWeight * 1.15.
    - Dimension limit: each side ≤ productDimension + 2cm.
    - No prefilled numeric values; InputNumber controls hidden.
  - Submit packing:
    - API: `ReturnPackingService.submitPackageInfo` → `POST /api/customers/me/returns/{id}/package-info` with `weight, length, width, height, customerAddressId, storeAddressId`.
    - Response: `shippingFee`; UI shows success message with fee.
    - After server returns package info (`packageWeight/Length/Width/Height`, `shippingFee`), the “Đóng gói” button is disabled and package info is displayed in list.

- **Statuses & display after packing**
  - If package info exists: button disabled; package info rendered in `ReturnHistory`.
  - GHN tracking (customer side) shown in order history (`OrderCard`, `OrderDetailModal`) when GHN code is available via `useOrderHistory` + `OrderHistoryService.getGhnOrderByStoreOrderId`.

### 2) Seller Flow
- **View return list**
  - UI: `StoreReturnList.tsx`.
  - Data source: `StoreReturnService.list` → `GET /api/store/returns?page&size`.
  - Columns include package info, faultType, GHN/tracking, media previews.

- **Decisions**
  - Approve/Reject:
    - Approve (status change to APPROVED) via `StoreReturnService.approve` (noted in service).
    - Reject (PENDING only) via `StoreReturnService.reject` → `POST /api/store/returns/{id}/reject` with `shopRejectReason`.

- **If package info is present (status APPROVED)**
  - Button: “Xác nhận ca lấy hàng” opens `PickShiftModal`.
  - Pick shifts: `GhnService.getPickShifts` → `/ghn/pick-shifts` (title only shown).
  - Confirm pick shift: `StoreReturnService.createGhnOrder` → `POST /api/store/returns/{id}/create-ghn-order` with `{ pickShiftId }`.
  - Response includes `ghnOrderCode`; UI shows GHN code + “Theo dõi đơn” linking to `https://donhang.ghn.vn/?order_code=...`.

- **Cancel GHN order**
  - UI button above table.
  - API: `GhnService.cancelOrder` → `POST /api/ghn/cancel-order` with `{ order_codes: [...] }`.
  - After cancel, refresh list.

- **Tracking**
  - GHN code shown in seller table (`StoreReturnList`) and link to GHN tracking page.

### 3) Data Models (key fields)
- `ReturnRequestResponse` (customer & seller lists):
  - ids: `id`, `customerId`, `shopId`, `orderItemId`, `productId`
  - product: `productName`, `itemPrice`, `faultType`, `reasonType`, `reason`
  - media: `customerImageUrls`, `customerVideoUrl`
  - status: `PENDING | APPROVED | REJECTED | SHIPPING | REFUNDED`
  - package: `packageWeight/Length/Width/Height`, `shippingFee`
  - logistics: `ghnOrderCode`, `trackingStatus`
  - timestamps: `createdAt`, `updatedAt`

### 4) UI Entry Points
- Customer:
  - Create request: Order history card/modal → `ReturnRequestModal`.
  - Manage packing: Return history list → “Thực hiện đóng gói và hoàn đơn” → `ReturnPackingModal`.
  - View history: `/returns` (`ReturnHistoryPage`), and latest card on profile (`ReturnHistoryCard`).
- Seller:
  - Manage returns: `StoreReturnList` (table with actions).
  - Pick shift: `PickShiftModal`.
  - Cancel GHN: button above seller table.

### 5) API Summary
- **Customer APIs**
  - `POST /api/customers/me/returns`
    - Body: `{ orderItemId, productId, itemPrice, reasonType, reason, customerImageUrls?, customerVideoUrl? }`
    - New status: `PENDING`
  - `GET /api/customers/me/returns?page&size`
    - Returns `ReturnRequestResponse[]` with paging
  - `POST /api/customers/me/returns/{id}/package-info`
    - Body: `{ weight, length, width, height, customerAddressId, storeAddressId }`
    - Response: `{ shippingFee }`
    - Effect: fills packageWeight/Length/Width/Height + shippingFee; disables packing button
  - Support lookups:
    - `GET /api/customers/me/addresses`
    - `GET /api/store/{shopId}` (via `getStoreDetailWithAddresses`)
    - `GET /api/products/{productId}` (weight, dimensions)

- **Seller APIs**
  - `GET /api/store/returns?page&size`
  - `POST /api/store/returns/{id}/approve`
    - Status: `PENDING` → `APPROVED`
  - `POST /api/store/returns/{id}/reject` with `{ shopRejectReason }`
    - Status: `PENDING` → `REJECTED`
  - `POST /api/store/returns/{id}/create-ghn-order` with `{ pickShiftId }`
    - Status remains `APPROVED` but populates `ghnOrderCode`; flow continues to shipping
  - GHN:
    - `GET /api/ghn/pick-shifts` (list pick shifts)
    - `POST /api/ghn/cancel-order` with `{ order_codes: [...] }`

### 5b) Status & Triggers (state machine)
- `PENDING`
  - Enter: customer creates return request
  - Exit:
    - `APPROVED` (seller approve)
    - `REJECTED` (seller reject with reason)
- `APPROVED`
  - Customer action: submit package info (`package-info`) → package fields + shippingFee
  - Seller action: create GHN order (pick shift) → `ghnOrderCode`
  - Typically transitions to `SHIPPING` when logistics starts (server-driven)
- `SHIPPING`
  - Logistics in progress; tracking via `ghnOrderCode`
  - Exit: `REFUNDED` (completion/refund confirmed) or `AUTO_REFUNDED` (shop không xử lý sau khi nhận hàng)
- `REJECTED`
  - Terminal for this request
- `REFUNDED`
  - Terminal: refund completed (bao gồm refund-only)
- `CANCELLED`
  - Auto-cancel khi khách không gửi hàng đúng hạn
- `AUTO_REFUNDED`
  - Auto refund do shop không xử lý sau khi nhận hàng / dispute window

### 5c) Role/Responsibility per step
- Customer:
  - Create request (`POST /returns`)
  - Provide package info (`POST /returns/{id}/package-info`) after APPROVED
- Seller:
  - Approve/Reject (`/approve`, `/reject`)
  - Book pick shift + create GHN order (`/create-ghn-order`)
  - Cancel GHN if needed (`/ghn/cancel-order`)
- System/Logistics:
  - Calculate shipping fee (response from package-info)
  - Advance statuses (e.g., SHIPPING, REFUNDED) based on backend logic/logistics updates

### 5d) Case 4.1 – Auto-approve after 48h (shop không phản hồi)
- **Business rule (BE)**: If a return request stays `PENDING` > 48h without shop action, system auto-transitions to `APPROVED`.

- **Customer UI behavior**
  - Before auto-approve (`PENDING`):
    - Status chip: “Chờ shop phản hồi”
    - Buttons disabled: edit request, enter package weight, cancel (per business default)
  - After auto-approve (`APPROVED` returned by API list/detail):
    - Show info text: “Yêu cầu trả hàng đã được hệ thống tự duyệt do shop không phản hồi.”
    - Status label: “Shop đã duyệt (tự động)”
    - Enable: “Nhập thông tin gói hàng” / “Tạo phiếu gửi” (packing modal)

- **Seller UI behavior (Store)**
  - Before auto-approve (`PENDING`):
    - Status text: “Yêu cầu mới – Chờ xử lý”
    - Actions enabled: “Chấp nhận trả hàng” (approve), “Từ chối” (reject)
    - (Optional) countdown: “Tự động duyệt sau XX giờ…”
  - After auto-approve (`APPROVED` with no shop action detected):
    - Banner/status: “Yêu cầu đã được hệ thống tự duyệt do quá 48 giờ không phản hồi.”
    - Disable/Hide: “Chấp nhận”, “Từ chối” with tooltip “Yêu cầu đã được hệ thống auto-approve, không thể thay đổi.”
    - Still allow: tạo đơn GHN lấy hàng trả (create GHN return order)

- **Frontend implications**
  - Need a way to detect auto-approve:
    - Ideal: backend returns a flag (e.g., `autoApproved: true` or `autoApprovedAt`) in `ReturnRequestResponse`.
    - If no flag: risk of mislabeling; request backend to add explicit field. Avoid inferring solely from timestamps.
  - Rendering adjustments:
    - Customer: conditional info text + status label override when autoApproved
    - Seller: disable approve/reject, show banner and tooltip, keep GHN creation enabled


### 6) Status Flow (typical)
1. Customer submits return → `PENDING`
2. Seller approves → `APPROVED`
3. Customer enters package info → shipping fee calculated; button disabled
4. Seller books pick shift → GHN order created, `ghnOrderCode` populated
5. Logistics progress → `SHIPPING`
6. Completion/refund → `REFUNDED`

### 5e) Case 4.2 – Auto-cancel sau 72h khách không gửi hàng
- Rule: `APPROVED` → `CANCELLED` nếu khách không gửi hàng (BE có thể rút ngắn thời gian test).
- Customer: trạng thái CANCELLED, note “bị huỷ do không gửi hàng”, ẩn mọi action.
- Seller: CANCELLED, note “Khách không gửi hàng”, ẩn Approve/Reject/GHN.

### 5f) Case 4.3 – Shop không xử lý 48h sau khi nhận hàng → AUTO_REFUNDED
- Rule: `SHIPPING` + `trackingStatus='delivered'`, quá 48h không gọi `shopReceiveOrDispute` → `AUTO_REFUNDED`, refund itemPrice (không phí ship), faultType theo reasonType (CUSTOMER/SHOP).
- Customer:
  - SHIPPING + delivered: cảnh báo “Shop đã nhận hàng – chờ xử lý 48h, nếu không sẽ tự hoàn tiền (không hoàn phí trả hàng).”
  - AUTO_REFUNDED: badge, mô tả theo faultType (CUSTOMER: không hoàn phí trả hàng; SHOP: phí theo chính sách KM); ẩn action.
- Seller:
  - AUTO_REFUNDED: thông báo “Hệ thống đã tự hoàn tiền do shop không xử lý trong thời hạn.” Ẩn action.

### 5g) Case 4.4 – GHN không pickup 48h → tạo lại GHN
- Rule: BE reset về `APPROVED`, đã có package + shippingFee, nhưng `ghnOrderCode=null` (đơn GHN cũ timeout/hủy).
- Seller: banner “GHN không lấy hàng, vui lòng tạo lại đơn GHN”; nút pick-shift đổi “Tạo lại đơn GHN trả hàng”.
- Customer: optional note “Shop sẽ tạo lại đơn lấy hàng mới.”

### 5h) Case 3 – AUTO_REFUNDED khi shop không khiếu nại dù khách sai
- Rule: `SHIPPING` + delivered, shop không xử lý 48h → `AUTO_REFUNDED` (refund itemPrice, không phí ship), faultType theo reasonType.
- Customer: note tùy faultType (CUSTOMER → không hoàn phí trả hàng; SHOP → phí theo chính sách). Ẩn action.
- Seller: thấy AUTO_REFUNDED, ẩn action.

### 5i) Case 8 – Hoàn tiền không cần trả hàng (Refund without return)
- Seller:
  - Nút “Hoàn tiền không cần trả hàng” chỉ hiển thị khi `status=PENDING` và `ghnOrderCode=null`.
  - Modal xác nhận: số tiền hoàn = itemPrice; nhắc không tạo GHN, khách không cần gửi hàng; phí ship không hoàn.
  - API: `POST /api/store/returns/{id}/refund-without-return`.
  - Thành công: status → REFUNDED, toast “Hoàn tiền thành công. Khách không cần gửi lại hàng.” Ẩn mọi action khác.
  - Lỗi: hiển thị message BE.
- Customer:
  - Xử lý như REFUNDED; nếu BE trả `refundWithoutReturn=true` có thể hiển thị note “Shop đã hoàn tiền, bạn không cần gửi lại hàng. Phí vận chuyển ban đầu không được hoàn.”

### 7) Notable UX/Validation
- Product weight/dimension limits enforced in `ReturnPackingModal`.
- Inputs not prefilled; up/down arrows hidden on numeric fields.
- Success message after package info includes shippingFee.
- Media preview modals for images/videos in both customer and seller UIs.
- GHN tracking link shown when GHN code exists (customer & seller views).

### 8) Files to reference
- Customer UI: `ReturnRequestModal.tsx`, `ReturnHistory.tsx`, `ReturnHistoryCard.tsx`, `ReturnPackingModal.tsx`, `ReturnHistoryPage.tsx`.
- Seller UI: `StoreReturnList.tsx`, `PickShiftModal.tsx`.
- Services: `OrderHistoryService.ts`, `ReturnHistoryService.ts`, `ReturnPackingService.ts`, `StoreReturnService.ts`, `GhnService.ts`, `ProductListService.ts`, `AddressService.ts`, `CustomerStoreService.ts`.


