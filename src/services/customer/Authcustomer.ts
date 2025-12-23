import { StatusCodeUtils } from '../../utils/statusCodes';
import { RefreshTokenService } from '../RefreshTokenService';
import type {
  CustomerRegisterRequest,
  CustomerRegisterResponse,
  CustomerLoginRequest,
  CustomerLoginResponse,
  CustomerProfile,
  ApiError
} from '../../types/api';

// Lightweight JWT helpers scoped to this file
function base64UrlDecode(input: string): string {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return decodeURIComponent(
        Array.prototype.map
          .call(window.atob(padded), (c: string) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
    }
    // @ts-ignore Node fallback if available
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payloadStr = base64UrlDecode(parts[1]);
  if (!payloadStr) return null;
  try {
    return JSON.parse(payloadStr) as Record<string, any>;
  } catch {
    return null;
  }
}

function extractAccountIdFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const possibleKeys = ['accountId', 'account_id', 'accId', 'aid', 'id', 'sub'];
  for (const key of possibleKeys) {
    if (payload[key] !== undefined && payload[key] !== null) {
      return String(payload[key]);
    }
  }
  return null;
}

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_TIMEOUT = 10000; // 10 seconds

// HTTP Client class
class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Get token from localStorage for authenticated requests (UPPERCASE key)
      const token = localStorage.getItem('CUSTOMER_token');
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      };
      
      // Add Authorization header if token exists
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errors: errorData.errors || {}
        } as ApiError;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error?.name === 'AbortError') {
        throw {
          status: 408,
          message: 'Request timeout',
          errors: {}
        } as ApiError;
      }
      
      if (error?.status) {
        throw error; // API error
      }
      
      // Network error
      throw {
        status: 0,
        message: 'Network error. Please check your connection.',
        errors: {}
      } as ApiError;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create HTTP client instance
const httpClient = new HttpClient(API_BASE_URL);

// Customer Authentication Service
export class CustomerAuthService {
  /**
   * Register a new customer
   */
  static async register(data: CustomerRegisterRequest): Promise<CustomerRegisterResponse> {
    try {
      console.log('🚀 Registering customer:', { ...data, password: '[HIDDEN]' });
      
      const response = await httpClient.post<CustomerRegisterResponse>(
        '/api/account/register/customer',
        data
      );
      
      console.log('✅ Registration successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login customer
   */
  static async login(data: CustomerLoginRequest): Promise<CustomerLoginResponse> {
    try {
      console.log('🚀 Logging in customer:', { ...data, password: '[HIDDEN]' });
      
      const response = await httpClient.post<CustomerLoginResponse>(
        '/api/account/login/customer',
        data
      );
      
      console.log('✅ Login successful');
      
      // Store tokens in localStorage using RefreshTokenService
      if (response.data?.accessToken) {
        const refreshToken = response.data.refreshToken || '';
        const tokenType = response.data.tokenType || 'Bearer';
        
        // Store tokens using RefreshTokenService (handles all formats automatically)
        RefreshTokenService.storeTokens('CUSTOMER', response.data.accessToken, refreshToken, tokenType);

        // Decode accountId from token
        const accountId = extractAccountIdFromToken(response.data.accessToken);
        
        // Decode customerId from token payload
        const payload = decodeJwtPayload(response.data.accessToken);
        const customerId = payload?.customerId ?? payload?.uid ?? null;
        
        // Store customer data using standardized helper
        RefreshTokenService.storeCustomerData({
          email: response.data.user.email,
          full_name: response.data.user.fullName,
          role: response.data.user.role,
          accountId: accountId || '',
          customerId: customerId || ''
        });
        
        console.log('✅ Login completed - All data stored (standardized format)');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout customer - Clear all tokens and user data
   */
  static logout(): void {
    console.log('🚪 Logging out customer...');
    
    // Lấy customerId trước khi clear storage để biết đúng session AI chat cần xoá
    let aiChatStorageKey: string | null = null;
    try {
      const aiKeyPrefix = 'aiChat:session:';
      // Ưu tiên lấy từ token đã decode (qua RefreshTokenService) nếu có
      const token = localStorage.getItem('CUSTOMER_token');
      let customerIdFromToken: string | null = null;
      if (token) {
        const payload = decodeJwtPayload(token);
        customerIdFromToken = (payload?.customerId ?? payload?.uid ?? null) as string | null;
      }
      const rawCustomerId = customerIdFromToken || localStorage.getItem('customerId') || 'guest';
      aiChatStorageKey = `${aiKeyPrefix}${rawCustomerId}`;
    } catch {
      aiChatStorageKey = null;
    }

    // Set flag to prevent welcome popup after logout redirect
    sessionStorage.setItem('isLoggingOut', 'true');
    
    // Get token before clearing (for storage event)
    const oldToken = localStorage.getItem('CUSTOMER_token');
    
    // Clear ALL data using RefreshTokenService (includes all backward compatibility keys)
    RefreshTokenService.clearAllData('CUSTOMER');

    // Clear AI chat history for this customer session
    try {
      if (aiChatStorageKey) {
        localStorage.removeItem(aiChatStorageKey);
        console.log(`🗑️ AI chat history cleared for key: ${aiChatStorageKey}`);
      }
    } catch (e) {
      console.warn('⚠️ Failed to clear AI chat history on logout:', e);
    }
    
    // Trigger storage event to notify other tabs/components
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'customer_token',
        oldValue: oldToken,
        newValue: null,
        storageArea: localStorage
      }));
    } catch (e) {
      // StorageEvent might not be supported in all browsers, use custom event instead
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { loggedOut: true } }));
    }
    
    // Set authStateChanged flag for Header component
    localStorage.setItem('authStateChanged', 'true');
    
    console.log('✅ Customer logged out successfully');
  }

  /**
   * Get current customer profile
   */
  static async getProfile(): Promise<CustomerProfile> {
    try {
      const token = this.getToken();
      if (!token) {
        throw {
          status: 401,
          message: 'No authentication token found',
          errors: {}
        } as ApiError;
      }

      const response = await httpClient.get<{ data: CustomerProfile }>('/api/customer/profile');
      return response.data;
    } catch (error) {
      console.error('❌ Get profile failed:', error);
      throw error;
    }
  }

  /**
   * Update customer profile
   */
  static async updateProfile(data: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const response = await httpClient.put<{ data: CustomerProfile }>('/api/customer/profile', data);
      
      // Update stored user data
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('customer_user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Update profile failed:', error);
      throw error;
    }
  }

  /**
   * Check if customer is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get authentication token (UPPERCASE key)
   */
  static getToken(): string | null {
    return localStorage.getItem('CUSTOMER_token');
  }

  /**
   * Get decoded account id (from token or cache - camelCase key)
   */
  static getAccountId(): string | null {
    const cached = localStorage.getItem('accountId');
    if (cached) return cached;
    const token = this.getToken();
    if (!token) return null;
    const accountId = extractAccountIdFromToken(token);
    if (accountId) localStorage.setItem('accountId', accountId);
    return accountId;
  }

  /**
   * Get current user data
   */
  static getCurrentUser(): CustomerProfile | null {
    try {
      const userStr = localStorage.getItem('customer_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Refresh token (if implemented in backend)
   */
  static async refreshToken(): Promise<string> {
    try {
      console.log('🔄 Refreshing customer token...');
      
        const result = await RefreshTokenService.refreshUserToken('CUSTOMER');
      
      if (!result) {
        throw new Error('Failed to refresh token');
      }
      
      console.log('✅ Customer token refreshed successfully');
      return result.accessToken;
    } catch (error) {
      console.error('❌ Customer token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return RefreshTokenService.getRefreshToken('CUSTOMER');
  }

  /**
   * Validate form data before sending to API
   */
  static validateRegisterData(data: CustomerRegisterRequest): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email không hợp lệ');
    }

    if (!data.phone || !/^(84|0[3|5|7|8|9])+([0-9]{8})$/.test(data.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    return errors;
  }

  /**
   * Format API error for display using StatusCodeUtils
   */
  static formatApiError(error: ApiError): string {
    // Use StatusCodeUtils for better error handling
    if (error.status) {
      // If there's a specific message from API, translate it
      if (error.message) {
        const translatedMessage = StatusCodeUtils.translateApiMessage(error.message);
        if (translatedMessage !== error.message) {
          return translatedMessage;
        }
      }
      
      // Use status code to get appropriate message
      return StatusCodeUtils.getStatusMessage(error.status, error.message);
    }

    // Handle validation errors
    if (error.errors && Object.keys(error.errors).length > 0) {
      const firstErrorKey = Object.keys(error.errors)[0];
      const firstError = error.errors[firstErrorKey][0];
      return StatusCodeUtils.translateApiMessage(firstError) || firstError;
    }
    
    // Fallback to original error message
    return StatusCodeUtils.translateApiMessage(error.message) || error.message || 'Đã xảy ra lỗi không xác định';
  }

  /**
   * Check if error requires immediate action (like re-authentication)
   */
  static shouldLogoutOnError(error: ApiError): boolean {
    return StatusCodeUtils.isAuthError(error.status || 0);
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: ApiError): boolean {
    return StatusCodeUtils.isRetryable(error.status || 0);
  }

  /**
   * Verify register account token
   */
  static async verifyRegisterAccount(token: string): Promise<any> {
    // Dùng fetch trực tiếp để lấy được cả message của BE khi status 4xx.
    // Chú ý: VITE_API_BASE_URL có thể đã chứa /api, nên cần chuẩn hóa để tránh double /api.
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const url = `${apiBase}/account/verify-email?token=${encodeURIComponent(token)}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*'
        }
      });

      const body = await res.json().catch(() => ({}));
      const result = {
        status: res.status,
        message: body?.message || res.statusText || '',
        data: body?.data ?? null
      };

      if (!res.ok) {
        // Trả về kết quả để FE tự hiển thị, không throw để tránh mất message
        return result;
      }
      return result;
    } catch (error) {
      console.error('❌ Verify register account failed:', error);
      throw error;
    }
  }

  /**
   * Resend verify email
   */
  static async resendVerifyEmail(email: string, role: 'CUSTOMER' | 'SELLER' | 'STOREOWNER' = 'CUSTOMER'): Promise<any> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const url = `${apiBase}/account/resend-verify-email`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify({ email, role }),
      });

      const body = await res.json().catch(() => ({}));
      const result = {
        status: res.status,
        message: body?.message || res.statusText || '',
        data: body?.data ?? null,
      };

      if (!res.ok) {
        return result;
      }
      return result;
    } catch (error) {
      console.error('❌ Resend verify email failed:', error);
      throw error;
    }
  }

  /**
   * Forgot password (send reset email)
   */
  static async forgotPassword(email: string): Promise<any> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const url = `${apiBase}/account/forgot-password`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify({ email }),
      });

      const body = await res.json().catch(() => ({}));
      return {
        status: res.status,
        message: body?.message || res.statusText || '',
        data: body?.data ?? null,
      };
    } catch (error) {
      console.error('❌ Forgot password failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<any> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const url = `${apiBase}/account/reset-password`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const body = await res.json().catch(() => ({}));
      return {
        status: res.status,
        message: body?.message || res.statusText || '',
        data: body?.data ?? null,
      };
    } catch (error) {
      console.error('❌ Reset password failed:', error);
      throw error;
    }
  }
}

// Export default
export default CustomerAuthService;
