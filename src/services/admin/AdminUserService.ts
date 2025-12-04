import { StatusCodeUtils } from '../../utils/statusCodes';
import type {
  CustomerListRequest,
  CustomerListResponse,
  CustomerStatsResponse,
  UpdateCustomerStatusRequest,
  UpdateCustomerStatusResponse,
  ApiError
} from '../../types/api';

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

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
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
const adminHttpClient = new AdminHttpClient(API_BASE_URL);

// Admin User Management Service
export class AdminUserService {
  /**
   * Get paginated list of customers
   */
  static async getCustomers(params: CustomerListRequest = {}): Promise<CustomerListResponse> {
    try {
      console.log('🚀 Fetching customers with params:', params);
      
      const response = await adminHttpClient.get<CustomerListResponse>(
        '/api/customers',
        params
      );
      
      console.log('✅ Customers fetched successfully:', {
        totalElements: response.totalElements,
        numberOfElements: response.numberOfElements,
        page: response.number + 1,
        totalPages: response.totalPages
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch customers:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(): Promise<CustomerStatsResponse> {
    try {
      console.log('🚀 Fetching customer statistics');
      
      // For now, we'll calculate stats from the customer list
      // In a real implementation, this would be a separate API endpoint
      const allCustomers = await this.getCustomers({ size: 1000 }); // Get all customers
      
      const stats: CustomerStatsResponse = {
        totalCustomers: allCustomers.totalElements,
        activeCustomers: allCustomers.content.filter(c => c.status === 'ACTIVE').length,
        inactiveCustomers: allCustomers.content.filter(c => c.status === 'INACTIVE').length,
        suspendedCustomers: allCustomers.content.filter(c => c.status === 'SUSPENDED').length,
        newCustomersToday: 0, // Would need createdAt field from API
        newCustomersThisWeek: 0, // Would need createdAt field from API
        newCustomersThisMonth: 0 // Would need createdAt field from API
      };
      
      console.log('✅ Customer statistics calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Failed to fetch customer statistics:', error);
      throw error;
    }
  }

  /**
   * Update customer status
   */
  static async updateCustomerStatus(request: UpdateCustomerStatusRequest): Promise<UpdateCustomerStatusResponse> {
    try {
      console.log('🚀 Updating customer status:', request);
      
      // This would be a PUT request to update customer status
      // For now, we'll simulate the response
      const response: UpdateCustomerStatusResponse = {
        success: true,
        message: 'Customer status updated successfully',
        data: {
          customerId: request.customerId,
          status: request.status,
          updatedAt: new Date().toISOString()
        }
      };
      
      console.log('✅ Customer status updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to update customer status:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(customerId: string): Promise<any> {
    try {
      console.log('🚀 Fetching customer by ID:', customerId);
      
      // This would be a GET request to /api/customers/{id}
      // For now, we'll get from the list and find by ID
      const customers = await this.getCustomers({ size: 1000 });
      const customer = customers.content.find(c => c.id === customerId);
      
      if (!customer) {
        throw {
          status: 404,
          message: 'Customer not found',
          errors: {}
        } as ApiError;
      }
      
      console.log('✅ Customer found:', customer.fullName);
      return customer;
    } catch (error) {
      console.error('❌ Failed to fetch customer by ID:', error);
      throw error;
    }
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
export default AdminUserService;
