# Use Case: Customer Chat with AI Agent

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-CHAT-AI-AGENT  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng nhập)  
**Secondary Actors:** System, AI Product Search Service, localStorage

**Description:**  
Khách hàng đã đăng nhập có thể chat với AI Agent để được tư vấn về sản phẩm âm thanh. AI Agent có thể giúp khách hàng tìm kiếm sản phẩm. **Lưu ý:** AI Agent không hỗ trợ tính năng nghe thử (demo), không hỗ trợ phối ghép thiết bị, và không hỗ trợ setup phòng nghe. Hệ thống hỗ trợ 3 chế độ phản hồi: tìm kiếm sản phẩm, tư vấn, và không liên quan. Tin nhắn được lưu vào localStorage.

**Trigger:**  
Khách hàng muốn được tư vấn về sản phẩm âm thanh và click nút "Chat Agent" (floating button) ở góc dưới bên phải màn hình.

**Preconditions:**
1. Khách hàng đã đăng nhập vào hệ thống (đã authenticated)
2. Khách hàng có customerId được lưu trong hệ thống
3. Trình duyệt hỗ trợ localStorage

**Postconditions:**
1. Tin nhắn được gửi thành công và hiển thị trong giao diện chat
2. Phản hồi từ AI Agent được hiển thị (sản phẩm, tư vấn, hoặc thông báo)
3. Tin nhắn được lưu vào localStorage để xem lại sau
4. Nếu có sản phẩm được đề xuất, khách hàng có thể click để xem chi tiết

**Normal Flow:**
1. Khách hàng click nút "Chat Agent" (floating button) ở góc dưới bên phải màn hình
2. Hệ thống kiểm tra authentication: nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
3. Hệ thống mở cửa sổ chat và load tin nhắn từ localStorage (nếu có) hoặc hiển thị tin nhắn chào mừng mặc định
4. Khách hàng nhập câu hỏi và click "Gửi" hoặc nhấn Enter
5. Hệ thống hiển thị tin nhắn của khách hàng và gửi request đến API AI Product Search
6. API xử lý và trả về phản hồi với một trong 3 chế độ: product_search (danh sách sản phẩm), advice (tư vấn), hoặc none (không liên quan)
7. Hệ thống hiển thị phản hồi từ AI Agent
8. Hệ thống lưu tin nhắn vào localStorage
9. Nếu có sản phẩm, khách hàng có thể click để xem chi tiết

**Alternative Flows:**
1. **Minimize/Restore chat window:** Khách hàng có thể minimize hoặc restore cửa sổ chat
2. **Xóa cuộc trò chuyện:** Khách hàng có thể xóa toàn bộ cuộc trò chuyện (sau khi xác nhận)
3. **Xem lại lịch sử:** Khi mở lại chat, hệ thống tự động load tin nhắn từ localStorage

**Exceptions:**
1. **Khách hàng chưa đăng nhập:** Hệ thống chuyển hướng đến trang đăng nhập
2. **Tin nhắn rỗng:** Hệ thống không gửi và nút "Gửi" bị disable
3. **Lỗi khi gọi API:** Hệ thống hiển thị tin nhắn lỗi: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
4. **Quota exceeded:** Hệ thống hiển thị: "Hết dung lượng hỏi AI rồi nha bạn! Hãy quay lại sau 1 thời gian nữa nha. Xin lỗi vì sự bất tiện này :("
5. **Token hết hạn:** Hệ thống tự động refresh token hoặc chuyển hướng đến trang đăng nhập
6. **Logout:** Hệ thống tự động xóa tin nhắn khỏi localStorage
7. **Câu hỏi về nghe thử, phối ghép, hoặc setup phòng nghe:** AI Agent thông báo không hỗ trợ và đề xuất liên hệ cửa hàng

**Priority:** HIGH

**Business Rules:**
- BR-AI-AGENT-001: Khách hàng phải đăng nhập để sử dụng Chat Agent
- BR-AI-AGENT-002: Tin nhắn không được rỗng
- BR-AI-AGENT-003: Hệ thống hỗ trợ 3 chế độ phản hồi: product_search, advice, none
- BR-AI-AGENT-004: Tin nhắn được lưu vào localStorage chỉ khi khách hàng đã đăng nhập
- BR-AI-AGENT-005: Khi logout, tất cả tin nhắn được xóa khỏi localStorage
- BR-AI-AGENT-006: AI Agent không hỗ trợ tính năng nghe thử (demo), phối ghép thiết bị, và setup phòng nghe
- BR-AI-AGENT-007: Hệ thống xử lý đặc biệt lỗi quota exceeded với thông báo thân thiện

---

### English

**ID and Name:** UC-CUSTOMER-CHAT-AI-AGENT  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Logged-in customer)  
**Secondary Actors:** System, AI Product Search Service, localStorage

**Description:**  
A logged-in customer can chat with AI Agent to get advice about audio products. AI Agent can help customer search for products. **Note:** AI Agent does not support demo/listening trial features, does not support equipment matching/combining, and does not support listening room setup. The system supports 3 response modes: product search, advice, and none. Messages are saved to localStorage.

**Trigger:**  
Customer wants to get advice about audio products and clicks "Chat Agent" button (floating button) at bottom right corner of screen.

**Preconditions:**
1. Customer is logged into the system (authenticated)
2. Customer has customerId stored in system
3. Browser supports localStorage

**Postconditions:**
1. Message is successfully sent and displayed in chat interface
2. Response from AI Agent is displayed (products, advice, or notification)
3. Messages are saved to localStorage for later viewing
4. If products are suggested, customer can click to view details

**Normal Flow:**
1. Customer clicks "Chat Agent" button (floating button) at bottom right corner of screen
2. System checks authentication: if not logged in, redirects to login page
3. System opens chat window and loads messages from localStorage (if any) or displays default welcome message
4. Customer enters question and clicks "Send" or presses Enter
5. System displays customer's message and sends request to AI Product Search API
6. API processes and returns response with one of 3 modes: product_search (product list), advice (advice), or none (out-of-scope)
7. System displays response from AI Agent
8. System saves messages to localStorage
9. If products are displayed, customer can click to view details

**Alternative Flows:**
1. **Minimize/Restore chat window:** Customer can minimize or restore chat window
2. **Clear conversation:** Customer can clear entire conversation (after confirmation)
3. **View chat history:** When reopening chat, system automatically loads messages from localStorage

**Exceptions:**
1. **Customer not logged in:** System redirects to login page
2. **Empty message:** System doesn't send and "Send" button is disabled
3. **Error calling API:** System displays error message: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
4. **Quota exceeded:** System displays: "Hết dung lượng hỏi AI rồi nha bạn! Hãy quay lại sau 1 thời gian nữa nha. Xin lỗi vì sự bất tiện này :("
5. **Token expired:** System automatically refreshes token or redirects to login page
6. **Logout:** System automatically clears messages from localStorage
7. **Question about demo, equipment matching, or room setup:** AI Agent notifies not supported and suggests contacting store directly

**Priority:** HIGH

**Business Rules:**
- BR-AI-AGENT-001: Customer must be logged in to use Chat Agent
- BR-AI-AGENT-002: Message cannot be empty
- BR-AI-AGENT-003: System supports 3 response modes: product_search, advice, none
- BR-AI-AGENT-004: Messages are saved to localStorage only when customer is logged in
- BR-AI-AGENT-005: When logout, all messages are cleared from localStorage
- BR-AI-AGENT-006: AI Agent does not support demo/listening trial, equipment matching, and room setup features
- BR-AI-AGENT-007: System handles quota exceeded error with friendly message

---

## Summary

Use case này mô tả quy trình khách hàng chat với AI Agent để được tư vấn về sản phẩm âm thanh, bao gồm:

- **9 bước Normal Flow** từ mở chat, nhập câu hỏi, gửi tin nhắn, gọi API, xử lý 3 chế độ phản hồi, đến lưu tin nhắn
- **3 Alternative Flows** cho minimize/restore, xóa cuộc trò chuyện, và xem lại lịch sử
- **7 Exception cases** xử lý các lỗi authentication, tin nhắn rỗng, lỗi API, quota exceeded, token hết hạn, logout, và các câu hỏi về tính năng không được hỗ trợ
- **7 Business Rules** quy định các quy tắc nghiệp vụ cơ bản

**Lưu ý:** AI Agent có giới hạn - không hỗ trợ tính năng nghe thử (demo), không hỗ trợ phối ghép thiết bị, và không hỗ trợ setup phòng nghe. Tính năng này giúp khách hàng tìm kiếm và được tư vấn về sản phẩm âm thanh một cách đơn giản.

