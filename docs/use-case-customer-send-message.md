# Use Case: Customer Send Message to Store

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-CUSTOMER-SEND-MESSAGE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Khách hàng đã đăng nhập)  
**Secondary Actors:** System, Firebase Firestore, Cloudinary (File Storage), Store Owner

**Description:**  
Khách hàng đã đăng nhập có thể gửi tin nhắn đến cửa hàng thông qua hệ thống chat realtime. Khách hàng có thể gửi tin nhắn văn bản, hình ảnh, video, hoặc kết hợp để hỏi về sản phẩm, đơn hàng, hoặc các vấn đề khác. Tin nhắn được gửi đến cả API backend và Firestore để đảm bảo lưu trữ và đồng bộ realtime.

**Trigger:**  
Khách hàng muốn chat với cửa hàng và click nút "Chat với cửa hàng" trên trang sản phẩm hoặc trang cửa hàng, hoặc mở conversation từ danh sách conversations.

**Preconditions:**
1. Khách hàng đã đăng nhập vào hệ thống (đã authenticated)
2. Khách hàng có customerId được lưu trong hệ thống
3. Khách hàng đã chọn cửa hàng để chat (có storeId)

**Postconditions:**
1. Tin nhắn được gửi thành công và hiển thị trong cuộc trò chuyện
2. Tin nhắn được lưu vào database và Firestore
3. Tin nhắn được đồng bộ realtime đến chủ cửa hàng
4. Danh sách conversations được cập nhật với tin nhắn mới nhất
5. Conversation được tạo tự động nếu chưa tồn tại

**Normal Flow:**
1. Khách hàng mở chat với cửa hàng (từ trang sản phẩm, trang cửa hàng, hoặc danh sách conversations)
2. Hệ thống kiểm tra authentication: nếu chưa đăng nhập, yêu cầu đăng nhập
3. Hệ thống hiển thị giao diện chat với danh sách tin nhắn trước đó (nếu có)
4. Hệ thống thiết lập kết nối realtime với Firestore để nhận tin nhắn mới từ cửa hàng
5. Khách hàng nhập tin nhắn văn bản vào ô nhập liệu hoặc chọn file (hình ảnh/video) để gửi
6. Nếu có file, khách hàng có thể xem preview trước khi gửi và có thể xóa file nếu không muốn gửi
7. Khách hàng click nút "Gửi" để gửi tin nhắn
8. Hệ thống kiểm tra tin nhắn có nội dung: phải có ít nhất văn bản hoặc file
9. Nếu có file, hệ thống upload file lên Cloudinary:
   - Validate file (format, size)
   - Upload hình ảnh hoặc video
   - Nhận URL của file đã upload
10. Hệ thống xác định loại tin nhắn dựa trên nội dung:
    - TEXT: Chỉ có văn bản, không có file
    - IMAGE: Chỉ có 1 hình ảnh, không có văn bản
    - VIDEO: Chỉ có 1 video, không có văn bản
    - MIXED: Có văn bản và/hoặc nhiều file
11. Hệ thống gửi tin nhắn đến cả API backend và Firestore:
    - Gửi đến API để lưu vào database
    - Gửi đến Firestore để đồng bộ realtime
12. Tin nhắn được hiển thị ngay lập tức trong giao diện của khách hàng
13. Firestore tự động đồng bộ tin nhắn đến giao diện của chủ cửa hàng (nếu đang mở conversation)
14. Hệ thống cập nhật danh sách conversations với tin nhắn mới nhất và thời gian
15. Hệ thống tự động scroll xuống tin nhắn mới nhất
16. Hệ thống xóa nội dung trong ô nhập liệu và file đã chọn

**Alternative Flows:**
1. **Xem danh sách conversations:** Khách hàng có thể xem danh sách tất cả conversations với các cửa hàng và chọn một để chat
2. **Gửi chỉ file không có văn bản:** Khách hàng có thể gửi chỉ hình ảnh hoặc video mà không cần nhập văn bản
3. **Gửi nhiều file cùng lúc:** Khách hàng có thể chọn và gửi nhiều hình ảnh/video trong một tin nhắn (loại MIXED)
4. **Xem preview file trước khi gửi:** Khách hàng có thể xem preview hình ảnh/video trước khi gửi và có thể xóa file nếu không muốn gửi
5. **Conversation tự động tạo:** Nếu chưa có conversation với cửa hàng, hệ thống tự động tạo conversation mới khi gửi tin nhắn đầu tiên

**Exceptions:**
1. **Khách hàng chưa đăng nhập:** Nếu khách hàng chưa đăng nhập và cố gắng chat, hệ thống yêu cầu đăng nhập trước và lưu redirect URL
2. **CustomerId không tồn tại:** Nếu không tìm thấy customerId, hệ thống hiển thị lỗi và yêu cầu đăng nhập lại
3. **StoreId không tồn tại:** Nếu không tìm thấy storeId, hệ thống hiển thị lỗi và không thể gửi tin nhắn
4. **File không hợp lệ:** 
   - Nếu file không phải là hình ảnh hoặc video → Hiển thị lỗi: "File không hợp lệ. Vui lòng chọn file hình ảnh hoặc video"
   - Nếu file quá lớn (ví dụ: video > 30MB) → Hiển thị lỗi: "File quá lớn. Vui lòng chọn file nhỏ hơn"
5. **Lỗi khi upload file:** Nếu có lỗi khi upload file lên Cloudinary, hệ thống hiển thị lỗi và khôi phục tin nhắn/file để khách hàng có thể thử lại
6. **Lỗi khi gửi tin nhắn đến API:** Nếu có lỗi khi gửi tin nhắn đến API backend, hệ thống hiển thị lỗi và khôi phục tin nhắn để khách hàng có thể thử lại
7. **Lỗi khi gửi tin nhắn đến Firestore:** Nếu có lỗi khi gửi tin nhắn đến Firestore, hệ thống vẫn có thể gửi qua API, nhưng không đồng bộ realtime. Hệ thống có thể hiển thị cảnh báo
8. **Mất kết nối Firestore:** Nếu mất kết nối với Firestore, hệ thống vẫn có thể gửi tin nhắn qua API, nhưng không nhận được tin nhắn realtime từ cửa hàng. Hệ thống có thể hiển thị cảnh báo về mất kết nối
9. **Token hết hạn:** Nếu access token hết hạn, hệ thống tự động refresh token. Nếu refresh token cũng hết hạn, hệ thống chuyển hướng đến trang đăng nhập
10. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server, hệ thống hiển thị thông báo lỗi và khách hàng có thể thử lại
11. **Tin nhắn trống:** Nếu khách hàng cố gắng gửi tin nhắn không có văn bản và không có file, hệ thống không gửi và yêu cầu nhập nội dung

**Priority:** HIGH

**Business Rules:**
- BR-SEND-001: Khách hàng phải đăng nhập để gửi tin nhắn
- BR-SEND-002: Tin nhắn phải có ít nhất văn bản hoặc file (không thể gửi tin nhắn trống)
- BR-SEND-003: Hình ảnh phải là file hợp lệ (JPG, PNG, WebP, GIF)
- BR-SEND-004: Video phải là file hợp lệ (MP4, WebM, OGG, MOV, AVI) và không vượt quá kích thước giới hạn (ví dụ: 30MB)
- BR-SEND-005: Tin nhắn được gửi đến cả API backend (để lưu vào database) và Firestore (để đồng bộ realtime)
- BR-SEND-006: Hệ thống hỗ trợ 4 loại tin nhắn: TEXT, IMAGE, VIDEO, MIXED
- BR-SEND-007: Nếu chưa có conversation với cửa hàng, hệ thống tự động tạo conversation mới khi gửi tin nhắn đầu tiên
- BR-SEND-008: Tin nhắn được hiển thị ngay lập tức trong giao diện của khách hàng sau khi gửi
- BR-SEND-009: Danh sách conversations được cập nhật với tin nhắn mới nhất và thời gian sau khi gửi thành công
- BR-SEND-010: Hệ thống tự động scroll xuống tin nhắn mới nhất sau khi gửi

---

### English

**ID and Name:** UC-CUSTOMER-SEND-MESSAGE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Customer (Logged-in customer)  
**Secondary Actors:** System, Firebase Firestore, Cloudinary (File Storage), Store Owner

**Description:**  
A logged-in customer can send messages to store through a realtime chat system. Customer can send text messages, images, videos, or combinations to ask about products, orders, or other issues. Messages are sent to both API backend and Firestore to ensure storage and realtime synchronization.

**Trigger:**  
Customer wants to chat with store and clicks "Chat with Store" button on product page or store page, or opens conversation from conversation list.

**Preconditions:**
1. Customer is logged into the system (authenticated)
2. Customer has customerId stored in system
3. Customer has selected store to chat with (has storeId)

**Postconditions:**
1. Message is successfully sent and displayed in conversation
2. Message is saved to database and Firestore
3. Message is synchronized in realtime to store owner
4. Conversation list is updated with latest message
5. Conversation is automatically created if it doesn't exist

**Normal Flow:**
1. Customer opens chat with store (from product page, store page, or conversation list)
2. System checks authentication: if not logged in, requires login
3. System displays chat interface with previous messages (if any)
4. System establishes realtime connection with Firestore to receive new messages from store
5. Customer enters text message in input field or selects files (images/videos) to send
6. If files exist, customer can preview before sending and can remove files if don't want to send
7. Customer clicks "Send" button to send message
8. System checks message has content: must have at least text or file
9. If files exist, system uploads files to Cloudinary:
   - Validate file (format, size)
   - Upload image or video
   - Receive URL of uploaded file
10. System determines message type based on content:
    - TEXT: Text only, no files
    - IMAGE: Single image only, no text
    - VIDEO: Single video only, no text
    - MIXED: Text and/or multiple files
11. System sends message to both API backend and Firestore:
    - Send to API to save to database
    - Send to Firestore for realtime sync
12. Message is displayed immediately in customer's interface
13. Firestore automatically syncs message to store owner's interface (if viewing conversation)
14. System updates conversation list with latest message and time
15. System automatically scrolls to latest message
16. System clears input field and selected files

**Alternative Flows:**
1. **View conversation list:** Customer can view list of all conversations with stores and select one to chat
2. **Send only files without text:** Customer can send only images or videos without entering text
3. **Send multiple files at once:** Customer can select and send multiple images/videos in one message (MIXED type)
4. **Preview files before sending:** Customer can preview images/videos before sending and can remove files if don't want to send
5. **Conversation auto-created:** If no conversation exists with store, system automatically creates new conversation when sending first message

**Exceptions:**
1. **Customer not logged in:** If customer is not logged in and tries to chat, system requires login first and saves redirect URL
2. **CustomerId does not exist:** If customerId is not found, system displays error and requires login again
3. **StoreId does not exist:** If storeId is not found, system displays error and cannot send message
4. **Invalid file:**
   - If file is not image or video → Display error: "Invalid file. Please select image or video file"
   - If file is too large (e.g., video > 30MB) → Display error: "File too large. Please select smaller file"
5. **Error uploading file:** If there is error uploading file to Cloudinary, system displays error and restores message/file so customer can retry
6. **Error sending message to API:** If there is error sending message to API backend, system displays error and restores message so customer can retry
7. **Error sending message to Firestore:** If there is error sending message to Firestore, system can still send via API, but won't sync realtime. System may display warning
8. **Firestore connection lost:** If connection to Firestore is lost, system can still send messages via API, but won't receive realtime messages from store. System may display warning about connection loss
9. **Token expired:** If access token expires, system automatically refreshes token. If refresh token also expires, system redirects to login page
10. **Network or server error:** If there is connection or server error, system displays error message and customer can retry
11. **Empty message:** If customer tries to send message with no text and no files, system doesn't send and requires content

**Priority:** HIGH

**Business Rules:**
- BR-SEND-001: Customer must be logged in to send messages
- BR-SEND-002: Message must have at least text or file (cannot send empty message)
- BR-SEND-003: Images must be valid files (JPG, PNG, WebP, GIF)
- BR-SEND-004: Videos must be valid files (MP4, WebM, OGG, MOV, AVI) and not exceed size limit (e.g., 30MB)
- BR-SEND-005: Messages are sent to both API backend (to save to database) and Firestore (for realtime sync)
- BR-SEND-006: System supports 4 message types: TEXT, IMAGE, VIDEO, MIXED
- BR-SEND-007: If no conversation exists with store, system automatically creates new conversation when sending first message
- BR-SEND-008: Message is displayed immediately in customer's interface after sending
- BR-SEND-009: Conversation list is updated with latest message and time after successful send
- BR-SEND-010: System automatically scrolls to latest message after sending

---

## Summary

Use case này mô tả quy trình khách hàng gửi tin nhắn đến cửa hàng, bao gồm:

- **16 bước Normal Flow** từ mở chat, nhập tin nhắn/chọn file, upload file, xác định loại tin nhắn, gửi đến API và Firestore, đến hiển thị và cập nhật danh sách conversations
- **5 Alternative Flows** cho xem danh sách conversations, gửi chỉ file, gửi nhiều file, preview file, và tự động tạo conversation
- **11 Exception cases** xử lý các lỗi authentication, file không hợp lệ, lỗi upload, lỗi gửi tin nhắn, mất kết nối Firestore, token hết hạn, và các lỗi khác
- **10 Business Rules** quy định các quy tắc nghiệp vụ về authentication, loại tin nhắn, file upload, và realtime sync

Use case đảm bảo quy trình gửi tin nhắn an toàn với authentication check, hỗ trợ đa dạng loại tin nhắn (text, image, video, mixed), upload file qua Cloudinary, đồng bộ realtime qua Firestore, và xử lý các trường hợp ngoại lệ một cách rõ ràng.

