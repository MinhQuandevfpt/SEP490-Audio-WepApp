import type { ApiError } from '../../types/api';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_TIMEOUT = 10000; // 10 seconds

// HTTP Client class for Admin operations
class AdminHttpClient {
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
      // Get admin token from localStorage for authenticated requests
      const token = localStorage.getItem('admin_access_token');
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

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return this.request<T>(url, {
      method: 'GET',
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create HTTP client instance
const adminHttpClient = new AdminHttpClient(API_BASE_URL);

// GHN Order types
export interface GhnOrder {
  id: string;
  storeOrderId: string;
  storeId: string;
  orderGhn: string;
  totalFee: number;
  expectedDeliveryTime: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GhnOrderListRequest {
  storeId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface GhnOrderListResponse {
  status: number;
  message: string;
  data: {
    content: GhnOrder[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: {
        sorted: boolean;
        empty: boolean;
        unsorted: boolean;
      };
      offset: number;
      paged: boolean;
      unpaged: boolean;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    numberOfElements: number;
    first: boolean;
    empty: boolean;
  };
}

export interface UpdateGhnOrderStatusRequest {
  status: string;
}

export interface UpdateGhnOrderStatusResponse {
  id: string;
  storeOrderId: string;
  storeId: string;
  orderGhn: string;
  totalFee: number;
  expectedDeliveryTime: string;
  status: string;
  updatedAt: string;
  createdAt: string;
}

// Admin GHN Order Service
export class AdminGhnOrderService {
  /**
   * Get paginated list of GHN orders
   */
  static async getGhnOrders(params: GhnOrderListRequest = {}): Promise<GhnOrderListResponse> {
    try {
      console.log('🚀 Fetching GHN orders with params:', params);
      
      const response = await adminHttpClient.get<GhnOrderListResponse>(
        '/api/v1/ghn-orders',
        params
      );
      
      console.log('✅ GHN orders fetched successfully:', {
        totalElements: response.data.totalElements,
        numberOfElements: response.data.numberOfElements,
        page: response.data.number + 1,
        totalPages: response.data.totalPages
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch GHN orders:', error);
      throw error;
    }
  }

  /**
   * Update GHN order status
   * PATCH /api/v1/ghn-orders/{ghnOrderId}/status
   */
  static async updateGhnOrderStatus(
    ghnOrderId: string,
    status: string
  ): Promise<UpdateGhnOrderStatusResponse> {
    try {
      console.log('🚀 Updating GHN order status:', { ghnOrderId, status });
      
      // API returns the updated GhnOrder directly
      const response = await adminHttpClient.patch<UpdateGhnOrderStatusResponse>(
        `/api/v1/ghn-orders/${ghnOrderId}/status`,
        { status }
      );
      
      console.log('✅ GHN order status updated successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to update GHN order status:', error);
      throw error;
    }
  }
}

