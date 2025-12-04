// Category Service for Seller Dashboard
import type { CategoryListResponse } from '../../types/seller';
import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class CategoryService {
  /**
   * Get list of categories
   * GET /api/categories
   */
  static async getCategories(): Promise<CategoryListResponse> {
    try {
      const url = `${API_URL}/categories`;
      console.log('🔍 Fetching categories from:', url);
      const data = await HttpInterceptor.get<CategoryListResponse>(url, {
        headers: {
          'Accept': 'application/json',
        },
        userType: 'seller',
      });
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
