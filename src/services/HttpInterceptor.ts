/**
 * HTTP Interceptor with automatic token refresh
 * Automatically refreshes access token on 401 errors for all user types
 */

import { RefreshTokenService } from './RefreshTokenService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export type UserType = 'customer' | 'seller' | 'staff' | 'admin';

interface RequestConfig extends RequestInit {
  userType?: UserType;
  skipAuthRefresh?: boolean; // Skip auto-refresh for this request
}

export class HttpInterceptor {
  /**
   * Make an HTTP request with automatic token refresh on 401
   */
  static async fetch<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { userType, skipAuthRefresh, ...fetchConfig } = config;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      // First attempt
      const response = await this.makeRequest(url, fetchConfig, userType);
      
      if (!response.ok) {
        // Handle 401 - Unauthorized (token expired)
        if (response.status === 401 && !skipAuthRefresh && userType && userType !== 'admin') {
          console.log(`🔄 Token expired for ${userType}, attempting refresh...`);
          
          // Try to refresh token
          const refreshed = await RefreshTokenService.refreshUserToken(userType);
          
          if (refreshed) {
            console.log(`✅ Token refreshed for ${userType}, retrying request...`);
            
            // Retry the original request with new token
            const retryResponse = await this.makeRequest(url, fetchConfig, userType);
            
            if (!retryResponse.ok) {
              throw await this.handleError(retryResponse);
            }
            
            // Handle 204 No Content
            if (retryResponse.status === 204 || retryResponse.status === 205) {
              return undefined as T;
            }
            
            const retryText = await retryResponse.text();
            if (!retryText || retryText.trim().length === 0) {
              return undefined as T;
            }
            
            try {
              return JSON.parse(retryText) as T;
            } catch (e) {
              return undefined as T;
            }
          } else {
            // Refresh failed, redirect to login
            console.error(`❌ Token refresh failed for ${userType}`);
            this.handleAuthFailure(userType);
            throw new Error('Session expired. Please login again.');
          }
        }
        
        // Handle other errors
        throw await this.handleError(response);
      }

      // Handle 204 No Content (DELETE requests often return this)
      if (response.status === 204 || response.status === 205) {
        return undefined as T;
      }

      // Read response text (can only read once)
      const text = await response.text();
      
      // If no content, return undefined
      if (!text || text.trim().length === 0) {
        return undefined as T;
      }

      // Check content type to decide if should parse JSON
      const contentType = response.headers.get('content-type');
      
      // Try to parse as JSON if content-type suggests JSON or if text looks like JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          return JSON.parse(text) as T;
        } catch (e) {
          // If parsing fails, return undefined for DELETE/PUT operations that might return empty but with JSON content-type
          return undefined as T;
        }
      }
      
      // For other content types, try to parse JSON anyway (some APIs don't set content-type correctly)
      try {
        return JSON.parse(text) as T;
      } catch (e) {
        // If not valid JSON, return as-is (will be cast to T, might be string)
        return text as T;
      }
    } catch (error) {
      console.error('HTTP request error:', error);
      throw error;
    }
  }

  /**
   * Make the actual HTTP request
   */
  private static async makeRequest(
    url: string,
    config: RequestInit,
    userType?: UserType
  ): Promise<Response> {
    const headers = new Headers(config.headers);
    
    // Add default headers
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', '*/*');
    }

    // Add authorization header if user type is specified
    if (userType) {
      const token = this.getToken(userType);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return fetch(url, {
      ...config,
      headers,
    });
  }

  /**
   * Handle HTTP errors
   */
  private static async handleError(response: Response): Promise<Error> {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(message) as any;
    error.status = response.status;
    error.data = errorData;
    return error;
  }

  /**
   * Handle authentication failure (redirect to login)
   */
  private static handleAuthFailure(userType: UserType): void {
    // Clear tokens (skip admin as it doesn't use RefreshTokenService)
    if (userType !== 'admin') {
      RefreshTokenService.clearTokens(userType);
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
    
    // Redirect to appropriate login page
    const loginPaths: Record<UserType, string> = {
      customer: '/login',
      seller: '/seller/login',
      staff: '/store-staff/login',
      admin: '/admin/login',
    };
    
    const loginPath = loginPaths[userType] || '/login';
    
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = loginPath;
    }
  }

  /**
   * Get token for user type
   */
  private static getToken(userType: UserType): string | null {
    const tokenKeys: Record<UserType, string> = {
      customer: 'customer_token',
      seller: 'seller_token',
      staff: 'staff_token',
      admin: 'admin_token',
    };
    
    return localStorage.getItem(tokenKeys[userType]);
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  static async get<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...config, method: 'GET' });
  }

  static async post<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...config, method: 'DELETE' });
  }

  static async patch<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export default HttpInterceptor;
