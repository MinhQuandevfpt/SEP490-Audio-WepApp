// Admin Payout Management Service
import type {
  PayoutBill,
  PayoutBillListParams,
  PayoutBillListResponse,
  PayoutBillDetailResponse
} from '../../types/admin';
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
}

// Create HTTP client instance
const adminHttpClient = new AdminHttpClient(API_BASE_URL);

// Admin Payout Management Service
export class AdminPayoutService {
  /**
   * Get list of payout bills with filters
   */
  static async getPayoutBills(params: PayoutBillListParams = {}): Promise<PayoutBill[]> {
    const response: any = await adminHttpClient.get<any>(
      '/api/admin/payout-bill',
      params
    );
    
    // Handle both response formats:
    // 1. Array directly: [...]
    // 2. Wrapped in object: { status, message, data: [...] }
    if (Array.isArray(response)) {
      return response as PayoutBill[];
    }
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as PayoutBillListResponse).data || [];
    }
    
    return [];
  }

  /**
   * Get payout bill detail by ID
   */
  static async getPayoutBillDetail(billId: string): Promise<PayoutBill> {
    const response: any = await adminHttpClient.get<any>(
      `/api/admin/payout-bill/${billId}`
    );
    
    // Handle both response formats:
    // 1. Direct object: { id, billCode, ... }
    // 2. Wrapped in object: { status, message, data: {...} }
    let bill: PayoutBill;
    
    if (response && typeof response === 'object' && 'id' in response && 'billCode' in response) {
      bill = response as PayoutBill;
    } else if (response && typeof response === 'object' && 'data' in response) {
      bill = (response as PayoutBillDetailResponse).data;
    } else {
      throw new Error('Invalid response format from server');
    }
    
    // Normalize returnFees to returnShipFees for consistency
    if (bill.returnFees !== undefined && !bill.returnShipFees) {
      bill.returnShipFees = bill.returnFees;
    }
    
    // Add IDs to items if missing (for table rowKey)
    if (bill.items) {
      bill.items = bill.items.map((item, index) => ({
        ...item,
        id: item.id || `${bill.id}-item-${index}-${item.orderItemId.slice(0, 8)}`
      }));
    }
    
    // Add IDs to shippingOrders if missing (for table rowKey)
    if (bill.shippingOrders) {
      bill.shippingOrders = bill.shippingOrders.map((order, index) => ({
        ...order,
        id: order.id || `${bill.id}-shipping-${index}-${order.ghnOrderCode}`
      }));
    }
    
    // Add IDs to returnShipFees if missing (for table rowKey)
    if (bill.returnShipFees) {
      bill.returnShipFees = bill.returnShipFees.map((fee, index) => ({
        ...fee,
        id: fee.id || `${bill.id}-return-${index}-${fee.ghnOrderCode || index}`
      }));
    }
    
    return bill;
  }
}

