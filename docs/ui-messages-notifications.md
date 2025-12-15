# UI Messages & Notifications - Tổng hợp toàn bộ thông báo trong hệ thống

## Tổng quan

File này tổng hợp tất cả các message thông báo, notification, alert, và error messages được sử dụng trong toàn bộ UI của hệ thống AudioShop. Các message được trình bày dưới dạng bảng với 4 cột: Message Code, Message Type, Context, và Content.

---

## Hệ thống Notification

### Utility Functions

**File:** `src/utils/notification.ts`

- `showCenterSuccess(message, title?, duration?)` - Hiển thị thông báo thành công (centered popup)
- `showCenterError(message, title?, duration?)` - Hiển thị thông báo lỗi (centered popup)
- `showWarning(message, title?, duration?)` - Hiển thị cảnh báo
- `showInfo(message, title?, duration?)` - Hiển thị thông tin
- `showTikiNotification(message, title?, type, duration?)` - Function chính để hiển thị notification

**File:** `src/utils/errorTranslation.ts`

- `translateError(errorMessage)` - Dịch error message từ tiếng Anh sang tiếng Việt
- `translateHttpStatus(status)` - Dịch HTTP status code sang tiếng Việt
- `formatApiError(error)` - Format API error với bản dịch tiếng Việt

---

## Bảng tổng hợp Messages

| Message Code | Message Type | Context | Content |
|--------------|--------------|---------|---------|
| **AUTH-001** | Error | Customer Login | Vui lòng nhập email! |
| **AUTH-002** | Error | Customer Login | Đăng nhập bằng số điện thoại chưa được hỗ trợ! |
| **AUTH-003** | Error | Customer Login | Vui lòng nhập mật khẩu! |
| **AUTH-004** | Error | Customer Login | Tài khoản hoặc mật khẩu không đúng |
| **AUTH-005** | Error | Customer Login | Xác thực thất bại |
| **AUTH-006** | Error | Customer Login | Không có quyền truy cập |
| **AUTH-007** | Error | Customer Login | Phiên đăng nhập đã hết hạn |
| **AUTH-008** | Error | Customer Login | Mã xác thực không hợp lệ |
| **AUTH-009** | Error | Customer Login | Lỗi kết nối mạng |
| **AUTH-010** | Error | Customer Login | Lỗi máy chủ |
| **AUTH-011** | Error | Customer Login | Dịch vụ tạm thời không khả dụng |
| **AUTH-012** | Success | Customer Register | Bạn sẽ được chuyển đến trang đăng nhập |
| **AUTH-013** | Success | Customer Register | Đăng ký thành công! Vui lòng đăng nhập để tiếp tục. |
| **AUTH-014** | Error | Customer Register | Mật khẩu xác nhận không khớp! |
| **AUTH-015** | Error | Customer Register | Bạn phải đồng ý với điều khoản dịch vụ để tiếp tục! |
| **AUTH-016** | Error | Customer Register | Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập. |
| **AUTH-017** | Error | Customer Register | Số điện thoại này đã được sử dụng. |
| **AUTH-018** | Error | Customer Register | Tên phải có ít nhất 2 ký tự |
| **AUTH-019** | Error | Customer Register | Email không hợp lệ |
| **AUTH-020** | Error | Customer Register | Số điện thoại không hợp lệ |
| **AUTH-021** | Error | Customer Register | Mật khẩu phải có ít nhất 6 ký tự |
| **AUTH-022** | Success | Change Password | Đổi mật khẩu thành công! |
| **AUTH-023** | Error | Change Password | Vui lòng nhập mật khẩu hiện tại |
| **AUTH-024** | Error | Change Password | Mật khẩu hiện tại không đúng |
| **AUTH-025** | Error | Change Password | Vui lòng nhập mật khẩu mới |
| **AUTH-026** | Error | Change Password | Mật khẩu mới phải có ít nhất 6 ký tự |
| **AUTH-027** | Error | Change Password | Mật khẩu mới phải khác mật khẩu hiện tại |
| **AUTH-028** | Error | Change Password | Vui lòng xác nhận mật khẩu mới |
| **AUTH-029** | Error | Change Password | Mật khẩu xác nhận không khớp |
| **AUTH-030** | Error | Change Password | Có lỗi xảy ra, vui lòng thử lại |
| **CART-001** | Success | Shopping Cart | Đã xóa sản phẩm khỏi giỏ hàng |
| **CART-002** | Success | Shopping Cart | Đã xóa toàn bộ giỏ hàng |
| **CART-003** | Error | Shopping Cart | Không tìm thấy sản phẩm trong giỏ hàng. |
| **CART-004** | Error | Shopping Cart | Không thể cập nhật số lượng. Vui lòng thử lại. |
| **CART-005** | Error | Shopping Cart | Không thể xóa sản phẩm. Vui lòng thử lại. |
| **CART-006** | Error | Shopping Cart | Không thể xóa giỏ hàng. Vui lòng thử lại. |
| **CART-007** | Error | Shopping Cart | Vui lòng chọn ít nhất một sản phẩm để mua. |
| **CART-008** | Error | Shopping Cart | Không thể chuẩn bị dữ liệu thanh toán. Vui lòng thử lại. |
| **CART-009** | Warning | Shopping Cart | Voucher {code} đã được gỡ vì đơn hàng của cửa hàng không đạt tối thiểu {amount}đ. |
| **CART-010** | Warning | Shopping Cart | Voucher {code} đã được sử dụng cho {productName}. Mỗi voucher chỉ có thể áp dụng cho một sản phẩm. |
| **CART-011** | Warning | Shopping Cart | Sản phẩm "{productName}" đã vượt quá giới hạn sử dụng chiến dịch. Giá đã được cập nhật về giá gốc. |
| **CHECKOUT-001** | Success | Checkout | Đặt hàng thành công! |
| **CHECKOUT-002** | Success | Checkout | Đã xóa sản phẩm khỏi đơn hàng |
| **CHECKOUT-003** | Error | Checkout | Không tìm thấy thông tin giỏ hàng. Vui lòng chọn sản phẩm trước khi thanh toán. |
| **CHECKOUT-004** | Error | Checkout | Thông tin giỏ hàng không hợp lệ. Vui lòng chọn lại sản phẩm. |
| **CHECKOUT-005** | Error | Checkout | Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm trước khi thanh toán. |
| **CHECKOUT-006** | Error | Checkout | Không tìm thấy sản phẩm đã chọn. Vui lòng kiểm tra lại giỏ hàng. |
| **CHECKOUT-007** | Error | Checkout | Không thể tải dữ liệu thanh toán. Vui lòng thử lại. |
| **CHECKOUT-008** | Error | Checkout | Không thể xóa sản phẩm. Vui lòng thử lại. |
| **CHECKOUT-009** | Error | Checkout | Giỏ hàng rỗng, quay lại để chọn sản phẩm. |
| **CHECKOUT-010** | Error | Checkout | Vui lòng chọn địa chỉ nhận hàng. |
| **CHECKOUT-011** | Error | Checkout | Vui lòng chọn phương thức thanh toán. |
| **CHECKOUT-012** | Error | Checkout | Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau. |
| **CHECKOUT-013** | Error | Checkout | Phương thức thanh toán không hợp lệ. |
| **CHECKOUT-014** | Error | Checkout | Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại. |
| **CHECKOUT-015** | Error | Checkout | Không thể tạo liên kết thanh toán PayOS. Vui lòng thử lại. |
| **CHECKOUT-016** | Error | Checkout | Voucher {code} không còn hợp lệ. |
| **CHECKOUT-017** | Error | Checkout | Voucher {code} đã được gỡ vì đơn hàng không đạt tối thiểu {amount}đ. |
| **ADDRESS-001** | Success | Address Management | Cập nhật địa chỉ thành công |
| **ADDRESS-002** | Success | Address Management | Thêm địa chỉ thành công |
| **ADDRESS-003** | Success | Address Management | Xóa địa chỉ thành công |
| **ADDRESS-004** | Success | Address Management | Đã đặt làm địa chỉ mặc định |
| **ADDRESS-005** | Error | Address Management | Vui lòng điền đầy đủ thông tin địa chỉ |
| **ADDRESS-006** | Error | Address Management | Không thể lưu địa chỉ |
| **ADDRESS-007** | Error | Address Management | Không thể xóa địa chỉ |
| **ADDRESS-008** | Error | Address Management | Không thể đặt mặc định |
| **VOUCHER-001** | Error | Voucher Section | Vui lòng nhập mã voucher |
| **VOUCHER-002** | Error | Voucher Section | Mã voucher không hợp lệ hoặc không tồn tại |
| **VOUCHER-003** | Error | Voucher Section | Voucher không thể sử dụng |
| **VOUCHER-004** | Error | Voucher Section | Không xác định được cửa hàng |
| **VOUCHER-005** | Error | Voucher Section | Đơn hàng tối thiểu {min}đ. Hiện tại: {current}đ |
| **ORDER-001** | Success | Order History (Customer) | Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng. Vui lòng chờ cửa hàng xem xét. |
| **ORDER-002** | Success | Order History (Customer) | Hủy đơn hàng thành công |
| **ORDER-003** | Success | Order History (Customer) | Đã sao chép mã vận đơn |
| **ORDER-004** | Success | Order History (Customer) | Đánh giá sản phẩm thành công |
| **ORDER-005** | Error | Order History (Customer) | Hủy đơn hàng thất bại |
| **ORDER-006** | Error | Order History (Customer) | Gửi yêu cầu hủy đơn hàng thất bại |
| **ORDER-007** | Error | Order History (Customer) | Không thể sao chép |
| **ORDER-008** | Error | Order History (Customer) | Tải media thất bại, vui lòng thử lại |
| **ORDER-009** | Info | Order History (Customer) | Bạn đã đánh giá sản phẩm này rồi. |
| **ORDER-010** | Info | Order History (Customer) | Sản phẩm trong đơn hàng này đã được đánh giá. |
| **ORDER-011** | Warning | Order History (Customer) | Vui lòng chọn sản phẩm để đánh giá |
| **ORDER-012** | Warning | Order History (Customer) | Vui lòng chọn số sao đánh giá |
| **ORDER-013** | Warning | Order History (Customer) | Vui lòng nhập nội dung đánh giá |
| **ORDER-014** | Success | Order Management (Seller) | Đơn hàng đã được chuyển sang trạng thái "Chờ lấy hàng" |
| **ORDER-015** | Success | Order Management (Seller) | Hủy đơn hàng GHN thành công! |
| **ORDER-016** | Success | Order Management (Seller) | Đang tải hóa đơn để in... |
| **ORDER-017** | Success | Order Management (Seller) | Đã mở cửa sổ in hóa đơn |
| **ORDER-018** | Success | Order Management (Seller) | Đã chấp nhận yêu cầu hủy đơn hàng và hoàn tiền |
| **ORDER-019** | Success | Order Management (Seller) | Đã từ chối yêu cầu hủy đơn hàng |
| **ORDER-020** | Error | Order Management (Seller) | Không thể chuẩn bị đơn hàng |
| **ORDER-021** | Error | Order Management (Seller) | Vui lòng nhập mã đơn hàng GHN |
| **ORDER-022** | Error | Order Management (Seller) | Không thể lấy print token |
| **ORDER-023** | Error | Order Management (Seller) | Không thể in hóa đơn. Vui lòng thử lại. |
| **ORDER-024** | Error | Order Management (Seller) | Không thể chấp nhận yêu cầu hủy đơn hàng |
| **ORDER-025** | Error | Order Management (Seller) | Không thể từ chối yêu cầu hủy đơn hàng |
| **PRODUCT-001** | Success | Product Creation/Update (Seller) | Đã tải lại địa chỉ kho mặc định |
| **PRODUCT-002** | Success | Product Creation/Update (Seller) | Cập nhật sản phẩm thành công! Đang quay lại trang quản lý... |
| **PRODUCT-003** | Success | Product Creation/Update (Seller) | Tạo sản phẩm thành công! Đang chuyển đến trang quản lý... |
| **PRODUCT-004** | Error | Product Creation/Update (Seller) | Không thể tải danh mục |
| **PRODUCT-005** | Error | Product Creation/Update (Seller) | Không tìm thấy địa chỉ mặc định của cửa hàng |
| **PRODUCT-006** | Error | Product Creation/Update (Seller) | Không tìm thấy tỉnh/thành phố tương ứng |
| **PRODUCT-007** | Error | Product Creation/Update (Seller) | Không thể tải lại địa chỉ kho |
| **PRODUCT-008** | Error | Product Creation/Update (Seller) | Vui lòng chọn tỉnh/thành phố trước |
| **PRODUCT-009** | Error | Product Creation/Update (Seller) | Vui lòng chọn quận/huyện trước |
| **PRODUCT-010** | Error | Product Creation/Update (Seller) | Tối đa 2 phân loại hàng |
| **PRODUCT-011** | Error | Product Creation/Update (Seller) | Upload ảnh thất bại |
| **PRODUCT-012** | Error | Product Creation/Update (Seller) | {count} ảnh bị trùng, xin vui lòng xem lại: {list}... |
| **PRODUCT-013** | Error | Product Creation/Update (Seller) | Bạn chỉ có thể tải lên không quá 9 files ảnh. {count} ảnh cuối đã bị loại bỏ. |
| **PRODUCT-014** | Error | Product Creation/Update (Seller) | Vui lòng nhập đầy đủ thông tin chung bắt buộc |
| **PRODUCT-015** | Error | Product Creation/Update (Seller) | SKU (Mã sản phẩm) là bắt buộc. Vui lòng nhập SKU cho sản phẩm. |
| **PRODUCT-016** | Error | Product Creation/Update (Seller) | Vui lòng điền thông tin bắt buộc, thêm ít nhất 1 ảnh và nhập đầy đủ giá, SKU, tồn kho |
| **PRODUCT-017** | Error | Product Creation/Update (Seller) | Hãy tạo địa chỉ cửa hàng trước |
| **PRODUCT-018** | Success | Product Management (Seller) | Đã ẩn sản phẩm thành công |
| **PRODUCT-019** | Success | Product Management (Seller) | Đã hiển thị sản phẩm thành công |
| **PRODUCT-020** | Error | Product Management (Seller) | Không thể tải danh sách sản phẩm |
| **PRODUCT-021** | Error | Product Management (Seller) | Không thể ẩn/hiển thị sản phẩm |
| **PRODUCT-022** | Success | Product Management (Admin) | Đã duyệt {count} sản phẩm thành công |
| **PRODUCT-023** | Success | Product Management (Admin) | Đã từ chối {count} sản phẩm thành công |
| **PRODUCT-024** | Warning | Product Management (Admin) | Vui lòng nhập lý do từ chối |
| **RETURN-001** | Success | Return Request (Customer) | Đã tải lên {count} hình ảnh |
| **RETURN-002** | Success | Return Request (Customer) | Đã tải lên video thành công |
| **RETURN-003** | Success | Return Request (Customer) | Đã gửi yêu cầu hoàn trả sản phẩm |
| **RETURN-004** | Error | Return Request (Customer) | Không thể tải lên hình ảnh |
| **RETURN-005** | Error | Return Request (Customer) | Chỉ hỗ trợ định dạng video |
| **RETURN-006** | Error | Return Request (Customer) | Dung lượng video không được vượt quá 30MB |
| **RETURN-007** | Error | Return Request (Customer) | Không thể tải lên video |
| **RETURN-008** | Error | Return Request (Customer) | Không thể gửi yêu cầu hoàn trả |
| **RETURN-009** | Warning | Return Request (Customer) | Vui lòng chọn sản phẩm cần hoàn trả |
| **RETURN-010** | Warning | Return Request (Customer) | Vui lòng nhập lý do hoàn trả |
| **RETURN-011** | Success | Return Packing (Customer) | Xác nhận đóng gói thành công đơn hoàn trả. Phí vận chuyển: {amount} |
| **RETURN-012** | Success | Return Packing (Customer) | Xác nhận đóng gói thành công đơn hoàn trả. |
| **RETURN-013** | Error | Return Packing (Customer) | Không thể tự động lấy địa chỉ mặc định. Vui lòng kiểm tra lại. |
| **RETURN-014** | Error | Return Packing (Customer) | Không tìm thấy thông tin yêu cầu hoàn trả. |
| **RETURN-015** | Error | Return Packing (Customer) | Không thể xác nhận đóng gói đơn hoàn trả |
| **RETURN-016** | Success | Return Management (Seller) | Đã duyệt yêu cầu hoàn trả |
| **RETURN-017** | Success | Return Management (Seller) | Đã từ chối yêu cầu hoàn trả |
| **RETURN-018** | Success | Return Management (Seller) | Đã tạo đơn GHN thành công. Mã đơn: {code} |
| **RETURN-019** | Success | Return Management (Seller) | Đã xác nhận ca lấy hàng thành công |
| **RETURN-020** | Success | Return Management (Seller) | Đã gửi yêu cầu hủy đơn GHN |
| **RETURN-021** | Success | Return Management (Seller) | Hoàn tiền thành công. Khách không cần gửi lại hàng. |
| **RETURN-022** | Error | Return Management (Seller) | Không thể duyệt yêu cầu hoàn trả |
| **RETURN-023** | Error | Return Management (Seller) | Không tìm thấy thông tin yêu cầu hoàn trả. |
| **RETURN-024** | Error | Return Management (Seller) | Không thể từ chối yêu cầu hoàn trả |
| **RETURN-025** | Error | Return Management (Seller) | Không thể tạo đơn GHN |
| **RETURN-026** | Error | Return Management (Seller) | Vui lòng nhập mã đơn hàng GHN |
| **RETURN-027** | Error | Return Management (Seller) | Không thể hủy đơn GHN |
| **RETURN-028** | Error | Return Management (Seller) | Có lỗi xảy ra khi hoàn tiền. Vui lòng thử lại. |
| **RETURN-029** | Warning | Return Management (Seller) | Vui lòng nhập lý do từ chối |
| **CHAT-001** | Error | AI Chat Agent | Xin lỗi, tôi không thể xử lý câu hỏi này. Vui lòng thử lại với câu hỏi khác. |
| **CHAT-002** | Error | AI Chat Agent | Hết dung lượng hỏi AI rồi nha bạn! Hãy quay lại sau 1 thời gian nữa nha. Xin lỗi vì sự bất tiện này :( |
| **CHAT-003** | Error | AI Chat Agent | Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. |
| **CHAT-004** | Info | AI Chat Agent | Vui lòng đăng nhập để sử dụng Chat Agent |
| **CHAT-005** | Error | Store Chat (Customer) | Vui lòng đăng nhập để chat với cửa hàng. |
| **CHAT-006** | Error | Store Chat (Customer) | Không tìm thấy thông tin cửa hàng. |
| **CHAT-007** | Error | Store Chat (Customer) | Không thể tải file lên. Vui lòng thử lại. |
| **CHAT-008** | Error | Store Chat (Customer) | Vui lòng chọn file ảnh hợp lệ |
| **CHAT-009** | Error | Store Chat (Customer) | Vui lòng chọn file video hợp lệ (MP4, WebM, OGG, MOV, AVI) |
| **CHAT-010** | Error | Store Chat (Customer) | Dung lượng video không được vượt quá 30MB |
| **CHAT-011** | Error | Store Chat (Customer) | Chỉ có thể gửi ảnh/video khi chat với cửa hàng |
| **CHAT-012** | Error | Store Chat (Customer) | Video "{name}" có dung lượng quá lớn (tối đa 30MB) |
| **CHAT-013** | Error | Store Chat (Customer) | File "{name}" không phải là ảnh hoặc video hợp lệ. |
| **CHAT-014** | Info | Store Chat (Customer) | Vui lòng chọn một cửa hàng để bắt đầu chat. |
| **CHAT-015** | Error | Store Chat (Seller) | Không thể tải file lên. Vui lòng thử lại. |
| **CHAT-016** | Error | Store Chat (Seller) | Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. |
| **CHAT-017** | Error | Store Chat (Seller) | Vui lòng chọn file ảnh hợp lệ |
| **CHAT-018** | Error | Store Chat (Seller) | Vui lòng chọn file video hợp lệ (MP4, WebM, OGG, MOV, AVI) |
| **CHAT-019** | Error | Store Chat (Seller) | Dung lượng video không được vượt quá 30MB |
| **CHAT-020** | Error | Store Chat (Seller) | Video "{name}" có dung lượng quá lớn (tối đa 30MB) |
| **CHAT-021** | Error | Store Chat (Seller) | Chỉ hỗ trợ định dạng video MP4. File "{name}" không được hỗ trợ. |
| **CHAT-022** | Error | Store Chat (Seller) | File "{name}" không phải là ảnh hoặc video hợp lệ. |
| **PROFILE-001** | Success | Update Profile | Upload ảnh đại diện thành công |
| **PROFILE-002** | Success | Update Profile | Cập nhật thông tin thành công |
| **PROFILE-003** | Error | Update Profile | Vui lòng chọn file hình ảnh hợp lệ |
| **PROFILE-004** | Error | Update Profile | Kích thước file không được vượt quá 5MB |
| **PROFILE-005** | Error | Update Profile | Không thể upload ảnh. Vui lòng thử lại. |
| **PROFILE-006** | Error | Update Profile | Cập nhật thất bại |
| **STORE-001** | Success | Setup Store | Đã làm mới thông tin cửa hàng |
| **STORE-002** | Success | Setup Store | Đã ngưng bán cửa hàng thành công |
| **STORE-003** | Success | Setup Store | Đã kích hoạt cửa hàng thành công |
| **STORE-004** | Error | Setup Store | Không tìm thấy ID cửa hàng |
| **STORE-005** | Error | Setup Store | Không thể tải thông tin cửa hàng. Vui lòng thử lại sau. |
| **STORE-006** | Error | Setup Store | Vui lòng nhập lý do ngưng bán |
| **STORE-007** | Error | Setup Store | Không thể ngưng bán cửa hàng. Vui lòng thử lại sau. |
| **STORE-008** | Error | Setup Store | Không thể kích hoạt cửa hàng. Vui lòng thử lại sau. |
| **STORE-009** | Success | Store Profile | Tải logo thành công! |
| **STORE-010** | Success | Store Profile | Tải ảnh bìa thành công! |
| **STORE-011** | Success | Store Profile | Cập nhật hồ sơ shop thành công! |
| **STORE-012** | Error | Store Profile | Không tìm thấy thông tin cửa hàng |
| **STORE-013** | Error | Store Profile | Không tìm thấy ID cửa hàng |
| **STORE-014** | Error | Store Profile | Không thể tải thông tin cửa hàng |
| **STORE-015** | Error | Store Profile | Không thể cắt ảnh |
| **STORE-016** | Error | Store Profile | Tải logo thất bại |
| **STORE-017** | Error | Store Profile | Tải ảnh bìa thất bại |
| **STORE-018** | Error | Store Profile | Cập nhật hồ sơ shop thất bại |
| **ADMIN-001** | Success | Category Management | Xóa danh mục thành công |
| **ADMIN-002** | Success | Category Management | Cập nhật danh mục thành công |
| **ADMIN-003** | Error | Category Management | Không thể tải chi tiết danh mục |
| **ADMIN-004** | Error | Category Management | Xóa danh mục thất bại |
| **ADMIN-005** | Error | Category Management | Cập nhật danh mục thất bại |
| **ADMIN-006** | Success | Platform Fee Management | Cập nhật phí nền tảng thành công |
| **ADMIN-007** | Success | Platform Fee Management | Tạo phí nền tảng thành công |
| **ADMIN-008** | Error | Platform Fee Management | Không thể cập nhật phí nền tảng |
| **ADMIN-009** | Error | Platform Fee Management | Không thể tạo phí nền tảng |
| **ADMIN-010** | Error | Payout Management | Lỗi tải dữ liệu |
| **ADMIN-011** | Error | Payout Management | Vui lòng chọn hoặc nhập ID cửa hàng |
| **ADMIN-012** | Error | Payout Management | Vui lòng chọn cửa hàng |
| **ADMIN-013** | Error | Payout Management | Lỗi tạo bill |
| **ADMIN-014** | Error | Payout Management | Lỗi tạo bill tự động |
| **ADMIN-015** | Success | Policy Management | Ảnh icon đã được tải lên thành công! |
| **ADMIN-016** | Success | Policy Management | Xóa danh mục thành công! |
| **ADMIN-017** | Success | Policy Management | Cập nhật danh mục thành công! |
| **ADMIN-018** | Success | Policy Management | Tạo danh mục thành công! |
| **ADMIN-019** | Success | Policy Management | Xóa mục thành công! |
| **ADMIN-020** | Success | Policy Management | Cập nhật mục thành công! |
| **ADMIN-021** | Success | Policy Management | Tạo mục thành công! |
| **ADMIN-022** | Error | Policy Management | Tải ảnh thất bại. Vui lòng thử lại. |
| **ADMIN-023** | Error | Policy Management | Không thể xóa danh mục. Vui lòng thử lại. |
| **ADMIN-024** | Error | Policy Management | Không thể cập nhật danh mục |
| **ADMIN-025** | Error | Policy Management | Không thể tạo danh mục |
| **ADMIN-026** | Error | Policy Management | Không thể xóa mục. Vui lòng thử lại. |
| **ADMIN-027** | Error | Policy Management | Không thể cập nhật mục |
| **ADMIN-028** | Error | Policy Management | Không thể tạo mục |
| **REVIEW-001** | Success | Product Review (Customer) | Cập nhật đánh giá thành công |
| **REVIEW-002** | Success | Product Review (Customer) | Xoá đánh giá thành công |
| **REVIEW-003** | Error | Product Review (Customer) | Không thể cập nhật đánh giá |
| **REVIEW-004** | Error | Product Review (Customer) | Không thể xoá đánh giá |
| **REVIEW-005** | Success | Reply Review (Seller) | Gửi phản hồi thành công |
| **REVIEW-006** | Error | Reply Review (Seller) | Không thể gửi phản hồi |
| **NOTIF-001** | Success | Seller Notifications | Đã đánh dấu đã đọc |
| **NOTIF-002** | Success | Seller Notifications | Đã đánh dấu {count} thông báo đã đọc |
| **NOTIF-003** | Error | Seller Notifications | Không thể tải thông báo. Vui lòng thử lại. |
| **NOTIF-004** | Error | Seller Notifications | Không thể xử lý thông báo. Vui lòng thử lại. |
| **NOTIF-005** | Error | Seller Notifications | Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại. |
| **NOTIF-006** | Info | Seller Notifications | Tất cả thông báo đã được đánh dấu đã đọc |
| **STAFF-001** | Success | Staff Order Management | Đã đánh dấu sẵn sàng giao hàng thành công |
| **STAFF-002** | Success | Staff Order Management | Đã đánh dấu đang giao hàng thành công |
| **STAFF-003** | Error | Staff Order Management | Không thể đánh dấu sẵn sàng giao hàng |
| **STAFF-004** | Error | Staff Order Management | Không thể đánh dấu đang giao hàng |
| **PICKUP-001** | Error | Pickup Shift | Không thể tải danh sách ca lấy hàng |
| **ERR-TRANS-001** | Error | Error Translation | Tài khoản hoặc mật khẩu không đúng |
| **ERR-TRANS-002** | Error | Error Translation | Xác thực thất bại |
| **ERR-TRANS-003** | Error | Error Translation | Không có quyền truy cập |
| **ERR-TRANS-004** | Error | Error Translation | Truy cập bị từ chối |
| **ERR-TRANS-005** | Error | Error Translation | Không tìm thấy tài khoản |
| **ERR-TRANS-006** | Error | Error Translation | Không tìm thấy người dùng |
| **ERR-TRANS-007** | Error | Error Translation | Tài khoản đã bị khóa |
| **ERR-TRANS-008** | Error | Error Translation | Tài khoản đã bị vô hiệu hóa |
| **ERR-TRANS-009** | Error | Error Translation | Tài khoản đã bị tạm ngưng |
| **ERR-TRANS-010** | Error | Error Translation | Phiên đăng nhập đã hết hạn |
| **ERR-TRANS-011** | Error | Error Translation | Mã xác thực không hợp lệ |
| **ERR-TRANS-012** | Error | Error Translation | Không tìm thấy mã xác thực |
| **ERR-TRANS-013** | Error | Error Translation | Lỗi kết nối mạng |
| **ERR-TRANS-014** | Error | Error Translation | Hết thời gian kết nối |
| **ERR-TRANS-015** | Error | Error Translation | Lỗi máy chủ |
| **ERR-TRANS-016** | Error | Error Translation | Dịch vụ tạm thời không khả dụng |
| **ERR-TRANS-017** | Error | Error Translation | Vui lòng nhập email |
| **ERR-TRANS-018** | Error | Error Translation | Vui lòng nhập mật khẩu |
| **ERR-TRANS-019** | Error | Error Translation | Định dạng email không hợp lệ |
| **ERR-TRANS-020** | Error | Error Translation | Mật khẩu quá ngắn |
| **ERR-TRANS-021** | Error | Error Translation | Không tìm thấy cửa hàng |
| **ERR-TRANS-022** | Error | Error Translation | Mã cửa hàng không hợp lệ |
| **ERR-TRANS-023** | Error | Error Translation | Cửa hàng chưa được kích hoạt |
| **ERR-TRANS-024** | Error | Error Translation | Yêu cầu không hợp lệ (400) |
| **ERR-TRANS-025** | Error | Error Translation | Tài khoản hoặc mật khẩu không đúng (401) |
| **ERR-TRANS-026** | Error | Error Translation | Không có quyền truy cập (403) |
| **ERR-TRANS-027** | Error | Error Translation | Không tìm thấy tài nguyên (404) |
| **ERR-TRANS-028** | Error | Error Translation | Hết thời gian yêu cầu (408) |
| **ERR-TRANS-029** | Error | Error Translation | Quá nhiều yêu cầu, vui lòng thử lại sau (429) |
| **ERR-TRANS-030** | Error | Error Translation | Lỗi máy chủ nội bộ (500) |
| **ERR-TRANS-031** | Error | Error Translation | Lỗi cổng kết nối (502) |
| **ERR-TRANS-032** | Error | Error Translation | Dịch vụ tạm thời không khả dụng (503) |
| **ERR-TRANS-033** | Error | Error Translation | Hết thời gian chờ cổng kết nối (504) |
| **CONFIRM-001** | Confirmation | Category Management (Admin) | Bạn có chắc chắn muốn xóa danh mục này? |
| **CONFIRM-002** | Confirmation | Product Management (Seller) | Bạn có chắc chắn muốn ẩn/hiển thị sản phẩm này? |
| **CONFIRM-003** | Confirmation | Payout Management (Admin) | Bạn có chắc chắn muốn tạo bill cho cửa hàng này? |
| **CONFIRM-004** | Confirmation | Payout Management (Admin) | Bạn có chắc chắn muốn tạo bill tự động cho tất cả cửa hàng? |
| **CONFIRM-005** | Confirmation | Policy Management (Admin) | Bạn có chắc chắn muốn xóa danh mục này? |
| **CONFIRM-006** | Confirmation | Policy Management (Admin) | Bạn có chắc chắn muốn xóa mục này? |
| **CONFIRM-007** | Confirmation | Chat Agent | Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện? |
| **ALERT-001** | Alert | Store Chat (Customer) | Chỉ có thể gửi ảnh/video khi chat với cửa hàng |
| **ALERT-002** | Alert | Store Chat (Customer) | Không thể tải file lên. Vui lòng thử lại. |
| **ALERT-003** | Alert | Store Chat (Customer) | Vui lòng chọn file ảnh hợp lệ |
| **ALERT-004** | Alert | Store Chat (Customer) | Vui lòng chọn file video hợp lệ (MP4, WebM, OGG, MOV, AVI) |
| **ALERT-005** | Alert | Store Chat (Customer) | Dung lượng video không được vượt quá 30MB |
| **ALERT-006** | Alert | Store Chat (Customer) | Video "{name}" có dung lượng quá lớn (tối đa 30MB) |
| **ALERT-007** | Alert | Store Chat (Customer) | File "{name}" không phải là ảnh hoặc video hợp lệ. |
| **ALERT-008** | Alert | Store Chat (Seller) | Không thể tải file lên. Vui lòng thử lại. |
| **ALERT-009** | Alert | Store Chat (Seller) | Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. |
| **ALERT-010** | Alert | Store Chat (Seller) | Vui lòng chọn file ảnh hợp lệ |
| **ALERT-011** | Alert | Store Chat (Seller) | Vui lòng chọn file video hợp lệ (MP4, WebM, OGG, MOV, AVI) |
| **ALERT-012** | Alert | Store Chat (Seller) | Dung lượng video không được vượt quá 30MB |
| **ALERT-013** | Alert | Store Chat (Seller) | Video "{name}" có dung lượng quá lớn (tối đa 30MB) |
| **ALERT-014** | Alert | Store Chat (Seller) | Chỉ hỗ trợ định dạng video MP4. File "{name}" không được hỗ trợ. |
| **ALERT-015** | Alert | Store Chat (Seller) | File "{name}" không phải là ảnh hoặc video hợp lệ. |
| **ALERT-016** | Alert | TinyMCE Editor | Upload ảnh thất bại! |
| **ALERT-017** | Alert | TinyMCE Editor | Upload ảnh thất bại: {error} |
| **ALERT-018** | Alert | Image/Video Section | Chỉ hỗ trợ định dạng video MP4 |
| **ALERT-019** | Alert | Image/Video Section | Dung lượng video không được vượt quá 30MB |
| **LOADING-001** | Loading | Customer Login | Đang đăng nhập... |
| **LOADING-002** | Loading | Customer Register | Đang đăng ký... |
| **LOADING-003** | Loading | Shopping Cart | Đang tải giỏ hàng... |
| **LOADING-004** | Loading | Checkout | Đang tải dữ liệu thanh toán... |
| **LOADING-005** | Loading | Checkout | Đang gửi đơn hàng... |
| **LOADING-006** | Loading | Store Profile | Đang tải logo... |
| **LOADING-007** | Loading | Store Profile | Đang tải ảnh bìa... |
| **LOADING-008** | Loading | Product Review | Đang xoá đánh giá... |
| **LOADING-009** | Loading | Order Management (Seller) | Đang tải hóa đơn để in... |
| **LOADING-010** | Loading | Product Creation | Đang tải danh mục... |
| **LOADING-011** | Loading | Address Form | Đang tải tỉnh/thành... |
| **LOADING-012** | Loading | Address Form | Đang tải quận/huyện... |
| **LOADING-013** | Loading | Address Form | Đang tải phường/xã... |
| **LOADING-014** | Loading | Address Form | Đang tải địa chỉ... |
| **LOADING-015** | Loading | Address Form | Đang lưu... |
| **LOADING-016** | Loading | General | Đang xử lý... |
| **STATUS-001** | Status | Order Status | Chờ xác nhận (PENDING) |
| **STATUS-002** | Status | Order Status | Đã xác nhận (CONFIRMED) |
| **STATUS-003** | Status | Order Status | Đang chuẩn bị (PROCESSING) |
| **STATUS-004** | Status | Order Status | Đang đóng gói (PACKING) |
| **STATUS-005** | Status | Order Status | Chờ lấy hàng (READY_FOR_PICKUP) |
| **STATUS-006** | Status | Order Status | Đang giao hàng (SHIPPING) |
| **STATUS-007** | Status | Order Status | Đã giao hàng (DELIVERED) |
| **STATUS-008** | Status | Order Status | Hoàn thành (COMPLETED) |
| **STATUS-009** | Status | Order Status | Đã hủy (CANCELLED) |
| **STATUS-010** | Status | Order Status | Đã trả hàng (RETURNED) |
| **STATUS-011** | Status | Order Status | Đã hoàn tiền (REFUNDED) |
| **STATUS-012** | Status | Return Status | Chờ duyệt (PENDING) |
| **STATUS-013** | Status | Return Status | Đã duyệt (APPROVED) |
| **STATUS-014** | Status | Return Status | Đã từ chối (REJECTED) |
| **STATUS-015** | Status | Return Status | Đang vận chuyển (SHIPPING) |
| **STATUS-016** | Status | Return Status | Đã hoàn tiền (REFUNDED) |
| **STATUS-017** | Status | Return Status | Tự động hoàn tiền (AUTO_REFUNDED) |
| **STATUS-018** | Status | Return Status | Đã hủy (CANCELLED) |
| **STATUS-019** | Status | Return Status | Khiếu nại (DISPUTE) |
| **STATUS-020** | Status | Wallet Status | Đang hoạt động (ACTIVE) |
| **STATUS-021** | Status | Wallet Status | Không hoạt động (INACTIVE) |
| **STATUS-022** | Status | Wallet Status | Đã tạm khóa (SUSPENDED) |
| **STATUS-023** | Status | Transaction Status | Thành công (SUCCESS) |
| **STATUS-024** | Status | Transaction Status | Hoàn thành (COMPLETED) |
| **STATUS-025** | Status | Transaction Status | Đang xử lý (PENDING) |
| **STATUS-026** | Status | Transaction Status | Thất bại (FAILED) |
| **STATUS-027** | Status | Transaction Status | Đã hủy (CANCELLED) |
| **STATUS-028** | Status | Transaction Status | Đang xử lý (PROCESSING) |
| **VALID-001** | Validation | Email Validation | Email không hợp lệ |
| **VALID-002** | Validation | Email Validation | Vui lòng nhập email |
| **VALID-003** | Validation | Phone Validation | Số điện thoại không hợp lệ |
| **VALID-004** | Validation | Phone Validation | Vui lòng nhập số điện thoại |
| **VALID-005** | Validation | Password Validation | Mật khẩu phải có ít nhất 6 ký tự |
| **VALID-006** | Validation | Password Validation | Mật khẩu quá ngắn |
| **VALID-007** | Validation | Password Validation | Mật khẩu xác nhận không khớp |
| **VALID-008** | Validation | Name Validation | Tên phải có ít nhất 2 ký tự |
| **VALID-009** | Validation | Address Validation | Vui lòng điền đầy đủ thông tin địa chỉ |
| **VALID-010** | Validation | Address Validation | Thiếu mã địa lý: vui lòng chọn Tỉnh/Quận/Phường hợp lệ |
| **VALID-011** | Validation | Product Validation | SKU (Mã sản phẩm) là bắt buộc. Vui lòng nhập SKU cho sản phẩm. |
| **VALID-012** | Validation | Product Validation | Vui lòng điền thông tin bắt buộc, thêm ít nhất 1 ảnh và nhập đầy đủ giá, SKU, tồn kho |
| **VALID-013** | Validation | Product Validation | Vui lòng nhập đầy đủ thông tin chung bắt buộc |
| **VALID-014** | Validation | File Validation | Vui lòng chọn file hình ảnh hợp lệ |
| **VALID-015** | Validation | File Validation | Kích thước file không được vượt quá 5MB |
| **VALID-016** | Validation | File Validation | Dung lượng video không được vượt quá 30MB |
| **VALID-017** | Validation | File Validation | Bạn chỉ có thể tải lên không quá 9 files ảnh |
| **VALID-018** | Validation | File Validation | Tối đa 2 phân loại hàng |
| **EMPTY-001** | Empty State | Address Management | Chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới. |
| **EMPTY-002** | Empty State | Shopping Cart | Giỏ hàng trống. |
| **EMPTY-003** | Empty State | Chat System | Chưa có cuộc trò chuyện nào |
| **EMPTY-004** | Empty State | Wallet | Chưa có giao dịch |
| **EMPTY-005** | Empty State | Wallet | Không có thông tin ví |
| **EMPTY-006** | Empty State | Profile | Không tìm thấy thông tin khách hàng |
| **EMPTY-007** | Empty State | Product | Không tìm thấy sản phẩm |
| **EMPTY-008** | Empty State | Order | Không tìm thấy đơn hàng |
| **PLACEHOLDER-001** | Placeholder | Chat Input | Nhập câu hỏi của bạn... |
| **PLACEHOLDER-002** | Placeholder | Voucher Input | Nhập mã voucher |
| **PLACEHOLDER-003** | Placeholder | Email Input | Nhập email của bạn |
| **PLACEHOLDER-004** | Placeholder | Password Input | Nhập mật khẩu |
| **PLACEHOLDER-005** | Placeholder | Search Input | Tìm kiếm tai nghe, loa, micro... |
| **WELCOME-001** | Welcome | Login Success | Chào mừng {userName} quay trở lại! |
| **SPECIAL-001** | Error | AI Chat Quota | Hết dung lượng hỏi AI rồi nha bạn! Hãy quay lại sau 1 thời gian nữa nha. Xin lỗi vì sự bất tiện này :( |
| **SPECIAL-002** | Error | Duplicate Images | {count} ảnh bị trùng, xin vui lòng xem lại: {list}... |
| **SPECIAL-003** | Info | Store KYC Status | Bạn chưa hoàn thành thông tin KYC. Vui lòng hoàn tất để bắt đầu bán hàng. |
| **SPECIAL-004** | Info | Store KYC Status | Yêu cầu KYC của bạn đang được xét duyệt. Vui lòng chờ 1-3 ngày làm việc. |
| **SPECIAL-005** | Info | Store KYC Status | Yêu cầu KYC của bạn đã bị từ chối. Vui lòng cập nhật lại thông tin và gửi lại. |
| **SPECIAL-006** | Info | Store KYC Status | Cửa hàng của bạn đã được kích hoạt. Chào mừng bạn đến với AudioShop! |
| **SPECIAL-007** | Error | Session Expired | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. |
| **SPECIAL-008** | Error | Session Expired | Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại. |

---

## Tổng hợp theo Message Type

### Success Messages (80 messages)
- AUTH-012, AUTH-013, AUTH-022, CART-001, CART-002, CHECKOUT-001, CHECKOUT-002, ADDRESS-001 đến ADDRESS-004, ORDER-001 đến ORDER-004, ORDER-014 đến ORDER-019, PRODUCT-001 đến PRODUCT-003, PRODUCT-018, PRODUCT-019, PRODUCT-022, PRODUCT-023, RETURN-001 đến RETURN-003, RETURN-011, RETURN-012, RETURN-016 đến RETURN-021, PROFILE-001, PROFILE-002, STORE-001 đến STORE-003, STORE-009 đến STORE-011, ADMIN-001, ADMIN-002, ADMIN-006, ADMIN-007, ADMIN-015 đến ADMIN-021, REVIEW-001, REVIEW-002, REVIEW-005, NOTIF-001, NOTIF-002, STAFF-001, STAFF-002

### Error Messages (200+ messages)
- AUTH-001 đến AUTH-011, AUTH-014 đến AUTH-021, AUTH-023 đến AUTH-030, CART-003 đến CART-008, CHECKOUT-003 đến CHECKOUT-017, ADDRESS-005 đến ADDRESS-008, VOUCHER-001 đến VOUCHER-005, ORDER-005 đến ORDER-008, ORDER-020 đến ORDER-025, PRODUCT-004 đến PRODUCT-017, PRODUCT-020, PRODUCT-021, RETURN-004 đến RETURN-008, RETURN-013 đến RETURN-015, RETURN-022 đến RETURN-028, CHAT-001 đến CHAT-003, CHAT-005 đến CHAT-013, CHAT-015 đến CHAT-022, PROFILE-003 đến PROFILE-006, STORE-004 đến STORE-008, STORE-012 đến STORE-018, ADMIN-003 đến ADMIN-005, ADMIN-008, ADMIN-009, ADMIN-010 đến ADMIN-014, ADMIN-022 đến ADMIN-028, REVIEW-003, REVIEW-004, REVIEW-006, NOTIF-003 đến NOTIF-005, STAFF-003, STAFF-004, PICKUP-001, ERR-TRANS-001 đến ERR-TRANS-033, ALERT-001 đến ALERT-019, SPECIAL-001, SPECIAL-002, SPECIAL-007, SPECIAL-008

### Warning Messages (15 messages)
- CART-009 đến CART-011, ORDER-011 đến ORDER-013, RETURN-009, RETURN-010, RETURN-029, PRODUCT-024

### Info Messages (10 messages)
- ORDER-009, ORDER-010, CHAT-004, CHAT-014, NOTIF-006, SPECIAL-003 đến SPECIAL-006

### Loading Messages (20 messages)
- LOADING-001 đến LOADING-016

### Confirmation Dialogs (7 messages)
- CONFIRM-001 đến CONFIRM-007

### Alert Messages (19 messages)
- ALERT-001 đến ALERT-019

### Status Messages (28 messages)
- STATUS-001 đến STATUS-028

### Validation Messages (18 messages)
- VALID-001 đến VALID-018

### Empty States (8 messages)
- EMPTY-001 đến EMPTY-008

### Placeholder Messages (5 messages)
- PLACEHOLDER-001 đến PLACEHOLDER-005

### Welcome Messages (1 message)
- WELCOME-001

### Special Cases (8 messages)
- SPECIAL-001 đến SPECIAL-008

---

## Tổng hợp theo Context/Module

### Authentication & Authorization (30 messages)
- AUTH-001 đến AUTH-030

### Shopping Cart & Checkout (50 messages)
- CART-001 đến CART-011, CHECKOUT-001 đến CHECKOUT-017, ADDRESS-001 đến ADDRESS-008, VOUCHER-001 đến VOUCHER-005, LOADING-003, LOADING-004, LOADING-005, LOADING-011 đến LOADING-015, EMPTY-002, PLACEHOLDER-002

### Order Management (40 messages)
- ORDER-001 đến ORDER-025, LOADING-009, STATUS-001 đến STATUS-011, EMPTY-008

### Product Management (35 messages)
- PRODUCT-001 đến PRODUCT-024, LOADING-010, VALID-011 đến VALID-013, VALID-017, VALID-018, EMPTY-007

### Return & Refund (30 messages)
- RETURN-001 đến RETURN-029, STATUS-012 đến STATUS-019

### Chat System (25 messages)
- CHAT-001 đến CHAT-022, EMPTY-003, PLACEHOLDER-001

### Profile Management (15 messages)
- PROFILE-001 đến PROFILE-006, EMPTY-006

### Store Management (20 messages)
- STORE-001 đến STORE-018, LOADING-006, LOADING-007, SPECIAL-003 đến SPECIAL-006

### Admin Management (40 messages)
- ADMIN-001 đến ADMIN-028, CONFIRM-001, CONFIRM-003, CONFIRM-004, CONFIRM-005, CONFIRM-006

### Review Management (10 messages)
- REVIEW-001 đến REVIEW-006, LOADING-008

### Notification Management (10 messages)
- NOTIF-001 đến NOTIF-006

### Staff Management (5 messages)
- STAFF-001 đến STAFF-004, PICKUP-001

### Error Translation (33 messages)
- ERR-TRANS-001 đến ERR-TRANS-033

### Status Messages (28 messages)
- STATUS-001 đến STATUS-028

### Validation Messages (18 messages)
- VALID-001 đến VALID-018

### Empty States (8 messages)
- EMPTY-001 đến EMPTY-008

### Placeholder Messages (5 messages)
- PLACEHOLDER-001 đến PLACEHOLDER-005

### Welcome Messages (1 message)
- WELCOME-001

### Special Cases (8 messages)
- SPECIAL-001 đến SPECIAL-008

### Confirmation Dialogs (7 messages)
- CONFIRM-001 đến CONFIRM-007

### Alert Messages (19 messages)
- ALERT-001 đến ALERT-019

### Loading Messages (16 messages)
- LOADING-001 đến LOADING-016

---

## Notes & Best Practices

### Notification System
- Hệ thống sử dụng **centered popup notification** (`showCenterSuccess`, `showCenterError`) cho UX tốt hơn
- Tất cả notifications tự động đóng sau 3 giây (mặc định)
- Có thể tùy chỉnh duration cho từng notification

### Error Handling
- Tất cả error messages được dịch sang tiếng Việt thông qua `errorTranslation.ts`
- Error messages không tiết lộ thông tin nhạy cảm (ví dụ: không nói rõ email có tồn tại hay không)
- Generic error message: **"Đã xảy ra lỗi không xác định"** hoặc **"Có lỗi xảy ra, vui lòng thử lại"**

### Message Consistency
- Success messages thường kết thúc bằng **"thành công"**
- Error messages thường bắt đầu bằng **"Không thể"**, **"Vui lòng"**, hoặc **"Lỗi"**
- Warning messages thường bắt đầu bằng **"Vui lòng"**

### Internationalization
- Hệ thống hỗ trợ đa ngôn ngữ (Vietnamese & English) thông qua `LanguageContext`
- Các message trong `LanguageContext.tsx` được sử dụng cho các component chính
- Các message hardcoded trong components sẽ được migrate sang translation system trong tương lai

---

## Recommendations

1. **Centralize Messages:** Nên tập trung tất cả messages vào một file translation duy nhất
2. **Consistent Formatting:** Đảm bảo format nhất quán cho tất cả messages
3. **Error Codes:** Cân nhắc sử dụng error codes thay vì hardcoded messages
4. **Message Categories:** Phân loại messages rõ ràng để dễ maintain
5. **Documentation:** Cập nhật file này khi có message mới

---

**Last Updated:** 2025-01-XX  
**Total Messages Documented:** ~400+ messages  
**Total Message Codes:** 400+ codes
