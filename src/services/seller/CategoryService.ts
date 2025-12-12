// Category Service for Seller Dashboard
import type { CategoryListResponse } from '../../types/seller';
import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class CategoryService {
  /**
   * Get category tree
   * GET /api/categories/tree
   */
  static async getCategories(): Promise<CategoryListResponse> {
    try {
      const url = `${API_URL}/categories/tree`;
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
      
      // Ensure data.data is an array - preserve data integrity
      if (data.data !== undefined && data.data !== null) {
        if (!Array.isArray(data.data)) {
          // If single object, wrap it in array to preserve data
          if (typeof data.data === 'object') {
            console.warn('⚠️ API returned single object instead of array, wrapping in array');
            data.data = [data.data];
          } else {
            // Invalid type - throw error to prevent silent data loss
            throw new Error(`Invalid category data type: expected array or object, got ${typeof data.data}`);
          }
        }
      } else {
        // If data.data is null/undefined, set to empty array
        data.data = [];
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get category detail with attributes
   * GET /api/categories/{categoryId}
   */
  static async getCategoryDetail(categoryId: string) {
    const url = `${API_URL}/categories/${categoryId}`;
    return HttpInterceptor.get(url, {
      headers: { Accept: 'application/json' },
      userType: 'seller',
    });
  }
}
