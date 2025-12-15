# Use Case: Customer Forgot Password

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-FORGOT-PASSWORD  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng ký nhưng quên mật khẩu)  
**Secondary Actors:** System, SMS Service

**Description:**  
Khách hàng đã có tài khoản nhưng quên mật khẩu có thể yêu cầu khôi phục mật khẩu bằng cách nhập số điện thoại đã đăng ký. Hệ thống sẽ gửi mã OTP (One-Time Password) qua SMS đến số điện thoại của khách hàng. Sau khi nhập OTP chính xác, khách hàng có thể đặt lại mật khẩu mới. Sau khi đặt lại mật khẩu thành công, khách hàng có thể đăng nhập bằng mật khẩu mới.

**Trigger:**  
Khách hàng quên mật khẩu và click link "Quên mật khẩu?" trên trang đăng nhập hoặc truy cập trực tiếp trang khôi phục mật khẩu.

**Preconditions:**
1. Khách hàng đã có tài khoản trong hệ thống (đã đăng ký trước đó)
2. Khách hàng biết số điện thoại đã sử dụng để đăng ký tài khoản
3. Khách hàng có quyền truy cập số điện thoại đã đăng ký để nhận SMS

**Postconditions:**
1. Mã OTP khôi phục mật khẩu được gửi đến số điện thoại của khách hàng (nếu số điện thoại tồn tại)
2. Mã OTP được tạo và gửi qua SMS
3. Khách hàng có thể xác thực bằng OTP và đặt lại mật khẩu mới
4. Mật khẩu mới được cập nhật trong hệ thống
5. Khách hàng được chuyển đến trang đăng nhập để đăng nhập bằng mật khẩu mới

**Normal Flow:**
1. Khách hàng truy cập trang khôi phục mật khẩu (từ link "Quên mật khẩu?" trên trang đăng nhập)
2. Hệ thống hiển thị form yêu cầu nhập số điện thoại đã đăng ký
3. Khách hàng nhập số điện thoại vào form
4. Khách hàng click nút "Gửi mã OTP" hoặc tương tự
5. Hệ thống thực hiện validation phía client: kiểm tra số điện thoại đã được nhập và đúng format
6. Nếu validation thành công, hệ thống gửi yêu cầu khôi phục mật khẩu đến backend
7. Backend kiểm tra số điện thoại có tồn tại trong hệ thống:
   - Nếu số điện thoại tồn tại → Tạo mã OTP (có thời hạn, thường là 5-10 phút)
   - Nếu số điện thoại không tồn tại → Trả về thông báo chung (không tiết lộ số điện thoại có tồn tại)
8. Backend gửi mã OTP qua SMS đến số điện thoại của khách hàng
9. Hệ thống hiển thị thông báo: "Nếu số điện thoại tồn tại, chúng tôi đã gửi mã OTP đến số điện thoại của bạn"
10. Hệ thống hiển thị form nhập OTP và bắt đầu đếm ngược thời gian (nếu có)
11. Khách hàng kiểm tra tin nhắn SMS và nhập mã OTP vào form
12. Khách hàng click nút "Xác thực OTP" hoặc tương tự
13. Hệ thống gửi mã OTP đến backend để xác thực
14. Backend kiểm tra mã OTP có đúng và còn hiệu lực không:
   - Nếu OTP đúng và còn hiệu lực → Xác thực thành công
   - Nếu OTP sai hoặc hết hạn → Trả về lỗi
15. Nếu xác thực thành công, hệ thống hiển thị form đặt lại mật khẩu (mật khẩu mới, xác nhận mật khẩu)
16. Khách hàng nhập mật khẩu mới và xác nhận mật khẩu
17. Khách hàng click nút "Đặt lại mật khẩu"
18. Hệ thống thực hiện validation: kiểm tra mật khẩu mới đủ độ dài, mật khẩu và xác nhận mật khẩu khớp nhau
19. Nếu validation thành công, hệ thống gửi yêu cầu đặt lại mật khẩu đến backend kèm số điện thoại đã xác thực
20. Backend cập nhật mật khẩu mới trong database
21. Backend vô hiệu hóa mã OTP đã sử dụng (không thể dùng lại)
22. Hệ thống hiển thị thông báo thành công: "Đặt lại mật khẩu thành công!"
23. Hệ thống tự động chuyển hướng khách hàng đến trang đăng nhập

**Alternative Flows:**
1. **Khách hàng nhớ lại mật khẩu:** Nếu khách hàng nhớ lại mật khẩu sau khi yêu cầu khôi phục, có thể click link "Quay lại đăng nhập" để quay về trang đăng nhập
2. **Không nhận được OTP:** Khách hàng có thể click nút "Gửi lại OTP" sau một khoảng thời gian để yêu cầu gửi lại mã OTP mới
3. **OTP hết hạn:** Nếu mã OTP đã hết hạn, hệ thống hiển thị thông báo và cho phép khách hàng yêu cầu gửi lại mã OTP mới
4. **Đăng nhập bằng Google:** Nếu khách hàng đăng ký bằng Google OAuth, có thể được hướng dẫn đăng nhập bằng Google thay vì khôi phục mật khẩu

**Exceptions:**
1. **Số điện thoại không được nhập:** Nếu số điện thoại trống, hệ thống hiển thị lỗi: "Vui lòng nhập số điện thoại"
2. **Số điện thoại không đúng format:** Nếu số điện thoại không đúng format (không phải format Việt Nam), hệ thống hiển thị lỗi: "Số điện thoại không hợp lệ"
3. **Số điện thoại không tồn tại:** API trả về lỗi, nhưng hệ thống hiển thị thông báo chung: "Nếu số điện thoại tồn tại, chúng tôi đã gửi mã OTP đến số điện thoại của bạn" (không tiết lộ số điện thoại có tồn tại vì lý do bảo mật)
4. **Lỗi gửi SMS:** Nếu có lỗi khi gửi SMS (server SMS lỗi, số điện thoại không hợp lệ), hệ thống log lỗi và có thể hiển thị thông báo: "Không thể gửi SMS. Vui lòng thử lại sau."
5. **OTP không được nhập:** Nếu khách hàng chưa nhập OTP, hệ thống hiển thị lỗi: "Vui lòng nhập mã OTP"
6. **OTP không đúng:** Nếu mã OTP nhập vào không đúng, hệ thống hiển thị thông báo: "Mã OTP không đúng. Vui lòng kiểm tra lại."
7. **OTP đã hết hạn:** Nếu mã OTP đã hết hạn, hệ thống hiển thị thông báo: "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới."
8. **OTP đã được sử dụng:** Nếu mã OTP đã được sử dụng để xác thực trước đó, hệ thống hiển thị thông báo: "Mã OTP này đã được sử dụng. Vui lòng yêu cầu mã mới."
9. **Mật khẩu mới không hợp lệ:** 
   - Nếu mật khẩu mới < 6 ký tự → Hiển thị lỗi: "Mật khẩu phải có ít nhất 6 ký tự"
   - Nếu mật khẩu và xác nhận mật khẩu không khớp → Hiển thị lỗi: "Mật khẩu xác nhận không khớp"
10. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server khi gửi yêu cầu khôi phục, xác thực OTP hoặc đặt lại mật khẩu, hệ thống hiển thị thông báo: "Có lỗi xảy ra. Vui lòng thử lại sau." và log lỗi chi tiết
11. **API trả về lỗi không xác định:** Hệ thống format và hiển thị thông báo lỗi từ API, khách hàng có thể thử lại hoặc liên hệ support
12. **Yêu cầu quá nhiều lần:** Nếu khách hàng yêu cầu gửi OTP quá nhiều lần trong thời gian ngắn, hệ thống có thể giới hạn và hiển thị: "Bạn đã yêu cầu quá nhiều lần. Vui lòng đợi một chút trước khi thử lại."

**Priority:** HIGH

**Business Rules:**
- BR-FORGOT-001: Số điện thoại là bắt buộc và phải đúng format số điện thoại Việt Nam (84 hoặc 0[3|5|7|8|9] + 8 chữ số)
- BR-FORGOT-002: Không được tiết lộ thông tin số điện thoại có tồn tại trong hệ thống hay không vì lý do bảo mật (luôn hiển thị thông báo chung)
- BR-FORGOT-003: Mã OTP phải có thời hạn (thường là 5-10 phút)
- BR-FORGOT-004: Mã OTP chỉ có thể sử dụng một lần, sau khi sử dụng phải được vô hiệu hóa
- BR-FORGOT-005: Mã OTP phải là số ngẫu nhiên, thường là 4-6 chữ số
- BR-FORGOT-006: Mật khẩu mới phải có tối thiểu 6 ký tự
- BR-FORGOT-007: Mật khẩu mới và xác nhận mật khẩu phải khớp nhau
- BR-FORGOT-008: Sau khi đặt lại mật khẩu thành công, khách hàng phải đăng nhập lại bằng mật khẩu mới
- BR-FORGOT-009: Có thể giới hạn số lần yêu cầu gửi OTP trong một khoảng thời gian để tránh spam và giảm chi phí SMS
- BR-FORGOT-010: SMS chứa mã OTP phải chứa hướng dẫn rõ ràng và thời hạn sử dụng mã

---

### English

**ID and Name:** UC-CUSTOMER-FORGOT-PASSWORD  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Registered customer who forgot password)  
**Secondary Actors:** System, SMS Service

**Description:**  
A customer with an existing account who forgot their password can request password recovery by entering their registered phone number. The system will send an OTP (One-Time Password) via SMS to the customer's phone number. After entering the correct OTP, the customer can set a new password. After successfully resetting the password, the customer can login with the new password.

**Trigger:**  
Customer forgot their password and clicks "Forgot Password?" link on the login page or directly accesses the password recovery page.

**Preconditions:**
1. Customer has an account in the system (registered previously)
2. Customer knows the phone number used to register the account
3. Customer has access to the registered phone number to receive SMS

**Postconditions:**
1. Password recovery OTP is sent to customer's phone number (if phone number exists)
2. OTP is created and sent via SMS
3. Customer can verify using OTP and set a new password
4. New password is updated in the system
5. Customer is redirected to login page to login with new password

**Normal Flow:**
1. Customer accesses password recovery page 
2. System displays form requesting registered phone number
3. Customer enters phone number into form
4. Customer clicks "Gửi mã OTP" button or similar
5. System performs client-side validation: checks if phone number is entered and valid format
6. If validation succeeds, system sends password recovery request to backend
7. Backend checks if phone number exists in system:
   - If phone number exists → Create OTP 
   - If phone number doesn't exist → Return general message 
8. Backend sends OTP via SMS to customer's phone number
9. System displays message: "Chúng tôi đã gửi mã OTP đến số điện thoại của bạn"
10. System displays OTP input form and starts countdown timer 
11. Customer checks SMS message and enters OTP into form
12. Customer clicks "Xác thực OTP" button or similar
13. System sends OTP to backend for verification
14. Backend checks if OTP is correct and still valid:
   - If OTP is correct and valid → Verification successful
   - If OTP is incorrect or expired → Return error
15. If verification succeeds, system displays password reset form (new password, confirm password)
16. Customer enters new password and confirms password
17. Customer clicks "Đặt lại mật khẩu" button
18. System performs validation: checks if new password meets minimum length, password and confirm password match
19. If validation succeeds, system sends password reset request to backend with verified phone number
20. Backend updates new password in database
21. Backend invalidates used OTP (cannot be reused)
22. System displays success message: "Đặt lại mật khẩu thành công!"
23. System automatically redirects customer to login page

**Alternative Flows:**
1. **Customer remembers password:** If customer remembers password after requesting recovery, can click "Back to Login" link to return to login page
2. **Did not receive OTP:** Customer can click "Resend OTP" button after some time to request resending new OTP
3. **OTP expired:** If OTP has expired, system displays message and allows customer to request new OTP
4. **Login with Google:** If customer registered with Google OAuth, can be guided to login with Google instead of password recovery

**Exceptions:**
1. **Phone number not entered:** If phone number is empty, system displays error: "Please enter phone number"
2. **Phone number format invalid:** If phone number format is invalid (not Vietnamese format), system displays error: "Invalid phone number"
3. **Phone number does not exist:** API returns error, but system displays general message: "If the phone number exists, we have sent an OTP to your phone number" (doesn't reveal if phone number exists for security reasons)
4. **SMS sending error:** If there is error sending SMS (SMS server error, invalid phone number), system logs error and may display message: "Unable to send SMS. Please try again later."
5. **OTP not entered:** If customer hasn't entered OTP, system displays error: "Please enter OTP"
6. **OTP incorrect:** If entered OTP is incorrect, system displays message: "OTP is incorrect. Please check again."
7. **OTP expired:** If OTP has expired, system displays message: "OTP has expired. Please request a new code."
8. **OTP already used:** If OTP has been used for verification before, system displays message: "This OTP has already been used. Please request a new code."
9. **New password invalid:**
   - If new password < 6 characters → Display error: "Password must be at least 6 characters"
   - If password and confirm password don't match → Display error: "Passwords do not match"
10. **Network or server error:** If there is connection or server error when sending recovery request, verifying OTP or resetting password, system displays message: "An error occurred. Please try again later." and logs detailed error
11. **Unknown API error:** System formats and displays error message from API, customer can retry or contact support
12. **Too many requests:** If customer requests OTP too many times in short period, system may rate limit and display: "You have requested too many times. Please wait a moment before trying again."

**Priority:** HIGH

**Business Rules:**
- BR-FORGOT-001: Phone number is required and must be valid Vietnamese phone format (84 or 0[3|5|7|8|9] + 8 digits)
- BR-FORGOT-002: Must not reveal whether phone number exists in system for security reasons (always display general message)
- BR-FORGOT-003: OTP must have expiration time (usually 5-10 minutes)
- BR-FORGOT-004: OTP can only be used once, must be invalidated after use
- BR-FORGOT-005: OTP must be a random number, usually 4-6 digits
- BR-FORGOT-006: New password must have minimum 6 characters
- BR-FORGOT-007: New password and confirm password must match
- BR-FORGOT-008: After successful password reset, customer must login again with new password
- BR-FORGOT-009: May limit number of OTP requests in a time period to prevent spam and reduce SMS costs
- BR-FORGOT-010: SMS containing OTP must contain clear instructions and code expiration time

---

## Summary

Use case này mô tả quy trình khôi phục mật khẩu của khách hàng, bao gồm:

- **23 bước Normal Flow** từ truy cập trang khôi phục mật khẩu, nhập số điện thoại, gửi OTP qua SMS, xác thực OTP, đặt lại mật khẩu đến chuyển hướng về trang đăng nhập
- **4 Alternative Flows** cho nhớ lại mật khẩu, không nhận được OTP, OTP hết hạn, và đăng nhập bằng Google
- **12 Exception cases** xử lý các lỗi validation, số điện thoại không tồn tại, OTP không hợp lệ/hết hạn/đã dùng, mật khẩu không hợp lệ, và lỗi hệ thống
- **10 Business Rules** quy định các quy tắc nghiệp vụ về bảo mật, validation, OTP management, và rate limiting

Use case đảm bảo quy trình khôi phục mật khẩu an toàn với validation đầy đủ, bảo mật thông tin (không tiết lộ số điện thoại có tồn tại), OTP có thời hạn và chỉ dùng một lần, và xử lý các trường hợp ngoại lệ một cách rõ ràng.

