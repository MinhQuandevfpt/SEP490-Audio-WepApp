// Admin Store Service - Get store information by ID
import type { ApiError } from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_TIMEOUT = 10000;

interface StoreInfo {
  id: string;
  name?: string;
  storeName?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const token = localStorage.getItem('admin_access_token');
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      };
      
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
          status: store.status
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

