# Use Case: Customer Request Return Order After Successful Delivery

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-RETURN-REQUEST  
**Date Created:** 2025-01-XX  
**Primary Actor:** Khách hàng (Customer)  
**Secondary Actors:** Shop (Store Owner), Hệ thống (System), GHN (Logistics Provider), Admin (nếu có khiếu nại)

**Description:**  
Khách hàng đã nhận được đơn hàng thành công và muốn yêu cầu hoàn trả/hoàn tiền cho sản phẩm. Khách hàng tạo yêu cầu hoàn trả với lý do, có thể kèm hình ảnh/video minh chứng, chờ shop duyệt, thực hiện đóng gói, và gửi hàng trả lại để nhận hoàn tiền.

**Trigger:**  
Khách hàng truy cập trang Lịch sử đơn hàng hoặc Chi tiết đơn hàng, tìm đơn hàng đã được giao thành công, và nhấn nút "Yêu cầu hoàn trả" trên sản phẩm cần hoàn trả.

**Preconditions:**
1. Khách hàng đã đăng nhập vào hệ thống
2. Khách hàng có ít nhất một đơn hàng với trạng thái `DELIVERY_SUCCESS` hoặc `COMPLETED`
3. Đơn hàng chưa quá thời hạn cho phép yêu cầu hoàn trả (thường là 7-30 ngày kể từ ngày nhận hàng)
4. Sản phẩm cần hoàn trả chưa có yêu cầu hoàn trả đang xử lý
5. Sản phẩm cần hoàn trả chưa được hoàn trả thành công trước đó

**Postconditions:**
1. Yêu cầu hoàn trả được tạo thành công với trạng thái `PENDING` và lưu trong hệ thống
2. Shop nhận được thông báo về yêu cầu hoàn trả mới
3. Khách hàng có thể xem yêu cầu hoàn trả trong trang Lịch sử hoàn trả
4. Timer tự động bắt đầu: shop không phản hồi trong 48h → auto-approve; khách không gửi hàng trong 72h sau approve → auto-cancel

**Normal Flow:**
1. Khách hàng truy cập trang Lịch sử đơn hàng, tìm và click vào đơn hàng đã được giao thành công
2. Trong trang Chi tiết đơn hàng, khách hàng click nút "Yêu cầu hoàn trả" trên sản phẩm cần hoàn trả
3. Hệ thống mở modal form yêu cầu hoàn trả. Khách hàng điền thông tin:
   - Chọn loại lỗi (`CUSTOMER_FAULT` hoặc `SHOP_FAULT`)
   - Nhập lý do chi tiết (tối thiểu 10 ký tự)
   - (Tùy chọn) Upload hình ảnh/video minh chứng
4. Khách hàng xác nhận và gửi yêu cầu. Hệ thống validate và gọi API tạo return request với status `PENDING`
5. Hệ thống hiển thị thông báo thành công, điều hướng đến trang Lịch sử hoàn trả, và gửi thông báo cho shop
6. Khách hàng chờ shop phản hồi. Nếu shop không phản hồi trong 48 giờ, hệ thống tự động duyệt (auto-approve)
7. Khi status = `APPROVED`, khách hàng click nút "Thực hiện đóng gói và hoàn đơn"
8. Hệ thống mở modal đóng gói, tự động load địa chỉ mặc định và thông tin sản phẩm. Khách hàng nhập weight và dimensions (có validation dựa trên product info)
9. Khách hàng xác nhận đóng gói. Hệ thống tính phí vận chuyển và cập nhật package info
10. Shop tạo đơn GHN lấy hàng. Hệ thống cập nhật `ghnOrderCode` và gửi thông báo cho khách hàng
11. GHN vận chuyển hàng trả. Khi GHN bắt đầu vận chuyển, status chuyển sang `SHIPPING`. Khi giao thành công, `trackingStatus` = `'delivered'`
12. Shop xử lý và hoàn tiền trong vòng 48 giờ, hoặc hệ thống tự động hoàn tiền nếu shop không phản hồi. Status chuyển sang `REFUNDED` hoặc `AUTO_REFUNDED`. Tiền hoàn trả được chuyển vào ví khách hàng

**Alternative Flows:**
1. **Shop từ chối yêu cầu:** Sau khi khách hàng gửi yêu cầu (PENDING), shop có thể từ chối với lý do. Status chuyển sang `REJECTED`, use case kết thúc
2. **Khách hàng không gửi hàng:** Sau khi được duyệt (APPROVED), nếu khách hàng không thực hiện đóng gói trong vòng 72 giờ, hệ thống tự động hủy (status → `CANCELLED`), use case kết thúc
3. **Shop hoàn tiền không cần trả hàng:** Shop có thể chọn hoàn tiền mà không yêu cầu khách hàng gửi lại hàng. Status chuyển sang `REFUNDED` với flag `refundWithoutReturn = true`, bỏ qua các bước đóng gói và vận chuyển
4. **Khách hàng không upload hình ảnh/video:** Khách hàng có thể bỏ qua việc upload, form vẫn hợp lệ nếu có đủ `reasonType` và `reason`
5. **Shop khiếu nại:** Sau khi nhận hàng, shop có thể khiếu nại nếu phát hiện vấn đề. Status chuyển sang `DISPUTE`, admin xử lý và quyết định hoàn tiền hay không

**Exceptions:**
1. Khách hàng chưa đăng nhập → Hệ thống điều hướng đến trang đăng nhập, sau khi đăng nhập quay lại và tiếp tục
2. Đơn hàng không tồn tại hoặc không thuộc về khách hàng → Hiển thị lỗi, use case kết thúc
3. Đơn hàng chưa được giao thành công → Nút "Yêu cầu hoàn trả" bị disabled, use case không thể bắt đầu
4. Đã quá thời hạn yêu cầu hoàn trả → Nút "Yêu cầu hoàn trả" bị disabled, use case không thể bắt đầu
5. Sản phẩm đã có yêu cầu hoàn trả đang xử lý → Nút "Yêu cầu hoàn trả" bị disabled, use case không thể bắt đầu
6. Validation form thất bại → Hiển thị lỗi validation, khách hàng sửa và thử lại
7. Upload file thất bại → Hiển thị lỗi, cho phép khách hàng thử lại hoặc bỏ qua
8. API tạo yêu cầu hoàn trả thất bại → Hiển thị lỗi, khách hàng có thể thử lại hoặc liên hệ support
9. Không tìm thấy địa chỉ mặc định khi đóng gói → Hiển thị cảnh báo, cho phép khách hàng chọn địa chỉ thủ công
10. Validation package info thất bại → Hiển thị lỗi validation (weight, dimensions), khách hàng sửa và thử lại
11. API submit package info thất bại → Hiển thị lỗi, khách hàng có thể thử lại
12. GHN API lỗi khi shop tạo đơn → Shop nhận thông báo lỗi, khách hàng không bị ảnh hưởng, shop có thể thử lại

**Priority:** HIGH

**Business Rules:**
- BR-RETURN-001: Chỉ cho phép yêu cầu hoàn trả sau khi đơn hàng có status `DELIVERY_SUCCESS` hoặc `COMPLETED`
- BR-RETURN-002: Thời hạn yêu cầu hoàn trả là 7-30 ngày kể từ ngày nhận hàng (tùy chính sách)
- BR-RETURN-003: Mỗi sản phẩm chỉ có thể có một yêu cầu hoàn trả đang xử lý tại một thời điểm
- BR-RETURN-004: Nếu shop không phản hồi trong 48 giờ, hệ thống tự động duyệt yêu cầu (auto-approve)
- BR-RETURN-005: Nếu khách hàng không gửi hàng trong 72 giờ sau khi được duyệt, hệ thống tự động hủy yêu cầu (auto-cancel)
- BR-RETURN-006: Nếu shop không xử lý sau 48 giờ kể từ khi nhận hàng, hệ thống tự động hoàn tiền (auto-refund)
- BR-RETURN-007: Phí vận chuyển trả hàng không được hoàn lại nếu `faultType === 'CUSTOMER'`
- BR-RETURN-008: Package weight phải ≥ product weight, max = product weight + 0.3kg (nếu ≤5kg) hoặc product weight * 1.15 (nếu >5kg)
- BR-RETURN-009: Package dimensions phải ≥ product dimensions, max = product dimensions + 2cm mỗi chiều

---

### English

**ID and Name:** UC-CUSTOMER-RETURN-REQUEST  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer  
**Secondary Actors:** Shop (Store Owner), System, GHN (Logistics Provider), Admin (if dispute occurs)

**Description:**  
Customer has successfully received an order and wants to request a return/refund for a product. Customer creates a return request with reason, optionally including supporting images/videos, waits for shop approval, performs packaging, and ships the item back to receive refund.

**Trigger:**  
Customer accesses Order History page or Order Detail page, finds an order that has been successfully delivered, and clicks "Request Return" button on the product to be returned.

**Preconditions:**
1. Customer is logged into the system
2. Customer has at least one order with status `DELIVERY_SUCCESS` or `COMPLETED`
3. Order has not exceeded the allowed return request period (usually 7-30 days from delivery date)
4. Product to be returned does not have a pending return request
5. Product to be returned has not been successfully returned before

**Postconditions:**
1. Return request is successfully created with status `PENDING` and saved in the system
2. Shop receives notification about the new return request
3. Customer can view the return request in Return History page
4. Automatic timers start: shop no response in 48h → auto-approve; customer no shipment in 72h after approve → auto-cancel

**Normal Flow:**
1. Customer accesses Order History page, finds and clicks on a successfully delivered order
2. In Order Detail page, customer clicks "Request Return" button on the product to be returned
3. System opens return request form modal. Customer fills in information: selects fault type (`CUSTOMER_FAULT` or `SHOP_FAULT`), enters detailed reason (minimum 10 characters), optionally uploads supporting images/videos
4. Customer confirms and submits request. System validates and calls API to create return request with status `PENDING`
5. System displays success message, navigates to Return History page, and sends notification to shop
6. Customer waits for shop response. If shop does not respond within 48 hours, system auto-approves
7. When status = `APPROVED`, customer clicks "Perform Packaging and Complete Order" button
8. System opens packaging modal, automatically loads default addresses and product info. Customer enters weight and dimensions (with validation based on product info)
9. Customer confirms packaging. System calculates shipping fee and updates package info
10. Shop creates GHN pickup order. System updates `ghnOrderCode` and sends notification to customer
11. GHN ships return item. When GHN starts shipping, status changes to `SHIPPING`. When delivered successfully, `trackingStatus` = `'delivered'`
12. Shop processes and refunds within 48 hours, or system auto-refunds if shop doesn't respond. Status changes to `REFUNDED` or `AUTO_REFUNDED`. Refund amount is transferred to customer's wallet

**Alternative Flows:**
1. **Shop rejects request:** After customer submits request (PENDING), shop can reject with reason. Status changes to `REJECTED`, use case ends
2. **Customer does not ship:** After approval (APPROVED), if customer does not perform packaging within 72 hours, system auto-cancels (status → `CANCELLED`), use case ends
3. **Shop refunds without return:** Shop can choose to refund without requiring customer to return item. Status changes to `REFUNDED` with flag `refundWithoutReturn = true`, skips packaging and shipping steps
4. **Customer does not upload images/videos:** Customer can skip uploading, form is still valid if `reasonType` and `reason` are provided
5. **Shop disputes:** After receiving item, shop can dispute if issues found. Status changes to `DISPUTE`, admin handles and decides whether to refund

**Exceptions:**
1. Customer not logged in → System redirects to login page, returns after login and continues
2. Order does not exist or does not belong to customer → Display error, use case ends
3. Order has not been successfully delivered → "Request Return" button disabled, use case cannot start
4. Return request period has expired → "Request Return" button disabled, use case cannot start
5. Product already has pending return request → "Request Return" button disabled, use case cannot start
6. Form validation fails → Display validation errors, customer fixes and retries
7. File upload fails → Display error, allow customer to retry or skip
8. API create return request fails → Display error, customer can retry or contact support
9. Default address not found when packaging → Display warning, allow customer to manually select address
10. Package info validation fails → Display validation errors (weight, dimensions), customer fixes and retries
11. API submit package info fails → Display error, customer can retry
12. GHN API error when shop creates order → Shop receives error notification, customer not affected, shop can retry later

**Priority:** HIGH

**Business Rules:**
- BR-RETURN-001: Return can only be requested after order has status `DELIVERY_SUCCESS` or `COMPLETED`
- BR-RETURN-002: Return request period is 7-30 days from delivery date (depending on policy)
- BR-RETURN-003: Each product can only have one pending return request at a time
- BR-RETURN-004: If shop does not respond within 48 hours, system auto-approves request
- BR-RETURN-005: If customer does not ship within 72 hours after approval, system auto-cancels request
- BR-RETURN-006: If shop does not process within 48 hours after receiving item, system auto-refunds
- BR-RETURN-007: Return shipping fee is not refunded if `faultType === 'CUSTOMER'`
- BR-RETURN-008: Package weight must be ≥ product weight, max = product weight + 0.3kg (if ≤5kg) or product weight * 1.15 (if >5kg)
- BR-RETURN-009: Package dimensions must be ≥ product dimensions, max = product dimensions + 2cm per dimension

---

## Summary

Use case này mô tả luồng hoàn chỉnh của khách hàng yêu cầu hoàn trả sau khi nhận đơn hàng thành công, bao gồm:

- **12 bước Normal Flow** từ truy cập trang đơn hàng đến nhận hoàn tiền
- **5 Alternative Flows** cho các tình huống khác nhau (từ chối, hủy, hoàn tiền không cần trả hàng, v.v.)
- **12 Exception cases** xử lý các điều kiện lỗi khác nhau
- **9 Business Rules** quy định các quy tắc nghiệp vụ

Use case đảm bảo quy trình hoàn trả mượt mà với validation đầy đủ, thông báo kịp thời, và xử lý tự động khi các bên không phản hồi trong thời hạn quy định.

