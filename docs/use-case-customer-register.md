# Use Case: Customer Register

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-REGISTER  
**Date Created:** 2025-01-XX  
**Primary Actor:** Guest (Khách chưa đăng ký)  
**Secondary Actors:** System, Email Service (nếu có gửi email xác nhận)

**Description:**  
Khách chưa đăng ký (Guest) tạo tài khoản mới trên hệ thống bằng cách điền thông tin đăng ký (họ tên, email, số điện thoại, mật khẩu) và đồng ý với điều khoản dịch vụ. Sau khi đăng ký thành công, khách hàng được chuyển đến trang đăng nhập.

**Trigger:**  
Khách chưa đăng ký muốn tạo tài khoản mới và click nút "Đăng ký" trên giao diện hệ thống.

**Preconditions:**
1. Khách chưa có tài khoản trong hệ thống
2. Khách chưa đăng nhập (chưa authenticated)

**Postconditions:**
1. Tài khoản khách hàng được tạo thành công trong hệ thống
2. Thông tin khách hàng (name, email, phone) được lưu vào database
3. Khách hàng được chuyển đến trang đăng nhập (`/auth/login`)
4. Hệ thống hiển thị thông báo đăng ký thành công

**Normal Flow:**
1. Khách chưa đăng ký truy cập trang đăng ký (có thể từ nút "Đăng ký" ở góc trên bên phải màn hình hoặc đường link `/auth/register`)
2. Khách hàng điền thông tin vào form đăng ký:
   - **Họ tên** (name): Bắt buộc, tối thiểu 2 ký tự
   - **Email** (email): Bắt buộc, phải đúng format email
   - **Số điện thoại** (phone): Bắt buộc, phải đúng format số điện thoại Việt Nam (84 hoặc 0[3|5|7|8|9] + 8 chữ số)
   - **Mật khẩu** (password): Bắt buộc, tối thiểu 6 ký tự
   - **Xác nhận mật khẩu** (confirmPassword): Bắt buộc, phải khớp với mật khẩu
   - **Đồng ý điều khoản** (agreeTerms): Bắt buộc phải được chọn
   - **Đồng ý nhận khuyến mãi** (agreePromotions): Tùy chọn
3. Khách hàng click nút "Đăng ký" để gửi form
4. Hệ thống thực hiện validation phía client:
   - Kiểm tra mật khẩu và xác nhận mật khẩu có khớp không
   - Kiểm tra đã đồng ý điều khoản chưa
   - Validate từng field (name ≥ 2 ký tự, email format, phone format, password ≥ 6 ký tự)
5. Nếu validation thành công, hệ thống gọi API: `POST /api/account/register/customer` với dữ liệu (name, email, phone, password)
6. Backend xử lý và tạo tài khoản trong database
7. API trả về response với status `201` và thông tin khách hàng đã đăng ký
8. Hệ thống hiển thị thông báo thành công: "Đăng ký thành công!"
9. Sau 3 giây, hệ thống tự động chuyển hướng khách hàng đến trang đăng nhập (`/auth/login`) với thông báo và email đã đăng ký

**Alternative Flows:**
1. **Đăng ký bằng Google:** Khách hàng có thể chọn đăng ký bằng tài khoản Google thay vì form thông thường. Hệ thống xử lý OAuth và tạo tài khoản tự động
2. **Khách hàng đã có tài khoản:** Nếu khách hàng đã có tài khoản, có thể click link "Đăng nhập ngay" để chuyển đến trang đăng nhập thay vì đăng ký mới

**Exceptions:**
1. **Thông tin không hợp lệ hoặc thiếu:**
   - Nếu name < 2 ký tự → Hiển thị lỗi: "Tên phải có ít nhất 2 ký tự"
   - Nếu email không đúng format → Hiển thị lỗi: "Email không hợp lệ"
   - Nếu phone không đúng format → Hiển thị lỗi: "Số điện thoại không hợp lệ"
   - Nếu password < 6 ký tự → Hiển thị lỗi: "Mật khẩu phải có ít nhất 6 ký tự"
   - Nếu password và confirmPassword không khớp → Hiển thị lỗi: "Mật khẩu xác nhận không khớp"
   - Nếu chưa đồng ý điều khoản → Hiển thị lỗi: "Bạn phải đồng ý với điều khoản dịch vụ"
   - Hệ thống hiển thị thông báo lỗi và yêu cầu khách hàng sửa lại thông tin
2. **Email đã tồn tại:** Nếu email đã được sử dụng bởi tài khoản khác, API trả về lỗi. Hệ thống hiển thị thông báo: "Email này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập."
3. **Số điện thoại đã tồn tại:** Nếu số điện thoại đã được sử dụng, API trả về lỗi. Hệ thống hiển thị thông báo: "Số điện thoại này đã được sử dụng."
4. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server, hệ thống hiển thị thông báo: "Đăng ký thất bại. Vui lòng thử lại sau." và log lỗi chi tiết
5. **API trả về lỗi không xác định:** Hệ thống format và hiển thị thông báo lỗi từ API, khách hàng có thể thử lại hoặc liên hệ support

**Priority:** HIGH

**Business Rules:**
- BR-REGISTER-001: Email phải là duy nhất trong hệ thống, không được trùng với tài khoản khác
- BR-REGISTER-002: Số điện thoại phải là duy nhất trong hệ thống, không được trùng với tài khoản khác
- BR-REGISTER-003: Họ tên phải có tối thiểu 2 ký tự
- BR-REGISTER-004: Email phải đúng format: `[^\s@]+@[^\s@]+\.[^\s@]+`
- BR-REGISTER-005: Số điện thoại phải đúng format Việt Nam: `84` hoặc `0[3|5|7|8|9]` + 8 chữ số
- BR-REGISTER-006: Mật khẩu phải có tối thiểu 6 ký tự
- BR-REGISTER-007: Mật khẩu và xác nhận mật khẩu phải khớp nhau
- BR-REGISTER-008: Khách hàng bắt buộc phải đồng ý với điều khoản dịch vụ và chính sách bảo mật mới có thể đăng ký
- BR-REGISTER-009: Sau khi đăng ký thành công, khách hàng phải đăng nhập để sử dụng hệ thống (không tự động đăng nhập sau đăng ký)

---

### English

**ID and Name:** UC-CUSTOMER-REGISTER  
**Date Created:** 2025-01-XX  
**Primary Actor:** Guest (Unregistered user)  
**Secondary Actors:** System, Email Service (if email confirmation is sent)

**Description:**  
An unregistered guest creates a new account on the system by filling in registration information (full name, email, phone number, password) and agreeing to terms of service. After successful registration, the customer is redirected to the login page.

**Trigger:**  
An unregistered guest wants to create a new account and clicks the "Register" button on the system interface.

**Preconditions:**
1. Guest does not have an account in the system
2. Guest is not logged in (not authenticated)

**Postconditions:**
1. Customer account is successfully created in the system
2. Customer information (name, email, phone) is saved to database
3. Customer is redirected to login page (`/auth/login`)
4. System displays successful registration notification

**Normal Flow:**
1. Unregistered guest accesses the registration page (from "Register" button in upper right corner or link `/auth/register`)
2. Customer fills in registration form:
   - **Full Name** (name): Required, minimum 2 characters
   - **Email** (email): Required, must be valid email format
   - **Phone Number** (phone): Required, must be valid Vietnamese phone format (84 or 0[3|5|7|8|9] + 8 digits)
   - **Password** (password): Required, minimum 6 characters
   - **Confirm Password** (confirmPassword): Required, must match password
   - **Agree to Terms** (agreeTerms): Required, must be checked
   - **Agree to Promotions** (agreePromotions): Optional
3. Customer clicks "Register" button to submit form
4. System performs client-side validation:
   - Check if password and confirm password match
   - Check if terms are agreed
   - Validate each field (name ≥ 2 chars, email format, phone format, password ≥ 6 chars)
5. If validation succeeds, system calls API: `POST /api/account/register/customer` with data (name, email, phone, password)
6. Backend processes and creates account in database
7. API returns response with status `201` and registered customer information
8. System displays success message: "Registration successful!"
9. After 3 seconds, system automatically redirects customer to login page (`/auth/login`) with message and registered email

**Alternative Flows:**
1. **Register with Google:** Customer can choose to register using Google account instead of regular form. System handles OAuth and automatically creates account
2. **Customer already has account:** If customer already has an account, can click "Login now" link to navigate to login page instead of registering new account

**Exceptions:**
1. **Invalid or incomplete information:**
   - If name < 2 characters → Display error: "Name must be at least 2 characters"
   - If email format invalid → Display error: "Invalid email"
   - If phone format invalid → Display error: "Invalid phone number"
   - If password < 6 characters → Display error: "Password must be at least 6 characters"
   - If password and confirmPassword don't match → Display error: "Passwords do not match"
   - If terms not agreed → Display error: "You must agree to terms of service"
   - System displays error message and prompts customer to retry
2. **Email already exists:** If email is already used by another account, API returns error. System displays message: "This email is already in use. Please use another email or login."
3. **Phone already exists:** If phone number is already used, API returns error. System displays message: "This phone number is already in use."
4. **Network or server error:** If there is connection or server error, system displays message: "Registration failed. Please try again later." and logs detailed error
5. **Unknown API error:** System formats and displays error message from API, customer can retry or contact support

**Priority:** HIGH

**Business Rules:**
- BR-REGISTER-001: Email must be unique in the system, cannot duplicate with other accounts
- BR-REGISTER-002: Phone number must be unique in the system, cannot duplicate with other accounts
- BR-REGISTER-003: Full name must have minimum 2 characters
- BR-REGISTER-004: Email must be valid format: `[^\s@]+@[^\s@]+\.[^\s@]+`
- BR-REGISTER-005: Phone number must be valid Vietnamese format: `84` or `0[3|5|7|8|9]` + 8 digits
- BR-REGISTER-006: Password must have minimum 6 characters
- BR-REGISTER-007: Password and confirm password must match
- BR-REGISTER-008: Customer must agree to terms of service and privacy policy to register
- BR-REGISTER-009: After successful registration, customer must login to use the system (no auto-login after registration)

---

## Summary

Use case này mô tả quy trình đăng ký tài khoản khách hàng mới trên hệ thống, bao gồm:

- **9 bước Normal Flow** từ truy cập trang đăng ký đến chuyển hướng đến trang đăng nhập
- **2 Alternative Flows** cho đăng ký bằng Google và chuyển sang đăng nhập
- **5 Exception cases** xử lý các lỗi validation, email/phone trùng, và lỗi hệ thống
- **9 Business Rules** quy định các quy tắc nghiệp vụ về validation và tính duy nhất

Use case đảm bảo quy trình đăng ký an toàn với validation đầy đủ, kiểm tra tính duy nhất của email và số điện thoại, và yêu cầu đồng ý điều khoản dịch vụ.

