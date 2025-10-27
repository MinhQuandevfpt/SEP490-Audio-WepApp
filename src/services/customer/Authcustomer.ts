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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
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
      // Get token from localStorage for authenticated requests
      const token = localStorage.getItem('customer_token');
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
        
        // Store tokens using RefreshTokenService
        RefreshTokenService.storeTokens('customer', response.data.accessToken, refreshToken, tokenType);
        
        // Also store in old format for backward compatibility
        localStorage.setItem('customer_token', response.data.accessToken);
        localStorage.setItem('token_type', tokenType);

        // Decode accountId from token and store/log it
        const accountId = extractAccountIdFromToken(response.data.accessToken);
        if (accountId) {
          localStorage.setItem('account_id', accountId);
          console.log('👤 Account ID:', accountId);
        }

        // Also decode and log userId if present in token payload
        const payload = decodeJwtPayload(response.data.accessToken);
        const customerId = payload?.customerId ?? payload?.uid ?? null;
        if (customerId) {
          localStorage.setItem('customer_id', String(customerId));
          console.log('🆔 Customer ID:', String(customerId));
        }
        
        // Convert API response to match database schema (fullName -> full_name)
        const userDataForStorage = {
          email: response.data.user.email,
          full_name: response.data.user.fullName, // Convert to snake_case to match database
          role: response.data.user.role,
          accountId: accountId,
          customerId: customerId
        };
        
        console.log('📝 Storing user info with full_name only:', userDataForStorage);
        localStorage.setItem('customer_user', JSON.stringify(userDataForStorage));
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout customer
   */
  static logout(): void {
    // Remove customer auth tokens using RefreshTokenService
    RefreshTokenService.clearTokens('customer');
    
    // Remove customer auth tokens (backward compatibility)
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('token_type');
    localStorage.removeItem('account_id');      // New from thongln branch
    localStorage.removeItem('customer_id');     // New from thongln branch
    
    // Remove OAuth2 related data
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('accountId');
    localStorage.removeItem('customerId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authStateChanged');
    
    console.log('👋 Customer logged out');
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
   * Get authentication token
   */
  static getToken(): string | null {
    return localStorage.getItem('customer_token');
  }

  /**
   * Get decoded account id (from token or cache)
   */
  static getAccountId(): string | null {
    const cached = localStorage.getItem('account_id');
    if (cached) return cached;
    const token = this.getToken();
    if (!token) return null;
    const accountId = extractAccountIdFromToken(token);
    if (accountId) localStorage.setItem('account_id', accountId);
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
      
      const result = await RefreshTokenService.refreshUserToken('customer');
      
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
    return RefreshTokenService.getRefreshToken('customer');
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
}

// Export default
export default CustomerAuthService;
