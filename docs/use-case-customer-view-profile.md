# Use Case: Customer View Profile

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-VIEW-PROFILE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng nhập)  
**Secondary Actors:** System

**Description:**  
Khách hàng đã đăng nhập có thể xem trang tài khoản (profile page) của mình để xem thông tin cá nhân, quản lý địa chỉ, xem lịch sử đơn hàng, bảo hành, đánh giá, lịch sử hoàn trả, ví nền tảng, thông báo, và đổi mật khẩu. Trang profile có nhiều tabs để khách hàng có thể điều hướng giữa các phần khác nhau.

**Trigger:**  
Khách hàng muốn xem thông tin tài khoản và click vào icon người dùng (user icon) trên header hoặc truy cập trực tiếp đường dẫn `/account`.

**Preconditions:**
1. Khách hàng đã đăng nhập vào hệ thống (đã authenticated)
2. Khách hàng có customerId được lưu trong localStorage
3. Khách hàng có quyền truy cập trang profile (protected route)

**Postconditions:**
1. Trang profile được hiển thị với thông tin khách hàng
2. Thông tin profile được load từ API hoặc cache và hiển thị
3. Khách hàng có thể xem và điều hướng giữa các tabs khác nhau
4. Khách hàng có thể thực hiện các hành động khác từ trang profile (xem đơn hàng, quản lý địa chỉ, etc.)

**Normal Flow:**
1. Khách hàng click vào icon người dùng trên header hoặc truy cập trang tài khoản
2. Hệ thống kiểm tra authentication: nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
3. Nếu đã đăng nhập, hệ thống lấy thông tin định danh khách hàng từ hệ thống
4. Hệ thống load dữ liệu profile từ hệ thống (có thể sử dụng cache để tối ưu performance)
5. Hệ thống hiển thị trang profile với sidebar navigation và các tabs chính:
   - Thông tin cá nhân: Hiển thị thông tin cơ bản, điểm tích lũy, cấp độ thành viên
   - Sổ địa chỉ: Quản lý địa chỉ giao hàng
   - Đơn hàng: Xem lịch sử đơn hàng
   - Bảo hành: Quản lý bảo hành sản phẩm
   - Đánh giá sản phẩm: Xem và chỉnh sửa đánh giá
   - Lịch sử hoàn trả: Xem lịch sử hoàn trả
   - Ví nền tảng: Quản lý ví, số dư, lịch sử giao dịch
   - Thông báo: Xem thông báo từ hệ thống
   - Đổi mật khẩu: Đổi mật khẩu tài khoản
6. Tab mặc định là "Thông tin cá nhân" nếu không có tab nào được chỉ định
7. Hệ thống hiển thị thông tin profile bao gồm thông tin cơ bản, thông tin thành viên, và các thống kê liên quan
8. Khách hàng có thể click vào các tabs khác để xem các phần tương ứng
9. Khách hàng có thể thực hiện các hành động từ trang profile (xem chi tiết đơn hàng, quản lý địa chỉ, etc.)

**Alternative Flows:**
1. **Truy cập trực tiếp tab cụ thể:** Khách hàng có thể truy cập trực tiếp một tab cụ thể thông qua đường dẫn tương ứng
2. **Sử dụng cache:** Nếu dữ liệu đã được cache, hệ thống sử dụng cache để hiển thị nhanh hơn, sau đó có thể refresh từ server nếu cần
3. **Quay lại từ trang khác:** Khách hàng có thể quay lại trang profile từ các trang khác trong hệ thống

**Exceptions:**
1. **Khách hàng chưa đăng nhập:** Nếu khách hàng chưa đăng nhập và truy cập trang profile, hệ thống chuyển hướng đến trang đăng nhập và lưu redirect URL để quay lại sau khi đăng nhập
2. **Thông tin định danh không tồn tại:** Nếu không tìm thấy thông tin định danh khách hàng, hệ thống hiển thị lỗi và có thể chuyển hướng đến trang đăng nhập
3. **Lỗi khi load dữ liệu:** Nếu có lỗi khi load dữ liệu profile từ server, hệ thống hiển thị thông báo lỗi hoặc loading state và có thể hiển thị dữ liệu tạm thời nếu có
4. **Token hết hạn:** Nếu access token hết hạn, hệ thống tự động refresh token. Nếu refresh token cũng hết hạn, hệ thống chuyển hướng đến trang đăng nhập
5. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server, hệ thống hiển thị thông báo lỗi và log lỗi chi tiết
6. **Lỗi không xác định:** Hệ thống format và hiển thị thông báo lỗi, khách hàng có thể thử lại hoặc liên hệ support
7. **Dữ liệu không hợp lệ:** Nếu server trả về dữ liệu không đúng format, hệ thống xử lý gracefully và hiển thị thông báo lỗi phù hợp

**Priority:** MEDIUM

**Business Rules:**
- BR-PROFILE-001: Trang profile chỉ có thể truy cập khi khách hàng đã đăng nhập
- BR-PROFILE-002: Thông tin định danh khách hàng phải được lưu sau khi đăng nhập thành công
- BR-PROFILE-003: Dữ liệu profile được cache để tối ưu performance
- BR-PROFILE-004: Tab mặc định là "Thông tin cá nhân" nếu không có tab nào được chỉ định
- BR-PROFILE-005: Khách hàng chỉ có thể xem profile của chính mình, không thể xem profile của khách hàng khác
- BR-PROFILE-006: Thông tin profile phải được load từ server để đảm bảo dữ liệu mới nhất
- BR-PROFILE-007: Hệ thống hỗ trợ truy cập trực tiếp các tabs thông qua đường dẫn tương ứng
- BR-PROFILE-008: Nếu có lỗi authentication, hệ thống phải chuyển hướng đến trang đăng nhập và lưu redirect URL
- BR-PROFILE-009: Các tabs trong profile page cho phép khách hàng quản lý toàn bộ thông tin và hoạt động liên quan đến tài khoản

---

### English

**ID and Name:** UC-CUSTOMER-VIEW-PROFILE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Logged-in customer)  
**Secondary Actors:** System

**Description:**  
A logged-in customer can view their account (profile page) to see personal information, manage addresses, view order history, warranty, reviews, return history, platform wallet, notifications, and change password. The profile page has multiple tabs for customers to navigate between different sections.

**Trigger:**  
Customer wants to view account information and clicks the user icon on header or directly accesses the `/account` route.

**Preconditions:**
1. Customer is logged into the system (authenticated)
2. Customer has customerId stored in localStorage
3. Customer has access to profile page (protected route)

**Postconditions:**
1. Profile page is displayed with customer information
2. Profile information is loaded from API or cache and displayed
3. Customer can view and navigate between different tabs
4. Customer can perform other actions from profile page (view orders, manage addresses, etc.)

**Normal Flow:**
1. Customer clicks user icon on header or accesses profile page
2. System checks authentication: if not logged in, redirects to login page
3. If logged in, system retrieves customer identification information from system
4. System loads profile data from system (may use cache to optimize performance)
5. System displays profile page with sidebar navigation and main tabs:
   - Personal Information: Displays basic information, loyalty points, membership level
   - Address Book: Manage delivery addresses
   - Orders: View order history
   - Warranty: Manage product warranty
   - Product Reviews: View and edit reviews
   - Return History: View return history
   - Platform Wallet: Manage wallet, balance, transaction history
   - Notifications: View system notifications
   - Change Password: Change account password
6. Default tab is "Personal Information" if no tab is specified
7. System displays profile information including basic information, membership information, and related statistics
8. Customer can click on different tabs to view corresponding sections
9. Customer can perform actions from profile page (view order details, manage addresses, etc.)

**Alternative Flows:**
1. **Direct access to specific tab:** Customer can directly access a specific tab via corresponding route
2. **Using cache:** If data is already cached, system uses cache for faster display, then may refresh from server if needed
3. **Return from other pages:** Customer can return to profile page from other pages in the system

**Exceptions:**
1. **Customer not logged in:** If customer is not logged in and accesses profile page, system redirects to login page and saves redirect URL to return after login
2. **Customer identification does not exist:** If customer identification information is not found, system displays error and may redirect to login page
3. **Error loading data:** If there is error loading profile data from server, system displays error message or loading state and may display temporary data if available
4. **Token expired:** If access token expires, system automatically refreshes token. If refresh token also expires, system redirects to login page
5. **Network or server error:** If there is connection or server error, system displays error message and logs detailed error
6. **Unknown error:** System formats and displays error message, customer can retry or contact support
7. **Invalid data:** If server returns data in incorrect format, system handles gracefully and displays appropriate error message

**Priority:** MEDIUM

**Business Rules:**
- BR-PROFILE-001: Profile page can only be accessed when customer is logged in
- BR-PROFILE-002: Customer identification information must be stored after successful login
- BR-PROFILE-003: Profile data is cached to optimize performance
- BR-PROFILE-004: Default tab is "Personal Information" if no tab is specified
- BR-PROFILE-005: Customer can only view their own profile, cannot view other customers' profiles
- BR-PROFILE-006: Profile information must be loaded from server to ensure latest data
- BR-PROFILE-007: System supports direct access to tabs via corresponding routes
- BR-PROFILE-008: If there is authentication error, system must redirect to login page and save redirect URL
- BR-PROFILE-009: Tabs in profile page allow customer to manage all information and activities related to their account

---

## Summary

Use case này mô tả quy trình khách hàng xem trang tài khoản (profile page), bao gồm:

- **9 bước Normal Flow** từ click icon người dùng, kiểm tra authentication, load dữ liệu, đến hiển thị trang profile với các tabs
- **3 Alternative Flows** cho truy cập trực tiếp tab cụ thể, sử dụng cache, và quay lại từ trang khác
- **7 Exception cases** xử lý các lỗi authentication, thông tin định danh không tồn tại, lỗi load dữ liệu, token hết hạn, lỗi mạng/server, và dữ liệu không hợp lệ
- **9 Business Rules** quy định các quy tắc nghiệp vụ về authentication, caching, tab navigation, và quyền truy cập

Use case đảm bảo quy trình xem profile an toàn với authentication check, tối ưu performance với caching, hỗ trợ nhiều tabs để quản lý toàn bộ thông tin tài khoản, và xử lý các trường hợp ngoại lệ một cách rõ ràng. Trang profile là trung tâm quản lý tài khoản của khách hàng với nhiều tabs khác nhau.

