# Google OAuth2 Login/Register Documentation

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc và Flow](#kiến-trúc-và-flow)
3. [Các file liên quan](#các-file-liên-quan)
4. [API Endpoints](#api-endpoints)
5. [Flow chi tiết](#flow-chi-tiết)
6. [Request/Response Formats](#requestresponse-formats)
7. [Storage Management](#storage-management)
8. [Error Handling](#error-handling)
9. [Mobile Implementation Guide](#mobile-implementation-guide)
10. [Debugging Tips](#debugging-tips)

---

## 📖 Tổng quan

Hệ thống sử dụng **OAuth2 Authorization Code Flow** với Google để đăng nhập/đăng ký người dùng. Flow này bao gồm:

1. **User click "Đăng nhập với Google"** → Redirect đến Google OAuth
2. **User xác thực với Google** → Google redirect về backend
3. **Backend xử lý và tạo account** → Redirect về frontend với tokens
4. **Frontend lưu tokens và profile** → Navigate về homepage

### Đặc điểm:
- ✅ **Tự động đăng ký**: Nếu user chưa có account, backend tự động tạo account mới
- ✅ **Tự động đăng nhập**: Nếu user đã có account, backend tự động đăng nhập
- ✅ **Single Sign-On (SSO)**: User chỉ cần xác thực một lần với Google
- ✅ **Token-based authentication**: Sử dụng JWT tokens (accessToken + refreshToken)

---

## 🏗️ Kiến trúc và Flow

### High-Level Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Click "Đăng nhập với Google"
       ▼
┌─────────────────────────────────────┐
│  GoogleLoginButton.tsx               │
│  - Clear localStorage               │
│  - Redirect to OAuth URL             │
└──────┬───────────────────────────────┘
       │
       │ 2. window.location.href = OAuth URL
       ▼
┌─────────────────────────────────────┐
│  Google OAuth Server                 │
│  - User authenticates                │
│  - User grants permissions            │
└──────┬───────────────────────────────┘
       │
       │ 3. Redirect với authorization code
       ▼
┌─────────────────────────────────────┐
│  Backend Server                      │
│  /oauth2/authorization/google        │
│  - Exchange code for tokens          │
│  - Create/Find account               │
│  - Generate JWT tokens               │
└──────┬───────────────────────────────┘
       │
       │ 4. Redirect với tokens (query/hash/cookie)
       ▼
┌─────────────────────────────────────┐
│  OAuth2Success.tsx                   │
│  - Extract tokens from URL           │
│  - Store tokens (RefreshTokenService)│
│  - Fetch customer profile            │
│  - Store customer data               │
│  - Navigate to homepage              │
└──────┬───────────────────────────────┘
       │
       │ 5. Navigate to "/"
       ▼
┌─────────────────────────────────────┐
│  Homepage                            │
│  - Show welcome message              │
│  - User is authenticated             │
└─────────────────────────────────────┘
```

---

## 📁 Các file liên quan

### Frontend Files

#### 1. **`src/components/common/GoogleLoginButton.tsx`**
- **Mục đích**: Component button để trigger Google OAuth
- **Chức năng**:
  - Clear localStorage (token, isAuthenticated)
  - Redirect đến backend OAuth endpoint
  - Thêm timestamp để tránh cache

#### 2. **`src/pages/Customer/Login/Login.tsx`**
- **Mục đích**: Trang đăng nhập
- **Chức năng**:
  - Hiển thị form đăng nhập (email/password)
  - Hiển thị GoogleLoginButton
  - Xử lý login thông thường

#### 3. **`src/pages/Customer/Register/Register.tsx`**
- **Mục đích**: Trang đăng ký
- **Chức năng**:
  - Hiển thị form đăng ký
  - Hiển thị GoogleLoginButton
  - Xử lý registration thông thường

#### 4. **`src/pages/OAuth2Success/OAuth2Success.tsx`**
- **Mục đích**: Xử lý callback sau khi Google OAuth thành công
- **Chức năng**:
  - Extract tokens từ URL (query params, hash fragment, cookies)
  - Store tokens sử dụng RefreshTokenService
  - Fetch customer profile từ API
  - Store customer data
  - Navigate về homepage

#### 5. **`src/pages/OAuth2Callback/OAuth2Callback.tsx`**
- **Mục đích**: Fallback callback handler (nếu backend redirect sai)
- **Chức năng**:
  - Extract tokens từ query params
  - Store tokens
  - Navigate về homepage

#### 6. **`src/services/RefreshTokenService.ts`**
- **Mục đích**: Service quản lý tokens và user data
- **Chức năng**:
  - `storeTokens()`: Lưu accessToken, refreshToken
  - `storeCustomerData()`: Lưu customer profile
  - `clearAllData()`: Xóa tất cả data khi logout
  - `refreshToken()`: Refresh access token

---

## 🔌 API Endpoints

### 1. **OAuth2 Authorization Endpoint**

```
GET /oauth2/authorization/google
```

**Mục đích**: Redirect user đến Google OAuth server

**Request**:
- Method: `GET`
- URL: `https://audioe-commerce-production.up.railway.app/oauth2/authorization/google`
- Query params (optional): `t={timestamp}` (để tránh cache)

**Response**:
- Redirect đến Google OAuth server
- User xác thực với Google
- Google redirect về backend với authorization code

**Backend xử lý**:
1. Exchange authorization code cho access token từ Google
2. Lấy user info từ Google (email, name, picture)
3. Tìm hoặc tạo account trong database
4. Generate JWT tokens (accessToken, refreshToken)
5. Redirect về frontend với tokens

---

### 2. **Customer Profile Endpoints** (Sau khi có token)

#### Option 1: `/api/customers/{customerId}`
```
GET /api/customers/{customerId}
```

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
Accept: */*
```

**Response**:
```json
{
  "id": "uuid",
  "email": "user@gmail.com",
  "fullName": "User Name",
  "phone": "0123456789",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Option 2: `/api/customer/profile` (Fallback)
```
GET /api/customer/profile
```

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**: Tương tự Option 1

#### Option 3: `/api/customer/{customerId}` (Fallback)
```
GET /api/customer/{customerId}
```

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**: 
```json
{
  "data": {
    "id": "uuid",
    "email": "user@gmail.com",
    "fullName": "User Name",
    ...
  }
}
```

---

### 3. **Refresh Token Endpoint**

```
POST /api/account/refresh
```

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response**:
```json
{
  "status": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "tokenType": "Bearer"
  }
}
```

---

## 🔄 Flow chi tiết

### Step 1: User Click "Đăng nhập với Google"

**File**: `src/components/common/GoogleLoginButton.tsx`

```typescript
const handleGoogleLogin = () => {
  // Clear localStorage để đảm bảo fresh session
  localStorage.removeItem('token');
  localStorage.removeItem('isAuthenticated');
  
  // Redirect đến backend OAuth endpoint
  const authUrl = 'https://audioe-commerce-production.up.railway.app/oauth2/authorization/google';
  const timestamp = Date.now();
  window.location.href = `${authUrl}?t=${timestamp}`;
};
```

**Lưu ý**:
- Clear localStorage để tránh conflict với session cũ
- Thêm timestamp để tránh browser cache

---

### Step 2: Backend Redirect về Frontend

**Backend redirect về frontend với tokens qua một trong các cách:**

#### Cách 1: Query Parameters
```
https://yourapp.com/oauth2/success?token=xxx&refreshToken=yyy&accountId=zzz&customerId=www
```

#### Cách 2: Hash Fragment
```
https://yourapp.com/oauth2/success#token=xxx&refreshToken=yyy&accountId=zzz&customerId=www
```

#### Cách 3: Cookies
```
Set-Cookie: token=xxx
Set-Cookie: accountId=zzz
Set-Cookie: customerId=www
```

**Lưu ý**: Backend có thể sử dụng bất kỳ cách nào, frontend phải hỗ trợ tất cả.

---

### Step 3: OAuth2Success Component Xử lý

**File**: `src/pages/OAuth2Success/OAuth2Success.tsx`

#### 3.1. Extract Tokens từ URL

```typescript
// Thử lấy từ query params
let token = searchParams.get('token') || searchParams.get('accessToken');
let refreshToken = searchParams.get('refreshToken');
let accountId = searchParams.get('accountId');
let customerId = searchParams.get('customerId');
let error = searchParams.get('error');

// Nếu không có, thử lấy từ hash fragment
if (!token && window.location.hash) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  token = hashParams.get('token') || hashParams.get('accessToken');
  refreshToken = hashParams.get('refreshToken');
  accountId = hashParams.get('accountId');
  customerId = hashParams.get('customerId');
  error = hashParams.get('error');
}

// Nếu vẫn không có, thử lấy từ cookies
if (!token) {
  const cookieMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  const accountIdCookie = document.cookie.match(/(?:^|;\s*)accountId=([^;]+)/);
  const customerIdCookie = document.cookie.match(/(?:^|;\s*)customerId=([^;]+)/);
  
  if (cookieMatch) {
    token = cookieMatch[1];
    accountId = accountIdCookie ? accountIdCookie[1] : accountId;
    customerId = customerIdCookie ? customerIdCookie[1] : customerId;
  }
}
```

#### 3.2. Store Tokens

```typescript
// Store tokens sử dụng RefreshTokenService
RefreshTokenService.storeTokens('CUSTOMER', token, refreshToken || '', 'Bearer');
```

**Storage keys được tạo**:
- `CUSTOMER_token`: Access token
- `CUSTOMER_refresh_token`: Refresh token
- `CUSTOMER_token_type`: "Bearer"
- `isAuthenticated`: "true"

#### 3.3. Fetch Customer Profile

```typescript
// Thử nhiều endpoints để lấy profile
const tryGetCustomerProfile = async (token: string, customerId?: string) => {
  // Try 1: /api/customers/{customerId}
  if (customerId) {
    const response = await fetch(`/api/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      }
    });
    if (response.ok) {
      return await response.json();
    }
  }
  
  // Try 2: /api/customer/profile
  try {
    const profile = await CustomerAuthService.getProfile();
    return profile;
  } catch (error) {
    // Try 3: /api/customer/{customerId}
    // ...
  }
};
```

#### 3.4. Store Customer Data

```typescript
// Store customer data
RefreshTokenService.storeCustomerData({
  email: customerProfile.email,
  full_name: customerProfile.fullName,
  role: 'CUSTOMER',
  accountId: accountId,
  customerId: customerId || customerProfile.id || ''
});
```

**Storage keys được tạo**:
- `customer_user`: JSON object chứa toàn bộ user data
- `accountId`: Account ID
- `customerId`: Customer ID

#### 3.5. Fallback nếu không lấy được profile

```typescript
// Fallback: Decode JWT token để lấy thông tin
const tokenParts = token.split('.');
if (tokenParts.length === 3) {
  const payload = JSON.parse(atob(tokenParts[1]));
  const emailFromToken = payload.sub?.split(':')[0] || payload.email || '';
  const nameFromEmail = emailFromToken.split('@')[0] || `User_${accountId.slice(-6)}`;
  
  RefreshTokenService.storeCustomerData({
    email: emailFromToken,
    full_name: nameFromEmail,
    role: payload.role || 'CUSTOMER',
    accountId: accountId,
    customerId: customerId || payload.customerId || ''
  });
}
```

#### 3.6. Navigate về Homepage

```typescript
// Set flag để Header component biết cần update
localStorage.setItem('authStateChanged', Date.now().toString());

// Lưu welcome message
sessionStorage.setItem('welcomeMessage', JSON.stringify({
  userName: savedUserName,
  showWelcome: true
}));

// Navigate về homepage
navigate('/');
```

---

## 📦 Request/Response Formats

### OAuth2 Authorization Request

**URL**: `GET /oauth2/authorization/google?t={timestamp}`

**Response**: Redirect đến Google OAuth server

---

### OAuth2 Success Response (Backend → Frontend)

**URL**: `GET /oauth2/success?token=xxx&refreshToken=yyy&accountId=zzz&customerId=www`

**Query Parameters**:
- `token` (hoặc `accessToken`): JWT access token
- `refreshToken`: JWT refresh token
- `accountId`: Account ID (UUID)
- `customerId`: Customer ID (UUID)
- `error`: Error message (nếu có lỗi)

**Alternative Formats**:
- Hash fragment: `#token=xxx&refreshToken=yyy&...`
- Cookies: `Set-Cookie: token=xxx; accountId=zzz; customerId=www`

---

### Customer Profile Response

**Endpoint**: `GET /api/customers/{customerId}`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
Accept: */*
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@gmail.com",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## 💾 Storage Management

### Token Storage (RefreshTokenService.storeTokens)

**Keys được tạo**:
```typescript
localStorage.setItem('CUSTOMER_token', accessToken);
localStorage.setItem('CUSTOMER_refresh_token', refreshToken);
localStorage.setItem('CUSTOMER_token_type', 'Bearer');
localStorage.setItem('isAuthenticated', 'true'); // Chỉ cho CUSTOMER
```

### Customer Data Storage (RefreshTokenService.storeCustomerData)

**Keys được tạo**:
```typescript
// Primary storage (single source of truth)
localStorage.setItem('customer_user', JSON.stringify({
  email: 'user@gmail.com',
  full_name: 'Nguyễn Văn A',
  role: 'CUSTOMER',
  accountId: 'account-uuid',
  customerId: 'customer-uuid'
}));

// Individual IDs (for backward compatibility)
localStorage.setItem('accountId', 'account-uuid');
localStorage.setItem('customerId', 'customer-uuid');
```

### Clear Data (Logout)

**RefreshTokenService.clearAllData('CUSTOMER')** xóa:
- `CUSTOMER_token`
- `CUSTOMER_refresh_token`
- `CUSTOMER_token_type`
- `customer_user`
- `accountId`
- `customerId`
- `isAuthenticated`
- Tất cả old duplicate keys (cleanup)

---

## ⚠️ Error Handling

### 1. OAuth Error (Backend trả về error param)

```typescript
if (error) {
  showError('Đăng nhập Google thất bại: ' + error);
  navigate('/auth/login');
  return;
}
```

### 2. Missing Tokens

```typescript
if (!token || !accountId) {
  const missingParams = [];
  if (!token) missingParams.push('token');
  if (!accountId) missingParams.push('accountId');
  
  showError(`Không nhận được thông tin xác thực từ server. Thiếu: ${missingParams.join(', ')}`);
  setTimeout(() => {
    navigate('/auth/login');
  }, 3000);
}
```

### 3. Profile Fetch Failed

```typescript
try {
  const customerProfile = await tryGetCustomerProfile(token, customerId);
  // Store profile
} catch (profileError) {
  // Fallback: Decode JWT token
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    const payload = JSON.parse(atob(tokenParts[1]));
    // Extract info from token
  }
}
```

---

## 📱 Mobile Implementation Guide

### 1. Setup Google OAuth trong Mobile App

#### React Native (Expo)

```bash
# Install dependencies
npx expo install expo-auth-session expo-crypto
```

#### React Native (Bare)

```bash
npm install @react-native-google-signin/google-signin
```

#### Flutter

```yaml
dependencies:
  google_sign_in: ^6.0.0
```

---

### 2. OAuth Flow Implementation

#### React Native (Expo) Example

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Complete auth session
WebBrowser.maybeCompleteAuthSession();

const GoogleLoginButton = () => {
  const handleGoogleLogin = async () => {
    try {
      // Backend OAuth URL
      const authUrl = 'https://audioe-commerce-production.up.railway.app/oauth2/authorization/google';
      
      // Open browser for OAuth
      const result = await AuthSession.startAsync({
        authUrl: authUrl,
        returnUrl: AuthSession.makeRedirectUri({
          scheme: 'yourapp',
          path: 'oauth2/success'
        })
      });
      
      if (result.type === 'success') {
        // Extract tokens from result
        const { token, refreshToken, accountId, customerId } = extractParams(result.url);
        
        // Store tokens
        await storeTokens(token, refreshToken);
        
        // Fetch customer profile
        const profile = await fetchCustomerProfile(token, customerId);
        
        // Store customer data
        await storeCustomerData(profile, accountId, customerId);
        
        // Navigate to home
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Đăng nhập Google thất bại');
    }
  };
  
  return (
    <Button title="Đăng nhập với Google" onPress={handleGoogleLogin} />
  );
};
```

#### React Native (Bare) Example

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // From Google Cloud Console
});

const GoogleLoginButton = () => {
  const handleGoogleLogin = async () => {
    try {
      // Sign in with Google
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Get ID token
      const idToken = userInfo.idToken;
      
      // Send ID token to backend
      const response = await fetch('https://audioe-commerce-production.up.railway.app/api/oauth2/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
      
      const { token, refreshToken, accountId, customerId } = await response.json();
      
      // Store tokens
      await AsyncStorage.setItem('CUSTOMER_token', token);
      await AsyncStorage.setItem('CUSTOMER_refresh_token', refreshToken);
      await AsyncStorage.setItem('accountId', accountId);
      await AsyncStorage.setItem('customerId', customerId);
      
      // Fetch profile
      const profile = await fetchCustomerProfile(token, customerId);
      
      // Store profile
      await AsyncStorage.setItem('customer_user', JSON.stringify(profile));
      
      // Navigate to home
      navigation.navigate('Home');
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Đăng nhập Google thất bại');
    }
  };
  
  return (
    <Button title="Đăng nhập với Google" onPress={handleGoogleLogin} />
  );
};
```

#### Flutter Example

```dart
import 'package:google_sign_in/google_sign_in.dart';

final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
);

Future<void> handleGoogleLogin() async {
  try {
    // Sign in with Google
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) return; // User canceled
    
    // Get authentication details
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    
    // Send ID token to backend
    final response = await http.post(
      Uri.parse('https://audioe-commerce-production.up.railway.app/api/oauth2/google'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'idToken': googleAuth.idToken}),
    );
    
    final data = jsonDecode(response.body);
    final token = data['token'];
    final refreshToken = data['refreshToken'];
    final accountId = data['accountId'];
    final customerId = data['customerId'];
    
    // Store tokens
    await storage.write(key: 'CUSTOMER_token', value: token);
    await storage.write(key: 'CUSTOMER_refresh_token', value: refreshToken);
    await storage.write(key: 'accountId', value: accountId);
    await storage.write(key: 'customerId', value: customerId);
    
    // Fetch profile
    final profile = await fetchCustomerProfile(token, customerId);
    
    // Store profile
    await storage.write(key: 'customer_user', value: jsonEncode(profile));
    
    // Navigate to home
    Navigator.pushReplacementNamed(context, '/home');
  } catch (e) {
    print('Google login error: $e');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Đăng nhập Google thất bại')),
    );
  }
}
```

---

### 3. Helper Functions cho Mobile

#### Extract Params từ URL

```typescript
// React Native
const extractParams = (url: string) => {
  const params: any = {};
  const urlObj = new URL(url);
  
  // Extract from query params
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  // Extract from hash fragment
  if (urlObj.hash) {
    const hashParams = new URLSearchParams(urlObj.hash.substring(1));
    hashParams.forEach((value, key) => {
      params[key] = value;
    });
  }
  
  return {
    token: params.token || params.accessToken,
    refreshToken: params.refreshToken,
    accountId: params.accountId,
    customerId: params.customerId,
    error: params.error,
  };
};
```

#### Store Tokens

```typescript
// React Native (AsyncStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeTokens = async (token: string, refreshToken: string) => {
  await AsyncStorage.multiSet([
    ['CUSTOMER_token', token],
    ['CUSTOMER_refresh_token', refreshToken],
    ['CUSTOMER_token_type', 'Bearer'],
    ['isAuthenticated', 'true'],
  ]);
};

// Flutter (SharedPreferences)
import 'package:shared_preferences/shared_preferences.dart';

Future<void> storeTokens(String token, String refreshToken) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('CUSTOMER_token', token);
  await prefs.setString('CUSTOMER_refresh_token', refreshToken);
  await prefs.setString('CUSTOMER_token_type', 'Bearer');
  await prefs.setBool('isAuthenticated', true);
}
```

#### Fetch Customer Profile

```typescript
// React Native
const fetchCustomerProfile = async (token: string, customerId?: string) => {
  const API_BASE_URL = 'https://audioe-commerce-production.up.railway.app';
  
  // Try 1: /api/customers/{customerId}
  if (customerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }
  
  // Try 2: /api/customer/profile
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
  
  throw new Error('All profile endpoints failed');
};
```

#### Store Customer Data

```typescript
// React Native
const storeCustomerData = async (
  profile: any,
  accountId: string,
  customerId: string
) => {
  const customerData = {
    email: profile.email,
    full_name: profile.fullName,
    role: 'CUSTOMER',
    accountId: accountId,
    customerId: customerId || profile.id || '',
  };
  
  await AsyncStorage.multiSet([
    ['customer_user', JSON.stringify(customerData)],
    ['accountId', accountId],
    ['customerId', customerId || profile.id || ''],
  ]);
};
```

---

### 4. Deep Linking Setup

#### React Native (Expo)

**app.json**:
```json
{
  "expo": {
    "scheme": "yourapp",
    "ios": {
      "bundleIdentifier": "com.yourapp.app"
    },
    "android": {
      "package": "com.yourapp.app"
    }
  }
}
```

**OAuth redirect URL**:
```typescript
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'yourapp',
  path: 'oauth2/success'
});
// Result: yourapp://oauth2/success
```

#### React Native (Bare)

**AndroidManifest.xml**:
```xml
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="yourapp" android:host="oauth2" />
  </intent-filter>
</activity>
```

**Info.plist (iOS)**:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
    </array>
  </dict>
</array>
```

#### Flutter

**android/app/src/main/AndroidManifest.xml**:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="yourapp" android:host="oauth2" />
</intent-filter>
```

**ios/Runner/Info.plist**:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
    </array>
  </dict>
</array>
```

**Handle deep link**:
```dart
// Flutter
import 'package:uni_links/uni_links.dart';

void initDeepLinks() {
  getInitialUri().then((uri) {
    if (uri != null) {
      handleOAuthCallback(uri);
    }
  });
  
  uriLinkStream.listen((uri) {
    handleOAuthCallback(uri);
  });
}

void handleOAuthCallback(Uri uri) {
  if (uri.scheme == 'yourapp' && uri.host == 'oauth2' && uri.path == '/success') {
    final token = uri.queryParameters['token'];
    final refreshToken = uri.queryParameters['refreshToken'];
    final accountId = uri.queryParameters['accountId'];
    final customerId = uri.queryParameters['customerId'];
    
    // Process OAuth success
  }
}
```

---

## 🐛 Debugging Tips

### 1. Check OAuth URL

```typescript
console.log('OAuth URL:', authUrl);
console.log('Full URL with timestamp:', `${authUrl}?t=${Date.now()}`);
```

### 2. Log All Parameters

```typescript
console.log('Query params:', Object.fromEntries(searchParams.entries()));
console.log('Hash fragment:', window.location.hash);
console.log('All cookies:', document.cookie);
console.log('Full URL:', window.location.href);
```

### 3. Check Token Storage

```typescript
console.log('CUSTOMER_token:', localStorage.getItem('CUSTOMER_token'));
console.log('CUSTOMER_refresh_token:', localStorage.getItem('CUSTOMER_refresh_token'));
console.log('customer_user:', localStorage.getItem('customer_user'));
console.log('accountId:', localStorage.getItem('accountId'));
console.log('customerId:', localStorage.getItem('customerId'));
```

### 4. Decode JWT Token

```typescript
const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      return payload;
    }
  } catch (error) {
    console.error('Failed to decode token:', error);
  }
  return null;
};
```

### 5. Test Profile Endpoints

```typescript
// Test all profile endpoints
const testProfileEndpoints = async (token: string, customerId: string) => {
  const endpoints = [
    `/api/customers/${customerId}`,
    '/api/customer/profile',
    `/api/customer/${customerId}`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`${endpoint}:`, response.status, await response.json());
    } catch (error) {
      console.error(`${endpoint} failed:`, error);
    }
  }
};
```

---

## ✅ Checklist cho Mobile Implementation

- [ ] Setup Google OAuth SDK (React Native/Flutter)
- [ ] Configure OAuth redirect URLs
- [ ] Implement deep linking
- [ ] Create GoogleLoginButton component
- [ ] Implement token extraction từ URL
- [ ] Implement token storage (AsyncStorage/SharedPreferences)
- [ ] Implement customer profile fetching
- [ ] Implement customer data storage
- [ ] Handle OAuth errors
- [ ] Handle missing tokens
- [ ] Handle profile fetch failures
- [ ] Test với real Google account
- [ ] Test với new user (auto registration)
- [ ] Test với existing user (auto login)
- [ ] Test token refresh flow
- [ ] Test logout flow

---

## 📝 Notes

1. **Backend tự động tạo account**: Nếu user chưa có account, backend tự động tạo account mới từ Google info
2. **Backend tự động login**: Nếu user đã có account, backend tự động đăng nhập
3. **Multiple redirect formats**: Backend có thể redirect với tokens qua query params, hash fragment, hoặc cookies
4. **Fallback profile endpoints**: Frontend thử nhiều endpoints để lấy profile
5. **JWT token fallback**: Nếu không lấy được profile, decode JWT token để lấy thông tin
6. **Storage format**: Sử dụng standardized format (`customer_user` JSON + individual IDs)

---

## 🔗 Related Documentation

- [RefreshTokenService Documentation](./REFRESH_TOKEN_SERVICE.md)
- [Customer Auth Service Documentation](./CUSTOMER_AUTH_SERVICE.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Last Updated**: 2024-12-18
**Version**: 1.0.0

