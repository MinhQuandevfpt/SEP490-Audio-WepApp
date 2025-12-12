# AIChatbot Component Documentation

## Tổng quan

Component `AIChatbot` là một chatbot đa chức năng hỗ trợ 3 chế độ chat:
- **AI Chat**: Chat với trợ lý AI
- **Store Chat**: Chat với cửa hàng cụ thể
- **List Mode**: Danh sách các cuộc trò chuyện với các cửa hàng

## File Location
- **Component**: `src/components/AIChatbot/AIChatbot.tsx`
- **Services**: 
  - `src/services/ai/AIChatService.ts`
  - `src/services/customer/ChatService.ts`
  - `src/services/FirestoreChatService.ts`
  - `src/services/FileUploadService.ts`
- **Context**: `src/contexts/ChatContext.tsx`

---

## API Endpoints

### 1. AI Chat API

#### POST `/api/ai/chat`
**Mô tả**: Gửi tin nhắn đến AI chatbot

**Request Body**:
```json
{
  "userId": "user_1234567890_abc123",
  "message": "Xin chào, bạn có thể giúp gì cho tôi?",
  "userName": "Guest"
}
```

**Response**:
```json
{
  "answer": "Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp bạn tìm sản phẩm, trả lời câu hỏi về sản phẩm, và hỗ trợ bạn trong việc mua sắm.",
  "message": "Success",
  "userName": "Guest",
  "userId": "user_1234567890_abc123"
}
```

**Service Method**: `AIChatService.sendMessage(request: AIChatRequest)`

---

### 2. Chat Messages API

#### GET `/api/chat/conversations/{customerId}/{storeId}/messages`
**Mô tả**: Lấy danh sách tin nhắn giữa customer và store

**Query Parameters**:
- `viewerType`: `CUSTOMER` (required)
- `limit`: `number` (optional, default: không giới hạn)

**Example Request**:
```
GET /api/chat/conversations/customer123/store456/messages?viewerType=CUSTOMER&limit=100
```

**Response**:
```json
[
  {
    "id": "msg_001",
    "senderId": "customer123",
    "senderType": "CUSTOMER",
    "content": "Xin chào, sản phẩm này còn hàng không?",
    "messageType": "TEXT",
    "createdAt": "2025-01-15T10:30:00Z",
    "read": true
  },
  {
    "id": "msg_002",
    "senderId": "store456",
    "senderType": "STORE",
    "content": "Chào bạn, sản phẩm này vẫn còn hàng ạ!",
    "messageType": "TEXT",
    "createdAt": "2025-01-15T10:31:00Z",
    "read": true
  },
  {
    "id": "msg_003",
    "senderId": "customer123",
    "senderType": "CUSTOMER",
    "content": "",
    "messageType": "IMAGE",
    "mediaUrl": [
      {
        "url": "https://res.cloudinary.com/doopw2ezr/image/upload/v1234567890/example.jpg",
        "type": "image"
      }
    ],
    "createdAt": "2025-01-15T10:32:00Z",
    "read": false
  },
  {
    "id": "msg_004",
    "senderId": "customer123",
    "senderType": "CUSTOMER",
    "content": "Đây là hình ảnh sản phẩm",
    "messageType": "MIXED",
    "mediaUrl": [
      {
        "url": "https://res.cloudinary.com/doopw2ezr/image/upload/v1234567890/product.jpg",
        "type": "image"
      },
      {
        "url": "https://res.cloudinary.com/doopw2ezr/video/upload/v1234567890/demo.mp4",
        "type": "video"
      }
    ],
    "createdAt": "2025-01-15T10:33:00Z",
    "read": false
  }
]
```

**Service Method**: `ChatService.getMessages(customerId, storeId, limit?)`

---

#### POST `/api/chat/conversations/{customerId}/{storeId}/messages`
**Mô tả**: Gửi tin nhắn đến store

**Request Body**:
```json
{
  "senderId": "customer123",
  "senderType": "CUSTOMER",
  "content": "Xin chào, sản phẩm này còn hàng không?",
  "messageType": "TEXT"
}
```

**Request Body (với media)**:
```json
{
  "senderId": "customer123",
  "senderType": "CUSTOMER",
  "content": "Đây là hình ảnh sản phẩm",
  "messageType": "MIXED",
  "mediaUrl": [
    {
      "url": "https://res.cloudinary.com/doopw2ezr/image/upload/v1234567890/product.jpg",
      "type": "image"
    },
    {
      "url": "https://res.cloudinary.com/doopw2ezr/video/upload/v1234567890/demo.mp4",
      "type": "video"
    }
  ]
}
```

**Response**:
```json
{
  "id": "msg_005",
  "senderId": "customer123",
  "senderType": "CUSTOMER",
  "content": "Đây là hình ảnh sản phẩm",
  "messageType": "MIXED",
  "mediaUrl": [
    {
      "url": "https://res.cloudinary.com/doopw2ezr/image/upload/v1234567890/product.jpg",
      "type": "image"
    },
    {
      "url": "https://res.cloudinary.com/doopw2ezr/video/upload/v1234567890/demo.mp4",
      "type": "video"
    }
  ],
  "createdAt": "2025-01-15T10:34:00Z",
  "read": false
}
```

**Service Method**: `ChatService.sendMessage(customerId, storeId, request)`

---

#### GET `/api/chat/customers/{customerId}/conversations`
**Mô tả**: Lấy danh sách tất cả các cuộc trò chuyện của customer

**Example Request**:
```
GET /api/chat/customers/customer123/conversations
```

**Response**:
```json
[
  {
    "id": "conv_customer123_store456",
    "customerId": "customer123",
    "storeId": "store456",
    "lastMessage": "[Hình ảnh]",
    "lastMessageTime": "2025-01-15T10:34:00Z",
    "customerUnreadCount": 2,
    "storeUnreadCount": 0
  },
  {
    "id": "conv_customer123_store789",
    "customerId": "customer123",
    "storeId": "store789",
    "lastMessage": "Cảm ơn bạn đã mua hàng!",
    "lastMessageTime": "2025-01-14T15:20:00Z",
    "customerUnreadCount": 0,
    "storeUnreadCount": 1
  }
]
```

**Service Method**: `ChatService.getCustomerConversations(customerId)`

---

#### POST `/api/chat/conversations/{customerId}/{storeId}/read`
**Mô tả**: Đánh dấu tin nhắn đã đọc

**Query Parameters**:
- `viewerId`: `string` (ID của người xem)

**Example Request**:
```
POST /api/chat/conversations/customer123/store456/read?viewerId=customer123
```

**Response**: `200 OK` (no body)

**Service Method**: `ChatService.markAsRead(customerId, storeId, viewerId)`

---

### 3. File Upload API

#### POST `/api/files/upload/image`
**Mô tả**: Upload ảnh lên Cloudinary

**Request**: `multipart/form-data`
- `file`: File image

**Response**:
```json
{
  "url": "https://res.cloudinary.com/doopw2ezr/image/upload/v1234567890/example.jpg",
  "fileName": "example.jpg",
  "fileSize": 102400,
  "cloudName": "doopw2ezr",
  "publicId": "example"
}
```

**Service Method**: `FileUploadService.uploadImage(file)`

---

#### POST `/api/files/upload/video`
**Mô tả**: Upload video lên Cloudinary

**Request**: `multipart/form-data`
- `file`: File video (max 30MB)

**Response**:
```json
{
  "url": "https://res.cloudinary.com/doopw2ezr/video/upload/v1234567890/demo.mp4",
  "fileName": "demo.mp4",
  "fileSize": 5242880,
  "cloudName": "doopw2ezr",
  "publicId": "demo"
}
```

**Service Method**: `FileUploadService.uploadVideo(file)`

---

### 4. Store Info API

#### GET `/api/stores/{storeId}`
**Mô tả**: Lấy thông tin cửa hàng (được gọi từ `CustomerStoreService.getStoreById`)

**Response**:
```json
{
  "storeId": "store456",
  "storeName": "Tech Hub Store",
  "logoUrl": "https://res.cloudinary.com/doopw2ezr/image/upload/v1234567890/logo.jpg",
  "status": "ACTIVE"
}
```

---

## Firebase Firestore Structure

### Collection Path
```
chats/{customerId}_{storeId}/messages/{messageId}
```

### Message Document Structure
```json
{
  "id": "msg_001",
  "senderId": "customer123",
  "senderType": "CUSTOMER",
  "content": "Xin chào",
  "messageType": "TEXT",
  "mediaUrl": [
    {
      "url": "https://example.com/image.jpg",
      "type": "image"
    }
  ],
  "createdAt": "2025-01-15T10:30:00Z",
  "timestamp": 1705315800000,
  "read": false
}
```

### Firestore Methods
- `subscribeToMessages()`: Lắng nghe tin nhắn realtime
- `sendMessage()`: Gửi tin nhắn vào Firestore
- `updateMessagesReadStatus()`: Cập nhật trạng thái đã đọc

---

## Component Logic Flow

### 1. Initialization Flow

```
1. Component mounts
   ↓
2. Check authentication (CustomerAuthService.isAuthenticated())
   ↓
3. Listen to ChatContext changes
   ↓
4. If context.isOpen === true:
   - Set isOpen = true
   - Set chatMode from context
   - Set storeId from context
```

### 2. AI Chat Mode Flow

```
User sends message
   ↓
handleSendMessage()
   ↓
Check: chatMode === 'ai'
   ↓
Add user message to UI immediately
   ↓
Call AIChatService.sendMessage()
   ↓
Receive AI response
   ↓
Add assistant message to UI
```

### 3. Store Chat Mode Flow (List Mode)

```
User opens chat
   ↓
loadConversationsAndSelectStore()
   ↓
1. Load conversations from API
2. Fetch store info for each conversation
3. Format last message
4. Set selectedStore if storeId exists
   ↓
User selects conversation
   ↓
handleSelectConversation()
   ↓
1. Update selectedStoreIdRef
2. Set unreadCount = 0 (optimistic update)
3. Load messages from API
4. Setup Firestore listener for realtime updates
5. Mark messages as read
```

### 4. Send Message Flow (Store Chat)

```
User types message / selects files
   ↓
handleSendMessage()
   ↓
If has files:
  1. Upload files to Cloudinary (FileUploadService)
  2. Determine messageType (IMAGE/VIDEO/MIXED)
  3. Build mediaUrl array
   ↓
Send to both:
  1. API (ChatService.sendMessage) - for backend storage
  2. Firestore (FirestoreChatService.sendMessage) - for realtime sync
   ↓
Update conversation list with new lastMessage
   ↓
Firestore listener updates UI automatically
```

### 5. Realtime Updates Flow

```
Firestore listener active
   ↓
New message arrives in Firestore
   ↓
subscribeToMessages callback triggered
   ↓
Update messages state
   ↓
If message is from STORE and conversation not selected:
  - Increment unreadCount
   ↓
If conversation is selected:
  - Keep unreadCount = 0
  - Update lastMessage in conversation list
```

---

## Data Structures

### Message Interface
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  mediaUrl?: string | Array<{ url: string; type?: string }>;
  read?: boolean;
}
```

### ConversationWithStoreInfo Interface
```typescript
interface ConversationWithStoreInfo extends CustomerConversation {
  storeName: string;
  storeAvatar?: string;
  lastMessageSenderType?: 'CUSTOMER' | 'STORE';
}
```

### ChatMode Type
```typescript
type ChatMode = 'ai' | 'store' | 'list';
```

---

## Key Features

### 1. Multi-Mode Chat
- **AI Mode**: Chat với AI assistant
- **Store Mode**: Chat với cửa hàng cụ thể
- **List Mode**: Danh sách conversations với các cửa hàng

### 2. Media Support
- **Images**: JPG, PNG, WebP, GIF
- **Videos**: MP4, WebM, OGG, MOV, AVI (max 30MB)
- **Mixed**: Text + multiple images/videos

### 3. Realtime Updates
- Sử dụng Firestore để sync tin nhắn realtime
- Auto-update conversation list khi có tin nhắn mới
- Auto-scroll to bottom khi có tin nhắn mới

### 4. Read Status
- Track read/unread status cho mỗi tin nhắn
- Unread count cho mỗi conversation
- Auto mark as read khi mở conversation

### 5. File Upload
- Preview files trước khi gửi
- Upload multiple files cùng lúc
- Progress indicator khi upload

### 6. UI Features
- Zoom modal cho images/videos
- Responsive design
- Loading states
- Error handling
- Empty states

---

## State Management

### Component State
```typescript
- isOpen: boolean
- showModeSelector: boolean
- chatMode: 'ai' | 'store' | 'list'
- messages: Message[]
- inputMessage: string
- isLoading: boolean
- isUploading: boolean
- selectedFiles: Array<{ file: File; preview: string; type: 'image' | 'video' }>
- storeId: string | null
- conversations: ConversationWithStoreInfo[]
- isAuthenticated: boolean
- selectedStore: ConversationWithStoreInfo | null
- zoomMedia: { url: string; type: 'image' | 'video' } | null
```

### Refs
```typescript
- messagesEndRef: HTMLDivElement (for auto-scroll)
- inputRef: HTMLInputElement
- imageInputRef: HTMLInputElement
- videoInputRef: HTMLInputElement
- mediaInputRef: HTMLInputElement
- selectedStoreIdRef: string | null (track selected store for unread count)
```

---

## Event Handlers

### handleSendMessage()
- Validate input (text or files)
- Handle AI chat vs Store chat differently
- Upload files if exists
- Send to API and Firestore
- Update conversation list

### handleSelectConversation()
- Set selected store
- Update unreadCount to 0
- Load messages
- Setup Firestore listener
- Mark messages as read

### handleFileSelect()
- Validate file type and size
- Create preview
- Add to selectedFiles state

### handleMediaSelect()
- Handle both image and video files
- Validate and categorize files
- Create previews

### switchChatMode()
- Switch between AI, Store, List modes
- Reset messages accordingly
- Load conversations if needed

---

## Dependencies

### External Libraries
- `react-router-dom`: Navigation
- `lucide-react`: Icons
- `firebase/firestore`: Realtime database

### Internal Services
- `AIChatService`: AI chat API
- `ChatService`: Store chat API
- `FirestoreChatService`: Realtime sync
- `FileUploadService`: File upload
- `CustomerAuthService`: Authentication
- `CustomerStoreService`: Store info
- `ChatContext`: Global chat state

---

## Error Handling

### Authentication Errors
- Redirect to login if not authenticated
- Show error message if auth fails

### API Errors
- Show error message in chat
- Restore input on error
- Handle network errors gracefully

### File Upload Errors
- Validate file type and size before upload
- Show error alert on upload failure
- Restore selected files on error

### Firestore Errors
- Silent fail for read status updates
- Handle connection errors gracefully

---

## Performance Optimizations

1. **Memoization**: `useCallback` cho helper functions
2. **Refs**: Sử dụng refs để track selected store (avoid re-renders)
3. **Conditional Rendering**: Chỉ render listeners khi needed
4. **Cleanup**: Properly unsubscribe Firestore listeners
5. **Optimistic Updates**: Update UI immediately, sync later

---

## Security Considerations

1. **Authentication**: Check auth before allowing chat
2. **Authorization**: Only customer can access their conversations
3. **File Validation**: Validate file type and size before upload
4. **XSS Prevention**: Sanitize user input (handled by React)
5. **Token Management**: Use HttpInterceptor for token handling

---

## Example Usage

```typescript
// Open AI chat
chatContext.openChat('ai');

// Open store chat with specific store
chatContext.openChat('store', 'store123');

// Component automatically handles:
// - Loading conversations
// - Setting up realtime listeners
// - Managing state
// - Handling user interactions
```

---

## Notes

1. **Dual Storage**: Messages are stored in both API (backend) and Firestore (realtime)
2. **Media Format**: Supports both string (legacy) and array format for mediaUrl
3. **Unread Count**: Managed carefully to avoid race conditions
4. **Auto-scroll**: Automatically scrolls to bottom on new messages
5. **File Limits**: Video max 30MB, images no specific limit (handled by Cloudinary)

