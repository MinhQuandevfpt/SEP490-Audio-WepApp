# Use Case: Customer Update Profile

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-UPDATE-PROFILE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng nhập)  
**Secondary Actors:** System

**Description:**  
Khách hàng đã đăng nhập có thể cập nhật thông tin cá nhân trong trang tài khoản của mình. Khách hàng có thể cập nhật tên, số điện thoại, giới tính, ngày sinh, và ảnh đại diện. Email không thể được cập nhật bởi khách hàng.

**Trigger:**  
Khách hàng muốn cập nhật thông tin cá nhân và click vào nút "Cập nhật thông tin" hoặc "Chỉnh sửa" trong tab "Thông tin cá nhân" của trang profile.

**Preconditions:**
1. Khách hàng đã đăng nhập vào hệ thống (đã authenticated)
2. Khách hàng đang ở trang profile, tab "Thông tin cá nhân"
3. Khách hàng có quyền truy cập và chỉnh sửa thông tin của chính mình

**Postconditions:**
1. Thông tin profile được cập nhật thành công trong hệ thống
2. Dữ liệu profile mới được lưu vào database
3. Giao diện hiển thị thông tin đã cập nhật
4. Hệ thống hiển thị thông báo thành công

**Normal Flow:**
1. Khách hàng click vào nút "Cập nhật thông tin" hoặc "Chỉnh sửa" trong tab "Thông tin cá nhân"
2. Hệ thống chuyển form sang chế độ chỉnh sửa, hiển thị các trường có thể chỉnh sửa
3. Khách hàng cập nhật thông tin trong các trường:
   - **Họ tên** (fullName): Có thể cập nhật
   - **Email**: Không thể cập nhật (chỉ hiển thị, disabled)
   - **Số điện thoại** (phoneNumber): Có thể cập nhật
   - **Giới tính** (gender): Có thể chọn Nam, Nữ, hoặc Khác
   - **Ngày sinh** (dateOfBirth): Có thể cập nhật
   - **Ảnh đại diện** (avatar): Có thể upload ảnh mới hoặc xóa ảnh hiện tại
4. Khách hàng click nút "Lưu thay đổi" để gửi thông tin cập nhật
5. Hệ thống thực hiện validation phía client:
   - Kiểm tra các trường bắt buộc đã được điền
   - Kiểm tra format số điện thoại (nếu có)
   - Kiểm tra format ngày sinh (nếu có)
   - Kiểm tra kích thước và định dạng file ảnh (nếu upload ảnh mới)
6. Nếu validation thành công, hệ thống gửi yêu cầu cập nhật đến server
7. Server xác thực thông tin và cập nhật dữ liệu trong database
8. Server trả về thông tin profile đã được cập nhật
9. Hệ thống cập nhật giao diện với thông tin mới
10. Hệ thống hiển thị thông báo thành công: "Cập nhật thông tin thành công"
11. Form tự động chuyển về chế độ xem (không còn chỉnh sửa)

**Alternative Flows:**
1. **Hủy chỉnh sửa:** Nếu khách hàng click nút "Hủy" hoặc "Đóng" trong khi đang chỉnh sửa, hệ thống hủy các thay đổi và quay lại chế độ xem với thông tin ban đầu
2. **Upload ảnh đại diện:** Khách hàng có thể click vào ảnh đại diện để upload ảnh mới. Hệ thống hiển thị preview ảnh trước khi lưu. Khách hàng có thể xác nhận hoặc hủy việc upload
3. **Xóa ảnh đại diện:** Khách hàng có thể xóa ảnh đại diện hiện tại bằng cách click nút "Xóa ảnh đại diện"

**Exceptions:**
1. **Thông tin không hợp lệ:** 
   - Nếu họ tên trống → Hiển thị lỗi: "Vui lòng nhập họ tên"
   - Nếu số điện thoại không đúng format → Hiển thị lỗi: "Số điện thoại không hợp lệ"
   - Nếu ngày sinh không đúng format → Hiển thị lỗi: "Ngày sinh không hợp lệ"
   - Hệ thống hiển thị thông báo lỗi và yêu cầu khách hàng sửa lại
2. **File ảnh không hợp lệ:**
   - Nếu file không phải là hình ảnh → Hiển thị lỗi: "Vui lòng chọn file hình ảnh hợp lệ"
   - Nếu kích thước file vượt quá giới hạn (ví dụ: 5MB) → Hiển thị lỗi: "Kích thước file không được vượt quá 5MB"
3. **Lỗi khi upload ảnh:** Nếu có lỗi khi upload ảnh lên server, hệ thống hiển thị thông báo lỗi và khách hàng có thể thử lại
4. **Token hết hạn:** Nếu access token hết hạn, hệ thống tự động refresh token. Nếu refresh token cũng hết hạn, hệ thống chuyển hướng đến trang đăng nhập
5. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server khi gửi yêu cầu cập nhật, hệ thống hiển thị thông báo lỗi: "Cập nhật thất bại. Vui lòng thử lại sau." và log lỗi chi tiết
6. **Lỗi không xác định:** Hệ thống format và hiển thị thông báo lỗi từ server, khách hàng có thể thử lại hoặc liên hệ support
7. **Dữ liệu không được lưu:** Nếu server không thể lưu dữ liệu (ví dụ: database error), hệ thống hiển thị thông báo lỗi và khách hàng có thể thử lại

**Priority:** LOW

**Business Rules:**
- BR-UPDATE-001: Email không thể được cập nhật bởi khách hàng, chỉ có thể xem
- BR-UPDATE-002: Họ tên là bắt buộc và phải có ít nhất 2 ký tự
- BR-UPDATE-003: Số điện thoại phải đúng format (nếu được cập nhật)
- BR-UPDATE-004: Giới tính có thể là Nam, Nữ, hoặc Khác
- BR-UPDATE-005: Ngày sinh phải đúng format (nếu được cập nhật)
- BR-UPDATE-006: Ảnh đại diện phải là file hình ảnh hợp lệ và không vượt quá kích thước giới hạn
- BR-UPDATE-007: Khách hàng chỉ có thể cập nhật profile của chính mình, không thể cập nhật profile của khách hàng khác
- BR-UPDATE-008: Các trường như điểm tích lũy, cấp độ thành viên không thể được cập nhật bởi khách hàng (chỉ admin mới có quyền)
- BR-UPDATE-009: Sau khi cập nhật thành công, thông tin mới phải được hiển thị ngay lập tức trong giao diện

---

### English

**ID and Name:** UC-CUSTOMER-UPDATE-PROFILE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Logged-in customer)  
**Secondary Actors:** System

**Description:**  
A logged-in customer can update their personal information in their account page. Customer can update name, phone number, gender, date of birth, and avatar. Email cannot be updated by customer.

**Trigger:**  
Customer wants to update personal information and clicks "Update Information" or "Edit" button in "Personal Information" tab of profile page.

**Preconditions:**
1. Customer is logged into the system (authenticated)
2. Customer is on profile page, "Personal Information" tab
3. Customer has access and permission to edit their own information

**Postconditions:**
1. Profile information is successfully updated in the system
2. New profile data is saved to database
3. Interface displays updated information
4. System displays success notification

**Normal Flow:**
1. Customer clicks "Update Information" or "Edit" button in "Personal Information" tab
2. System switches form to edit mode, displays editable fields
3. Customer updates information in fields:
   - **Full Name** (fullName): Can be updated
   - **Email**: Cannot be updated (display only, disabled)
   - **Phone Number** (phoneNumber): Can be updated
   - **Gender** (gender): Can select Male, Female, or Other
   - **Date of Birth** (dateOfBirth): Can be updated
   - **Avatar**: Can upload new image or remove current image
4. Customer clicks "Save Changes" button to submit update
5. System performs client-side validation:
   - Checks required fields are filled
   - Checks phone number format (if provided)
   - Checks date of birth format (if provided)
   - Checks image file size and format (if uploading new image)
6. If validation succeeds, system sends update request to server
7. Server validates information and updates data in database
8. Server returns updated profile information
9. System updates interface with new information
10. System displays success message: "Profile updated successfully"
11. Form automatically switches back to view mode (no longer editing)

**Alternative Flows:**
1. **Cancel editing:** If customer clicks "Cancel" or "Close" button while editing, system cancels changes and returns to view mode with original information
2. **Upload avatar:** Customer can click on avatar to upload new image. System displays image preview before saving. Customer can confirm or cancel upload
3. **Remove avatar:** Customer can remove current avatar by clicking "Remove Avatar" button

**Exceptions:**
1. **Invalid information:**
   - If full name is empty → Display error: "Please enter full name"
   - If phone number format is invalid → Display error: "Invalid phone number"
   - If date of birth format is invalid → Display error: "Invalid date of birth"
   - System displays error message and prompts customer to correct
2. **Invalid image file:**
   - If file is not an image → Display error: "Please select a valid image file"
   - If file size exceeds limit (e.g., 5MB) → Display error: "File size must not exceed 5MB"
3. **Error uploading image:** If there is error uploading image to server, system displays error message and customer can retry
4. **Token expired:** If access token expires, system automatically refreshes token. If refresh token also expires, system redirects to login page
5. **Network or server error:** If there is connection or server error when sending update request, system displays error message: "Update failed. Please try again later." and logs detailed error
6. **Unknown error:** System formats and displays error message from server, customer can retry or contact support
7. **Data not saved:** If server cannot save data (e.g., database error), system displays error message and customer can retry

**Priority:** LOW

**Business Rules:**
- BR-UPDATE-001: Email cannot be updated by customer, can only be viewed
- BR-UPDATE-002: Full name is required and must have at least 2 characters
- BR-UPDATE-003: Phone number must be valid format (if updated)
- BR-UPDATE-004: Gender can be Male, Female, or Other
- BR-UPDATE-005: Date of birth must be valid format (if updated)
- BR-UPDATE-006: Avatar must be valid image file and not exceed size limit
- BR-UPDATE-007: Customer can only update their own profile, cannot update other customers' profiles
- BR-UPDATE-008: Fields such as loyalty points, membership level cannot be updated by customer (only admin has permission)
- BR-UPDATE-009: After successful update, new information must be displayed immediately in interface

---

## Summary

Use case này mô tả quy trình khách hàng cập nhật thông tin cá nhân trong trang tài khoản, bao gồm:

- **11 bước Normal Flow** từ click nút cập nhật, chỉnh sửa thông tin, validation, gửi yêu cầu đến server, đến hiển thị thông báo thành công
- **3 Alternative Flows** cho hủy chỉnh sửa, upload ảnh đại diện, và xóa ảnh đại diện
- **7 Exception cases** xử lý các lỗi validation, file ảnh không hợp lệ, lỗi upload, token hết hạn, lỗi mạng/server, và lỗi không xác định
- **9 Business Rules** quy định các quy tắc nghiệp vụ về các trường có thể cập nhật, validation, và quyền truy cập

Use case đảm bảo quy trình cập nhật profile an toàn với validation đầy đủ, không cho phép cập nhật email, hỗ trợ upload ảnh đại diện, và xử lý các trường hợp ngoại lệ một cách rõ ràng. Khách hàng chỉ có thể cập nhật các thông tin cơ bản của chính mình.

