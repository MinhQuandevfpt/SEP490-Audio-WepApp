# Use Case: Store Reply to Customer Message

## Use Case Specification

### Tiếng Việt

**ID and Name:** UC-STORE-REPLY-MESSAGE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Store Owner (Seller - Chủ cửa hàng đã đăng nhập)  
**Secondary Actors:** System, Firebase Firestore, Cloudinary (File Storage), Customer

**Description:**  
Chủ cửa hàng đã đăng nhập có thể xem và trả lời tin nhắn từ khách hàng thông qua hệ thống chat realtime. Chủ cửa hàng có thể xem danh sách conversations với các khách hàng, xem tin nhắn, đánh dấu đã đọc, và trả lời bằng tin nhắn văn bản, hình ảnh, video, hoặc kết hợp. Tin nhắn được gửi đến cả API backend và Firestore để đảm bảo lưu trữ và đồng bộ realtime.

**Trigger:**  
Chủ cửa hàng muốn trả lời khách hàng và truy cập trang Messages hoặc chọn conversation từ danh sách conversations.

**Preconditions:**
1. Chủ cửa hàng đã đăng nhập vào hệ thống (đã authenticated)
2. Chủ cửa hàng có storeId được lưu trong hệ thống
3. Có conversation với khách hàng (đã được tạo khi khách hàng gửi tin nhắn đầu tiên)

**Postconditions:**
1. Tin nhắn trả lời được gửi thành công và hiển thị trong cuộc trò chuyện
2. Tin nhắn được lưu vào database và Firestore
3. Tin nhắn được đồng bộ realtime đến khách hàng
4. Tin nhắn từ khách hàng được đánh dấu là đã đọc
5. Danh sách conversations được cập nhật với tin nhắn mới nhất

**Normal Flow:**
1. Chủ cửa hàng truy cập trang Messages hoặc mở conversation từ danh sách
2. Hệ thống kiểm tra authentication: nếu chưa đăng nhập, yêu cầu đăng nhập
3. Hệ thống hiển thị danh sách conversations với các khách hàng, bao gồm:
   - Tên khách hàng
   - Tin nhắn cuối cùng
   - Thời gian tin nhắn cuối cùng
   - Số lượng tin nhắn chưa đọc (unread count)
4. Chủ cửa hàng chọn một conversation để xem tin nhắn
5. Hệ thống load tin nhắn từ API và thiết lập kết nối realtime với Firestore để nhận tin nhắn mới
6. Hệ thống đánh dấu tất cả tin nhắn từ khách hàng trong conversation này là đã đọc
7. Hệ thống cập nhật unread count của conversation này về 0
8. Chủ cửa hàng xem tin nhắn từ khách hàng (văn bản, hình ảnh, video)
9. Chủ cửa hàng nhập tin nhắn trả lời vào ô nhập liệu hoặc chọn file (hình ảnh/video) để gửi
10. Nếu có file, chủ cửa hàng có thể xem preview trước khi gửi và có thể xóa file nếu không muốn gửi
11. Chủ cửa hàng click nút "Gửi" để gửi tin nhắn
12. Hệ thống kiểm tra tin nhắn có nội dung: phải có ít nhất văn bản hoặc file
13. Nếu có file, hệ thống upload file lên Cloudinary:
    - Validate file (format, size)
    - Upload hình ảnh hoặc video
    - Nhận URL của file đã upload
14. Hệ thống xác định loại tin nhắn dựa trên nội dung:
    - TEXT: Chỉ có văn bản, không có file
    - IMAGE: Chỉ có 1 hình ảnh, không có văn bản
    - VIDEO: Chỉ có 1 video, không có văn bản
    - MIXED: Có văn bản và/hoặc nhiều file
15. Hệ thống gửi tin nhắn đến cả API backend và Firestore:
    - Gửi đến API để lưu vào database
    - Gửi đến Firestore để đồng bộ realtime
16. Tin nhắn được hiển thị ngay lập tức trong giao diện của chủ cửa hàng
17. Firestore tự động đồng bộ tin nhắn đến giao diện của khách hàng (nếu đang mở conversation)
18. Hệ thống cập nhật danh sách conversations với tin nhắn mới nhất và thời gian
19. Hệ thống tự động scroll xuống tin nhắn mới nhất
20. Hệ thống xóa nội dung trong ô nhập liệu và file đã chọn

**Alternative Flows:**
1. **Xem danh sách conversations:** Chủ cửa hàng có thể xem danh sách tất cả conversations với các khách hàng, được sắp xếp theo thời gian tin nhắn cuối cùng (mới nhất trước)
2. **Gửi chỉ file không có văn bản:** Chủ cửa hàng có thể gửi chỉ hình ảnh hoặc video mà không cần nhập văn bản
3. **Gửi nhiều file cùng lúc:** Chủ cửa hàng có thể chọn và gửi nhiều hình ảnh/video trong một tin nhắn (loại MIXED)
4. **Xem preview file trước khi gửi:** Chủ cửa hàng có thể xem preview hình ảnh/video trước khi gửi và có thể xóa file nếu không muốn gửi
5. **Nhận tin nhắn realtime:** Khi khách hàng gửi tin nhắn mới, Firestore tự động cập nhật và hiển thị tin nhắn ngay lập tức trong giao diện của chủ cửa hàng (nếu đang mở conversation đó)
6. **Đánh dấu đã đọc tự động:** Khi chủ cửa hàng mở conversation, hệ thống tự động đánh dấu tất cả tin nhắn từ khách hàng là đã đọc

**Exceptions:**
1. **Chủ cửa hàng chưa đăng nhập:** Nếu chủ cửa hàng chưa đăng nhập, hệ thống yêu cầu đăng nhập trước
2. **StoreId không tồn tại:** Nếu không tìm thấy storeId, hệ thống hiển thị lỗi và không thể xem/gửi tin nhắn
3. **Không có conversations:** Nếu không có conversations nào, hệ thống hiển thị danh sách trống với thông báo "Chưa có cuộc trò chuyện nào"
4. **Conversation không tồn tại:** Nếu conversation được chọn không tồn tại, hệ thống hiển thị lỗi và không thể load tin nhắn
5. **File không hợp lệ:** 
   - Nếu file không phải là hình ảnh hoặc video → Hiển thị lỗi: "File không hợp lệ. Vui lòng chọn file hình ảnh hoặc video"
   - Nếu file quá lớn (ví dụ: video > 30MB) → Hiển thị lỗi: "File quá lớn. Vui lòng chọn file nhỏ hơn"
6. **Lỗi khi upload file:** Nếu có lỗi khi upload file lên Cloudinary, hệ thống hiển thị lỗi và khôi phục tin nhắn/file để chủ cửa hàng có thể thử lại
7. **Lỗi khi gửi tin nhắn đến API:** Nếu có lỗi khi gửi tin nhắn đến API backend, hệ thống hiển thị lỗi và khôi phục tin nhắn để chủ cửa hàng có thể thử lại
8. **Lỗi khi gửi tin nhắn đến Firestore:** Nếu có lỗi khi gửi tin nhắn đến Firestore, hệ thống vẫn có thể gửi qua API, nhưng không đồng bộ realtime. Hệ thống có thể hiển thị cảnh báo
9. **Mất kết nối Firestore:** Nếu mất kết nối với Firestore, hệ thống vẫn có thể gửi tin nhắn qua API, nhưng không nhận được tin nhắn realtime từ khách hàng. Hệ thống có thể hiển thị cảnh báo về mất kết nối
10. **Token hết hạn:** Nếu access token hết hạn, hệ thống tự động refresh token. Nếu refresh token cũng hết hạn, hệ thống chuyển hướng đến trang đăng nhập
11. **Lỗi mạng hoặc server:** Nếu có lỗi kết nối hoặc server, hệ thống hiển thị thông báo lỗi và chủ cửa hàng có thể thử lại
12. **Tin nhắn trống:** Nếu chủ cửa hàng cố gắng gửi tin nhắn không có văn bản và không có file, hệ thống không gửi và yêu cầu nhập nội dung
13. **Lỗi khi đánh dấu đã đọc:** Nếu có lỗi khi đánh dấu tin nhắn là đã đọc, hệ thống vẫn tiếp tục hoạt động bình thường nhưng có thể log lỗi

**Priority:** HIGH

**Business Rules:**
- BR-REPLY-001: Chủ cửa hàng phải đăng nhập để xem và trả lời tin nhắn
- BR-REPLY-002: Chủ cửa hàng chỉ có thể xem conversations của cửa hàng mình
- BR-REPLY-003: Tin nhắn phải có ít nhất văn bản hoặc file (không thể gửi tin nhắn trống)
- BR-REPLY-004: Hình ảnh phải là file hợp lệ (JPG, PNG, WebP, GIF)
- BR-REPLY-005: Video phải là file hợp lệ (MP4, WebM, OGG, MOV, AVI) và không vượt quá kích thước giới hạn (ví dụ: 30MB)
- BR-REPLY-006: Tin nhắn được gửi đến cả API backend (để lưu vào database) và Firestore (để đồng bộ realtime)
- BR-REPLY-007: Hệ thống hỗ trợ 4 loại tin nhắn: TEXT, IMAGE, VIDEO, MIXED
- BR-REPLY-008: Khi chủ cửa hàng mở conversation, tất cả tin nhắn từ khách hàng được đánh dấu là đã đọc
- BR-REPLY-009: Unread count được cập nhật tự động khi có tin nhắn mới từ khách hàng
- BR-REPLY-010: Danh sách conversations được sắp xếp theo thời gian tin nhắn cuối cùng (mới nhất trước)
- BR-REPLY-011: Tin nhắn được hiển thị ngay lập tức trong giao diện của chủ cửa hàng sau khi gửi
- BR-REPLY-012: Tin nhắn từ khách hàng được hiển thị realtime trong giao diện của chủ cửa hàng thông qua Firestore

---

### English

**ID and Name:** UC-STORE-REPLY-MESSAGE  
**Date Created:** 2025-01-XX  
**Primary Actor:** Store Owner (Seller - Logged-in store owner)  
**Secondary Actors:** System, Firebase Firestore, Cloudinary (File Storage), Customer

**Description:**  
A logged-in store owner can view and reply to messages from customers through a realtime chat system. Store owner can view list of conversations with customers, view messages, mark as read, and reply with text messages, images, videos, or combinations. Messages are sent to both API backend and Firestore to ensure storage and realtime synchronization.

**Trigger:**  
Store owner wants to reply to customer and accesses Messages page or selects conversation from conversation list.

**Preconditions:**
1. Store owner is logged into the system (authenticated)
2. Store owner has storeId stored in system
3. There is a conversation with customer (created when customer sends first message)

**Postconditions:**
1. Reply message is successfully sent and displayed in conversation
2. Message is saved to database and Firestore
3. Message is synchronized in realtime to customer
4. Messages from customer are marked as read
5. Conversation list is updated with latest message

**Normal Flow:**
1. Store owner accesses Messages page or opens conversation from list
2. System checks authentication: if not logged in, requires login
3. System displays list of conversations with customers, including:
   - Customer name
   - Last message
   - Last message time
   - Unread message count
4. Store owner selects a conversation to view messages
5. System loads messages from API and establishes realtime connection with Firestore to receive new messages
6. System marks all messages from customer in this conversation as read
7. System updates unread count of this conversation to 0
8. Store owner views messages from customer (text, images, videos)
9. Store owner enters reply message in input field or selects files (images/videos) to send
10. If files exist, store owner can preview before sending and can remove files if don't want to send
11. Store owner clicks "Send" button to send message
12. System checks message has content: must have at least text or file
13. If files exist, system uploads files to Cloudinary:
    - Validate file (format, size)
    - Upload image or video
    - Receive URL of uploaded file
14. System determines message type based on content:
    - TEXT: Text only, no files
    - IMAGE: Single image only, no text
    - VIDEO: Single video only, no text
    - MIXED: Text and/or multiple files
15. System sends message to both API backend and Firestore:
    - Send to API to save to database
    - Send to Firestore for realtime sync
16. Message is displayed immediately in store owner's interface
17. Firestore automatically syncs message to customer's interface (if viewing conversation)
18. System updates conversation list with latest message and time
19. System automatically scrolls to latest message
20. System clears input field and selected files

**Alternative Flows:**
1. **View conversation list:** Store owner can view list of all conversations with customers, sorted by last message time (newest first)
2. **Send only files without text:** Store owner can send only images or videos without entering text
3. **Send multiple files at once:** Store owner can select and send multiple images/videos in one message (MIXED type)
4. **Preview files before sending:** Store owner can preview images/videos before sending and can remove files if don't want to send
5. **Receive realtime messages:** When customer sends new message, Firestore automatically updates and displays message immediately in store owner's interface (if viewing that conversation)
6. **Auto mark as read:** When store owner opens conversation, system automatically marks all messages from customer as read

**Exceptions:**
1. **Store owner not logged in:** If store owner is not logged in, system requires login first
2. **StoreId does not exist:** If storeId is not found, system displays error and cannot view/send messages
3. **No conversations:** If there are no conversations, system displays empty list with message "No conversations yet"
4. **Conversation does not exist:** If selected conversation doesn't exist, system displays error and cannot load messages
5. **Invalid file:**
   - If file is not image or video → Display error: "Invalid file. Please select image or video file"
   - If file is too large (e.g., video > 30MB) → Display error: "File too large. Please select smaller file"
6. **Error uploading file:** If there is error uploading file to Cloudinary, system displays error and restores message/file so store owner can retry
7. **Error sending message to API:** If there is error sending message to API backend, system displays error and restores message so store owner can retry
8. **Error sending message to Firestore:** If there is error sending message to Firestore, system can still send via API, but won't sync realtime. System may display warning
9. **Firestore connection lost:** If connection to Firestore is lost, system can still send messages via API, but won't receive realtime messages from customer. System may display warning about connection loss
10. **Token expired:** If access token expires, system automatically refreshes token. If refresh token also expires, system redirects to login page
11. **Network or server error:** If there is connection or server error, system displays error message and store owner can retry
12. **Empty message:** If store owner tries to send message with no text and no files, system doesn't send and requires content
13. **Error marking as read:** If there is error marking messages as read, system still continues to work normally but may log error

**Priority:** HIGH

**Business Rules:**
- BR-REPLY-001: Store owner must be logged in to view and reply to messages
- BR-REPLY-002: Store owner can only view conversations of their own store
- BR-REPLY-003: Message must have at least text or file (cannot send empty message)
- BR-REPLY-004: Images must be valid files (JPG, PNG, WebP, GIF)
- BR-REPLY-005: Videos must be valid files (MP4, WebM, OGG, MOV, AVI) and not exceed size limit (e.g., 30MB)
- BR-REPLY-006: Messages are sent to both API backend (to save to database) and Firestore (for realtime sync)
- BR-REPLY-007: System supports 4 message types: TEXT, IMAGE, VIDEO, MIXED
- BR-REPLY-008: When store owner opens conversation, all messages from customer are marked as read
- BR-REPLY-009: Unread count is automatically updated when there are new messages from customer
- BR-REPLY-010: Conversation list is sorted by last message time (newest first)
- BR-REPLY-011: Message is displayed immediately in store owner's interface after sending
- BR-REPLY-012: Messages from customer are displayed in realtime in store owner's interface through Firestore

---

## Summary

Use case này mô tả quy trình chủ cửa hàng xem và trả lời tin nhắn từ khách hàng, bao gồm:

- **20 bước Normal Flow** từ truy cập trang Messages, xem danh sách conversations, chọn conversation, đánh dấu đã đọc, xem tin nhắn, nhập và gửi tin nhắn trả lời, đến cập nhật danh sách conversations
- **6 Alternative Flows** cho xem danh sách conversations, gửi chỉ file, gửi nhiều file, preview file, nhận tin nhắn realtime, và đánh dấu đã đọc tự động
- **13 Exception cases** xử lý các lỗi authentication, không có conversations, file không hợp lệ, lỗi upload, lỗi gửi tin nhắn, mất kết nối Firestore, token hết hạn, và các lỗi khác
- **12 Business Rules** quy định các quy tắc nghiệp vụ về authentication, quyền truy cập, loại tin nhắn, file upload, read status, và realtime sync

Use case đảm bảo quy trình trả lời tin nhắn an toàn với authentication check, quyền truy cập (chỉ xem conversations của cửa hàng mình), hỗ trợ đa dạng loại tin nhắn, upload file qua Cloudinary, đồng bộ realtime qua Firestore, và xử lý các trường hợp ngoại lệ một cách rõ ràng. Tính năng này giúp chủ cửa hàng hỗ trợ khách hàng hiệu quả.

