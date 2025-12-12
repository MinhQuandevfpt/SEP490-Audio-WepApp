// Admin Store Service - Get store information by ID
import type { ApiError } from '../../types/api';
import { AdminAuthService } from './AdminAuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_TIMEOUT = 10000;

interface StoreInfo {
  id: string;
  name?: string;
  storeName?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  logoUrl?: string | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: StoreInfo;
  timestamp: number;
}

const storeCacheWithTTL = new Map<string, CacheEntry>();

class AdminHttpClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryOn401: boolean = true): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Get and validate token
      let token = localStorage.getItem('admin_access_token');
      
      // Validate token: trim whitespace and check if it's not empty
      if (token) {
        token = token.trim();
        if (token === '' || token === 'null' || token === 'undefined') {
          token = null;
        }
      }
      
      // Build headers
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      };
      
      // Only add Authorization header if token is valid
      if (token && token.length > 0) {
        // Ensure proper format: "Bearer <token>" with space
        defaultHeaders['Authorization'] = `Bearer ${token}`;
        
        // Log token info for debugging (only first 20 chars for security)
        console.log(`🔑 [AdminHttpClient] Sending request with Authorization header (token prefix: ${token.substring(0, 20)}...)`);
      } else {
        console.warn('⚠️ [AdminHttpClient] No valid admin token found. Request may fail with 401/403.');
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

      // Parse response body first (whether success or error)
      // IMPORTANT: response body can only be read once, so we parse it here
      let responseData: any;
      let responseText: string = '';
      
      try {
        // Read response text first (can only be done once)
        responseText = await response.text();
        
        // Try to parse as JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          if (responseText) {
            try {
              responseData = JSON.parse(responseText);
            } catch (jsonError) {
              // If JSON parse fails, use text as message
              console.warn('⚠️ Failed to parse JSON, using text:', jsonError);
              responseData = { message: responseText || response.statusText || 'Failed to parse JSON response' };
            }
          } else {
            responseData = {};
          }
        } else {
          // Not JSON, use text as message
          responseData = { message: responseText || response.statusText };
        }
      } catch (readError) {
        // If reading response fails completely
        console.error('❌ Failed to read response:', readError);
        responseData = { message: response.statusText || `HTTP ${response.status}` };
      }

      // Check if response indicates an error
      if (!response.ok) {
        // Handle 401 Unauthorized - try to refresh token and retry once
        if (response.status === 401 && retryOn401) {
          console.log('🔄 [AdminHttpClient] Received 401, attempting to refresh token...');
          
          try {
            const refreshed = await AdminAuthService.refreshToken();
            if (refreshed) {
              console.log('✅ [AdminHttpClient] Token refreshed, retrying request...');
              // Retry the request with new token (only once)
              return this.request<T>(endpoint, options, false);
            } else {
              console.error('❌ [AdminHttpClient] Failed to refresh token');
              // Redirect to login or throw error
              throw {
                status: 401,
                message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                errors: {}
              } as ApiError;
            }
          } catch (refreshError) {
            console.error('❌ [AdminHttpClient] Token refresh error:', refreshError);
            throw {
              status: 401,
              message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
              errors: {}
            } as ApiError;
          }
        }
        
        // Extract error message from various possible fields
        let errorMessage = responseData.message || responseData.error || responseData.errorMessage;
        
        // Clean up common error prefixes
        if (errorMessage && typeof errorMessage === 'string') {
          errorMessage = errorMessage
            .replace(/^❌\s*approveProduct\s*failed:\s*/i, '')
            .replace(/^❌\s*/g, '')
            .trim();
        }
        
        // If message is null or empty, try to get from errors object
        if (!errorMessage || errorMessage === 'null' || errorMessage.trim() === '') {
          if (responseData.errors && typeof responseData.errors === 'object') {
            const firstError = Object.values(responseData.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = String(firstError[0]);
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        }
        
        // Fallback to status text if still no message
        if (!errorMessage || errorMessage === 'null' || errorMessage.trim() === '') {
          // Provide more specific error messages for common status codes
          const statusMessages: Record<number, string> = {
            400: 'Yêu cầu không hợp lệ',
            401: 'Không có quyền truy cập. Vui lòng đăng nhập lại.',
            403: 'Bị từ chối truy cập. Bạn không có quyền thực hiện thao tác này.',
            404: 'Không tìm thấy tài nguyên',
            500: 'Lỗi máy chủ. Vui lòng thử lại sau.',
            502: 'Lỗi kết nối đến máy chủ',
            503: 'Máy chủ đang bận. Vui lòng thử lại sau.',
          };
          errorMessage = statusMessages[response.status] || `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        
        // Use status from response body if available (for cases where HTTP status is 500 but body has status: 400)
        const errorStatus = responseData.status && typeof responseData.status === 'number' 
          ? responseData.status 
          : response.status;
        
        // Log error details for debugging
        console.error(`❌ [AdminHttpClient] Request failed:`, {
          url,
          status: errorStatus,
          message: errorMessage,
          hasToken: !!token,
          tokenLength: token?.length || 0,
        });
        
        throw {
          status: errorStatus,
          message: errorMessage,
          errors: responseData.errors || responseData.details || {}
        } as ApiError;
      }

      // Response is OK - return parsed data
      return responseData as T;
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
        throw error;
      }
      
      throw {
        status: 0,
        message: 'Network error. Please check your connection.',
        errors: {}
      } as ApiError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const adminHttpClient = new AdminHttpClient(API_BASE_URL);

export class AdminStoreService {
  /**
   * Get store information by ID with caching
   */
  static async getStoreById(storeId: string): Promise<StoreInfo | null> {
    if (!storeId) return null;

    // Check cache first
    const cached = storeCacheWithTTL.get(storeId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const response: any = await adminHttpClient.get<any>(`/api/stores/${storeId}`);
      
      let storeInfo: StoreInfo;
      
      // Handle different response formats
      let rawStoreInfo: any;
      if (response && typeof response === 'object') {
        if (response.data) {
          rawStoreInfo = response.data;
        } else if ('id' in response || 'storeId' in response) {
          rawStoreInfo = response;
        } else {
          return null;
        }
      } else {
        return null;
      }

      // Normalize store info - handle both 'name' and 'storeName'
      storeInfo = {
        id: rawStoreInfo.id || rawStoreInfo.storeId || storeId,
        name: rawStoreInfo.name || rawStoreInfo.storeName || `Cửa hàng ${storeId.slice(0, 8)}`,
        email: rawStoreInfo.email,
        phoneNumber: rawStoreInfo.phoneNumber,
        status: rawStoreInfo.status,
        logoUrl: rawStoreInfo.logoUrl || null,
      };

      // Cache the result
      storeCacheWithTTL.set(storeId, {
        data: storeInfo,
        timestamp: Date.now()
      });

      return storeInfo;
    } catch (error) {
      // Return null on error (store might not exist or API might fail)
      return null;
    }
  }

  /**
   * Get multiple store infos by IDs (batch)
   */
  static async getStoresByIds(storeIds: string[]): Promise<Map<string, StoreInfo>> {
    const result = new Map<string, StoreInfo>();
    const uncachedIds: string[] = [];

    // Check cache first
    storeIds.forEach(id => {
      const cached = storeCacheWithTTL.get(id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        result.set(id, cached.data);
      } else {
        uncachedIds.push(id);
      }
    });

    // Fetch uncached stores in parallel (limit to 10 concurrent requests)
    const batchSize = 10;
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      const promises = batch.map(id => this.getStoreById(id));
      const results = await Promise.all(promises);
      
      results.forEach((storeInfo, index) => {
        if (storeInfo) {
          result.set(batch[index], storeInfo);
        }
      });
    }

    return result;
  }

  /**
   * Get all stores with pagination and full details
   * GET /api/stores?page=0&size=10
   */
  static async getAllStoresWithPagination(page: number = 0, size: number = 10): Promise<{
    stores: any[];
    totalPages: number;
    currentPage: number;
    totalElements: number;
  }> {
    try {
      const response: any = await adminHttpClient.get<any>(`/api/stores?page=${page}&size=${size}`);
      
      if (response?.data) {
        return {
          stores: response.data.stores || [],
          totalPages: response.data.totalPages || 0,
          currentPage: response.data.currentPage || 0,
          totalElements: response.data.totalElements || 0
        };
      }
      
      return {
        stores: [],
        totalPages: 0,
        currentPage: 0,
        totalElements: 0
      };
    } catch (error) {
      console.error('Error fetching all stores:', error);
      throw error;
    }
  }

  /**
   * Get store detail by ID
   * GET /api/stores/{storeId}
   */
  static async getStoreDetailById(storeId: string): Promise<any> {
    try {
      const response: any = await adminHttpClient.get<any>(`/api/stores/${storeId}`);
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching store detail:', error);
      throw error;
    }
  }

  /**
   * Search stores by keyword
   * GET /api/stores/search?keyword={keyword}&page=0&size=10
   */
  static async searchStores(keyword: string, page: number = 0, size: number = 10): Promise<{
    stores: any[];
    pagination: {
      pageNumber: number;
      pageSize: number;
      totalPages: number;
      totalElements: number;
    };
  }> {
    try {
      const response: any = await adminHttpClient.get<any>(
        `/api/stores/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
      );
      
      if (response?.data) {
        return {
          stores: response.data.stores || [],
          pagination: response.data.pagination || {
            pageNumber: 0,
            pageSize: size,
            totalPages: 0,
            totalElements: 0
          }
        };
      }
      
      return {
        stores: [],
        pagination: {
          pageNumber: 0,
          pageSize: size,
          totalPages: 0,
          totalElements: 0
        }
      };
    } catch (error) {
      console.error('Error searching stores:', error);
      throw error;
    }
  }

  /**
   * Get all stores (with pagination) - simplified version for dropdowns
   * GET /api/stores?page=0&size=1000
   */
  static async getAllStores(page: number = 0, size: number = 1000): Promise<StoreInfo[]> {
    try {
      const response: any = await adminHttpClient.get<any>(`/api/stores?page=${page}&size=${size}`);
      
      if (response?.data?.stores && Array.isArray(response.data.stores)) {
        return response.data.stores.map((store: any) => ({
          id: store.storeId,
          name: store.storeName,
          email: store.email,
          phoneNumber: store.phoneNumber,
          status: store.status,
          logoUrl: store.logoUrl || null,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching all stores:', error);
      return [];
    }
  }

  /**
   * Clear store cache
   */
  static clearCache() {
    storeCacheWithTTL.clear();
  }
}

