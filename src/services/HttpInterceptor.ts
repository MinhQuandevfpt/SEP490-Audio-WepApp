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
            
            return await retryResponse.json();
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

      return await response.json();
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
