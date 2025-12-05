// Admin Store Service - Get store information by ID
import type { ApiError } from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
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
}

const adminHttpClient = new AdminHttpClient(API_BASE_URL);

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
   * Clear store cache
   */
  static clearCache() {
    storeCacheWithTTL.clear();
  }
}

