# 🎉 Customer Chat - Conversations List & Login Required

## ✅ Đã hoàn thành

### 1. List Conversations cho Customer

**API:** `GET /api/chat/customers/{customerId}/conversations`

**Response:**
```json
[
  {
    "id": "customerId_storeId",
    "customerId": "d48a2ea3-8788-4596-bb8f-5c52092b9e9d",
    "storeId": "d08be661-c48f-4187-9a81-d82494a825a5",
    "lastMessage": "bạn ơi",
    "lastMessageTime": "2025-11-27T15:11:06.717Z"
  }
]
```

---

### 2. Yêu cầu đăng nhập để chat

**Trước:** Customer chưa login vẫn có thể click Chat Shop (nhưng lỗi)

**Sau:** 
- Customer chưa login → Hiển thị UI đăng nhập
- Click "Đăng nhập ngay" → Redirect đến `/auth/login`
- Sau khi login → Có thể chat bình thường

---

## 🎯 Features Mới

### 1. Tab "Tin nhắn" - List Conversations

Thêm tab mới trong chatbot:
- **Chat AI** - Chat với AI bot
- **Tin nhắn** - Xem tất cả conversations với các cửa hàng ⭐ NEW

**UI:**
```
┌──────────────────────────┐
│ [Chat AI] [Tin nhắn]     │ ← New tab!
├──────────────────────────┤
│ 🏪 Store A               │
│    Xin chào shop         │
│    ⏰ 15:11              │
├──────────────────────────┤
│ 🏪 Store B               │
│    Cảm ơn shop           │
│    ⏰ 14:30              │
└──────────────────────────┘
```

### 2. Login Prompt

**Khi chưa đăng nhập:**
```
┌──────────────────────────┐
│     🔐                   │
│ Vui lòng đăng nhập       │
│                          │
│ Bạn cần đăng nhập để     │
│ xem tin nhắn với cửa hàng│
│                          │
│  [Đăng nhập ngay]        │
└──────────────────────────┘
```

---

## 📝 Implementation Details

### File: `src/services/customer/ChatService.ts`

**Added:**
```typescript
export interface CustomerConversation {
  id: string;
  customerId: string;
  storeId: string;
  storeName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
}

static async getCustomerConversations(customerId: string): Promise<CustomerConversation[]> {
  const endpoint = `${this.BASE_URL}/customers/${customerId}/conversations`;
  
  const response = await HttpInterceptor.get<any>(endpoint, {
    userType: 'customer',
  });

  if (Array.isArray(response)) {
    return response;
  }
  
  return response.data || [];
}
```

### File: `src/components/AIChatbot/AIChatbot.tsx`

**Added:**
1. Authentication check
2. Conversations list view
3. Login prompt UI
4. Store name fetching
5. Conversation selection

**New State:**
```typescript
const [conversations, setConversations] = useState<CustomerConversation[]>([]);
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

**New Functions:**
```typescript
// Load conversations from API
const loadConversations = async () => {
  const customerId = ChatService.getCurrentUserId();
  if (!customerId) return;

  const convList = await ChatService.getCustomerConversations(customerId);
  
  // Fetch store names in parallel
  const conversationsWithNames = await Promise.all(
    convList.map(async (conv) => {
      const storeInfo = await HttpInterceptor.get<StoreInfo>(
        `/api/stores/${conv.storeId}`,
        { userType: 'customer' }
      );
      return {
        ...conv,
        storeName: storeInfo.name || `Store ${conv.storeId.substring(0, 8)}...`,
      };
    })
  );

  setConversations(conversationsWithNames);
};

// Select a conversation to chat
const handleSelectConversation = (conv: CustomerConversation) => {
  setStoreId(conv.storeId);
  setChatMode('store');
  chatContext.openChat('store', conv.storeId);
  loadStoreMessages();
};

// Redirect to login
const handleLoginClick = () => {
  setIsOpen(false);
  navigate('/auth/login');
};
```

---

## 🎨 UI Flow

### Flow 1: Customer đã login

```
1. Click nút floating "Trợ lý AI"
   ↓
2. Click tab "Tin nhắn"
   ↓
3. Load conversations từ API
   ↓
4. Hiển thị danh sách cửa hàng đã chat
   ↓
5. Click vào một store
   ↓
6. Chuyển sang chat với store đó
   ↓
7. Load messages & chat! ✅
```

### Flow 2: Customer chưa login

```
1. Click nút floating "Trợ lý AI"
   ↓
2. Click tab "Tin nhắn"
   ↓
3. Hiển thị login prompt
   ↓
4. Click "Đăng nhập ngay"
   ↓
5. Redirect đến /auth/login
   ↓
6. Login thành công
   ↓
7. Quay lại → Chat bình thường ✅
```

---

## 🧪 Test Cases

### Test Case 1: View conversations (đã login)
```
1. Customer đã login
2. Có 2 conversations với Store A và Store B
3. Click "Trợ lý AI" → Tab "Tin nhắn"
4. Expected:
   - Thấy Store A với last message ✅
   - Thấy Store B với last message ✅
   - Thấy thời gian của mỗi message ✅
```

### Test Case 2: Login required
```
1. Customer chưa login
2. Click "Trợ lý AI" → Tab "Tin nhắn"
3. Expected:
   - Thấy login prompt ✅
   - Button "Đăng nhập ngay" ✅
4. Click "Đăng nhập ngay"
5. Expected:
   - Redirect đến /auth/login ✅
```

### Test Case 3: Select conversation
```
1. Customer đã login
2. Vào tab "Tin nhắn"
3. Click vào Store A
4. Expected:
   - Chuyển sang chat mode ✅
   - Load messages với Store A ✅
   - Có thể gửi tin nhắn ✅
```

### Test Case 4: Empty conversations
```
1. Customer đã login
2. Chưa chat với store nào
3. Vào tab "Tin nhắn"
4. Expected:
   - Hiển thị "Chưa có tin nhắn" ✅
   - Icon + text thông báo ✅
```

---

## 🔧 Technical Details

### Chat Modes

```typescript
type ChatMode = 'ai' | 'store' | 'list';
```

- `'ai'` - Chat với AI bot
- `'store'` - Chat với một store cụ thể
- `'list'` - Xem danh sách conversations (NEW)

### Authentication Check

```typescript
useEffect(() => {
  const checkAuth = () => {
    const authenticated = CustomerAuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };
  
  checkAuth();
  if (isOpen) {
    checkAuth();
  }
}, [isOpen]);
```

### Conditional UI

**Input disabled khi chưa login:**
```typescript
<input
  disabled={isLoading || !isAuthenticated}
  ...
/>
```

**Hiện login prompt:**
```typescript
{chatMode === 'list' ? (
  !isAuthenticated ? (
    <LoginPrompt />
  ) : (
    <ConversationsList />
  )
) : (
  <MessagesView />
)}
```

---

## 📊 API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/customers/{customerId}/conversations` | Lấy danh sách conversations ⭐ |
| GET | `/api/stores/{storeId}` | Lấy thông tin store (để lấy tên) |
| GET | `/api/chat/conversations/{customerId}/{storeId}/messages` | Lấy messages |
| POST | `/api/chat/conversations/{customerId}/{storeId}/messages` | Gửi message |

---

## 🎨 UI Components

### 1. Conversations List
```tsx
<div className="space-y-2">
  {conversations.map((conv) => (
    <button className="w-full p-3 bg-white rounded-lg ...">
      <div className="flex items-center gap-3">
        <Store icon />
        <div>
          <h4>{conv.storeName}</h4>
          <p>{conv.lastMessage}</p>
          <span>{time}</span>
        </div>
      </div>
    </button>
  ))}
</div>
```

### 2. Login Prompt
```tsx
<div className="flex flex-col items-center ...">
  <LogIn icon />
  <h3>Vui lòng đăng nhập</h3>
  <p>Bạn cần đăng nhập để...</p>
  <button onClick={handleLoginClick}>
    Đăng nhập ngay
  </button>
</div>
```

### 3. Empty State
```tsx
<div className="flex flex-col items-center ...">
  <MessageCircle icon />
  <h3>Chưa có tin nhắn</h3>
  <p>Bạn chưa có cuộc trò chuyện nào</p>
</div>
```

---

## 🛡️ Security

### Authentication Required

Các tính năng yêu cầu đăng nhập:
- ✅ View conversations list
- ✅ Chat với store
- ✅ Send messages

Nếu chưa login:
- ✅ Hiển thị login prompt
- ✅ Không cho chat
- ✅ Redirect đến login page

---

## 🔮 Future Improvements

### 1. Unread Count
```typescript
interface CustomerConversation {
  unreadCount?: number; // Backend cần provide
}
```

Display badge:
```tsx
{conv.unreadCount > 0 && (
  <span className="badge">{conv.unreadCount}</span>
)}
```

### 2. Search Conversations
```tsx
<input
  placeholder="Tìm kiếm cửa hàng..."
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### 3. Sort Options
- Mới nhất
- Cũ nhất
- Chưa đọc

### 4. Delete Conversation
```tsx
<button onClick={() => deleteConversation(conv.id)}>
  <Trash icon />
</button>
```

---

## ✅ Checklist

- [x] Add API getCustomerConversations()
- [x] Add conversations list view
- [x] Fetch store names
- [x] Authentication check
- [x] Login prompt UI
- [x] Login redirect
- [x] Select conversation
- [x] Empty state
- [x] Loading state
- [x] Disable input when not logged in
- [x] No linter errors
- [x] Tested & working

---

## 📚 Related Files

```
src/services/customer/ChatService.ts          ← Add getCustomerConversations()
src/components/AIChatbot/AIChatbot.tsx        ← Major updates
src/contexts/ChatContext.tsx                  ← Already exists
```

---

## 🎉 Summary

**Before:**
- ❌ Customer không thấy list conversations
- ❌ Chưa login vẫn có thể click (nhưng lỗi)
- ❌ Không biết đã chat với shop nào

**After:**
- ✅ Tab "Tin nhắn" hiển thị tất cả conversations
- ✅ Thấy store names, last messages
- ✅ Login required - hiển thị prompt đẹp
- ✅ Click để redirect login
- ✅ Select conversation để chat
- ✅ Better UX!

**Result:** Customer có thể quản lý conversations dễ dàng! 🚀

---

**Version:** 2.0.0  
**Date:** November 27, 2025  
**Status:** ✅ Production Ready

