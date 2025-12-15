# Business Rules - Use Case Mapping

## Tổng quan

File này map các Business Rules (BR) từ `bussiness.md` với các Use Cases tương ứng trong hệ thống.

---

## Use Case: Customer Register (UC-CUSTOMER-REGISTER)

**File:** `docs/use-case-customer-register.md`

**Business Rules liên quan:**
- **BR-79**: Users must create an account and be logged in before placing an order.
  - *Giải thích:* Use case này tạo tài khoản mới, là điều kiện tiên quyết để đặt hàng.

**Business Rules trong Use Case:**
- BR-REGISTER-001 đến BR-REGISTER-009 (các rules riêng của use case này)

---

## Use Case: Customer Login (UC-CUSTOMER-LOGIN)

**File:** `docs/use-case-customer-login.md`

**Business Rules liên quan:**
- **BR-01**: Users must enter a valid email/phone number and password to log in. Input fields must not be empty; invalid credentials must return an error. Locked or suspended accounts are not allowed to log in.
  - *Giải thích:* Quy định validation và xử lý lỗi khi đăng nhập.
- **BR-02**: Passwords must be securely encrypted and verified. After successful login, the system generates a JWT or session token and supports two-factor authentication (2FA) if enabled.
  - *Giải thích:* Quy định về bảo mật mật khẩu và token generation.
- **BR-03**: Google OAuth2 login is supported. If the email already exists, the user is logged in; otherwise, a new account is automatically created with the default role of Customer. Disabled or blocked Google accounts are not allowed to log in.
  - *Giải thích:* Quy định về đăng nhập bằng Google OAuth.
- **BR-79**: Users must create an account and be logged in before placing an order.
  - *Giải thích:* Đăng nhập là điều kiện tiên quyết để đặt hàng.

**Business Rules trong Use Case:**
- BR-LOGIN-001 đến BR-LOGIN-010 (các rules riêng của use case này)

---

## Use Case: Customer Forgot Password (UC-CUSTOMER-FORGOT-PASSWORD)

**File:** `docs/use-case-customer-forgot-password.md`

**Business Rules liên quan:**
- **BR-02**: Passwords must be securely encrypted and verified.
  - *Giải thích:* Quy định về bảo mật mật khẩu khi đặt lại mật khẩu mới.

**Business Rules trong Use Case:**
- BR-FORGOT-001 đến BR-FORGOT-010 (các rules riêng của use case này)

---

## Use Case: Customer Change Password (UC-CUSTOMER-CHANGE-PASSWORD)

**File:** `docs/use-case-customer-change-password.md`

**Business Rules liên quan:**
- **BR-02**: Passwords must be securely encrypted and verified.
  - *Giải thích:* Quy định về bảo mật mật khẩu khi đổi mật khẩu.

**Business Rules trong Use Case:**
- BR-CHANGE-PWD-001 đến BR-CHANGE-PWD-009 (các rules riêng của use case này)

---

## Use Case: Logout (UC-LOGOUT)

**File:** `docs/use-case-logout.md`

**Business Rules liên quan:**
- Không có BR trực tiếp từ `bussiness.md` cho use case này.

**Business Rules trong Use Case:**
- BR-LOGOUT-001 đến BR-LOGOUT-010 (các rules riêng của use case này)

---

## Use Case: Customer View Profile (UC-CUSTOMER-VIEW-PROFILE)

**File:** `docs/use-case-customer-view-profile.md`

**Business Rules liên quan:**
- **BR-104**: A customer must exist to view addresses; address lists are ordered with the default address first, followed by newest addresses.
  - *Giải thích:* Quy định về xem địa chỉ trong profile.
- **BR-105**: Customers may create multiple addresses; the first address is default; setting isDefault=true removes default from others; addressCount is updated accordingly.
  - *Giải thích:* Quy định về quản lý địa chỉ (có thể được thực hiện từ profile page).
- **BR-106**: Customers may update only their own addresses, including partial field updates; setting default updates all others.
  - *Giải thích:* Quy định về cập nhật địa chỉ.
- **BR-107**: Customers cannot delete others' addresses; deleting a default address auto-selects another as default; only one default address is allowed.
  - *Giải thích:* Quy định về xóa địa chỉ.

**Business Rules trong Use Case:**
- BR-PROFILE-001 đến BR-PROFILE-009 (các rules riêng của use case này)

---

## Use Case: Customer Update Profile (UC-CUSTOMER-UPDATE-PROFILE)

**File:** `docs/use-case-customer-update-profile.md`

**Business Rules liên quan:**
- **BR-103**: Deleting a customer performs a soft delete by setting status to DELETED; if the customer does not exist, the system returns "Customer not found."
  - *Giải thích:* Quy định về xóa customer (có thể liên quan đến cập nhật profile).

**Business Rules trong Use Case:**
- BR-UPDATE-001 đến BR-UPDATE-009 (các rules riêng của use case này)

---

## Use Case: Customer View Wallet (UC-CUSTOMER-VIEW-WALLET)

**File:** `docs/use-case-customer-view-wallet.md`

**Business Rules liên quan:**
- **BR-36**: The system must record full transaction histories and reconciliation records.
  - *Giải thích:* Quy định về lưu trữ lịch sử giao dịch (hiển thị trong wallet).
- **BR-45**: Refunds are processed from held funds and returned to the customer's wallet.
  - *Giải thích:* Quy định về hoàn tiền vào ví khách hàng.
- **BR-96**: Refunds are always deducted from pendingAmount (not available balance). Canceled or rejected returns unlock funds back to the seller; successful refunds transfer pending funds to the customer wallet.
  - *Giải thích:* Quy định về cách hoàn tiền vào ví khách hàng.
- **BR-112**: Customer payments (QR or COD collection) enter the platform wallet as pending; HOLD transactions are recorded; multi-store orders allocate pending amounts per store.
  - *Giải thích:* Quy định về cách thanh toán được ghi vào ví.
- **BR-115**: Orders canceled before delivery are refunded from the platform wallet to the customer wallet, including product price and shipping minus discounts; partial refunds apply in multi-store orders.
  - *Giải thích:* Quy định về hoàn tiền khi hủy đơn hàng.

**Business Rules trong Use Case:**
- BR-WALLET-001 đến BR-WALLET-008 (các rules riêng của use case này)

---

## Use Case: Customer Return Request (UC-CUSTOMER-RETURN-REQUEST)

**File:** `docs/use-case-customer-return-request.md`

**Business Rules liên quan:**
- **BR-37**: Customers may submit return requests within 7 days after successful delivery.
  - *Giải thích:* Quy định về thời hạn yêu cầu hoàn trả.
- **BR-38**: Each return request applies to only one product item per order.
  - *Giải thích:* Quy định về phạm vi yêu cầu hoàn trả.
- **BR-39**: Return requests must include a valid reason and supporting images or videos as evidence.
  - *Giải thích:* Quy định về nội dung yêu cầu hoàn trả.
- **BR-40**: When a return request is created, the related seller funds must be locked and excluded from payout.
  - *Giải thích:* Quy định về khóa tiền của seller khi có yêu cầu hoàn trả.
- **BR-41**: Sellers must respond to return requests within the defined time limit; otherwise, the system processes the request automatically.
  - *Giải thích:* Quy định về auto-approve nếu seller không phản hồi.
- **BR-42**: After seller approval, customers must ship the item back within 72 hours; otherwise, the request is canceled.
  - *Giải thích:* Quy định về thời hạn gửi hàng trả lại.
- **BR-43**: Return shipping costs are borne by either the seller or the buyer, depending on who is at fault.
  - *Giải thích:* Quy định về phí vận chuyển trả hàng.
- **BR-44**: In dispute cases, the Admin's decision is final.
  - *Giải thích:* Quy định về xử lý khiếu nại.
- **BR-45**: Refunds are processed from held funds and returned to the customer's wallet.
  - *Giải thích:* Quy định về hoàn tiền vào ví.
- **BR-54**: Customers may request return/exchange/refund within the policy window (e.g., 7–14 days) and only for products that are intact, unmodified, and not misused.
  - *Giải thích:* Quy định về điều kiện yêu cầu hoàn trả.
- **BR-84**: Customers may create return requests only for their own orders, with a maximum of one return per OrderItem.
  - *Giải thích:* Quy định về quyền tạo yêu cầu hoàn trả.
- **BR-85**: Return requests must specify a valid reason type (SHOP_FAULT, CUSTOMER_FAULT, CHANGE_OF_MIND) and include at least one photo or video as evidence.
  - *Giải thích:* Quy định về loại lý do và bằng chứng.
- **BR-86**: Return requests submitted at the deadline remain valid even if carrier pickup occurs afterward.
  - *Giải thích:* Quy định về deadline yêu cầu hoàn trả.
- **BR-87**: Creating a return locks the seller's pending amount and blocks payout; return status cannot be rolled back; ReturnRequests cannot be deleted, only archived.
  - *Giải thích:* Quy định về khóa tiền và không thể rollback.
- **BR-88**: Sellers must respond to return requests within 48 hours; otherwise, the system auto-approves the request.
  - *Giải thích:* Quy định về auto-approve sau 48 giờ.
- **BR-89**: If a seller rejects a return, the request moves to DISPUTE; funds remain locked; rejection requires justification or evidence.
  - *Giải thích:* Quy định về từ chối và chuyển sang DISPUTE.
- **BR-90**: After seller approval, customers must ship the item within 7 day; otherwise, the return is canceled and funds are unlocked for the seller.
  - *Giải thích:* Quy định về thời hạn gửi hàng (7 ngày).
- **BR-91**: Return shipping fees are always borne by the seller; fees are recorded and included in reconciliation bills; customers never pay return shipping.
  - *Giải thích:* Quy định về phí vận chuyển trả hàng (seller chịu).
- **BR-96**: Refunds are always deducted from pendingAmount (not available balance). Canceled or rejected returns unlock funds back to the seller; successful refunds transfer pending funds to the customer wallet.
  - *Giải thích:* Quy định về cách hoàn tiền.
- **BR-97**: Refund Without Return may only be triggered by Admin for low-value products.
  - *Giải thích:* Quy định về hoàn tiền không cần trả hàng.
- **BR-98**: Carrier webhook updates automatically synchronize return statuses.
  - *Giải thích:* Quy định về đồng bộ trạng thái từ carrier.
- **BR-99**: Items under return/dispute are not eligible for payout; after resolution or cancellation, items become eligible for payout after 7 days.
  - *Giải thích:* Quy định về điều kiện payout.
- **BR-100**: Only the order owner may create a complaint; each complaint is tied to exactly one ReturnRequest and must include reasons and evidence.
  - *Giải thích:* Quy định về khiếu nại (có thể liên quan đến return).
- **BR-101**: Complaints start with status OPEN. If the seller does not respond within 48 hours, the system auto-triggers Refund Without Return (once only), resolves the complaint, and refunds the customer automatically.
  - *Giải thích:* Quy định về xử lý khiếu nại tự động.
- **BR-102**: Complaints cannot be submitted after resolution; refunds must be returned to the customer wallet for the exact amount in the ReturnRequest.
  - *Giải thích:* Quy định về hoàn tiền sau khi giải quyết khiếu nại.

**Business Rules trong Use Case:**
- BR-RETURN-001 đến BR-RETURN-009 (các rules riêng của use case này)

---

## Use Case: Customer Send Message to Store (UC-CUSTOMER-SEND-MESSAGE)

**File:** `docs/use-case-customer-send-message.md`

**Business Rules liên quan:**
- **BR-70**: Sellers are expected to maintain a high response rate and reply promptly to customer messages over the last 30 days.
  - *Giải thích:* Quy định về tỷ lệ phản hồi của seller (liên quan đến chat).
- **BR-71**: Off-platform transactions are strictly prohibited, including references to bank transfers or personal payments.
  - *Giải thích:* Quy định về cấm giao dịch ngoài platform (có thể được kiểm tra trong chat).
- **BR-72**: Sharing personal contact details (bank accounts, phone numbers, addresses, or redirecting customers to Facebook/Zalo) is prohibited.
  - *Giải thích:* Quy định về cấm chia sẻ thông tin liên hệ cá nhân trong chat.
- **BR-73**: Offensive, abusive, or inappropriate language toward customers is not allowed.
  - *Giải thích:* Quy định về ngôn ngữ không phù hợp trong chat.
- **BR-74**: Sending external links not belonging to the platform is prohibited.
  - *Giải thích:* Quy định về cấm gửi link ngoài platform.

**Business Rules trong Use Case:**
- BR-SEND-001 đến BR-SEND-010 (các rules riêng của use case này)

---

## Use Case: Store Reply to Customer Message (UC-STORE-REPLY-MESSAGE)

**File:** `docs/use-case-store-reply-message.md`

**Business Rules liên quan:**
- **BR-70**: Sellers are expected to maintain a high response rate and reply promptly to customer messages over the last 30 days.
  - *Giải thích:* Quy định về tỷ lệ phản hồi của seller.
- **BR-71**: Off-platform transactions are strictly prohibited, including references to bank transfers or personal payments.
  - *Giải thích:* Quy định về cấm giao dịch ngoài platform.
- **BR-72**: Sharing personal contact details (bank accounts, phone numbers, addresses, or redirecting customers to Facebook/Zalo) is prohibited.
  - *Giải thích:* Quy định về cấm chia sẻ thông tin liên hệ cá nhân.
- **BR-73**: Offensive, abusive, or inappropriate language toward customers is not allowed.
  - *Giải thích:* Quy định về ngôn ngữ không phù hợp.
- **BR-74**: Sending external links not belonging to the platform is prohibited.
  - *Giải thích:* Quy định về cấm gửi link ngoài platform.

**Business Rules trong Use Case:**
- BR-REPLY-001 đến BR-REPLY-012 (các rules riêng của use case này)

---

## Use Case: Customer Chat with AI Agent (UC-CUSTOMER-CHAT-AI-AGENT)

**File:** `docs/use-case-customer-chat-ai-agent.md`

**Business Rules liên quan:**
- **BR-52**: Users may query only product and category data using Vietnamese language; only SELECT operations are allowed with limited result sets.
  - *Giải thích:* Quy định về phạm vi truy vấn của AI Agent (chỉ product và category, chỉ SELECT).
- **BR-53**: Users input room size, number of listeners, and wall/floor/ceiling materials; the system calculates target SPL, estimates required speaker power, recommends speaker quantity/type/power, and warns if the setup is overpowered or underpowered.
  - *Giải thích:* Quy định về tính năng setup phòng nghe (nhưng use case ghi rõ AI Agent không hỗ trợ tính năng này).

**Business Rules trong Use Case:**
- BR-AI-AGENT-001 đến BR-AI-AGENT-007 (các rules riêng của use case này)

---

## Use Case: Customer Cancel Pending Order (UC20)

**ID and Name:** UC20 – Cancel pending order  
**Date Created:** 1/10/2025  
**Primary Actor:** Customer  
**Secondary Actors:** System

**Description:**  
This feature allows customers to cancel orders in a period after placing an order. Customer can cancel orders that are in pending status (waiting for store confirmation).

**Business Rules liên quan:**
- **BR-31**: Customers may cancel orders only if the seller has not confirmed the order.
  - *Giải thích:* Use case này chỉ cho phép cancel khi order ở trạng thái PENDING (chưa được seller confirm). Đây là điều kiện tiên quyết.
- **BR-32**: Valid cancellations before confirmation are automatically processed and refunded if payment was made.
  - *Giải thích:* Quy định về xử lý tự động cancel và hoàn tiền nếu customer đã thanh toán. Cancel hợp lệ trước khi seller confirm được xử lý tự động.
- **BR-67**: If an order is in Pending Confirmation and not yet confirmed by the seller, the system allows automatic cancellation. Online payments trigger a refund request (1–3 business days); COD orders have no refund.
  - *Giải thích:* Quy định chi tiết về cancel order ở trạng thái Pending Confirmation. Thanh toán online sẽ trigger refund request (1-3 ngày), COD không có refund.
- **BR-115**: Orders canceled before delivery are refunded from the platform wallet to the customer wallet, including product price and shipping minus discounts; partial refunds apply in multi-store orders.
  - *Giải thích:* Quy định về hoàn tiền khi cancel order trước khi giao hàng. Hoàn tiền bao gồm giá sản phẩm và phí vận chuyển trừ đi discount. Đối với đơn hàng multi-store, áp dụng partial refund.

**Business Rules trong Use Case (đề xuất):**
- BR-CANCEL-001: Customer chỉ có thể cancel order khi order ở trạng thái PENDING (chưa được seller confirm)
- BR-CANCEL-002: Customer phải cung cấp lý do hợp lệ để cancel order
- BR-CANCEL-003: Cancel order ở trạng thái PENDING được xử lý tự động, không cần seller approval
- BR-CANCEL-004: Nếu customer đã thanh toán online, hệ thống tự động tạo refund request (1-3 ngày làm việc)
- BR-CANCEL-005: Đối với đơn hàng COD, cancel không có refund
- BR-CANCEL-006: Hoàn tiền bao gồm giá sản phẩm và phí vận chuyển, trừ đi các discount đã áp dụng
- BR-CANCEL-007: Đối với đơn hàng multi-store, áp dụng partial refund cho từng store
- BR-CANCEL-008: Sau khi cancel thành công, order status chuyển sang CANCELLED
- BR-CANCEL-009: Tiền hoàn trả được chuyển vào ví khách hàng (customer wallet)

**Lưu ý:** 
- BR-33 và BR-68 không áp dụng cho use case này vì chúng quy định về cancel order sau khi seller đã confirm (cần seller approval), trong khi use case này chỉ xử lý cancel order ở trạng thái PENDING.

---

## Use Case: Customer Cancel Ready to Pick Up Order (UC21)

**ID and Name:** UC21 – Cancel ready to pick up order  
**Date Created:** 10/10/2025  
**Primary Actor:** Customer  
**Secondary Actors:** System, Store Owner (Seller)

**Description:**  
This feature allows customers to cancel an order when the order has been placed in the store but has not yet been handed over to the delivery team. Order status is READY_TO_PICKUP (seller has confirmed and packed the order, ready for carrier pickup).

**Business Rules liên quan:**
- **BR-33**: If the seller has confirmed the order, cancellation requires seller approval.
  - *Giải thích:* Use case này xử lý cancel order sau khi seller đã confirm. READY_TO_PICKUP là trạng thái sau khi seller confirm và đóng gói xong, nên cancel cần seller approval. Đây là điều kiện tiên quyết.
- **BR-68**: If an order is already confirmed (Processing/Packing), cancellation requires seller approval. If rejected, the order proceeds and the customer may only request a return after delivery.
  - *Giải thích:* Quy định chi tiết về cancel order sau khi seller đã confirm (Processing/Packing). READY_TO_PICKUP là trạng thái sau Processing/Packing, nên BR này áp dụng. Nếu seller từ chối cancel, order tiếp tục và customer chỉ có thể request return sau khi nhận hàng.
- **BR-115**: Orders canceled before delivery are refunded from the platform wallet to the customer wallet, including product price and shipping minus discounts; partial refunds apply in multi-store orders.
  - *Giải thích:* Quy định về hoàn tiền khi cancel order trước khi giao hàng. READY_TO_PICKUP là trước khi delivery, nên nếu cancel thành công, sẽ hoàn tiền theo quy định này.

**Business Rules trong Use Case (đề xuất):**
- BR-CANCEL-READY-001: Customer chỉ có thể cancel order khi order ở trạng thái READY_TO_PICKUP
- BR-CANCEL-READY-002: Customer phải gửi yêu cầu cancel với lý do hợp lệ và chờ seller approval
- BR-CANCEL-READY-003: Cancel order ở trạng thái READY_TO_PICKUP yêu cầu seller approval, không tự động xử lý
- BR-CANCEL-READY-004: Seller có thể approve hoặc reject yêu cầu cancel của customer
- BR-CANCEL-READY-005: Nếu seller approve cancel request, order status chuyển sang CANCELLED
- BR-CANCEL-READY-006: Nếu seller reject cancel request, order tiếp tục tiến trình và customer chỉ có thể request return sau khi nhận hàng
- BR-CANCEL-READY-007: Nếu cancel được approve và customer đã thanh toán online, hệ thống hoàn tiền vào ví khách hàng
- BR-CANCEL-READY-008: Hoàn tiền bao gồm giá sản phẩm và phí vận chuyển, trừ đi các discount đã áp dụng
- BR-CANCEL-READY-009: Đối với đơn hàng multi-store, áp dụng partial refund cho từng store
- BR-CANCEL-READY-010: Đối với đơn hàng COD, nếu cancel được approve, không có refund (vì chưa thanh toán)

**Lưu ý:** 
- Use case này khác với UC20 (Cancel pending order):
  - UC20: Cancel order ở trạng thái PENDING (chưa seller confirm) → Tự động xử lý, không cần seller approval
  - UC21: Cancel order ở trạng thái READY_TO_PICKUP (đã seller confirm) → Cần seller approval
- BR-31 và BR-67 không áp dụng cho use case này vì chúng quy định về cancel order khi seller chưa confirm (tự động xử lý).

---

## Business Rules không có Use Case Customer tương ứng

Các Business Rules sau đây không có use case customer trực tiếp trong danh sách được cung cấp:

### Product & Store Management (BR-04 đến BR-17)
- BR-04: Only authenticated sellers with a valid store are allowed to create products.
- BR-05: When creating a product, the seller must select at least one valid category.
- BR-06: Product SKU must be unique within the scope of the seller's store.
- BR-07: Products without variants must have a selling price defined; products with variants must manage price and stock at the variant level.
- BR-08: Newly created or updated products must be assigned the PENDING_APPROVAL status for moderation.
- BR-09: Sellers may only edit products they own and only when the product is in an editable status.
- BR-10: Products participating in promotions or having existing orders must not allow critical information changes.
- BR-11: Disabling or deleting a product must not affect previously created orders.
- BR-12: Users are allowed to compare between 2 and 4 products within the same category.
- BR-13: Common attributes must be displayed in the same rows; differences must be highlighted. Users may add or remove products from the comparison table.
- BR-14: Only approved stores are allowed to publish products on the platform.
- BR-15: Products must contain complete and valid information before being approved.
- BR-16: Eligible content may be automatically approved; suspicious cases must be reviewed manually by an Admin.
- BR-17: Store and product approval processes must be completed within 48 hours and approval history must be recorded.

### Content Management (BR-18 đến BR-20)
- BR-18: Banners, landing pages, and blog content must define display start and end dates.
- BR-19: Only Admin users are authorized to approve content before publication.
- BR-20: Customers may only view banners that are active and within their valid display period.

### Vouchers & Promotions (BR-21 đến BR-24, BR-75 đến BR-77, BR-121 đến BR-123)
- BR-21: Each product may only be associated with one active voucher at a given time.
- BR-22: Vouchers are applied only when they are valid, have remaining usage quota, and meet the minimum order value.
- BR-23: The total discount value of a voucher must not exceed the valid product value of the seller.
- BR-24: When a voucher is applied, the system must record usage history per customer.
- BR-75: Admin users may create and manage platform-wide promotional campaigns and notify sellers to participate.
- BR-76: Each promotion or voucher must define budget limits, usage caps, and validity periods to prevent abuse.
- BR-121: Vouchers are applicable only when ACTIVE and within the valid time window (start ≤ now ≤ end).
- BR-122: Applying a voucher decrements remainingUsage; vouchers with zero remainingUsage cannot be applied; usage history is recorded per customer.
- BR-123: Vouchers apply only to eligibleSubtotal; discounts are capped so total discount never exceeds the seller's eligible product value.

### Payment & Orders (BR-25 đến BR-35, BR-59 đến BR-69, BR-79, BR-108 đến BR-111, BR-115 đến BR-117)
- BR-25: Customers may pay for multiple orders using a single payment link.
- BR-26: Upon successful payment, the order status is updated to PAID and a confirmation email is sent to the customer.
- BR-27: Failed or expired payments result in the order being marked as UNPAID.
- BR-28: Shipping fees must be calculated based on actual weight/dimensions and the customer's delivery address.
- BR-29: Delivery status must be synchronized from the shipping provider to the order system.
- BR-30: Multi-store orders are considered successfully delivered only when all sub-orders are delivered.
- BR-31: Customers may cancel orders only if the seller has not confirmed the order.
- BR-32: Valid cancellations before confirmation are automatically processed and refunded if payment was made.
- BR-33: If the seller has confirmed the order, cancellation requires seller approval.
- BR-34: All customer payments must be held in a pending state and released only after successful delivery and completion of the defined holding period.
- BR-35: Sellers receive net earnings after platform fees and shipping fee differences are deducted.
- BR-59: All orders (online or COD) incur platform fees, including commission, service fees, and payment fees if applicable.
- BR-60: For online orders, platform fees are deducted before settlement; the remaining amount is held (pending) in the system wallet.
- BR-61: For COD orders, platform fees are recorded as payable debt. Before allowing new COD orders, the system verifies that online-held funds meet or exceed COD fee debt (with configurable safety thresholds). If insufficient, top-up is required or COD is disabled.
- BR-62: Default commission is config by admin, calculated per sold product.
- BR-63: Only one platform fee configuration may be active at any given time.
- BR-64: Creating a new platform fee automatically deactivates the previous one.
- BR-65: A new platform fee becomes effective immediately upon creation.
- BR-66: Sellers must always be charged using the currently active platform fee.
- BR-67: If an order is in Pending Confirmation and not yet confirmed by the seller, the system allows automatic cancellation. Online payments trigger a refund request (1–3 business days); COD orders have no refund.
- BR-68: If an order is already confirmed (Processing/Packing), cancellation requires seller approval. If rejected, the order proceeds and the customer may only request a return after delivery.
- BR-69: If a customer paid online but refuses delivery, no immediate refund is issued. The carrier retries delivery 2–3 times; if failed, the item is returned to the seller. Refund is processed only after the seller confirms receipt of intact goods; shipping fees may be deducted or refund denied if goods are lost/damaged.
- BR-79: Users must create an account and be logged in before placing an order.
- BR-108: Sellers may operate only on delivery orders belonging to their own store.
- BR-109: Delivery status mapping: READY_FOR_PICKUP → READY_FOR_DELIVERY → OUT_FOR_DELIVERY → DELIVERED_WAITING_CONFIRM → DELIVERY_SUCCESS; customer refusal results in DELIVERY_DENIED.
- BR-110: Carrier webhooks synchronize child orders to parent orders; parent orders succeed only when all child orders succeed; status updates occur only when the new state differs.
- BR-111: Shipping fees must reflect actual weight/dimensions and correct addresses; calculated from store address; combo items calculated individually; order code and ETA displayed; missing carrier fees default to zero; final fees updated upon order creation.
- BR-115: Orders canceled before delivery are refunded from the platform wallet to the customer wallet, including product price and shipping minus discounts; partial refunds apply in multi-store orders.
- BR-116: For COD orders, the 7-day hold begins only after successful delivery; COD follows the same pending → allocate → release flow.
- BR-117: Sellers receive payouts only after delivery plus 7 days without returns; payout bills detail revenues and deductions; new bills cannot be created until previous bills are paid; sellers can view bill history.

### Reviews (BR-46 đến BR-48)
- BR-46: Only customers who have purchased and successfully received the product may submit reviews.
- BR-47: Each product in an order may be reviewed only once.
- BR-48: Only the review owner may edit or delete their review; sellers may only reply to reviews of their own products.

### Reports & Statistics (BR-49 đến BR-51, BR-80 đến BR-83)
- BR-49: The system must generate revenue, order count, and sold product statistics per store and across the platform.
- BR-50: The system must identify best-selling and slow-selling products and stores.
- BR-51: Report data must be near real-time and support export to Excel or PDF formats.
- BR-80: Admins can generate financial reports by period (daily, weekly, monthly, quarterly).
- BR-81: Taxes (VAT, income tax) must be calculated automatically in compliance with applicable laws.
- BR-82: All payments to merchants/owners must undergo reconciliation before payout.
- BR-83: Financial reports must be stored in the system to support audits and tax inspections.

### Loyalty & Membership (BR-55 đến BR-58)
- BR-55: Reward points are automatically granted after successful delivery; points are calculated as a percentage of order value, configurable by product group/customer segment/promotion, with configurable expiration.
- BR-56: Customers may redeem points for vouchers, free shipping, or gifts; redemption milestones are shown when eligible, with configurable monthly limits.
- BR-57: Membership tiers are determined by total accumulated points or total spending within the last 12 months; default tiers include Silver, Gold, Platinum, Diamond, each with distinct benefits.
- BR-58: The system generates personalized offers based on purchase history, browsing behavior, and membership tier, including exclusive deals, category-based discounts, and bundle recommendations.

### Wallet & Payout (BR-112 đến BR-114, BR-118)
- BR-112: Customer payments (QR or COD collection) enter the platform wallet as pending; HOLD transactions are recorded; multi-store orders allocate pending amounts per store.
- BR-113: Pending funds are released only after successful delivery and 7 days without return, transferring from pending to available balance for the seller.
- BR-114: Sellers receive net payouts after shipping differences and platform fees; negative payouts are capped at zero; all wallet transactions record before/after balances.
- BR-118: Orders or items under return/dispute are not eligible for payout until resolved.

### KYC (BR-119 đến BR-120)
- BR-119: Each seller may have only one KYC request in PENDING status at a time; submitting a new KYC sets the seller status to PENDING.
- BR-120: Approved KYC triggers a "KYC_APPROVED" email; rejected KYC sets status to REJECTED and sends a "KYC_REJECTED" email with reasons.

### Policies & Notifications (BR-78)
- BR-78: When admins update system policies or commission rates, notifications must be sent to store owners via app and email.

### Product Views (BR-77)
- BR-77: Each product view by a customer increments the product's view count by one.

---

## Tóm tắt Mapping

| Use Case | Business Rules từ bussiness.md | Business Rules riêng |
|----------|-------------------------------|---------------------|
| **UC-CUSTOMER-REGISTER** | BR-79 | BR-REGISTER-001 đến BR-REGISTER-009 |
| **UC-CUSTOMER-LOGIN** | BR-01, BR-02, BR-03, BR-79 | BR-LOGIN-001 đến BR-LOGIN-010 |
| **UC-CUSTOMER-FORGOT-PASSWORD** | BR-02 | BR-FORGOT-001 đến BR-FORGOT-010 |
| **UC-CUSTOMER-CHANGE-PASSWORD** | BR-02 | BR-CHANGE-PWD-001 đến BR-CHANGE-PWD-009 |
| **UC-LOGOUT** | Không có | BR-LOGOUT-001 đến BR-LOGOUT-010 |
| **UC-CUSTOMER-VIEW-PROFILE** | BR-104, BR-105, BR-106, BR-107 | BR-PROFILE-001 đến BR-PROFILE-009 |
| **UC-CUSTOMER-UPDATE-PROFILE** | BR-103 | BR-UPDATE-001 đến BR-UPDATE-009 |
| **UC-CUSTOMER-VIEW-WALLET** | BR-36, BR-45, BR-96, BR-112, BR-115 | BR-WALLET-001 đến BR-WALLET-008 |
| **UC-CUSTOMER-RETURN-REQUEST** | BR-37, BR-38, BR-39, BR-40, BR-41, BR-42, BR-43, BR-44, BR-45, BR-54, BR-84, BR-85, BR-86, BR-87, BR-88, BR-89, BR-90, BR-91, BR-96, BR-97, BR-98, BR-99, BR-100, BR-101, BR-102 | BR-RETURN-001 đến BR-RETURN-009 |
| **UC-CUSTOMER-SEND-MESSAGE** | BR-70, BR-71, BR-72, BR-73, BR-74 | BR-SEND-001 đến BR-SEND-010 |
| **UC-STORE-REPLY-MESSAGE** | BR-70, BR-71, BR-72, BR-73, BR-74 | BR-REPLY-001 đến BR-REPLY-012 |
| **UC-CUSTOMER-CHAT-AI-AGENT** | BR-52, BR-53 (một phần) | BR-AI-AGENT-001 đến BR-AI-AGENT-007 |
| **UC20-CANCEL-PENDING-ORDER** | BR-31, BR-32, BR-67, BR-115 | BR-CANCEL-001 đến BR-CANCEL-009 (đề xuất) |
| **UC21-CANCEL-READY-TO-PICKUP** | BR-33, BR-68, BR-115 | BR-CANCEL-READY-001 đến BR-CANCEL-READY-010 (đề xuất) |

---

## Ghi chú

1. **Business Rules không có Use Case tương ứng:** Nhiều BR liên quan đến Seller, Admin, hoặc các tính năng chưa có use case customer (như Shopping Cart, Checkout, Order Management, Product Comparison, Reviews, etc.)

2. **Business Rules có nhiều Use Case:** Một số BR có thể áp dụng cho nhiều use case (ví dụ: BR-02 về password security áp dụng cho Login, Forgot Password, Change Password).

3. **Business Rules trong Use Case:** Mỗi use case có các Business Rules riêng (BR-XXX-001, etc.) được định nghĩa trong chính use case đó, bổ sung cho các BR từ `bussiness.md`.

4. **Use Case Return Request có nhiều BR nhất:** Use case này có 23 BR từ `bussiness.md` vì quy trình return/refund phức tạp với nhiều quy tắc nghiệp vụ.

