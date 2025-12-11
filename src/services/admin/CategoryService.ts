import type { CategoryListResponse, CategoryItem, CategoryTreeNode, ApiResponse, CategoryDetailResponse, UpdateCategoryRequest } from '../../types/api';
import { adminHttpClient } from './AdminStoreService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

export class CategoryService {
  /**
   * Get categories from tree API and flatten to CategoryItem list
   * GET /api/categories/tree
   */
  static async getCategories(keyword?: string): Promise<CategoryListResponse> {
    try {
      // Use AdminCategoryService to get tree
      const response = await adminHttpClient.get<ApiResponse<CategoryTreeNode[]>>('/api/categories/tree');
      
      if (!response || !response.data) {
        return {
          status: 200,
          message: 'No categories found',
          data: []
        };
      }

      // Flatten tree to flat list
      const flattenTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
        const result: CategoryTreeNode[] = [];
        nodes.forEach(node => {
          result.push(node);
          if (node.children && node.children.length > 0) {
            result.push(...flattenTree(node.children));
          }
        });
        return result;
      };

      let categories = flattenTree(response.data);

      // Filter by keyword if provided
      if (keyword && keyword.trim()) {
        const searchTerm = keyword.trim().toLowerCase();
        categories = categories.filter(cat => 
          cat.name.toLowerCase().includes(searchTerm) ||
          cat.categoryId.toLowerCase().includes(searchTerm)
        );
      }

      // Convert CategoryTreeNode[] to CategoryItem[]
      const categoryItems: CategoryItem[] = categories.map(cat => ({
        categoryId: cat.categoryId,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), // Generate slug from name
        description: null,
        iconUrl: null,
        sortOrder: 0
      }));

      return {
        status: response.status || 200,
        message: response.message || 'Categories retrieved successfully',
        data: categoryItems
      };
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      throw new Error(error?.message || `Failed to fetch categories`);
    }
  }

  /**
   * Get category detail by ID
   * GET /api/categories/{categoryId}
   */
  static async getCategoryById(categoryId: string): Promise<CategoryDetailResponse> {
    try {
      const response = await adminHttpClient.get<CategoryDetailResponse>(`/api/categories/${categoryId}`);
      
      if (!response || !response.data) {
        throw new Error('No category data received');
      }

      return response;
    } catch (error: any) {
      console.error('Error fetching category detail:', error);
      throw new Error(error?.message || `Failed to fetch category detail`);
    }
  }

  static async createCategory(payload: Omit<CategoryItem, 'categoryId'>): Promise<CategoryListResponse> {
    const url = `${API_BASE_URL}/api/categories`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to create category (${response.status})`);
    }

    const data = await response.json();
    return data as CategoryListResponse;
  }

  /**
   * Update category with attributes management
   * PUT /api/categories/{categoryId}
   */
  static async updateCategory(categoryId: string, payload: UpdateCategoryRequest): Promise<CategoryDetailResponse> {
    try {
      const response = await adminHttpClient.put<CategoryDetailResponse>(
        `/api/categories/${categoryId}`,
        payload,
        {
          'Content-Type': 'application/json'
        }
      );
      
      if (!response || !response.data) {
        throw new Error('No category data received');
      }

      return response;
    } catch (error: any) {
      console.error('Error updating category:', error);
      throw new Error(error?.message || `Failed to update category`);
    }
  }

  /**
   * Delete category by ID
   * DELETE /api/categories/{categoryId}
   */
  static async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    try {
      const response = await adminHttpClient.delete<ApiResponse<void>>(`/api/categories/${categoryId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      throw new Error(error?.message || `Failed to delete category`);
    }
  }
}

export default CategoryService;

