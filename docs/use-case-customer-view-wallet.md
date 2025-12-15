# Use Case: Customer View Wallet

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-VIEW-WALLET  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng nhập)  
**Secondary Actors:** System, Wallet Service

**Description:**  
Khách hàng đã đăng nhập có thể xem thông tin ví của mình, bao gồm số dư hiện tại, trạng thái ví, và lịch sử giao dịch. Hệ thống hiển thị tổng quan ví và danh sách giao dịch với phân trang. Mỗi giao dịch hiển thị thời gian, loại giao dịch, trạng thái, số tiền, số dư sau giao dịch, và mô tả.

**Trigger:**  
Khách hàng truy cập trang Wallet trong phần Profile hoặc menu tài khoản.

**Preconditions:**
1. Khách hàng đã đăng nhập vào hệ thống (đã authenticated)
2. Khách hàng có customerId được lưu trong hệ thống
3. Khách hàng đã có ví trong hệ thống

**Postconditions:**
1. Thông tin ví được hiển thị (số dư, trạng thái, giao dịch cuối)
2. Lịch sử giao dịch được hiển thị với phân trang
3. Khách hàng có thể xem chi tiết từng giao dịch

**Normal Flow:**
1. Khách hàng truy cập trang Wallet
2. Hệ thống kiểm tra authentication: nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
3. Hệ thống lấy customerId từ thông tin đăng nhập
4. Hệ thống gọi API để lấy thông tin ví (số dư, trạng thái, giao dịch cuối)
5. Hệ thống gọi API để lấy lịch sử giao dịch (trang 1, 20 items mỗi trang)
6. Hệ thống hiển thị tổng quan ví:
   - Số dư hiện tại (định dạng tiền tệ)
   - Trạng thái ví (ACTIVE, INACTIVE, SUSPENDED) với màu sắc tương ứng
   - Thời gian giao dịch cuối cùng (nếu có)
7. Hệ thống hiển thị bảng lịch sử giao dịch với các cột:
   - Thời gian (định dạng ngày giờ Việt Nam)
   - Loại giao dịch (REFUND, QR, DEPOSIT, WITHDRAW, PENDING_HOLD, RELEASE_PENDING, ADJUSTMENT, PAYMENT, TRANSFER)
   - Trạng thái (SUCCESS, COMPLETED, PENDING, FAILED, CANCELLED, PROCESSING) với màu sắc tương ứng
   - Số tiền (màu xanh cho số dương, màu đỏ cho số âm)
   - Số dư sau giao dịch
   - Mô tả
8. Hệ thống hiển thị phân trang cho lịch sử giao dịch
9. Khách hàng có thể xem các trang tiếp theo hoặc thay đổi số lượng items mỗi trang

**Alternative Flows:**
1. **Thay đổi trang:** Khách hàng có thể click vào số trang hoặc nút next/previous để xem các trang tiếp theo
2. **Thay đổi số lượng items:** Khách hàng có thể thay đổi số lượng giao dịch hiển thị mỗi trang (mặc định 20)
3. **Refresh dữ liệu:** Khách hàng có thể refresh trang để cập nhật thông tin ví và lịch sử giao dịch mới nhất

**Exceptions:**
1. **Khách hàng chưa đăng nhập:** Hệ thống chuyển hướng đến trang đăng nhập
2. **CustomerId không tồn tại:** Hệ thống hiển thị lỗi: "Không tìm thấy thông tin khách hàng"
3. **Lỗi khi lấy thông tin ví:** Hệ thống hiển thị thông báo lỗi: "Không thể tải thông tin ví"
4. **Lỗi khi lấy lịch sử giao dịch:** Hệ thống hiển thị thông báo lỗi: "Không thể tải lịch sử ví"
5. **Không có ví:** Nếu khách hàng chưa có ví, hệ thống hiển thị: "Không có thông tin ví"
6. **Không có giao dịch:** Nếu chưa có giao dịch nào, hệ thống hiển thị: "Chưa có giao dịch"
7. **Token hết hạn:** Hệ thống tự động refresh token. Nếu refresh token cũng hết hạn, hệ thống chuyển hướng đến trang đăng nhập
8. **Lỗi mạng hoặc server:** Hệ thống hiển thị thông báo lỗi và khách hàng có thể thử lại

**Priority:** MEDIUM

**Business Rules:**
- BR-WALLET-001: Khách hàng phải đăng nhập để xem thông tin ví
- BR-WALLET-002: Số dư hiện tại được hiển thị với định dạng tiền tệ (VND)
- BR-WALLET-003: Trạng thái ví có 3 giá trị: ACTIVE (xanh), INACTIVE (mặc định), SUSPENDED (đỏ)
- BR-WALLET-004: Trạng thái giao dịch có màu sắc: SUCCESS/COMPLETED (xanh), PENDING/PROCESSING (cam), FAILED/CANCELLED (đỏ)
- BR-WALLET-005: Số tiền dương hiển thị màu xanh, số tiền âm hiển thị màu đỏ
- BR-WALLET-006: Lịch sử giao dịch được phân trang với mặc định 20 items mỗi trang
- BR-WALLET-007: Hệ thống hỗ trợ các loại giao dịch: REFUND, QR, DEPOSIT, WITHDRAW, PENDING_HOLD, RELEASE_PENDING, ADJUSTMENT, PAYMENT, TRANSFER
- BR-WALLET-008: Thời gian được hiển thị theo định dạng ngày giờ Việt Nam

---

### English

**ID and Name:** UC-CUSTOMER-VIEW-WALLET  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Logged-in customer)  
**Secondary Actors:** System, Wallet Service

**Description:**  
A logged-in customer can view their wallet information, including current balance, wallet status, and transaction history. The system displays wallet overview and transaction list with pagination. Each transaction displays time, transaction type, status, amount, balance after transaction, and description.

**Trigger:**  
Customer accesses Wallet page in Profile section or account menu.

**Preconditions:**
1. Customer is logged into the system (authenticated)
2. Customer has customerId stored in system
3. Customer has a wallet in the system

**Postconditions:**
1. Wallet information is displayed (balance, status, last transaction)
2. Transaction history is displayed with pagination
3. Customer can view details of each transaction

**Normal Flow:**
1. Customer accesses Wallet page
2. System checks authentication: if not logged in, redirects to login page
3. System gets customerId from login information
4. System calls API to get wallet information (balance, status, last transaction)
5. System calls API to get transaction history (page 1, 20 items per page)
6. System displays wallet overview:
   - Current balance (currency formatted)
   - Wallet status (ACTIVE, INACTIVE, SUSPENDED) with corresponding colors
   - Last transaction time (if any)
7. System displays transaction history table with columns:
   - Time (Vietnamese date-time format)
   - Transaction type (REFUND, QR, DEPOSIT, WITHDRAW, PENDING_HOLD, RELEASE_PENDING, ADJUSTMENT, PAYMENT, TRANSFER)
   - Status (SUCCESS, COMPLETED, PENDING, FAILED, CANCELLED, PROCESSING) with corresponding colors
   - Amount (green for positive, red for negative)
   - Balance after transaction
   - Description
8. System displays pagination for transaction history
9. Customer can view next pages or change number of items per page

**Alternative Flows:**
1. **Change page:** Customer can click page number or next/previous buttons to view other pages
2. **Change page size:** Customer can change number of transactions displayed per page (default 20)
3. **Refresh data:** Customer can refresh page to update wallet information and latest transaction history

**Exceptions:**
1. **Customer not logged in:** System redirects to login page
2. **CustomerId does not exist:** System displays error: "Không tìm thấy thông tin khách hàng"
3. **Error getting wallet info:** System displays error message: "Không thể tải thông tin ví"
4. **Error getting transaction history:** System displays error message: "Không thể tải lịch sử ví"
5. **No wallet:** If customer doesn't have wallet, system displays: "Không có thông tin ví"
6. **No transactions:** If there are no transactions, system displays: "Chưa có giao dịch"
7. **Token expired:** System automatically refreshes token. If refresh token also expires, system redirects to login page
8. **Network or server error:** System displays error message and customer can retry

**Priority:** MEDIUM

**Business Rules:**
- BR-WALLET-001: Customer must be logged in to view wallet information
- BR-WALLET-002: Current balance is displayed with currency format (VND)
- BR-WALLET-003: Wallet status has 3 values: ACTIVE (green), INACTIVE (default), SUSPENDED (red)
- BR-WALLET-004: Transaction status has colors: SUCCESS/COMPLETED (green), PENDING/PROCESSING (orange), FAILED/CANCELLED (red)
- BR-WALLET-005: Positive amounts display in green, negative amounts display in red
- BR-WALLET-006: Transaction history is paginated with default 20 items per page
- BR-WALLET-007: System supports transaction types: REFUND, QR, DEPOSIT, WITHDRAW, PENDING_HOLD, RELEASE_PENDING, ADJUSTMENT, PAYMENT, TRANSFER
- BR-WALLET-008: Time is displayed in Vietnamese date-time format

---

## Summary

Use case này mô tả quy trình khách hàng xem thông tin ví của mình, bao gồm:

- **9 bước Normal Flow** từ truy cập trang, kiểm tra authentication, gọi API lấy thông tin ví và lịch sử giao dịch, đến hiển thị tổng quan và bảng giao dịch với phân trang
- **3 Alternative Flows** cho thay đổi trang, thay đổi số lượng items, và refresh dữ liệu
- **8 Exception cases** xử lý các lỗi authentication, customerId không tồn tại, lỗi API, không có ví/giao dịch, token hết hạn, và lỗi mạng/server
- **8 Business Rules** quy định các quy tắc nghiệp vụ về authentication, định dạng hiển thị, màu sắc trạng thái, phân trang, và các loại giao dịch

Use case đảm bảo quy trình xem ví an toàn với authentication check, hiển thị thông tin rõ ràng với màu sắc phân biệt, hỗ trợ phân trang cho lịch sử giao dịch, và xử lý các trường hợp ngoại lệ một cách rõ ràng. Tính năng này giúp khách hàng theo dõi số dư và lịch sử giao dịch của ví một cách dễ dàng.

