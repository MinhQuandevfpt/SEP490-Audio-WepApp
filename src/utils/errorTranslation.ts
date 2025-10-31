/**
 * Error Translation Utility
 * Translates common API error messages to Vietnamese
 */

export interface ErrorTranslationMap {
  [key: string]: string;
}

// Common error message translations
const ERROR_TRANSLATIONS: ErrorTranslationMap = {
  // Authentication errors
  'Invalid credentials': 'Tài khoản hoặc mật khẩu không đúng',
  'invalid credentials': 'Tài khoản hoặc mật khẩu không đúng',
  'Invalid email or password': 'Tài khoản hoặc mật khẩu không đúng',
  'invalid email or password': 'Tài khoản hoặc mật khẩu không đúng',
  'Incorrect email or password': 'Tài khoản hoặc mật khẩu không đúng',
  'incorrect email or password': 'Tài khoản hoặc mật khẩu không đúng',
  'Wrong email or password': 'Tài khoản hoặc mật khẩu không đúng',
  'wrong email or password': 'Tài khoản hoặc mật khẩu không đúng',
  'Authentication failed': 'Xác thực thất bại',
  'authentication failed': 'Xác thực thất bại',
  'Unauthorized': 'Không có quyền truy cập',
  'unauthorized': 'Không có quyền truy cập',
  'Access denied': 'Truy cập bị từ chối',
  'access denied': 'Truy cập bị từ chối',
  
  // Account status errors
  'Account not found': 'Không tìm thấy tài khoản',
  'account not found': 'Không tìm thấy tài khoản',
  'User not found': 'Không tìm thấy người dùng',
  'user not found': 'Không tìm thấy người dùng',
  'Account is locked': 'Tài khoản đã bị khóa',
  'account is locked': 'Tài khoản đã bị khóa',
  'Account is disabled': 'Tài khoản đã bị vô hiệu hóa',
  'account is disabled': 'Tài khoản đã bị vô hiệu hóa',
  'Account is suspended': 'Tài khoản đã bị tạm ngưng',
  'account is suspended': 'Tài khoản đã bị tạm ngưng',
  
  // Token errors
  'Token expired': 'Phiên đăng nhập đã hết hạn',
  'token expired': 'Phiên đăng nhập đã hết hạn',
  'Invalid token': 'Mã xác thực không hợp lệ',
  'invalid token': 'Mã xác thực không hợp lệ',
  'Token not found': 'Không tìm thấy mã xác thực',
  'token not found': 'Không tìm thấy mã xác thực',
  
  // Network errors
  'Network error': 'Lỗi kết nối mạng',
  'network error': 'Lỗi kết nối mạng',
  'Connection timeout': 'Hết thời gian kết nối',
  'connection timeout': 'Hết thời gian kết nối',
  'Server error': 'Lỗi máy chủ',
  'server error': 'Lỗi máy chủ',
  'Service unavailable': 'Dịch vụ tạm thời không khả dụng',
  'service unavailable': 'Dịch vụ tạm thời không khả dụng',
  
  // Validation errors
  'Email is required': 'Vui lòng nhập email',
  'email is required': 'Vui lòng nhập email',
  'Password is required': 'Vui lòng nhập mật khẩu',
  'password is required': 'Vui lòng nhập mật khẩu',
  'Invalid email format': 'Định dạng email không hợp lệ',
  'invalid email format': 'Định dạng email không hợp lệ',
  'Password too short': 'Mật khẩu quá ngắn',
  'password too short': 'Mật khẩu quá ngắn',
  
  // Store-specific errors
  'Store not found': 'Không tìm thấy cửa hàng',
  'store not found': 'Không tìm thấy cửa hàng',
  'Invalid store code': 'Mã cửa hàng không hợp lệ',
  'invalid store code': 'Mã cửa hàng không hợp lệ',
  'Store is inactive': 'Cửa hàng chưa được kích hoạt',
  'store is inactive': 'Cửa hàng chưa được kích hoạt',
};

/**
 * Translates an English error message to Vietnamese
 * If no translation is found, returns the original message
 */
export function translateError(errorMessage: string): string {
  if (!errorMessage) return 'Đã xảy ra lỗi không xác định';
  
  // Direct translation lookup
  const directTranslation = ERROR_TRANSLATIONS[errorMessage];
  if (directTranslation) return directTranslation;
  
  // Case-insensitive lookup
  const lowerMessage = errorMessage.toLowerCase();
  const caseInsensitiveTranslation = ERROR_TRANSLATIONS[lowerMessage];
  if (caseInsensitiveTranslation) return caseInsensitiveTranslation;
  
  // Partial match lookup (for messages that contain the error phrase)
  for (const [englishKey, vietnameseValue] of Object.entries(ERROR_TRANSLATIONS)) {
    if (errorMessage.toLowerCase().includes(englishKey.toLowerCase())) {
      return vietnameseValue;
    }
  }
  
  // If no translation found, return original message
  return errorMessage;
}

/**
 * Translates HTTP status codes to Vietnamese error messages
 */
export function translateHttpStatus(status: number): string {
  const statusTranslations: { [key: number]: string } = {
    400: 'Yêu cầu không hợp lệ',
    401: 'Tài khoản hoặc mật khẩu không đúng',
    403: 'Không có quyền truy cập',
    404: 'Không tìm thấy tài nguyên',
    408: 'Hết thời gian yêu cầu',
    429: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
    500: 'Lỗi máy chủ nội bộ',
    502: 'Lỗi cổng kết nối',
    503: 'Dịch vụ tạm thời không khả dụng',
    504: 'Hết thời gian chờ cổng kết nối',
  };
  
  return statusTranslations[status] || `Lỗi HTTP ${status}`;
}

/**
 * Formats API error with Vietnamese translation
 * Handles error objects from API responses
 */
export function formatApiError(error: any): string {
  // Handle null/undefined
  if (!error) return 'Đã xảy ra lỗi không xác định';
  
  // Handle Error objects
  if (error instanceof Error) {
    return translateError(error.message);
  }
  
  // Handle API error responses with message field
  if (error.message) {
    return translateError(error.message);
  }
  
  // Handle API error responses with error field
  if (error.error) {
    return translateError(error.error);
  }
  
  // Handle HTTP status errors
  if (error.status) {
    return translateHttpStatus(error.status);
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return translateError(error);
  }
  
  // Default fallback
  return 'Đã xảy ra lỗi không xác định';
}
