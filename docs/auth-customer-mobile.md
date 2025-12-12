# Customer Auth (Web → Mobile) — Diagnose Logout Issue

Hiện tượng: chạy mobile (Expo/React Native) cứ hot-reload hoặc chỉnh sửa là bị logout, phải login lại. Dưới đây là cơ chế auth của customer và checklist khắc phục.

## Cơ chế auth hiện tại (customer)
- **Login** (`CustomerAuthService.login`):
  - Gọi `POST /api/account/login/customer`.
  - Lưu token qua `RefreshTokenService.storeTokens('CUSTOMER', accessToken, refreshToken, tokenType)`.
  - Key chính (uppercase): `CUSTOMER_token`, `CUSTOMER_refresh_token`, `CUSTOMER_token_type`, `customer_user`, `accountId`, `customerId`, `isAuthenticated`.
- **Gửi request**:
  - Dùng `HttpInterceptor.get/post/...` kèm `{ userType: 'customer' }`.
  - Interceptor lấy `Authorization: Bearer <CUSTOMER_token>`.
- **Tự refresh** (`HttpInterceptor`):
  - Khi 401 và có `userType`, gọi `RefreshTokenService.refreshUserToken('CUSTOMER')` → `POST /api/account/refresh` với `CUSTOMER_refresh_token`.
  - Nếu refresh thành công: ghi đè access/refresh token (vẫn dùng uppercase).
  - Nếu refresh fail: `clearTokens` và redirect `/login`.
- **Logout** (`CustomerAuthService.logout`):
  - Xóa toàn bộ key (cả bản cũ/lowercase), đặt `authStateChanged`, phát event storage.

## Nguyên nhân thường gặp gây logout trên mobile/hot reload
1) **Storage không persistent trên mobile**: `localStorage` không tồn tại hoặc bị reset trong môi trường React Native/Expo. Kết quả: token/refresh token mất → 401 → refresh fail → logout.  
2) **Thiếu `userType` khi gọi API**: quên truyền `{ userType: 'customer' }` → không gắn Authorization header → 401 (không refresh) → luồng UI tự xử lý thành logout.  
3) **Không có refresh token**: login response thiếu/không lưu `CUSTOMER_refresh_token` → refreshUserToken trả null → interceptor xem như thất bại và logout.  
4) **API refresh lỗi (CORS/base URL/env)**: `/api/account/refresh` trả lỗi → interceptor gọi `handleAuthFailure` → logout.  
5) **Key sai hoặc bị overwrite**: code khác ghi đè `customer_token` (lowercase) hoặc xóa `CUSTOMER_token`.  
6) **Session redirect**: `handleAuthFailure` redirect nếu pathname không chứa `/login`; trong mobile WebView điều này cũng diễn ra.

## Checklist khắc phục (ưu tiên cho mobile/Expo)
1) **Thay storage bằng AsyncStorage** (hoặc SecureStore) thay cho `localStorage` khi chạy native:
   - Tạo adapter cho `RefreshTokenService` và `HttpInterceptor` để đọc/ghi token qua AsyncStorage khi `Platform.OS !== 'web'`.
   - Đảm bảo đọc/ghi cùng key: `CUSTOMER_token`, `CUSTOMER_refresh_token`, `customer_user`, `isAuthenticated`.
2) **Đảm bảo mọi API customer đều truyền `userType: 'customer'`** khi gọi `HttpInterceptor`.  
3) **Kiểm tra login response**: sau login, verify đã có cả `CUSTOMER_token` và `CUSTOMER_refresh_token` (và được persist).  
4) **Kiểm tra `/api/account/refresh`** trên mobile:
   - Dùng cùng `VITE_API_BASE_URL` với web.
   - Confirm CORS/https ổn; log response nếu fail.  
5) **Tránh code xóa token ngoài luồng**:
   - Không set/clear `customer_token`/`CUSTOMER_token` tùy tiện.
   - Không ghi đè `localStorage.clear()` trong dev utils.  
6) **Graceful degrade khi refresh lỗi tạm thời** (tùy chọn):
   - Có thể tắt redirect auto trên mobile khi refresh fail lần đầu, thay bằng retry/on-demand login (cần sửa `HttpInterceptor.handleAuthFailure`).  
7) **Dev hot reload**:
   - Nếu dùng WebView devtools reload toàn bộ app, hãy giữ token trong persistent storage (AsyncStorage) để không mất phiên.  
8) **Kiểm tra đồng bộ key cũ**:
   - Interceptor ưu tiên `CUSTOMER_token`; có fallback `customer_token`. Đảm bảo code mới cũng không chỉ lưu lowercase.

## Nơi cần chỉnh nếu port sang mobile
- `HttpInterceptor.getToken` / `RefreshTokenService.storeTokens/getRefreshToken/clearTokens`: thêm layer storage adapter cho AsyncStorage.
- `CustomerAuthService.login/logout/refreshToken`: dùng adapter thay `localStorage`.
- Mọi chỗ gọi API cho customer: luôn `userType: 'customer'`.

## Quy trình debug nhanh
1) Login trên mobile → kiểm tra storage có `CUSTOMER_token` và `CUSTOMER_refresh_token` chưa.  
2) Gọi 1 API protected → xem header Authorization đã gắn chưa.  
3) Thử ép 401 (sửa token) → kiểm tra `/api/account/refresh` có thành công, và token mới có được lưu lại không.  
4) Quan sát log: nếu thấy `Token refresh failed` → xem chi tiết lỗi, CORS, hoặc refresh token trống.  
5) Nếu reload app bị logout: confirm storage dùng AsyncStorage và không bị clear khi reload.  

