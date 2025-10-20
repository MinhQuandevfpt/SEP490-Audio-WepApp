// Category Service for Seller Dashboard
import type { CategoryListResponse } from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class CategoryService {
  /**
   * Get list of categories
   * GET /api/categories
   */
  static async getCategories(): Promise<CategoryListResponse> {
    try {
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const url = `${API_URL}/categories`;
      console.log('🔍 Fetching categories from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Categories response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Categories error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Categories received:', {
        status: data.status,
        message: data.message,
        count: data.data?.length || 0
      });
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure data is an array
      if (data.data && !Array.isArray(data.data)) {
        console.warn('⚠️ API returned non-array data for categories, converting to array');
        data.data = [];
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }
}
