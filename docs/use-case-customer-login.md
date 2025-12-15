# Use Case: Customer Login

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-LOGIN  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng ký)  
**Secondary Actors:** System, Google OAuth (nếu đăng nhập bằng Google)

**Description:**  
Khách hàng đã có tài khoản đăng nhập vào hệ thống bằng email và mật khẩu (hoặc đăng nhập bằng Google OAuth). Sau khi đăng nhập thành công, khách hàng được xác thực và có quyền truy cập các tính năng của tài khoản cá nhân, được chuyển hướng về trang chủ hoặc trang trước đó.

**Trigger:**  
Khách hàng muốn đăng nhập vào tài khoản và click nút "Đăng nhập" trên giao diện hệ thống (thường ở góc trên bên phải màn hình).

**Preconditions:**
1. Khách hàng đã có tài khoản trong hệ thống (đã đăng ký trước đó)
2. Khách hàng chưa đăng nhập (chưa authenticated) hoặc đã logout

**Postconditions:**
1. Khách hàng được xác thực thành công (authenticateken đượd)
2. Access token và refresh toc lưu vào localStorage
3. Thông tin khách hàng (email, fullName, role, accountId, customerId) được lưu vào localStorage
4. Khách hàng được chuyển hướng về trang chủ (`/`) hoặc trang trước đó (nếu có `redirectAfterLogin`)
5. Hệ thống hiển thị thông báo chào mừng (welcome message) nếu chuyển về trang chủ
6. Khách hàng có quyền truy cập các tính năng của tài khoản cá nhân (xem đơn hàng, quản lý thông tin, mua sắm, v.v.)

**Normal Flow:**
1. Khách hàng truy cập trang đăng nhập (có thể từ nút "Đăng nhập" ở góc trên bên phải màn hình hoặc đường link đăng nhập)
2. Hệ thống hiển thị form đăng nhập với 2 phương thức: Email hoặc Phone (UI có toggle, nhưng API chỉ hỗ trợ Email)
3. Khách hàng chọn phương thức đăng nhập (mặc định là Email)
4. Khách hàng điền thông tin đăng nhập: Email (bắt buộc), Mật khẩu (bắt buộc), và tùy chọn "Ghi nhớ đăng nhập"
5. Khách hàng click nút "Đăng nhập" để gửi form
6. Hệ thống thực hiện validation phía client: kiểm tra email và password đã được nhập chưa. Nếu chọn Phone login, hiển thị lỗi không hỗ trợ
7. Nếu validation thành công, hệ thống gửi thông tin đăng nhập đến backend để xác thực
8. Backend xác thực thông tin đăng nhập: kiểm tra email có tồn tại, mật khẩu có đúng, và tạo tokens xác thực
9. Backend trả về thông tin xác thực thành công bao gồm access token, refresh token, và thông tin khách hàng
10. Hệ thống lưu tokens và thông tin khách hàng để sử dụng cho các request tiếp theo
11. Hệ thống kiểm tra xem có URL chuyển hướng được lưu trước đó không:
    - Nếu có → Chuyển hướng về URL đó (không hiển thị welcome message)
    - Nếu không → Chuyển hướng về trang chủ và lưu thông báo chào mừng
12. Nếu chuyển về trang chủ, hệ thống hiển thị thông báo chào mừng với tên khách hàng

**Alternative Flows:**
1. **Đăng nhập bằng Google:** Khách hàng có thể chọn đăng nhập bằng tài khoản Google thay vì email/password. Hệ thống xử lý OAuth, nhận token từ Google, và tự động tạo hoặc lấy tài khoản. Sau đó lưu thông tin xác thực và chuyển hướng như Normal Flow
2. **Khách hàng chưa có tài khoản:** Nếu khách hàng chưa có tài khoản, có thể click link "Đăng ký ngay" để chuyển đến trang đăng ký
3. **Quên mật khẩu:** Khách hàng có thể click link "Quên mật khẩu?" để chuyển đến trang khôi phục mật khẩu
4. **Email được điền sẵn từ đăng ký:** Nếu khách hàng vừa đăng ký và được chuyển đến trang đăng nhập, email sẽ được điền sẵn tự động

**Exceptions:**
1. **Email hoặc mật khẩu không được nhập:**
   - Nếu email trống → Hiển thị lỗi: "Vui lòng nhập email"
   - Nếu password trống → Hiển thị lỗi: "Vui lòng nhập mật khẩu"
   - Hệ thống hiển thị thông báo lỗi và yêu cầu khách hàng điền đầy đủ thông tin
2. **Email không tồn tại trong hệ thống:** API trả về lỗi. Hệ thống hiển thị thông báo: "Email hoặc mật khẩu không đúng" (không tiết lộ email có tồn tại hay không vì lý do bảo mật)
3. **Mật khẩu không đúng:** API trả về lỗi. Hệ thống hiển thị thông báo: "Email hoặc mật khẩu không đúng" (không tiết lộ mật khẩu đúng hay sai vì lý do bảo mật)
4. **Tài khoản bị khóa hoặc vô hiệu hóa:** API trả về lỗi. Hệ thống hiển thị thông báo: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ."
5. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server, hệ thống hiển thị thông báo: "Đăng nhập thất bại. Vui lòng thử lại sau." và log lỗi chi tiết
6. **API trả về lỗi không xác định:** Hệ thống format và hiển thị thông báo lỗi từ API, khách hàng có thể thử lại hoặc liên hệ support
7. **Lỗi khi lưu tokens:** Nếu có lỗi khi lưu tokens vào localStorage, hệ thống hiển thị cảnh báo và khách hàng có thể cần đăng nhập lại

**Priority:** HIGH

**Business Rules:**
- BR-LOGIN-001: Chỉ cho phép đăng nhập bằng email và password (đăng nhập bằng số điện thoại chưa được hỗ trợ bởi API hiện tại)
- BR-LOGIN-002: Email và password là bắt buộc, không được để trống
- BR-LOGIN-003: Access token và refresh token phải được lưu an toàn vào localStorage
- BR-LOGIN-004: Thông tin khách hàng (email, fullName, role, accountId, customerId) phải được lưu sau khi đăng nhập thành công
- BR-LOGIN-005: Nếu có `redirectAfterLogin` trong localStorage, phải chuyển hướng về URL đó sau khi đăng nhập (không hiển thị welcome message)
- BR-LOGIN-006: Nếu không có `redirectAfterLogin`, chuyển hướng về trang chủ và hiển thị welcome message
- BR-LOGIN-007: Không được tiết lộ thông tin chi tiết về lỗi đăng nhập (email không tồn tại hay mật khẩu sai) vì lý do bảo mật
- BR-LOGIN-008: Hỗ trợ đăng nhập bằng Google OAuth như một phương thức thay thế
- BR-LOGIN-009: Option "Ghi nhớ đăng nhập" (rememberMe) có thể được sử dụng để lưu session lâu hơn (hiện tại chưa có logic khác biệt, nhưng có thể mở rộng)
- BR-LOGIN-010: Sau khi đăng nhập thành công, khách hàng phải có quyền truy cập đầy đủ các tính năng của tài khoản cá nhân

---

### English

**ID and Name:** UC-CUSTOMER-LOGIN  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Registered customer)  
**Secondary Actors:** System, Google OAuth (if logging in with Google)

**Description:**  
A customer with an existing account logs into the system using email and password (or Google OAuth login). After successful login, the customer is authenticated and has access to personal account features, and is redirected to the homepage or previous page.

**Trigger:**  
Customer wants to log into their account and clicks the "Login" button on the system interface (usually in the upper right corner of the screen).

**Preconditions:**
1. Customer has an account in the system (registered previously)
2. Customer is not logged in (not authenticated) or has logged out

**Postconditions:**
1. Customer is successfully authenticated
2. Access token and refresh token are saved to localStorage
3. Customer information (email, fullName, role, accountId, customerId) is saved to localStorage
4. Customer is redirected to homepage (`/`) or previous page (if `redirectAfterLogin` exists)
5. System displays welcome message if redirected to homepage
6. Customer has access to personal account features (view orders, manage information, shop, etc.)

**Normal Flow:**
1. Customer accesses login page (from "Login" button in upper right corner or login link)
2. System displays login form with 2 methods: Email or Phone (UI has toggle, but API only supports Email)
3. Customer selects login method (default is Email)
4. Customer enters login information: Email (required), Password (required), and optional "Remember Me" checkbox
5. Customer clicks "Login" button to submit form
6. System performs client-side validation: checks if email and password are entered. If Phone login selected, displays error that it's not supported
7. If validation succeeds, system sends login information to backend for authentication
8. Backend authenticates login information: checks if email exists, password is correct, and creates authentication tokens
9. Backend returns successful authentication information including access token, refresh token, and customer information
10. System saves tokens and customer information for use in subsequent requests
11. System checks if there is a saved redirect URL from before:
    - If exists → Redirect to that URL (no welcome message)
    - If not → Redirect to homepage and save welcome message
12. If redirected to homepage, system displays welcome message with customer name

**Alternative Flows:**
1. **Login with Google:** Customer can choose to login using Google account instead of email/password. System handles OAuth, receives token from Google, and automatically creates or retrieves account. Then saves authentication information and redirects as in Normal Flow
2. **Customer does not have account:** If customer does not have an account, can click "Register now" link to navigate to registration page
3. **Forgot Password:** Customer can click "Forgot Password?" link to navigate to password recovery page
4. **Email pre-filled from registration:** If customer just registered and was redirected to login page, email will be automatically pre-filled

**Exceptions:**
1. **Email or password not entered:**
   - If email is empty → Display error: "Please enter email"
   - If password is empty → Display error: "Please enter password"
   - System displays error message and prompts customer to fill in complete information
2. **Email does not exist in system:** API returns error. System displays message: "Email or password is incorrect" (does not reveal whether email exists for security reasons)
3. **Password is incorrect:** API returns error. System displays message: "Email or password is incorrect" (does not reveal whether password is correct for security reasons)
4. **Account is locked or disabled:** API returns error. System displays message: "Your account has been locked. Please contact support."
5. **Network or server error:** If there is connection or server error, system displays message: "Login failed. Please try again later." and logs detailed error
6. **Unknown API error:** System formats and displays error message from API, customer can retry or contact support
7. **Error saving tokens:** If there is error saving tokens to localStorage, system displays warning and customer may need to login again

**Priority:** HIGH

**Business Rules:**
- BR-LOGIN-001: Only allow login with email and password (phone login is not supported by current API)
- BR-LOGIN-002: Email and password are required, cannot be empty
- BR-LOGIN-003: Access token and refresh token must be saved securely to localStorage
- BR-LOGIN-004: Customer information (email, fullName, role, accountId, customerId) must be saved after successful login
- BR-LOGIN-005: If `redirectAfterLogin` exists in localStorage, must redirect to that URL after login (no welcome message)
- BR-LOGIN-006: If no `redirectAfterLogin`, redirect to homepage and display welcome message
- BR-LOGIN-007: Must not reveal detailed information about login errors (email doesn't exist or password is wrong) for security reasons
- BR-LOGIN-008: Support Google OAuth login as an alternative method
- BR-LOGIN-009: "Remember Me" option (rememberMe) can be used to save session longer (currently no different logic, but can be extended)
- BR-LOGIN-010: After successful login, customer must have full access to personal account features

---

## Summary

Use case này mô tả quy trình đăng nhập của khách hàng vào hệ thống, bao gồm:

- **12 bước Normal Flow** từ truy cập trang đăng nhập đến chuyển hướng và hiển thị welcome message
- **4 Alternative Flows** cho đăng nhập bằng Google, đăng ký mới, quên mật khẩu, và email điền sẵn
- **7 Exception cases** xử lý các lỗi validation, email/password sai, tài khoản bị khóa, và lỗi hệ thống
- **10 Business Rules** quy định các quy tắc nghiệp vụ về authentication, token management, và redirect logic

Use case đảm bảo quy trình đăng nhập an toàn với validation đầy đủ, xử lý tokens đúng cách, và redirect logic thông minh để cải thiện trải nghiệm người dùng.

