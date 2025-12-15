# Test Cases Report - SEP490 Audio WebApp

## Tổng quan

Tài liệu này tổng hợp số lượng **Features** và **Functions** trong hệ thống SEP490 Audio WebApp, cùng với các test cases mẫu để làm tài liệu test report.

**Ngày tạo:** 2025-01-XX  
**Phiên bản:** 1.0.0

---

## Thống kê tổng quan

### Tổng số Features (Modules)

| Module | Số lượng Features | Mô tả |
|--------|-------------------|-------|
| **Customer Features** | 15+ | Authentication, Shopping Cart, Checkout, Order Management, Profile, Chat, Warranty, Wallet, etc. |
| **Seller Features** | 20+ | Dashboard, Product Management, Order Management, Return Management, Staff Management, Finance, Campaign, Voucher, etc. |
| **Admin Features** | 15+ | User Management, Store Management, Product Management, KYC Management, Category Management, Campaign Management, Payout Management, etc. |
| **Staff Features** | 5+ | Order Management, Delivery Assignment, etc. |
| **Common Features** | 10+ | Search, Chat (AI Agent, Store Chat), 3D Room Design, File Upload, etc. |
| **TỔNG CỘNG** | **65+ Features** | |

### Tổng số Functions (Service Methods)

| Service Category | Số lượng Services | Ước tính Functions/Service | Tổng Functions |
|-----------------|-------------------|---------------------------|----------------|
| **Customer Services** | 25 services | ~8-15 functions/service | ~250 functions |
| **Seller Services** | 20 services | ~10-20 functions/service | ~300 functions |
| **Admin Services** | 15 services | ~8-15 functions/service | ~150 functions |
| **Staff Services** | 2 services | ~5-10 functions/service | ~15 functions |
| **Common Services** | 4 services | ~5-10 functions/service | ~30 functions |
| **TỔNG CỘNG** | **66 Services** | | **~745 Functions** |

---

## Test Cases Mẫu

### Feature 1: Customer Authentication

**Mô tả:** Feature đăng ký và đăng nhập cho khách hàng, bao gồm validation, token management, và error handling.

**Số lượng Functions:** 12 functions
- `CustomerAuthService.register()`
- `CustomerAuthService.login()`
- `CustomerAuthService.logout()`
- `CustomerAuthService.getProfile()`
- `CustomerAuthService.updateProfile()`
- `CustomerAuthService.isAuthenticated()`
- `CustomerAuthService.getToken()`
- `CustomerAuthService.getAccountId()`
- `CustomerAuthService.getCurrentUser()`
- `CustomerAuthService.refreshToken()`
- `CustomerAuthService.validateRegisterData()`
- `CustomerAuthService.formatApiError()`

---

## Test Cases Template - Customer Authentication

### Summary Dashboard

| Feature | Customer Authentication |
|---------|-------------------------|
| **Test requirement** | Test đăng ký và đăng nhập tài khoản khách hàng, bao gồm validation, token management, và error handling |
| **Number of TCs** | 8 |

| Testing Round | Passed | Failed | Pending | N/A |
|---------------|--------|--------|---------|-----|
| Round 1 | 0 | 0 | 8 | 0 |
| Round 2 | 0 | 0 | 8 | 0 |
| Round 3 | 0 | 0 | 8 | 0 |

---

### Test Cases Detail

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|--------------|----------------------|---------------------|------------------|----------------|---------|-----------|--------|---------|-----------|--------|---------|-----------|--------|------|
| **Function: CustomerAuthService.register()** | | | | | | | | | | | | | | |
| TC-AUTH-001 | Test đăng ký tài khoản khách hàng thành công với thông tin hợp lệ | 1. Navigate to `/auth/register`<br>2. Nhập đầy đủ thông tin:<br>   - Full Name: "Nguyễn Văn A"<br>   - Email: "test@example.com"<br>   - Phone: "0912345678"<br>   - Password: "password123"<br>   - Confirm Password: "password123"<br>3. Check checkbox "Đồng ý với điều khoản dịch vụ"<br>4. Click button "Đăng ký" | 1. API call `POST /api/account/register/customer` thành công với status 201<br>2. Hiển thị success notification: "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục."<br>3. Tự động redirect đến trang `/auth/login` sau 3 giây<br>4. Email "test@example.com" được pre-fill trong login form<br>5. Tài khoản mới được tạo trong database | 1. User chưa có tài khoản trong hệ thống<br>2. Email "test@example.com" chưa được sử dụng<br>3. Số điện thoại "0912345678" chưa được sử dụng<br>4. Browser đã mở và kết nối internet | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-003 | Test đăng ký tài khoản với mật khẩu xác nhận không khớp | 1. Navigate to `/auth/register`<br>2. Nhập thông tin:<br>   - Full Name: "Nguyễn Văn C"<br>   - Email: "newuser@example.com"<br>   - Phone: "0901234567"<br>   - Password: "password123"<br>   - Confirm Password: "password456" (khác với password)<br>3. Check checkbox "Đồng ý với điều khoản dịch vụ"<br>4. Click button "Đăng ký" | 1. Client-side validation phát hiện password mismatch<br>2. Hiển thị error notification: "Mật khẩu xác nhận không khớp!"<br>3. Form không submit, không có API call<br>4. User vẫn ở trang register, có thể chỉnh sửa | 1. User đang ở trang register<br>2. Chưa có tài khoản với email "newuser@example.com" | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerAuthService.login()** | | | | | | | | | | | | | | |
| TC-AUTH-004 | Test đăng nhập tài khoản khách hàng thành công với email và password hợp lệ | 1. Navigate to `/auth/login`<br>2. Nhập email: "test@example.com"<br>3. Nhập password: "password123"<br>4. (Optional) Check "Ghi nhớ đăng nhập"<br>5. Click button "Đăng nhập" | 1. API call `POST /api/account/login/customer` thành công với status 200<br>2. Access token được lưu vào localStorage với key "CUSTOMER_token"<br>3. Refresh token được lưu vào localStorage<br>4. User data (email, full_name, role, accountId, customerId) được lưu vào localStorage<br>5. Tự động redirect đến homepage (`/`)<br>6. Hiển thị welcome message: "Chào mừng {userName} quay trở lại!" (nếu không có redirect URL)<br>7. Header hiển thị tên user và button "Đăng xuất" | 1. User đã có tài khoản với email "test@example.com" và password "password123"<br>2. Tài khoản chưa bị khóa hoặc vô hiệu hóa<br>3. Browser đã mở và kết nối internet | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-005 | Test đăng nhập với thông tin đăng nhập không đúng | 1. Navigate to `/auth/login`<br>2. Nhập email: "test@example.com"<br>3. Nhập password sai: "wrongpassword"<br>4. Click button "Đăng nhập" | 1. API call `POST /api/account/login/customer` trả về error status 401<br>2. Hiển thị error notification: "Tài khoản hoặc mật khẩu không đúng"<br>3. Form không clear, user vẫn có thể chỉnh sửa<br>4. User vẫn ở trang login<br>5. Không có token nào được lưu vào localStorage<br>6. Không redirect | 1. User có tài khoản với email "test@example.com" nhưng password khác<br>2. User đang ở trang login | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-006 | Test đăng nhập với email không tồn tại | 1. Navigate to `/auth/login`<br>2. Nhập email không tồn tại: "nonexistent@example.com"<br>3. Nhập password bất kỳ: "password123"<br>4. Click button "Đăng nhập" | 1. API call `POST /api/account/login/customer` trả về error status 401<br>2. Hiển thị error notification: "Tài khoản hoặc mật khẩu không đúng" (không tiết lộ email có tồn tại hay không)<br>3. Form không clear<br>4. User vẫn ở trang login<br>5. Không có token nào được lưu | 1. Email "nonexistent@example.com" không tồn tại trong hệ thống<br>2. User đang ở trang login | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerAuthService.logout()** | | | | | | | | | | | | | | |
| TC-AUTH-007 | Test đăng xuất tài khoản khách hàng | 1. User đã đăng nhập thành công<br>2. Click button "Đăng xuất" trong header (hoặc dropdown menu) | 1. Function `CustomerAuthService.logout()` được gọi<br>2. Tất cả tokens (access token, refresh token) được xóa khỏi localStorage<br>3. User data được xóa khỏi localStorage<br>4. Session storage được clear (isLoggingOut flag được set)<br>5. Storage event được dispatch để notify other tabs<br>6. Tự động redirect đến homepage (`/`)<br>7. Header hiển thị "Đăng nhập" và "Đăng ký" thay vì tên user<br>8. Welcome popup không hiển thị sau khi redirect | 1. User đã đăng nhập thành công<br>2. Có access token trong localStorage với key "CUSTOMER_token"<br>3. Có user data trong localStorage<br>4. User đang ở bất kỳ trang nào trong ứng dụng | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerAuthService.validateRegisterData()** | | | | | | | | | | | | | | |
| TC-AUTH-008 | Test validation dữ liệu đăng ký - thiếu thông tin bắt buộc | 1. Navigate to `/auth/register`<br>2. Nhập thông tin không đầy đủ:<br>   - Full Name: "A" (chỉ 1 ký tự)<br>   - Email: "invalid-email" (không đúng format)<br>   - Phone: "123" (không đúng format)<br>   - Password: "123" (chỉ 3 ký tự)<br>   - Confirm Password: "123"<br>3. Click button "Đăng ký" | 1. Client-side validation phát hiện các lỗi:<br>   - "Tên phải có ít nhất 2 ký tự"<br>   - "Email không hợp lệ"<br>   - "Số điện thoại không hợp lệ"<br>   - "Mật khẩu phải có ít nhất 6 ký tự"<br>2. Hiển thị error notification với lỗi đầu tiên<br>3. Form không submit, không có API call<br>4. User vẫn ở trang register, có thể chỉnh sửa | 1. User đang ở trang register<br>2. Form validation được enable | Pending | | | Pending | | | Pending | | | |

---

#### Test Case TC-AUTH-002: Customer Registration - Email Already Exists

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AUTH-002 |
| **Feature** | Customer Authentication |
| **Function** | `CustomerAuthService.register()` |
| **Priority** | High |
| **Test Type** | Functional - Negative Test |
| **Preconditions** | 1. Email "existing@example.com" đã tồn tại trong hệ thống |
| **Test Steps** | 1. Navigate to `/auth/register`<br>2. Nhập thông tin với email đã tồn tại:<br>   - Email: "existing@example.com"<br>   - Các trường khác hợp lệ<br>3. Click button "Đăng ký" |
| **Expected Result** | 1. API call trả về error status 400 hoặc 409<br>2. Hiển thị error message: "Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập."<br>3. Form không submit, user vẫn ở trang register |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

## Test Cases Template - Shopping Cart & Checkout

### Summary Dashboard

| Feature | Shopping Cart & Checkout |
|---------|-------------------------|
| **Test requirement** | Test quản lý giỏ hàng và thanh toán, bao gồm thêm/xóa sản phẩm, cập nhật số lượng, áp dụng voucher, tính phí vận chuyển, và checkout (COD/PayOS) |
| **Number of TCs** | 7 |

| Testing Round | Passed | Failed | Pending | N/A |
|---------------|--------|--------|---------|-----|
| Round 1 | 0 | 0 | 7 | 0 |
| Round 2 | 0 | 0 | 7 | 0 |
| Round 3 | 0 | 0 | 7 | 0 |

---

### Test Cases Detail

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|--------------|----------------------|---------------------|------------------|----------------|---------|-----------|--------|---------|-----------|--------|---------|-----------|--------|------|
| **Function: CustomerCartService.addProductToCart()** | | | | | | | | | | | | | | |
| TC-CART-001 | Test thêm sản phẩm vào giỏ hàng thành công | 1. Navigate to Product Detail Page<br>2. Chọn variant (nếu có)<br>3. Chọn số lượng: 2<br>4. Click button "Thêm vào giỏ hàng" | 1. API call `POST /api/v1/customers/{customerId}/cart/items` thành công với status 200<br>2. Hiển thị success notification: "Đã thêm sản phẩm vào giỏ hàng!"<br>3. Cart icon trong header hiển thị số lượng mới (tăng 2)<br>4. Product được thêm vào cart với đúng variant và quantity<br>5. Cart data được cập nhật trong database | 1. User đã đăng nhập thành công<br>2. Product ID hợp lệ và còn hàng<br>3. Product có variant (nếu cần)<br>4. Browser đã mở và kết nối internet | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerCartService.getCart()** | | | | | | | | | | | | | | |
| TC-CART-002 | Test lấy thông tin giỏ hàng thành công | 1. Navigate to `/cart`<br>2. Page tự động load cart data từ API | 1. API call `GET /api/v1/customers/{customerId}/cart` thành công với status 200<br>2. Hiển thị danh sách sản phẩm trong cart<br>3. Hiển thị đúng quantity, price, variant cho mỗi item<br>4. Hiển thị tổng tiền, phí vận chuyển, voucher (nếu có)<br>5. Hiển thị tổng cộng cuối cùng<br>6. Cart được group theo store (nếu có nhiều store) | 1. User đã đăng nhập thành công<br>2. Cart có ít nhất 1 sản phẩm<br>3. Browser đã mở và kết nối internet | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerCartService.updateItemQuantity()** | | | | | | | | | | | | | | |
| TC-CART-003 | Test cập nhật số lượng sản phẩm trong giỏ hàng thành công | 1. Navigate to `/cart`<br>2. Tìm sản phẩm cần update<br>3. Click nút tăng quantity từ 1 lên 3<br>4. Wait for API response | 1. API call `PATCH /api/v1/customers/{customerId}/cart/item/quantity` thành công với status 200<br>2. Quantity của item được update thành 3 trong UI<br>3. Line total được tính lại: unitPrice × 3<br>4. Tổng tiền cart được cập nhật tự động<br>5. Không có error notification<br>6. Cart data được cập nhật trong database | 1. User đã đăng nhập thành công<br>2. Cart có ít nhất 1 sản phẩm<br>3. Sản phẩm còn đủ hàng (stock >= 3)<br>4. Browser đã mở và kết nối internet | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerCartService.deleteItems()** | | | | | | | | | | | | | | |
| TC-CART-004 | Test xóa sản phẩm khỏi giỏ hàng thành công | 1. Navigate to `/cart`<br>2. Tìm sản phẩm cần xóa<br>3. Click nút "Xóa" trên 1 sản phẩm<br>4. Confirm delete (nếu có confirmation dialog) | 1. API call `DELETE /api/v1/customers/{customerId}/cart/items` thành công với status 200<br>2. Hiển thị success notification: "Đã xóa sản phẩm khỏi giỏ hàng"<br>3. Item bị xóa khỏi UI ngay lập tức<br>4. Cart total được cập nhật tự động<br>5. Cart icon trong header giảm số lượng tương ứng<br>6. Item được xóa khỏi database | 1. User đã đăng nhập thành công<br>2. Cart có ít nhất 2 sản phẩm (để test xóa 1 item)<br>3. Browser đã mở và kết nối internet | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerCartService.checkoutCod()** | | | | | | | | | | | | | | |
| TC-CART-005 | Test checkout đơn hàng với phương thức thanh toán COD thành công | 1. Navigate to `/cart`<br>2. Chọn sản phẩm cần mua (check checkbox)<br>3. Click button "Mua hàng"<br>4. Navigate to checkout page<br>5. Chọn địa chỉ giao hàng từ danh sách<br>6. Chọn phương thức thanh toán: COD<br>7. Review order summary<br>8. Click button "Xác nhận & Thanh toán" | 1. API call `POST /api/v1/customers/{customerId}/cart/checkout-cod` thành công với status 200<br>2. Hiển thị success notification: "Đặt hàng thành công!"<br>3. Order được tạo với status PENDING trong database<br>4. Cart được clear hoặc items đã checkout bị xóa khỏi cart<br>5. Tự động redirect đến Order Detail Page hoặc Order History<br>6. Order ID được hiển thị cho user | 1. User đã đăng nhập thành công<br>2. Cart có ít nhất 1 sản phẩm đã được chọn<br>3. User có ít nhất 1 địa chỉ giao hàng hợp lệ<br>4. Đã chọn địa chỉ và phương thức thanh toán COD<br>5. Browser đã mở và kết nối internet | Pending | | | Pending | | | Pending | | | |
| TC-CART-007 | Test checkout với giỏ hàng trống hoặc không có sản phẩm được chọn | 1. Navigate to `/cart`<br>2. Không chọn sản phẩm nào (hoặc cart trống)<br>3. Click button "Mua hàng" | 1. Client-side validation phát hiện lỗi<br>2. Hiển thị error notification: "Vui lòng chọn ít nhất một sản phẩm để mua."<br>3. Không navigate đến checkout page<br>4. User vẫn ở trang cart<br>5. Không có API call được thực hiện | 1. User đã đăng nhập thành công<br>2. Cart trống hoặc không có sản phẩm nào được chọn<br>3. User đang ở trang cart | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerCartService.checkoutPayOS()** | | | | | | | | | | | | | | |
| TC-CART-006 | Test checkout đơn hàng với phương thức thanh toán PayOS thành công | 1. Navigate to checkout page từ cart<br>2. Chọn địa chỉ giao hàng từ danh sách<br>3. Chọn phương thức thanh toán: PayOS<br>4. Review order summary<br>5. Click button "Xác nhận & Thanh toán" | 1. API call `POST /api/v1/payos/checkout?customerId={customerId}` thành công với status 200<br>2. Nhận được `checkoutUrl` từ response<br>3. Tự động redirect đến PayOS checkout page (external URL)<br>4. Order được tạo với status UNPAID (chờ thanh toán) trong database<br>5. Cart được clear hoặc items đã checkout bị xóa khỏi cart<br>6. User có thể thanh toán trên PayOS page | 1. User đã đăng nhập thành công<br>2. Cart có ít nhất 1 sản phẩm đã được chọn<br>3. User có ít nhất 1 địa chỉ giao hàng hợp lệ<br>4. Đã chọn địa chỉ và phương thức thanh toán PayOS<br>5. Browser đã mở và kết nối internet<br>6. PayOS service đang hoạt động | Pending | | | Pending | | | Pending | | | |

---

### Feature 3: Order Management

**Mô tả:** Feature quản lý đơn hàng của khách hàng, bao gồm xem lịch sử đơn hàng, chi tiết đơn hàng, hủy đơn hàng, và yêu cầu hoàn trả.

**Số lượng Functions:** 10 functions
- `OrderHistoryService.list()`
- `OrderHistoryService.getById()`
- `OrderHistoryService.getByExternalCode()`
- `OrderHistoryService.cancel()`
- `OrderHistoryService.requestCancel()`
- `OrderHistoryService.getGhnOrderByStoreOrderId()`
- `OrderHistoryService.requestReturn()`
- `OrderHistoryService.normalizeOrder()` (private)
- `OrderHistoryService.createStoreOrdersFromItems()` (private)
- `OrderHistoryService.getPreferredItemImage()` (private)

---

#### Test Case TC-ORDER-001: Get Order History - Success

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-ORDER-001 |
| **Feature** | Order Management |
| **Function** | `OrderHistoryService.list()` |
| **Priority** | High |
| **Test Type** | Functional - Positive Test |
| **Preconditions** | 1. User đã đăng nhập<br>2. User có ít nhất 1 đơn hàng trong hệ thống |
| **Test Steps** | 1. Navigate to `/profile` → Tab "Đơn hàng"<br>2. Page tự động load order history |
| **Expected Result** | 1. API call `GET /api/customers/{customerId}/orders?page=0&size=20` thành công<br>2. Hiển thị danh sách đơn hàng với pagination<br>3. Mỗi order hiển thị: order code, date, status, total amount<br>4. Có thể filter theo status (PENDING, CONFIRMED, SHIPPING, etc.)<br>5. Có thể search theo order code |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

#### Test Case TC-ORDER-002: Get Order Detail - Success

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-ORDER-002 |
| **Feature** | Order Management |
| **Function** | `OrderHistoryService.getById()` |
| **Priority** | High |
| **Test Type** | Functional - Positive Test |
| **Preconditions** | 1. User đã đăng nhập<br>2. Order ID hợp lệ và thuộc về user |
| **Test Steps** | 1. Navigate to Order History<br>2. Click vào một order để xem chi tiết |
| **Expected Result** | 1. API call `GET /api/customers/{customerId}/orders/{orderId}` thành công<br>2. Hiển thị đầy đủ thông tin order:<br>   - Order code, date, status<br>   - Danh sách sản phẩm với quantity, price<br>   - Thông tin địa chỉ giao hàng<br>   - Phương thức thanh toán<br>   - Shipping fee, discount, total<br>   - Tracking code (nếu có) |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

#### Test Case TC-ORDER-003: Cancel Order (PENDING Status) - Success

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-ORDER-003 |
| **Feature** | Order Management |
| **Function** | `OrderHistoryService.cancel()` |
| **Priority** | High |
| **Test Type** | Functional - Positive Test |
| **Preconditions** | 1. User đã đăng nhập<br>2. Order có status PENDING<br>3. Order thuộc về user |
| **Test Steps** | 1. Navigate to Order Detail Page<br>2. Click button "Hủy đơn hàng"<br>3. Nhập lý do hủy: "Không cần nữa"<br>4. Click "Xác nhận" |
| **Expected Result** | 1. API call `POST /api/v1/customers/{customerId}/orders/{orderId}/cancel?reason=...` thành công<br>2. Hiển thị success message: "Hủy đơn hàng thành công"<br>3. Order status được update thành CANCELLED<br>4. UI cập nhật để hiển thị status mới<br>5. Button "Hủy đơn hàng" biến mất |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

#### Test Case TC-ORDER-004: Request Cancel Order (AWAITING_SHIPMENT Status) - Success

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-ORDER-004 |
| **Feature** | Order Management |
| **Function** | `OrderHistoryService.requestCancel()` |
| **Priority** | High |
| **Test Type** | Functional - Positive Test |
| **Preconditions** | 1. User đã đăng nhập<br>2. Order có status AWAITING_SHIPMENT<br>3. Order thuộc về user |
| **Test Steps** | 1. Navigate to Order Detail Page<br>2. Click button "Yêu cầu hủy đơn hàng"<br>3. Nhập lý do: "Thay đổi ý định"<br>4. Click "Gửi yêu cầu" |
| **Expected Result** | 1. API call `POST /api/v1/customers/{customerId}/orders/{orderId}/cancel-request?reason=...` thành công<br>2. Hiển thị success message: "Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng. Vui lòng chờ cửa hàng xem xét."<br>3. Order có flag "cancellation requested"<br>4. Button "Yêu cầu hủy đơn hàng" biến mất |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

#### Test Case TC-ORDER-005: Request Return - Success

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-ORDER-005 |
| **Feature** | Order Management |
| **Function** | `OrderHistoryService.requestReturn()` |
| **Priority** | High |
| **Test Type** | Functional - Positive Test |
| **Preconditions** | 1. User đã đăng nhập<br>2. Order có status DELIVERY_SUCCESS<br>3. Order có ít nhất 1 item chưa được return<br>4. Đã nhận hàng thành công |
| **Test Steps** | 1. Navigate to Order Detail Page<br>2. Click button "Yêu cầu hoàn trả"<br>3. Chọn sản phẩm cần hoàn trả<br>4. Chọn lý do hoàn trả: "Sản phẩm bị lỗi"<br>5. Upload hình ảnh/video (nếu có)<br>6. Click "Gửi yêu cầu" |
| **Expected Result** | 1. API call `POST /api/customers/me/returns` thành công<br>2. Hiển thị success message: "Đã gửi yêu cầu hoàn trả sản phẩm"<br>3. Return request được tạo với status PENDING<br>4. Redirect đến Return History hoặc hiển thị return request mới |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

#### Test Case TC-ORDER-006: Get Order History - Empty Result

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-ORDER-006 |
| **Feature** | Order Management |
| **Function** | `OrderHistoryService.list()` |
| **Priority** | Medium |
| **Test Type** | Functional - Edge Case |
| **Preconditions** | 1. User đã đăng nhập<br>2. User chưa có đơn hàng nào |
| **Test Steps** | 1. Navigate to `/profile` → Tab "Đơn hàng"<br>2. Page tự động load order history |
| **Expected Result** | 1. API call thành công với empty array<br>2. Hiển thị empty state: "Chưa có đơn hàng nào"<br>3. Hiển thị button "Mua sắm ngay" để redirect đến homepage |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

#### Test Case TC-ORDER-007: Cancel Order - Invalid Status Error

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-ORDER-007 |
| **Feature** | Order Management |
| **Function** | `OrderHistoryService.cancel()` |
| **Priority** | Medium |
| **Test Type** | Functional - Negative Test |
| **Preconditions** | 1. User đã đăng nhập<br>2. Order có status SHIPPING (không thể hủy trực tiếp) |
| **Test Steps** | 1. Navigate to Order Detail Page<br>2. Tìm button "Hủy đơn hàng" (nếu có) |
| **Expected Result** | 1. Button "Hủy đơn hàng" không hiển thị (vì status không cho phép)<br>2. Hoặc nếu có, khi click sẽ hiển thị error: "Không thể hủy đơn hàng ở trạng thái này" |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |

---

## Tổng hợp Test Cases

### Theo Feature

| Feature | Số lượng Test Cases | Pass | Fail | Not Tested | Pass Rate |
|---------|-------------------|------|------|------------|-----------|
| Customer Authentication | 5 | 0 | 0 | 5 | 0% |
| Shopping Cart & Checkout | 7 | 0 | 0 | 7 | 0% |
| Order Management | 7 | 0 | 0 | 7 | 0% |
| **TỔNG CỘNG** | **19** | **0** | **0** | **19** | **0%** |

### Theo Function

| Function | Số lượng Test Cases | Pass | Fail | Not Tested |
|----------|-------------------|------|------|------------|
| `CustomerAuthService.register()` | 2 | 0 | 0 | 2 |
| `CustomerAuthService.login()` | 2 | 0 | 0 | 2 |
| `CustomerAuthService.logout()` | 1 | 0 | 0 | 1 |
| `CustomerCartService.addProductToCart()` | 1 | 0 | 0 | 1 |
| `CustomerCartService.getCart()` | 1 | 0 | 0 | 1 |
| `CustomerCartService.updateItemQuantity()` | 1 | 0 | 0 | 1 |
| `CustomerCartService.deleteItems()` | 1 | 0 | 0 | 1 |
| `CustomerCartService.checkoutCod()` | 2 | 0 | 0 | 2 |
| `CustomerCartService.checkoutPayOS()` | 1 | 0 | 0 | 1 |
| `OrderHistoryService.list()` | 2 | 0 | 0 | 2 |
| `OrderHistoryService.getById()` | 1 | 0 | 0 | 1 |
| `OrderHistoryService.cancel()` | 2 | 0 | 0 | 2 |
| `OrderHistoryService.requestCancel()` | 1 | 0 | 0 | 1 |
| `OrderHistoryService.requestReturn()` | 1 | 0 | 0 | 1 |
| **TỔNG CỘNG** | **19** | **0** | **0** | **19** |

---

## Test Coverage Summary

### Feature Coverage

- **Total Features in System:** 65+ features
- **Features with Test Cases:** 3 features (4.6%)
- **Features without Test Cases:** 62+ features (95.4%)

### Function Coverage

- **Total Functions in System:** ~745 functions
- **Functions with Test Cases:** 13 functions (1.7%)
- **Functions without Test Cases:** ~732 functions (98.3%)

---

## Recommendations

1. **Prioritize Critical Features:** Tập trung tạo test cases cho các features quan trọng nhất:
   - Payment Processing (PayOS, COD)
   - Order Management (Seller side)
   - Return & Refund Flow
   - Product Management (Seller side)
   - Admin Management Features

2. **Automated Testing:** Cân nhắc implement automated testing cho:
   - Unit tests cho các service functions
   - Integration tests cho API endpoints
   - E2E tests cho critical user flows

3. **Test Data Management:** Tạo test data repository với:
   - Test accounts (customer, seller, admin)
   - Test products, orders, vouchers
   - Test scenarios cho edge cases

4. **Test Execution Plan:** Lập kế hoạch test execution:
   - Smoke tests trước mỗi release
   - Regression tests sau mỗi bug fix
   - Performance tests cho critical features

5. **Test Documentation:** Cập nhật test cases thường xuyên:
   - Khi có feature mới
   - Khi có bug fix
   - Khi có requirement changes

---

## Appendix: Test Case Template

```markdown
| Field | Value |
|-------|-------|
| **Test Case ID** | TC-XXX-XXX |
| **Feature** | Feature Name |
| **Function** | FunctionName() |
| **Priority** | High / Medium / Low |
| **Test Type** | Functional / Integration / E2E / Performance / Security |
| **Preconditions** | 1. Precondition 1<br>2. Precondition 2 |
| **Test Steps** | 1. Step 1<br>2. Step 2<br>3. Step 3 |
| **Expected Result** | 1. Expected result 1<br>2. Expected result 2 |
| **Actual Result** | |
| **Status** | ⬜ Not Tested / ✅ Pass / ❌ Fail |
| **Notes** | |
```

---

**Last Updated:** 2025-01-XX  
**Document Version:** 1.0.0  
**Total Test Cases Generated:** 19 test cases  
**Total Features Documented:** 3 features  
**Total Functions Documented:** 13 functions

