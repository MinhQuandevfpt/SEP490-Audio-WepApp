/**
 * Category Service for Customer
 * Handles fetching product categories for display
 */

import type { CategoryListResponse } from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

export class CustomerCategoryService {
  /**
   * Get all categories
   * GET /api/categories
   */
  static async getAllCategories(): Promise<CategoryListResponse> {
    try {
      const url = `${API_BASE_URL}/api/categories`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories (${response.status})`);
      }

      const data = await response.json();
      return data as CategoryListResponse;
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Get category by keyword search
   * GET /api/categories?keyword={keyword}
   */
  static async searchCategories(keyword: string): Promise<CategoryListResponse> {
    try {
      const url = new URL(`${API_BASE_URL}/api/categories`);
      if (keyword && keyword.trim()) {
        url.searchParams.set('keyword', keyword.trim());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to search categories (${response.status})`);
      }

      const data = await response.json();
      return data as CategoryListResponse;
    } catch (error) {
      console.error('❌ Failed to search categories:', error);
      throw error;
    }
  }
}

export default CustomerCategoryService;
