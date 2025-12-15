# Use Case: Customer Change Password

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-CHANGE-PASSWORD  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng nhập)  
**Secondary Actors:** System

**Description:**  
Khách hàng đã đăng nhập có thể đổi mật khẩu tài khoản của mình bằng cách nhập mật khẩu hiện tại, mật khẩu mới, và xác nhận mật khẩu mới. Hệ thống sẽ xác thực mật khẩu hiện tại và cập nhật mật khẩu mới trong database.

**Trigger:**  
Khách hàng muốn đổi mật khẩu và truy cập tab "Đổi mật khẩu" trong trang profile.

**Preconditions:**
1. Khách hàng đã đăng nhập vào hệ thống (đã authenticated)
2. Khách hàng đang ở trang profile, tab "Đổi mật khẩu"
3. Khách hàng biết mật khẩu hiện tại của mình

**Postconditions:**
1. Mật khẩu mới được cập nhật thành công trong hệ thống
2. Mật khẩu mới được lưu vào database
3. Khách hàng có thể đăng nhập bằng mật khẩu mới
4. Form đổi mật khẩu được reset về trạng thái ban đầu

**Normal Flow:**
1. Khách hàng truy cập tab "Đổi mật khẩu" trong trang profile
2. Hệ thống hiển thị form đổi mật khẩu với 3 trường:
   - Mật khẩu hiện tại (bắt buộc)
   - Mật khẩu mới (bắt buộc)
   - Xác nhận mật khẩu mới (bắt buộc)
3. Khách hàng nhập mật khẩu hiện tại
4. Khách hàng nhập mật khẩu mới
5. Hệ thống hiển thị chỉ báo độ mạnh mật khẩu (password strength indicator) khi khách hàng nhập mật khẩu mới
6. Khách hàng nhập lại mật khẩu mới vào trường xác nhận
7. Khách hàng click nút "Đổi mật khẩu" để gửi form
8. Hệ thống thực hiện validation phía client:
   - Kiểm tra mật khẩu hiện tại đã được nhập
   - Kiểm tra mật khẩu hiện tại có đúng không
   - Kiểm tra mật khẩu mới đã được nhập
   - Kiểm tra mật khẩu mới có ít nhất 6 ký tự
   - Kiểm tra mật khẩu mới khác mật khẩu hiện tại
   - Kiểm tra xác nhận mật khẩu đã được nhập
   - Kiểm tra xác nhận mật khẩu khớp với mật khẩu mới
9. Nếu validation thành công, hệ thống gửi yêu cầu đổi mật khẩu đến server với mật khẩu hiện tại và mật khẩu mới
10. Server xác thực mật khẩu hiện tại: kiểm tra mật khẩu hiện tại có đúng không
11. Nếu mật khẩu hiện tại đúng, server cập nhật mật khẩu mới trong database
12. Server trả về thông báo thành công
13. Hệ thống reset form về trạng thái ban đầu (xóa tất cả các trường)
14. Hệ thống hiển thị thông báo thành công: "Đổi mật khẩu thành công!"
15. Thông báo thành công tự động biến mất sau 3 giây

**Alternative Flows:**
1. **Hiển thị/ẩn mật khẩu:** Khách hàng có thể click icon mắt để hiển thị hoặc ẩn mật khẩu trong các trường (mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu)
2. **Xem độ mạnh mật khẩu:** Khi khách hàng nhập mật khẩu mới, hệ thống tự động hiển thị chỉ báo độ mạnh mật khẩu (Rất yếu, Yếu, Trung bình, Mạnh, Rất mạnh) dựa trên độ dài và độ phức tạp

**Exceptions:**
1. **Mật khẩu hiện tại không được nhập:** Nếu mật khẩu hiện tại trống, hệ thống hiển thị lỗi: "Vui lòng nhập mật khẩu hiện tại"
2. **Mật khẩu hiện tại không đúng:** Nếu mật khẩu hiện tại không đúng, hệ thống hiển thị lỗi: "Mật khẩu hiện tại không đúng"
3. **Mật khẩu mới không được nhập:** Nếu mật khẩu mới trống, hệ thống hiển thị lỗi: "Vui lòng nhập mật khẩu mới"
4. **Mật khẩu mới quá ngắn:** Nếu mật khẩu mới < 6 ký tự, hệ thống hiển thị lỗi: "Mật khẩu mới phải có ít nhất 6 ký tự"
5. **Mật khẩu mới giống mật khẩu hiện tại:** Nếu mật khẩu mới giống mật khẩu hiện tại, hệ thống hiển thị lỗi: "Mật khẩu mới phải khác mật khẩu hiện tại"
6. **Xác nhận mật khẩu không được nhập:** Nếu xác nhận mật khẩu trống, hệ thống hiển thị lỗi: "Vui lòng xác nhận mật khẩu mới"
7. **Xác nhận mật khẩu không khớp:** Nếu xác nhận mật khẩu không khớp với mật khẩu mới, hệ thống hiển thị lỗi: "Mật khẩu xác nhận không khớp"
8. **Token hết hạn:** Nếu access token hết hạn, hệ thống tự động refresh token. Nếu refresh token cũng hết hạn, hệ thống chuyển hướng đến trang đăng nhập
9. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server khi gửi yêu cầu đổi mật khẩu, hệ thống hiển thị thông báo lỗi: "Có lỗi xảy ra, vui lòng thử lại" và log lỗi chi tiết
10. **Lỗi không xác định:** Hệ thống format và hiển thị thông báo lỗi từ server, khách hàng có thể thử lại hoặc liên hệ support

**Priority:** HIGH

**Business Rules:**
- BR-CHANGE-PWD-001: Mật khẩu hiện tại là bắt buộc và phải đúng
- BR-CHANGE-PWD-002: Mật khẩu mới phải có tối thiểu 6 ký tự
- BR-CHANGE-PWD-003: Mật khẩu mới phải khác mật khẩu hiện tại
- BR-CHANGE-PWD-004: Mật khẩu mới và xác nhận mật khẩu phải khớp nhau
- BR-CHANGE-PWD-005: Khách hàng chỉ có thể đổi mật khẩu của chính mình, không thể đổi mật khẩu của khách hàng khác
- BR-CHANGE-PWD-006: Sau khi đổi mật khẩu thành công, khách hàng phải sử dụng mật khẩu mới để đăng nhập
- BR-CHANGE-PWD-007: Hệ thống nên hiển thị chỉ báo độ mạnh mật khẩu để khuyến khích khách hàng tạo mật khẩu mạnh
- BR-CHANGE-PWD-008: Mật khẩu mới nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt để tăng độ bảo mật (khuyến nghị, không bắt buộc)
- BR-CHANGE-PWD-009: Sau khi đổi mật khẩu thành công, form phải được reset về trạng thái ban đầu

---

### English

**ID and Name:** UC-CUSTOMER-CHANGE-PASSWORD  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Logged-in customer)  
**Secondary Actors:** System

**Description:**  
A logged-in customer can change their account password by entering current password, new password, and confirming new password. The system will verify current password and update new password in database.

**Trigger:**  
Customer wants to change password and accesses "Change Password" tab in profile page.

**Preconditions:**
1. Customer is logged into the system (authenticated)
2. Customer is on profile page, "Change Password" tab
3. Customer knows their current password

**Postconditions:**
1. New password is successfully updated in the system
2. New password is saved to database
3. Customer can login with new password
4. Change password form is reset to initial state

**Normal Flow:**
1. Customer accesses "Change Password" tab in profile page
2. System displays change password form with 3 fields:
   - Current password (required)
   - New password (required)
   - Confirm new password (required)
3. Customer enters current password
4. Customer enters new password
5. System displays password strength indicator when customer enters new password
6. Customer re-enters new password in confirm field
7. Customer clicks "Change Password" button to submit form
8. System performs client-side validation:
   - Checks current password is entered
   - Checks current password is correct
   - Checks new password is entered
   - Checks new password has at least 6 characters
   - Checks new password is different from current password
   - Checks confirm password is entered
   - Checks confirm password matches new password
9. If validation succeeds, system sends change password request to server with current password and new password
10. Server verifies current password: checks if current password is correct
11. If current password is correct, server updates new password in database
12. Server returns success message
13. System resets form to initial state (clears all fields)
14. System displays success message: "Password changed successfully!"
15. Success message automatically disappears after 3 seconds

**Alternative Flows:**
1. **Show/hide password:** Customer can click eye icon to show or hide password in fields (current password, new password, confirm password)
2. **View password strength:** When customer enters new password, system automatically displays password strength indicator (Very Weak, Weak, Medium, Strong, Very Strong) based on length and complexity

**Exceptions:**
1. **Current password not entered:** If current password is empty, system displays error: "Please enter current password"
2. **Current password incorrect:** If current password is incorrect, system displays error: "Current password is incorrect"
3. **New password not entered:** If new password is empty, system displays error: "Please enter new password"
4. **New password too short:** If new password < 6 characters, system displays error: "New password must have at least 6 characters"
5. **New password same as current:** If new password is same as current password, system displays error: "New password must be different from current password"
6. **Confirm password not entered:** If confirm password is empty, system displays error: "Please confirm new password"
7. **Confirm password doesn't match:** If confirm password doesn't match new password, system displays error: "Confirm password does not match"
8. **Token expired:** If access token expires, system automatically refreshes token. If refresh token also expires, system redirects to login page
9. **Network or server error:** If there is connection or server error when sending change password request, system displays error message: "An error occurred, please try again" and logs detailed error
10. **Unknown error:** System formats and displays error message from server, customer can retry or contact support

**Priority:** HIGH

**Business Rules:**
- BR-CHANGE-PWD-001: Current password is required and must be correct
- BR-CHANGE-PWD-002: New password must have minimum 6 characters
- BR-CHANGE-PWD-003: New password must be different from current password
- BR-CHANGE-PWD-004: New password and confirm password must match
- BR-CHANGE-PWD-005: Customer can only change their own password, cannot change other customers' passwords
- BR-CHANGE-PWD-006: After successful password change, customer must use new password to login
- BR-CHANGE-PWD-007: System should display password strength indicator to encourage customers to create strong passwords
- BR-CHANGE-PWD-008: New password should include uppercase, lowercase, numbers and special characters to increase security (recommended, not required)
- BR-CHANGE-PWD-009: After successful password change, form must be reset to initial state

---

## Summary

Use case này mô tả quy trình khách hàng đổi mật khẩu tài khoản, bao gồm:

- **15 bước Normal Flow** từ truy cập tab đổi mật khẩu, nhập các trường, validation, gửi yêu cầu đến server, đến hiển thị thông báo thành công và reset form
- **2 Alternative Flows** cho hiển thị/ẩn mật khẩu và xem độ mạnh mật khẩu
- **10 Exception cases** xử lý các lỗi validation (mật khẩu hiện tại không đúng, mật khẩu mới quá ngắn, không khớp, etc.), token hết hạn, lỗi mạng/server, và lỗi không xác định
- **9 Business Rules** quy định các quy tắc nghiệp vụ về validation, độ mạnh mật khẩu, và quyền truy cập

Use case đảm bảo quy trình đổi mật khẩu an toàn với validation đầy đủ, yêu cầu xác thực mật khẩu hiện tại, khuyến khích tạo mật khẩu mạnh với chỉ báo độ mạnh, và xử lý các trường hợp ngoại lệ một cách rõ ràng. Đây là tính năng quan trọng để bảo mật tài khoản khách hàng.

