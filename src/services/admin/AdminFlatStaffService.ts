import type {
  CreateFlatStaffRequest,
  CreateFlatStaffResponse,
  FlatStaffListResponse,
  FlatStaffListParams
} from '../../types/flatstaff';
import type { ApiError } from '../../types/api';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_TIMEOUT = 10000; // 10 seconds

// HTTP Client class for Admin FlatStaff operations
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
        const apiError: ApiError = {
          status: response.status,
          message: errorData.message || 'Request failed',
          errors: errorData.errors
        };
        throw apiError;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError: ApiError = {
          status: 408,
          message: 'Request timeout'
        };
        throw timeoutError;
      }
      
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    
    return this.request<T>(endpoint + queryString, {
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

const adminHttpClient = new AdminHttpClient(API_BASE_URL);

/**
 * Admin FlatStaff Management Service
 */
export class AdminFlatStaffService {
  /**
   * Create a new flatstaff account
   */
  static async createFlatStaff(data: CreateFlatStaffRequest): Promise<CreateFlatStaffResponse> {
    try {
      console.log('🚀 Creating flatstaff account:', { ...data, password: '***' });
      
      const response = await adminHttpClient.post<CreateFlatStaffResponse>(
        '/api/account/register/flatstaff',
        data
      );
      
      console.log('✅ FlatStaff account created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create flatstaff account:', error);
      throw error;
    }
  }

  /**
   * Get list of flatstaff accounts (if API available)
   * Note: This endpoint may need to be created on backend
   */
  static async getFlatStaffList(params: FlatStaffListParams = {}): Promise<FlatStaffListResponse> {
    try {
      console.log('🚀 Fetching flatstaff list with params:', params);
      
      // Note: You may need to adjust this endpoint based on your actual backend API
      const response = await adminHttpClient.get<FlatStaffListResponse>(
        '/api/admin/flatstaff',
        params
      );
      
      console.log('✅ FlatStaff list fetched successfully:', {
        totalElements: response.data.totalElements,
        numberOfElements: response.data.content.length,
        page: response.data.number + 1,
        totalPages: response.data.totalPages
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch flatstaff list:', error);
      throw error;
    }
  }

  /**
   * Update flatstaff account status (if API available)
   */
  static async updateFlatStaffStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<any> {
    try {
      console.log('🚀 Updating flatstaff status:', { id, status });
      
      const response = await adminHttpClient.put<any>(
        `/api/admin/flatstaff/${id}/status`,
        { status }
      );
      
      console.log('✅ FlatStaff status updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to update flatstaff status:', error);
      throw error;
    }
  }

  /**
   * Delete flatstaff account (if API available)
   */
  static async deleteFlatStaff(id: string): Promise<any> {
    try {
      console.log('🚀 Deleting flatstaff:', id);
      
      const response = await adminHttpClient.delete<any>(
        `/api/admin/flatstaff/${id}`
      );
      
      console.log('✅ FlatStaff deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to delete flatstaff:', error);
      throw error;
    }
  }
}
