import { adminHttpClient } from './AdminStoreService';
import type { ApiResponse, CategoryTreeNode } from '../../types/api';

export class AdminCategoryService {
  /**
   * Get category tree for admin filters
   * GET /api/categories/tree
   */
  static async getCategoryTree(): Promise<ApiResponse<CategoryTreeNode[]>> {
    const response = await adminHttpClient.get<ApiResponse<CategoryTreeNode[]>>('/api/categories/tree');
    return response;
  }
}

