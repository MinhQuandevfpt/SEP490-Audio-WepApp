# Test Cases - Customer Authentication

## Summary Dashboard

| Feature | Customer Authentication |
|---------|------------------------|
| **Test requirement** | Test đăng ký, đăng nhập, đăng xuất tài khoản khách hàng, bao gồm validation, token management, và error handling |
| **Number of TCs** | 12 |

| Testing Round | Passed | Failed | Pending | N/A |
|---------------|--------|--------|---------|-----|
| Round 1 | 0 | 0 | 12 | 0 |
| Round 2 | 0 | 0 | 12 | 0 |
| Round 3 | 0 | 0 | 12 | 0 |

---

## Test Cases Detail

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|--------------|----------------------|---------------------|------------------|----------------|---------|-----------|--------|---------|-----------|--------|---------|-----------|--------|------|
| **Function: CustomerAuthService.register()** | | | | | | | | | | | | | | |
| TC-AUTH-001 | Customer account registration successful | 1. Navigate to `/auth/register`<br>2. Enter valid information:<br>   - Full Name: "Nguyễn Văn A"<br>   - Email: "test@example.com"<br>   - Phone: "0912345678"<br>   - Password: "password123"<br>   - Confirm Password: "password123"<br>3. Check "Đồng ý với điều khoản dịch vụ" checkbox<br>4. Click "Đăng ký" button | 1. API call `POST /api/account/register/customer` returns status 201<br>2. Display success notification: "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục."<br>3. Auto redirect to `/auth/login` after 3 seconds<br>4. Email "test@example.com" is pre-filled in login form<br>5. New account is created in database | 1. User does not have an account in the system<br>2. Email "test@example.com" is not used<br>3. Phone number "0912345678" is not used<br>4. Browser is open and connected to internet | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-002 | Registered with an existing email address | 1. Navigate to `/auth/register`<br>2. Enter information with existing email:<br>   - Full Name: "Nguyễn Văn B"<br>   - Email: "existing@example.com" (already exists)<br>   - Phone: "0987654321"<br>   - Password: "password123"<br>   - Confirm Password: "password123"<br>3. Check "Đồng ý với điều khoản dịch vụ" checkbox<br>4. Click "Đăng ký" button | 1. API call returns error status 400 or 409<br>2. Display error notification: "Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập."<br>3. Form does not submit successfully<br>4. User remains on register page, can edit information<br>5. New account is not created | 1. Email "existing@example.com" already exists in the system<br>2. User is on register page | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-003 | Password does not match | 1. Navigate to `/auth/register`<br>2. Enter information:<br>   - Full Name: "Nguyễn Văn C"<br>   - Email: "newuser@example.com"<br>   - Phone: "0901234567"<br>   - Password: "password123"<br>   - Confirm Password: "password456" (different from password)<br>3. Check "Đồng ý với điều khoản dịch vụ" checkbox<br>4. Click "Đăng ký" button | 1. Client-side validation detects password mismatch<br>2. Display error notification: "Mật khẩu xác nhận không khớp!"<br>3. Form does not submit, no API call<br>4. User remains on register page, can edit | 1. User is on register page<br>2. No account exists with email "newuser@example.com" | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-008 | Validate registration data is invalid | 1. Navigate to `/auth/register`<br>2. Enter incomplete/invalid data:<br>   - Full Name: "A" (only 1 character)<br>   - Email: "invalid-email" (invalid format)<br>   - Phone: "123" (invalid format)<br>   - Password: "123" (only 3 characters)<br>   - Confirm Password: "123"<br>3. Click "Đăng ký" button | 1. Client-side validation detects errors:<br>   - "Tên phải có ít nhất 2 ký tự"<br>   - "Email không hợp lệ"<br>   - "Số điện thoại không hợp lệ"<br>   - "Mật khẩu phải có ít nhất 6 ký tự"<br>2. Display error notification with first error<br>3. Form does not submit, no API call<br>4. User remains on register page, can edit | 1. User is on register page<br>2. Form validation is enabled | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerAuthService.login()** | | | | | | | | | | | | | | |
| TC-AUTH-004 | Login successful | 1. Navigate to `/auth/login`<br>2. Enter email: "test@example.com"<br>3. Enter password: "password123"<br>4. (Optional) Check "Ghi nhớ đăng nhập" checkbox<br>5. Click "Đăng nhập" button | 1. API call `POST /api/account/login/customer` returns status 200<br>2. Access token saved to localStorage with key "CUSTOMER_token"<br>3. Refresh token saved to localStorage<br>4. User data (email, full_name, role, accountId, customerId) saved to localStorage<br>5. Auto redirect to homepage (`/`)<br>6. Display welcome message: "Chào mừng {userName} quay trở lại!" (if no redirect URL)<br>7. Header displays user name and "Đăng xuất" button | 1. User has account with email "test@example.com" and password "password123"<br>2. Account is not locked or disabled<br>3. Browser is open and connected to internet | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-005 | Incorrect password entered | 1. Navigate to `/auth/login`<br>2. Enter email: "test@example.com"<br>3. Enter wrong password: "wrongpassword"<br>4. Click "Đăng nhập" button | 1. API call returns error status 401<br>2. Display error notification: "Tài khoản hoặc mật khẩu không đúng"<br>3. Form does not clear, user can still edit<br>4. User remains on login page<br>5. No tokens saved to localStorage<br>6. No redirect | 1. User has account with email "test@example.com" but different password<br>2. User is on login page | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-006 | Login with a non-existent email address | 1. Navigate to `/auth/login`<br>2. Enter non-existent email: "nonexistent@example.com"<br>3. Enter any password: "password123"<br>4. Click "Đăng nhập" button | 1. API call returns error status 401<br>2. Display error notification: "Tài khoản hoặc mật khẩu không đúng" (does not reveal if email exists)<br>3. Form does not clear<br>4. User remains on login page<br>5. No tokens saved | 1. Email "nonexistent@example.com" does not exist in the system<br>2. User is on login page | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-009 | Login with empty email or password | 1. Navigate to `/auth/login`<br>2. Leave email empty (or password empty)<br>3. Click "Đăng nhập" button | 1. Client-side validation detects missing field<br>2. Display error notification: "Vui lòng nhập email!" or "Vui lòng nhập mật khẩu!"<br>3. Form does not submit, no API call<br>4. User remains on login page | 1. User is on login page<br>2. Form validation is enabled | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-010 | Login with phone number (not supported) | 1. Navigate to `/auth/login`<br>2. Select "Phone" login method<br>3. Enter phone number and password<br>4. Click "Đăng nhập" button | 1. Client-side validation detects phone login attempt<br>2. Display error notification: "Đăng nhập bằng số điện thoại chưa được hỗ trợ!"<br>3. Form does not submit, no API call<br>4. User remains on login page | 1. User is on login page<br>2. Phone login method is selected | Pending | | | Pending | | | Pending | | | |
| TC-AUTH-011 | Login with Google OAuth | 1. Navigate to `/auth/login`<br>2. Click "Đăng nhập với Google" button<br>3. Complete Google OAuth flow<br>4. Receive token from Google | 1. Google OAuth popup opens<br>2. User authenticates with Google<br>3. System receives token from Google<br>4. Account is automatically created/retrieved<br>5. Tokens are saved to localStorage<br>6. Redirect to homepage as in normal login flow | 1. User has Google account<br>2. Google OAuth is configured<br>3. Browser allows popups | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerAuthService.logout()** | | | | | | | | | | | | | | |
| TC-AUTH-007 | Log out of account | 1. User is successfully logged in<br>2. Click "Đăng xuất" button in header (or dropdown menu) | 1. Function `CustomerAuthService.logout()` is called<br>2. All tokens (access token, refresh token) are removed from localStorage<br>3. User data is removed from localStorage<br>4. Session storage is cleared (isLoggingOut flag is set)<br>5. Storage event is dispatched to notify other tabs<br>6. Auto redirect to homepage (`/`)<br>7. Header displays "Đăng nhập" and "Đăng ký" instead of user name<br>8. Welcome popup does not display after redirect | 1. User is successfully logged in<br>2. Access token exists in localStorage with key "CUSTOMER_token"<br>3. User data exists in localStorage<br>4. User is on any page in the application | Pending | | | Pending | | | Pending | | | |
| **Function: CustomerAuthService.validateRegisterData()** | | | | | | | | | | | | | | |
| TC-AUTH-012 | Register without agreeing to terms | 1. Navigate to `/auth/register`<br>2. Enter all valid information<br>3. Do NOT check "Đồng ý với điều khoản dịch vụ" checkbox<br>4. Click "Đăng ký" button | 1. Client-side validation detects missing agreement<br>2. Display error notification: "Bạn phải đồng ý với điều khoản dịch vụ để tiếp tục!"<br>3. Form does not submit, no API call<br>4. User remains on register page | 1. User is on register page<br>2. All fields are filled correctly<br>3. Terms checkbox is not checked | Pending | | | Pending | | | Pending | | | |

---

## Notes

**✅ Tất cả 12 test cases đã được hệ thống handle:**

1. **TC-AUTH-001**: ✅ Registration success flow includes auto-redirect to login page and email pre-fill feature. (Implemented in `Register.tsx`)

2. **TC-AUTH-002**: ✅ Email uniqueness validation is handled by backend API, returns 400 or 409 status. (Error handling in `Register.tsx` catch block with `formatApiError`)

3. **TC-AUTH-003**: ✅ Password confirmation mismatch is validated on client-side before API call. (Line 56-59 in `Register.tsx`)

4. **TC-AUTH-004**: ✅ Login success includes token storage, user data storage, and redirect logic with welcome message. (Implemented in `Login.tsx`)

5. **TC-AUTH-005 & TC-AUTH-006**: ✅ Security best practice - generic error message does not reveal if email exists or password is wrong. (Error handling in `Login.tsx` catch block)

6. **TC-AUTH-007**: ✅ Logout clears all authentication data and notifies other browser tabs via storage event. (Implemented in `CustomerAuthService.logout()`)

7. **TC-AUTH-008**: ✅ Client-side validation covers multiple fields: name length, email format, phone format, password length. (Implemented in `CustomerAuthService.validateRegisterData()`)

8. **TC-AUTH-009**: ✅ Empty field validation prevents unnecessary API calls. (Line 50-64 in `Login.tsx`)

9. **TC-AUTH-010**: ✅ Phone login is shown in UI but not supported by current API - shows error message. (Line 56-59 in `Login.tsx`)

10. **TC-AUTH-011**: ✅ Google OAuth login is an alternative authentication method that bypasses email/password. (Implemented: `GoogleLoginButton.tsx`, `OAuth2Callback.tsx`, `OAuth2Success.tsx`)

11. **TC-AUTH-012**: ✅ Terms agreement is required for registration - enforced on client-side. (Line 61-64 in `Register.tsx`)

