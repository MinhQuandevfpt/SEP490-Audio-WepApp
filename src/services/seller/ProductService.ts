// Product Service for Seller Dashboard
import type { Product, ProductListResponse, ProductQueryParams } from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class ProductService {
  /**
   * Get list of products with filters
   * GET /api/products
   */
  static async getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
    try {
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.categoryName) {
        queryParams.append('categoryName', params.categoryName);
      }
      
      if (params.storeId) {
        queryParams.append('storeId', params.storeId);
      }
      
      if (params.keyword) {
        queryParams.append('keyword', params.keyword);
      }
      
      if (params.status) {
        queryParams.append('status', params.status);
      }
      
      // Pagination
      queryParams.append('page', String(params.page || 0));
      queryParams.append('size', String(params.size || 20));

      const url = `${API_URL}/products?${queryParams.toString()}`;
      console.log('🔍 Fetching products from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Products response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Products error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Products received:', {
        status: data.status,
        message: data.message,
        count: data.data?.content?.length || data.data?.length || 0,
        totalElements: data.data?.totalElements || 0
      });
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Validate data structure - should have content array or be array itself
      if (data.data) {
        if (data.data.content && Array.isArray(data.data.content)) {
          // Pagination structure - already correct
          console.log('📄 Using pagination structure');
        } else if (Array.isArray(data.data)) {
          // Legacy structure - convert to pagination structure
          console.log('📄 Converting legacy structure to pagination format');
          data.data = {
            content: data.data,
            totalElements: data.data.length,
            totalPages: 1,
            first: true,
            last: true,
            size: data.data.length,
            number: 0,
            numberOfElements: data.data.length,
            empty: data.data.length === 0,
            pageable: {
              pageNumber: 0,
              pageSize: data.data.length,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: 0,
              paged: false,
              unpaged: true
            }
          };
        } else {
          console.warn('⚠️ API returned unexpected data structure, setting empty content');
          data.data = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
            size: 0,
            number: 0,
            numberOfElements: 0,
            empty: true,
            pageable: {
              pageNumber: 0,
              pageSize: 0,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: 0,
              paged: false,
              unpaged: true
            }
          };
        }
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get products for current seller's store
   */
  static async getMyProducts(params: Omit<ProductQueryParams, 'storeId'> = {}): Promise<ProductListResponse> {
    try {
      // Get store ID from localStorage
      const storeId = localStorage.getItem('seller_store_id');
      
      if (!storeId) {
        throw new Error('Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.');
      }

      return this.getProducts({
        ...params,
        storeId,
      });
    } catch (error) {
      console.error('❌ Error fetching my products:', error);
      throw error;
    }
  }

  /**
   * Create a new product for current seller's store
   * POST /api/products
   */
  static async createProduct(payload: Record<string, any>): Promise<any> {
    try {
      const token =
        localStorage.getItem('seller_token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('seller_token') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('token');
      if (!token) {
        throw new Error('❌ Không tìm thấy token. Vui lòng đăng nhập lại (missing Authorization).');
      }

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      return data;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   * TODO: Implement when API is ready
   */
  static async getProductById(productId: string): Promise<Product> {
    try {
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  }

  /**
   * Get status label in Vietnamese
   */
  static getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Đang bán',
      'INACTIVE': 'Ngưng bán',
      'OUT_OF_STOCK': 'Hết hàng',
      'PENDING': 'Chờ duyệt',
      'REJECTED': 'Bị từ chối'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color
   */
  static getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'OUT_OF_STOCK': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
}
