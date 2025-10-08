// HTTP Status Codes and Response Messages Management

export const HttpStatusCode = {
  // Success 2xx
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Error 4xx  
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Error 5xx
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export const ApiStatusMessage = {
  // Authentication
  LOGIN_SUCCESS: "Login success",
  LOGOUT_SUCCESS: "Logout success", 
  REGISTER_SUCCESS: "Customer created",
  SELLER_REGISTER_SUCCESS: "Seller created",
  
  // Validation Errors
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  PHONE_ALREADY_EXISTS: "Phone number already exists", 
  WEAK_PASSWORD: "Password must be at least 6 characters",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  INVALID_PHONE_FORMAT: "Invalid phone number format",
  
  // Authorization Errors
  UNAUTHORIZED_ACCESS: "Unauthorized access",
  FORBIDDEN_ACTION: "Forbidden action",
  TOKEN_EXPIRED: "Token has expired",
  INVALID_TOKEN: "Invalid token",
  
  // Server Errors
  INTERNAL_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  NETWORK_ERROR: "Network error occurred"
} as const;

// Status code checker utilities
export class StatusCodeUtils {
  static isSuccess(code: number): boolean {
    return code >= 200 && code < 300;
  }

  static isClientError(code: number): boolean {
    return code >= 400 && code < 500;
  }

  static isServerError(code: number): boolean {
    return code >= 500 && code < 600;
  }

  static isError(code: number): boolean {
    return code >= 400;
  }

  // Get user-friendly message based on status code
  static getStatusMessage(code: number, apiMessage?: string): string {
    // If API provides specific message, use it
    if (apiMessage) {
      return StatusCodeUtils.translateApiMessage(apiMessage);
    }

    // Default messages based on status codes
    switch (code) {
      case HttpStatusCode.OK:
        return "Thành công";
      case HttpStatusCode.CREATED:
        return "Tạo thành công";
      case HttpStatusCode.BAD_REQUEST:
        return "Dữ liệu không hợp lệ";
      case HttpStatusCode.UNAUTHORIZED:
        return "Thông tin đăng nhập không chính xác";
      case HttpStatusCode.FORBIDDEN:
        return "Bạn không có quyền thực hiện hành động này";
      case HttpStatusCode.NOT_FOUND:
        return "Không tìm thấy tài nguyên";
      case HttpStatusCode.CONFLICT:
        return "Dữ liệu đã tồn tại";
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        return "Dữ liệu không thể xử lý";
      case HttpStatusCode.TOO_MANY_REQUESTS:
        return "Quá nhiều yêu cầu, vui lòng thử lại sau";
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
        return "Lỗi máy chủ nội bộ";
      case HttpStatusCode.BAD_GATEWAY:
        return "Lỗi kết nối máy chủ";
      case HttpStatusCode.SERVICE_UNAVAILABLE:
        return "Dịch vụ tạm thời không khả dụng";
      case HttpStatusCode.GATEWAY_TIMEOUT:
        return "Hết thời gian chờ kết nối";
      default:
        return "Có lỗi xảy ra, vui lòng thử lại";
    }
  }

  // Translate API messages to Vietnamese
  static translateApiMessage(message: string): string {
    const translations: Record<string, string> = {
      // Success messages
      [ApiStatusMessage.LOGIN_SUCCESS]: "Đăng nhập thành công",
      [ApiStatusMessage.LOGOUT_SUCCESS]: "Đăng xuất thành công", 
      [ApiStatusMessage.REGISTER_SUCCESS]: "Đăng ký thành công",
      [ApiStatusMessage.SELLER_REGISTER_SUCCESS]: "Đăng ký seller thành công",
      
      // Error messages
      [ApiStatusMessage.INVALID_CREDENTIALS]: "Email hoặc mật khẩu không chính xác",
      [ApiStatusMessage.EMAIL_ALREADY_EXISTS]: "Email đã được sử dụng",
      [ApiStatusMessage.PHONE_ALREADY_EXISTS]: "Số điện thoại đã được sử dụng",
      [ApiStatusMessage.WEAK_PASSWORD]: "Mật khẩu phải có ít nhất 6 ký tự",
      [ApiStatusMessage.INVALID_EMAIL_FORMAT]: "Định dạng email không hợp lệ",
      [ApiStatusMessage.INVALID_PHONE_FORMAT]: "Định dạng số điện thoại không hợp lệ",
      [ApiStatusMessage.UNAUTHORIZED_ACCESS]: "Không có quyền truy cập",
      [ApiStatusMessage.FORBIDDEN_ACTION]: "Hành động không được phép",
      [ApiStatusMessage.TOKEN_EXPIRED]: "Phiên đăng nhập đã hết hạn",
      [ApiStatusMessage.INVALID_TOKEN]: "Token không hợp lệ",
      [ApiStatusMessage.INTERNAL_ERROR]: "Lỗi máy chủ nội bộ",
      [ApiStatusMessage.SERVICE_UNAVAILABLE]: "Dịch vụ tạm thời không khả dụng",
      [ApiStatusMessage.NETWORK_ERROR]: "Lỗi kết nối mạng"
    };

    return translations[message] || message;
  }

  // Format success message with user info
  static formatSuccessMessage(
    type: 'register' | 'login' | 'logout',
    userName?: string,
    additionalInfo?: string
  ): string {
    switch (type) {
      case 'register':
        return `🎉 Đăng ký thành công! ${userName ? `Chào mừng ${userName}.` : ''} ${additionalInfo || 'Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây...'}`;
      case 'login':
        return `🎉 Đăng nhập thành công! ${userName ? `Chào mừng ${userName} trở lại.` : ''} ${additionalInfo || 'Đang chuyển đến trang chủ...'}`;
      case 'logout':
        return `👋 Đăng xuất thành công! ${additionalInfo || 'Hẹn gặp lại bạn!'}`;
      default:
        return "Thành công!";
    }
  }

  // Check if error is authentication related
  static isAuthError(code: number): boolean {
    return code === HttpStatusCode.UNAUTHORIZED || code === HttpStatusCode.FORBIDDEN;
  }

  // Check if error requires user action
  static requiresUserAction(code: number): boolean {
    return this.isClientError(code) && code !== HttpStatusCode.TOO_MANY_REQUESTS;
  }

  // Check if error is retryable
  static isRetryable(code: number): boolean {
    return this.isServerError(code) || code === HttpStatusCode.TOO_MANY_REQUESTS;
  }
}

// Export commonly used status codes for easy access
export const Status = {
  OK: HttpStatusCode.OK,
  CREATED: HttpStatusCode.CREATED,
  BAD_REQUEST: HttpStatusCode.BAD_REQUEST,
  UNAUTHORIZED: HttpStatusCode.UNAUTHORIZED,
  FORBIDDEN: HttpStatusCode.FORBIDDEN,
  NOT_FOUND: HttpStatusCode.NOT_FOUND,
  CONFLICT: HttpStatusCode.CONFLICT,
  INTERNAL_ERROR: HttpStatusCode.INTERNAL_SERVER_ERROR
} as const;