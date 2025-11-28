# Firebase Realtime Chat - Hướng dẫn cài đặt và sử dụng

## 📝 Tổng quan

Đã chuyển đổi hệ thống chat giữa khách hàng và cửa hàng từ **auto-refresh polling** (3s/lần) sang **Firebase Realtime Database** để có khả năng nhận tin nhắn realtime.

## ✅ Những gì đã thực hiện

### 1. **Cài đặt Firebase SDK**
```bash
npm install firebase
```

### 2. **Tạo file cấu hình Firebase**
- **File**: `src/config/firebase.ts`
- Chứa Firebase config và khởi tạo Realtime Database

### 3. **Tạo Firebase Realtime Service**
- **File**: `src/services/FirebaseRealtimeChatService.ts`
- Các chức năng chính:
  - `subscribeToMessages()`: Lắng nghe tin nhắn realtime
  - `sendMessage()`: Gửi tin nhắn lên Firebase
  - `getMessages()`: Lấy tin nhắn một lần (không subscribe)
  - `unsubscribe()`: Hủy lắng nghe

### 4. **Cập nhật Chat Khách hàng**
- **File**: `src/components/AIChatbot/AIChatbot.tsx`
- ❌ **Đã xóa**: Auto-refresh polling mỗi 3 giây
- ✅ **Đã thêm**: Firebase realtime listener
- Khi gửi tin nhắn: Gửi đồng thời đến API và Firebase

### 5. **Cập nhật Chat Cửa hàng (Seller)**
- **File**: `src/pages/Seller/Messages/MessagesPage.tsx`
- ❌ **Đã xóa**: Auto-refresh polling mỗi 3 giây
- ✅ **Đã thêm**: Firebase realtime listener
- Khi gửi tin nhắn: Gửi đồng thời đến API và Firebase

## 🔥 Cấu trúc Firebase Realtime Database

```
chats/
  └── {customerId}_{storeId}/
      └── messages/
          ├── messageId1/
          │   ├── id: string
          │   ├── senderId: string
          │   ├── senderType: "CUSTOMER" | "STORE"
          │   ├── content: string
          │   ├── messageType: "TEXT"
          │   ├── createdAt: ISO string
          │   └── timestamp: number
          ├── messageId2/
          └── ...
```

## 🚀 Cách hoạt động

### **Flow gửi tin nhắn:**
1. User gửi tin nhắn
2. Promise.all() gửi đồng thời:
   - API backend (để lưu vào database chính)
   - Firebase Realtime Database (để sync realtime)
3. Firebase listener tự động cập nhật UI khi có tin nhắn mới

### **Flow nhận tin nhắn:**
1. Component mount → Subscribe Firebase listener
2. Khi có tin nhắn mới → Firebase callback được trigger
3. UI tự động cập nhật
4. Component unmount → Unsubscribe listener

## ⚠️ Lưu ý quan trọng

### ✅ **KHÔNG ảnh hưởng đến:**
- Chat AI (vẫn hoạt động bình thường)
- Các API khác
- Backend logic

### 🎯 **CHỈ áp dụng cho:**
- Chat giữa khách hàng và cửa hàng
- 2 file: `AIChatbot.tsx` và `MessagesPage.tsx`

## 🔧 Cấu hình Firebase Realtime Database Rules

Để bảo mật, cần cấu hình Firebase Rules:

```json
{
  "rules": {
    "chats": {
      "$chatId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "messages": {
          ".indexOn": ["timestamp"]
        }
      }
    }
  }
}
```

## 📦 Dependencies đã thêm

```json
{
  "firebase": "^latest"
}
```

## 🧪 Test

### **Kiểm tra realtime:**
1. Mở 2 tab trình duyệt
2. Tab 1: Đăng nhập customer → Chat với store
3. Tab 2: Đăng nhập seller → Mở Messages page
4. Gửi tin nhắn từ 1 trong 2 tab
5. ✅ Tab còn lại phải hiện tin nhắn ngay lập tức (không cần refresh)

### **Kiểm tra AI Chat:**
1. Mở chat AI
2. Gửi tin nhắn
3. ✅ AI vẫn trả lời bình thường (không bị ảnh hưởng)

## 🐛 Troubleshooting

### **Tin nhắn không realtime:**
- Kiểm tra Firebase config trong `src/config/firebase.ts`
- Kiểm tra Firebase Rules (phải cho phép read/write)
- Kiểm tra network tab xem có kết nối WebSocket không

### **Tin nhắn bị duplicate:**
- Đảm bảo unsubscribe khi component unmount
- Kiểm tra useEffect dependencies

### **Lỗi Firebase permission:**
- Cập nhật Firebase Rules
- Kiểm tra Firebase project settings

## 📚 API Reference

### **FirebaseRealtimeChatService**

```typescript
// Subscribe to messages
const unsubscribe = FirebaseRealtimeChatService.subscribeToMessages(
  customerId,
  storeId,
  (messages) => {
    console.log('New messages:', messages);
  }
);

// Send message
await FirebaseRealtimeChatService.sendMessage(
  customerId,
  storeId,
  {
    senderId: userId,
    senderType: 'CUSTOMER', // or 'STORE'
    content: 'Hello!',
    messageType: 'TEXT'
  }
);

// Unsubscribe
unsubscribe();
```

## ✨ Lợi ích

- ⚡ **Realtime**: Tin nhắn hiển thị ngay lập tức
- 🔋 **Tiết kiệm**: Không cần polling 3s/lần
- 📉 **Giảm tải server**: Ít request hơn
- 🎯 **Trải nghiệm tốt**: Chat mượt mà như Messenger

## 📝 Files đã thay đổi

1. ✅ `src/config/firebase.ts` (NEW)
2. ✅ `src/services/FirebaseRealtimeChatService.ts` (NEW)
3. ✅ `src/components/AIChatbot/AIChatbot.tsx` (MODIFIED)
4. ✅ `src/pages/Seller/Messages/MessagesPage.tsx` (MODIFIED)
5. ✅ `package.json` (firebase dependency)

---

**Tác giả**: GitHub Copilot  
**Ngày**: 28/11/2025  
**Version**: 1.0.0
