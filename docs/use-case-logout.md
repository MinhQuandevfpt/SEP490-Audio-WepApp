# Use Case: Logout

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-LOGOUT  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer, Seller (Store Owner), Staff, Administrator  
**Secondary Actors:** System

**Description:**  
Người dùng đã đăng nhập (khách hàng, chủ cửa hàng, nhân viên cửa hàng, hoặc quản trị viên) có thể đăng xuất khỏi tài khoản của mình. Hệ thống sẽ xóa tất cả thông tin xác thực (tokens, user data) khỏi localStorage và chuyển hướng người dùng đến trang đăng nhập tương ứng với role của họ.

**Trigger:**  
Người dùng muốn đăng xuất và click nút "Đăng xuất" trên giao diện hệ thống (thường ở header, menu dropdown, hoặc dashboard layout).

**Preconditions:**
1. Người dùng đã đăng nhập vào hệ thống (đã authenticated)
2. Người dùng có quyền truy cập vào nút/logout function

**Postconditions:**
1. Tất cả tokens (access token, refresh token) được xóa khỏi localStorage
2. Tất cả thông tin người dùng (user data, accountId, customerId, etc.) được xóa khỏi localStorage
3. Session storage được xóa (nếu có, ví dụ: welcome message cho Customer)
4. Người dùng được chuyển hướng đến trang đăng nhập tương ứng với role:
   - Customer → Trang chủ (`/`) hoặc trang đăng nhập (`/customer/login`)
   - Seller → `/seller/login`
   - Staff → `/store-staff/login`
   - Admin → `/admin/login`
5. Người dùng không còn quyền truy cập các tính năng yêu cầu authentication
6. Các tab/window khác của cùng trình duyệt được thông báo về việc logout (nếu có)

**Normal Flow:**
1. Người dùng click nút "Đăng xuất" (có thể từ header, menu dropdown, hoặc dashboard layout)
2. Hệ thống xác định role của người dùng hiện tại (Customer, Seller, Staff, hoặc Admin)
3. Hệ thống gọi logout service tương ứng với role:
   - Customer → `CustomerAuthService.logout()`
   - Seller → `SellerAuthService.logout()`
   - Staff → `StoreStaffAuthService.logout()`
   - Admin → `AdminAuthService.logout()`
4. Logout service gọi `RefreshTokenService.clearAllData(userType)` để xóa tất cả dữ liệu:
   - Access token
   - Refresh token
   - Token type
   - User information (email, name, role, accountId, customerId, etc.)
   - Các keys cũ (backward compatibility)
   - Session storage data (nếu có)
5. Đối với Customer, hệ thống thực hiện thêm:
   - Set flag `isLoggingOut` trong sessionStorage để prevent welcome popup
   - Dispatch storage event để notify các tab/window khác
   - Set `authStateChanged` flag trong localStorage
6. Hệ thống chuyển hướng người dùng đến trang đăng nhập tương ứng:
   - Customer → Trang chủ (`/`) hoặc `/customer/login`
   - Seller → `/seller/login`
   - Staff → `/store-staff/login`
   - Admin → `/admin/login`
7. Trang đăng nhập được hiển thị và người dùng có thể đăng nhập lại nếu muốn

**Alternative Flows:**
1. **Logout từ nhiều tab/window:** Nếu người dùng đăng xuất từ một tab, các tab khác của cùng trình duyệt sẽ được thông báo qua storage event và tự động cập nhật trạng thái (đối với Customer)
2. **Logout tự động do lỗi xác thực:** Nếu có lỗi xác thực nghiêm trọng (ví dụ: refresh token hết hạn, token không hợp lệ), hệ thống có thể tự động logout người dùng và chuyển hướng đến trang đăng nhập
3. **Logout từ menu dropdown:** Người dùng có thể click "Đăng xuất" từ menu dropdown profile thay vì nút logout trực tiếp

**Exceptions:**
1. **Lỗi khi xóa localStorage:** Nếu có lỗi khi xóa dữ liệu từ localStorage (ví dụ: localStorage bị disable, quota exceeded), hệ thống vẫn cố gắng chuyển hướng người dùng đến trang đăng nhập. Dữ liệu có thể vẫn còn trong localStorage nhưng sẽ không thể sử dụng vì đã chuyển hướng
2. **Lỗi khi dispatch storage event:** Nếu không thể dispatch storage event (ví dụ: browser không hỗ trợ), hệ thống sử dụng custom event `authStateChanged` làm phương án dự phòng (đối với Customer)
3. **Lỗi mạng khi chuyển hướng:** Nếu có lỗi khi chuyển hướng, hệ thống vẫn cố gắng force redirect bằng `window.location.href`
4. **Người dùng chưa đăng nhập:** Nếu người dùng chưa đăng nhập nhưng vẫn click logout (edge case), hệ thống vẫn thực hiện clear data và chuyển hướng đến trang đăng nhập
5. **Lỗi không xác định:** Nếu có lỗi không xác định trong quá trình logout, hệ thống log lỗi và vẫn cố gắng chuyển hướng người dùng đến trang đăng nhập để đảm bảo trải nghiệm

**Priority:** MEDIUM

**Business Rules:**
- BR-LOGOUT-001: Logout phải xóa tất cả tokens (access token, refresh token) khỏi localStorage
- BR-LOGOUT-002: Logout phải xóa tất cả thông tin người dùng (user data, accountId, customerId, etc.) khỏi localStorage
- BR-LOGOUT-003: Logout phải xóa session storage data (nếu có) để tránh hiển thị welcome message sau khi logout
- BR-LOGOUT-004: Sau khi logout, người dùng phải được chuyển hướng đến trang đăng nhập tương ứng với role của họ
- BR-LOGOUT-005: Customer sau khi logout được chuyển về trang chủ (`/`) hoặc trang đăng nhập (`/customer/login`)
- BR-LOGOUT-006: Seller, Staff, Admin sau khi logout được chuyển đến trang đăng nhập tương ứng (`/seller/login`, `/store-staff/login`, `/admin/login`)
- BR-LOGOUT-007: Logout phải thông báo cho các tab/window khác (đối với Customer) để đồng bộ trạng thái authentication
- BR-LOGOUT-008: Sau khi logout, người dùng không còn quyền truy cập các tính năng yêu cầu authentication cho đến khi đăng nhập lại
- BR-LOGOUT-009: Logout phải xóa cả các keys cũ (backward compatibility) để đảm bảo cleanup hoàn toàn
- BR-LOGOUT-010: Logout có thể được gọi từ nhiều nơi (header, menu, dashboard layout) và phải hoạt động nhất quán

---

### English

**ID and Name:** UC-LOGOUT  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer, Seller (Store Owner), Staff, Administrator  
**Secondary Actors:** System

**Description:**  
A logged-in user (customer, store owner, store staff, or administrator) can log out of their account. The system will remove all authentication information (tokens, user data) from localStorage and redirect the user to the login page corresponding to their role.

**Trigger:**  
User wants to log out and clicks the "Logout" button on the system interface (usually in header, menu dropdown, or dashboard layout).

**Preconditions:**
1. User is logged into the system (authenticated)
2. User has access to logout button/function

**Postconditions:**
1. All tokens (access token, refresh token) are removed from localStorage
2. All user information (user data, accountId, customerId, etc.) is removed from localStorage
3. Session storage is cleared (if any, e.g., welcome message for Customer)
4. User is redirected to login page corresponding to their role:
   - Customer → Homepage (`/`) or login page (`/customer/login`)
   - Seller → `/seller/login`
   - Staff → `/store-staff/login`
   - Admin → `/admin/login`
5. User no longer has access to features requiring authentication
6. Other tabs/windows of the same browser are notified about logout (if applicable)

**Normal Flow:**
1. User clicks "Logout" button (from header, menu dropdown, or dashboard layout)
2. System identifies current user's role (Customer, Seller, Staff, or Admin)
3. System calls corresponding logout service based on role:
   - Customer → `CustomerAuthService.logout()`
   - Seller → `SellerAuthService.logout()`
   - Staff → `StoreStaffAuthService.logout()`
   - Admin → `AdminAuthService.logout()`
4. Logout service calls `RefreshTokenService.clearAllData(userType)` to remove all data:
   - Access token
   - Refresh token
   - Token type
   - User information (email, name, role, accountId, customerId, etc.)
   - Old keys (backward compatibility)
   - Session storage data (if any)
5. For Customer, system additionally:
   - Sets `isLoggingOut` flag in sessionStorage to prevent welcome popup
   - Dispatches storage event to notify other tabs/windows
   - Sets `authStateChanged` flag in localStorage
6. System redirects user to corresponding login page:
   - Customer → Homepage (`/`) or `/customer/login`
   - Seller → `/seller/login`
   - Staff → `/store-staff/login`
   - Admin → `/admin/login`
7. Login page is displayed and user can login again if desired

**Alternative Flows:**
1. **Logout from multiple tabs/windows:** If user logs out from one tab, other tabs of the same browser will be notified via storage event and automatically update state (for Customer)
2. **Automatic logout due to authentication error:** If there is a serious authentication error (e.g., refresh token expired, invalid token), system may automatically logout user and redirect to login page
3. **Logout from menu dropdown:** User can click "Logout" from profile menu dropdown instead of direct logout button

**Exceptions:**
1. **Error clearing localStorage:** If there is error clearing data from localStorage (e.g., localStorage disabled, quota exceeded), system still attempts to redirect user to login page. Data may remain in localStorage but cannot be used because user is redirected
2. **Error dispatching storage event:** If unable to dispatch storage event (e.g., browser doesn't support), system uses custom event `authStateChanged` as fallback (for Customer)
3. **Network error during redirect:** If there is error during redirect, system still attempts to force redirect using `window.location.href`
4. **User not logged in:** If user is not logged in but still clicks logout (edge case), system still performs clear data and redirects to login page
5. **Unknown error:** If there is unknown error during logout process, system logs error and still attempts to redirect user to login page to ensure user experience

**Priority:** MEDIUM

**Business Rules:**
- BR-LOGOUT-001: Logout must remove all tokens (access token, refresh token) from localStorage
- BR-LOGOUT-002: Logout must remove all user information (user data, accountId, customerId, etc.) from localStorage
- BR-LOGOUT-003: Logout must clear session storage data (if any) to prevent welcome message display after logout
- BR-LOGOUT-004: After logout, user must be redirected to login page corresponding to their role
- BR-LOGOUT-005: Customer after logout is redirected to homepage (`/`) or login page (`/customer/login`)
- BR-LOGOUT-006: Seller, Staff, Admin after logout are redirected to corresponding login pages (`/seller/login`, `/store-staff/login`, `/admin/login`)
- BR-LOGOUT-007: Logout must notify other tabs/windows (for Customer) to synchronize authentication state
- BR-LOGOUT-008: After logout, user no longer has access to features requiring authentication until logging in again
- BR-LOGOUT-009: Logout must remove old keys (backward compatibility) to ensure complete cleanup
- BR-LOGOUT-010: Logout can be called from multiple places (header, menu, dashboard layout) and must work consistently

---

## Summary

Use case này mô tả quy trình đăng xuất của người dùng, bao gồm:

- **7 bước Normal Flow** từ click nút logout, xác định role, gọi logout service, xóa dữ liệu, đến chuyển hướng về trang đăng nhập
- **3 Alternative Flows** cho logout từ nhiều tab, logout tự động do lỗi, và logout từ menu dropdown
- **5 Exception cases** xử lý các lỗi khi xóa localStorage, dispatch event, chuyển hướng, và các edge cases
- **10 Business Rules** quy định các quy tắc nghiệp vụ về cleanup dữ liệu, redirect logic, và đồng bộ trạng thái

Use case đảm bảo quy trình logout an toàn và hoàn chỉnh, xóa sạch tất cả dữ liệu authentication, chuyển hướng đúng trang đăng nhập theo role, và xử lý các trường hợp ngoại lệ một cách rõ ràng. Use case hỗ trợ tất cả 4 role: Customer, Seller, Staff, và Admin.

